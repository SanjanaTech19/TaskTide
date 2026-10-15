import os
import json
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_PATH = os.path.join(os.path.dirname(__file__), "tasktide.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="Student / Young Professional")
    institution = Column(String, default="University / Company")
    avatar_initials = Column(String, default="TT")
    max_work_hours_per_day = Column(Float, default=7.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("DBTask", back_populates="user", cascade="all, delete-orphan")
    commitments = relationship("DBCommitment", back_populates="user", cascade="all, delete-orphan")
    snapshots = relationship("DBScheduleSnapshot", back_populates="user", cascade="all, delete-orphan")


class DBTask(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    category = Column(String, default="assignment")
    estimated_hours = Column(Float, default=2.0)
    actual_hours = Column(Float, nullable=True)
    deadline = Column(String, nullable=False)
    difficulty = Column(String, default="medium")
    priority = Column(String, default="medium")
    is_fixed = Column(Boolean, default=False)
    scheduled_start = Column(String, nullable=True)
    scheduled_end = Column(String, nullable=True)
    scheduled_day = Column(String, nullable=True)
    dependencies = Column(Text, default="[]")  # JSON list
    completed = Column(Boolean, default=False)
    color = Column(String, nullable=True)

    user = relationship("User", back_populates="tasks")


class DBCommitment(Base):
    __tablename__ = "commitments"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0 = Monday, ..., 6 = Sunday
    start_time = Column(String, nullable=False)   # "09:00"
    end_time = Column(String, nullable=False)     # "11:00"
    category = Column(String, default="class")
    recurring = Column(Boolean, default=True)
    color = Column(String, default="#3B82F6")

    user = relationship("User", back_populates="commitments")


class DBScheduleSnapshot(Base):
    __tablename__ = "schedule_snapshots"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    timestamp = Column(String, nullable=False)
    strategy = Column(String, nullable=False)
    tasks_count = Column(Integer, default=0)
    feasible = Column(Boolean, default=True)
    snapshot_data = Column(Text, default="[]")  # JSON string of tasks

    user = relationship("User", back_populates="snapshots")


# Password utilities (PBKDF2 HMAC SHA-256)
def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return hashed, salt

def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    hashed, _ = hash_password(plain_password, salt)
    return secrets.compare_digest(hashed, hashed_password)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_default_user_and_data():
    """Initializes tables and seeds the demo account for Alex Chen if not present"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_email = "alex.chen@tasktide.io"
        existing = db.query(User).filter(User.email == demo_email).first()
        if not existing:
            hashed, salt = hash_password("password123")
            demo_user = User(
                id="user-alex-chen",
                email=demo_email,
                hashed_password=hashed,
                salt=salt,
                name="Alex Chen",
                role="Computer Science Junior & ML Engineering Intern",
                institution="Stanford University & TechCorp AI Lab",
                avatar_initials="AC",
                max_work_hours_per_day=7.0
            )
            db.add(demo_user)
            db.commit()

            # Seed demo commitments
            commitments_data = [
                ("comm-1", "CS 314: Operating Systems Lecture", 0, "10:00", "11:30", "class", "#3B82F6"),
                ("comm-2", "CS 314: Operating Systems Lecture", 2, "10:00", "11:30", "class", "#3B82F6"),
                ("comm-3", "Distributed Systems Lab Session", 1, "14:00", "17:00", "class", "#6366F1"),
                ("comm-4", "TechCorp ML Intern Standup & Sync", 0, "09:00", "10:00", "work", "#8B5CF6"),
                ("comm-5", "TechCorp ML Team Sprint Review", 3, "15:00", "16:30", "work", "#8B5CF6"),
                ("comm-6", "Gym & Strength Conditioning", 1, "18:00", "19:30", "personal", "#10B981"),
                ("comm-7", "Gym & Strength Conditioning", 4, "18:00", "19:30", "personal", "#10B981"),
            ]
            for cid, title, dow, start, end, cat, col in commitments_data:
                db.add(DBCommitment(
                    id=cid, user_id=demo_user.id, title=title, day_of_week=dow,
                    start_time=start, end_time=end, category=cat, color=col
                ))

            # Seed demo tasks
            today = datetime.now()
            tasks_data = [
                (
                    "task-1",
                    "Kernel Multithreading & Synchronization Project",
                    "Implement preemptive thread scheduler and locks in C with semaphore tests.",
                    "project", 6.0, (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "hard", "urgent", "#EF4444"
                ),
                (
                    "task-2",
                    "ML Pipeline: Real-time Feature Store Ingestion",
                    "Refactor async Kafka consumer and write pytest coverage for batch transformer.",
                    "internship", 5.0, (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                    "hard", "high", "#F59E0B"
                ),
                (
                    "task-3",
                    "Distributed Systems Lab 3: Raft Consensus",
                    "Pass leader election and log replication test suites 3A & 3B.",
                    "assignment", 4.5, (today + timedelta(days=4)).strftime("%Y-%m-%d"),
                    "medium", "high", "#8878F5"
                ),
                (
                    "task-4",
                    "Stats & Probability Midterm Prep: Problem Sets 4-6",
                    "Practice joint probability distributions, Bayes estimators, and confidence intervals.",
                    "exam_prep", 3.5, (today + timedelta(days=5)).strftime("%Y-%m-%d"),
                    "medium", "medium", "#10B981"
                ),
                (
                    "task-5",
                    "Senior Thesis: Literature Review Draft (5 Papers)",
                    "Summarize Graph Neural Network state-of-the-art for biochemical molecules.",
                    "project", 4.0, (today + timedelta(days=6)).strftime("%Y-%m-%d"),
                    "easy", "low", "#06B6D4"
                )
            ]
            for tid, title, desc, cat, hrs, dline, diff, prio, col in tasks_data:
                db.add(DBTask(
                    id=tid, user_id=demo_user.id, title=title, description=desc,
                    category=cat, estimated_hours=hrs, deadline=dline,
                    difficulty=diff, priority=prio, color=col, completed=False
                ))

            db.commit()
    finally:
        db.close()
