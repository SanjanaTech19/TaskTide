import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import jwt
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from models import (
    Task, FixedCommitment, DailyAvailability,
    ScheduleStrategy, ScheduleRequest, OptimizationResponse,
    ScheduleOption, WorkloadAnalysis, WhatIfRequest, WhatIfResponse,
    DecompositionRequest, DecompositionResponse,
    DocumentExtractionRequest, ExtractedTask, TaskCategory, Priority, Difficulty,
    SignUpRequest, LoginRequest, AuthResponse, UserProfileResponse
)
from database import (
    engine, SessionLocal, Base, User, DBTask, DBCommitment, DBScheduleSnapshot,
    hash_password, verify_password, get_db, seed_default_user_and_data
)
from feasibility import compute_workload_feasibility, get_calibrated_hours
from scheduler import TaskTideScheduler
from ai_engine import AIEngine

# Initialize DB tables and seed default user (Alex Chen)
seed_default_user_and_data()

app = FastAPI(
    title="TaskTide API",
    description="Intelligent Workload Planning & Constraint-Based Scheduling Engine with Database Auth",
    version="2.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = "tasktide_jwt_secret_key_2026_super_secure_academic"
JWT_ALGORITHM = "HS256"

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=30),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        # Default to demo user for unauthenticated backwards-compatible calls
        return db.query(User).filter(User.email == "alex.chen@tasktide.io").first()
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return db.query(User).filter(User.email == "alex.chen@tasktide.io").first()
        user = db.query(User).filter(User.id == user_id).first()
        return user or db.query(User).filter(User.email == "alex.chen@tasktide.io").first()
    except Exception:
        return db.query(User).filter(User.email == "alex.chen@tasktide.io").first()

def get_demo_start_date() -> str:
    return datetime.now().strftime("%Y-%m-%d")

def user_to_tasks_and_commitments(user: User, db: Session):
    db_tasks = db.query(DBTask).filter(DBTask.user_id == user.id).all()
    tasks: List[Task] = []
    for dt in db_tasks:
        try:
            deps = json.loads(dt.dependencies) if dt.dependencies else []
        except Exception:
            deps = []
        tasks.append(Task(
            id=dt.id,
            title=dt.title,
            description=dt.description or "",
            category=TaskCategory(dt.category) if dt.category in [c.value for c in TaskCategory] else TaskCategory.ASSIGNMENT,
            estimated_hours=dt.estimated_hours,
            actual_hours=dt.actual_hours,
            deadline=dt.deadline,
            difficulty=Difficulty(dt.difficulty) if dt.difficulty in [d.value for d in Difficulty] else Difficulty.MEDIUM,
            priority=Priority(dt.priority) if dt.priority in [p.value for p in Priority] else Priority.MEDIUM,
            is_fixed=dt.is_fixed,
            scheduled_start=dt.scheduled_start,
            scheduled_end=dt.scheduled_end,
            scheduled_day=dt.scheduled_day,
            dependencies=deps,
            completed=dt.completed,
            color=dt.color
        ))

    db_commitments = db.query(DBCommitment).filter(DBCommitment.user_id == user.id).all()
    commitments: List[FixedCommitment] = []
    for dc in db_commitments:
        commitments.append(FixedCommitment(
            id=dc.id,
            title=dc.title,
            day_of_week=dc.day_of_week,
            start_time=dc.start_time,
            end_time=dc.end_time,
            category=dc.category,
            recurring=dc.recurring,
            color=dc.color
        ))

    return tasks, commitments

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TaskTide Workload Engine",
        "engine": "Google OR-Tools CP-SAT",
        "database": "SQLite (Persisted)",
        "timestamp": datetime.now().isoformat()
    }

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # Compute initials
    parts = req.name.strip().split()
    initials = (parts[0][0] + (parts[1][0] if len(parts) > 1 else ""))[:2].upper() or "TT"

    hashed, salt = hash_password(req.password)
    user_id = f"user-{uuid.uuid4().hex[:10]}"

    new_user = User(
        id=user_id,
        email=req.email.strip().lower(),
        hashed_password=hashed,
        salt=salt,
        name=req.name.strip(),
        role=req.role or "Student / Intern",
        institution=req.institution or "University",
        avatar_initials=initials,
        max_work_hours_per_day=7.0
    )
    db.add(new_user)
    db.commit()

    # Seed starter commitments & tasks if requested
    today = datetime.now()
    if req.seed_demo_data:
        # Starter commitments
        starter_commitments = [
            ("c-1", "Core Curriculum Lecture", 0, "10:00", "11:30", "class", "#3B82F6"),
            ("c-2", "Lab Practice Session", 1, "14:00", "16:00", "class", "#6366F1"),
            ("c-3", "Team Standup / Project Sync", 3, "09:30", "10:30", "work", "#8B5CF6"),
            ("c-4", "Fitness & Wellbeing Session", 4, "18:00", "19:30", "personal", "#10B981"),
        ]
        for cid, title, dow, s, e, cat, col in starter_commitments:
            db.add(DBCommitment(
                id=f"{cid}-{uuid.uuid4().hex[:6]}", user_id=new_user.id,
                title=title, day_of_week=dow, start_time=s, end_time=e,
                category=cat, color=col
            ))

        # Starter tasks
        starter_tasks = [
            ("t-1", "Problem Set & Practice Implementation", "Solve assigned theoretical problems and verify edge cases.", "assignment", 4.0, (today + timedelta(days=2)).strftime("%Y-%m-%d"), "medium", "high", "#8878F5"),
            ("t-2", "Sprint Deliverable: Module Integration", "Implement core feature requirements and unit tests.", "project", 5.5, (today + timedelta(days=3)).strftime("%Y-%m-%d"), "hard", "urgent", "#EF4444"),
            ("t-3", "Midterm Audit & Study Review", "Consolidate lecture notes and review past year exam papers.", "exam_prep", 3.0, (today + timedelta(days=5)).strftime("%Y-%m-%d"), "medium", "medium", "#10B981"),
        ]
        for tid, title, desc, cat, hrs, dline, diff, prio, col in starter_tasks:
            db.add(DBTask(
                id=f"{tid}-{uuid.uuid4().hex[:6]}", user_id=new_user.id,
                title=title, description=desc, category=cat, estimated_hours=hrs,
                deadline=dline, difficulty=diff, priority=prio, color=col, completed=False
            ))

        db.commit()

    token = create_access_token(new_user.id)
    tasks, commitments = user_to_tasks_and_commitments(new_user, db)
    start_date = get_demo_start_date()
    availability = DailyAvailability(max_work_hours_per_day=new_user.max_work_hours_per_day)

    analysis = compute_workload_feasibility(
        tasks=tasks,
        commitments=commitments,
        start_date_str=start_date,
        horizon_days=7,
        availability=availability,
        apply_calibration=True
    )

    return AuthResponse(
        token=token,
        user=UserProfileResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role,
            institution=new_user.institution,
            avatar_initials=new_user.avatar_initials,
            max_work_hours_per_day=new_user.max_work_hours_per_day
        ),
        tasks=tasks,
        commitments=commitments,
        start_date=start_date,
        availability=availability,
        initial_analysis=analysis
    )

@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )

    if not verify_password(req.password, user.hashed_password, user.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )

    token = create_access_token(user.id)
    tasks, commitments = user_to_tasks_and_commitments(user, db)
    start_date = get_demo_start_date()
    availability = DailyAvailability(max_work_hours_per_day=user.max_work_hours_per_day)

    analysis = compute_workload_feasibility(
        tasks=tasks,
        commitments=commitments,
        start_date_str=start_date,
        horizon_days=7,
        availability=availability,
        apply_calibration=True
    )

    return AuthResponse(
        token=token,
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            institution=user.institution,
            avatar_initials=user.avatar_initials,
            max_work_hours_per_day=user.max_work_hours_per_day
        ),
        tasks=tasks,
        commitments=commitments,
        start_date=start_date,
        availability=availability,
        initial_analysis=analysis
    )

@app.post("/api/auth/demo-login", response_model=AuthResponse)
def demo_login(db: Session = Depends(get_db)):
    # 1-Click Demo Login as Alex Chen
    demo_user = db.query(User).filter(User.email == "alex.chen@tasktide.io").first()
    if not demo_user:
        seed_default_user_and_data()
        demo_user = db.query(User).filter(User.email == "alex.chen@tasktide.io").first()

    token = create_access_token(demo_user.id)
    tasks, commitments = user_to_tasks_and_commitments(demo_user, db)
    start_date = get_demo_start_date()
    availability = DailyAvailability(max_work_hours_per_day=demo_user.max_work_hours_per_day)

    analysis = compute_workload_feasibility(
        tasks=tasks,
        commitments=commitments,
        start_date_str=start_date,
        horizon_days=7,
        availability=availability,
        apply_calibration=True
    )

    return AuthResponse(
        token=token,
        user=UserProfileResponse(
            id=demo_user.id,
            email=demo_user.email,
            name=demo_user.name,
            role=demo_user.role,
            institution=demo_user.institution,
            avatar_initials=demo_user.avatar_initials,
            max_work_hours_per_day=demo_user.max_work_hours_per_day
        ),
        tasks=tasks,
        commitments=commitments,
        start_date=start_date,
        availability=availability,
        initial_analysis=analysis
    )

@app.get("/api/auth/me", response_model=AuthResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = create_access_token(user.id)
    tasks, commitments = user_to_tasks_and_commitments(user, db)
    start_date = get_demo_start_date()
    availability = DailyAvailability(max_work_hours_per_day=user.max_work_hours_per_day)

    analysis = compute_workload_feasibility(
        tasks=tasks,
        commitments=commitments,
        start_date_str=start_date,
        horizon_days=7,
        availability=availability,
        apply_calibration=True
    )

    return AuthResponse(
        token=token,
        user=UserProfileResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            institution=user.institution,
            avatar_initials=user.avatar_initials,
            max_work_hours_per_day=user.max_work_hours_per_day
        ),
        tasks=tasks,
        commitments=commitments,
        start_date=start_date,
        availability=availability,
        initial_analysis=analysis
    )

# --- WORKSPACE INITIAL STATE ---

@app.get("/api/initial-state")
def get_initial_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks, commitments = user_to_tasks_and_commitments(user, db)
    start_date = get_demo_start_date()
    availability = DailyAvailability(max_work_hours_per_day=user.max_work_hours_per_day)
    
    analysis = compute_workload_feasibility(
        tasks=tasks,
        commitments=commitments,
        start_date_str=start_date,
        horizon_days=7,
        availability=availability,
        apply_calibration=True
    )

    return {
        "user_profile": {
            "name": user.name,
            "role": user.role,
            "institution": user.institution,
            "avatar_initials": user.avatar_initials
        },
        "tasks": tasks,
        "commitments": commitments,
        "start_date": start_date,
        "availability": availability,
        "initial_analysis": analysis
    }

# --- DATABASE TASK PERSISTENCE ---

@app.post("/api/tasks/create", response_model=Task)
def create_task(task: Task, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = DBTask(
        id=task.id,
        user_id=user.id,
        title=task.title,
        description=task.description or "",
        category=task.category.value,
        estimated_hours=task.estimated_hours,
        actual_hours=task.actual_hours,
        deadline=task.deadline,
        difficulty=task.difficulty.value,
        priority=task.priority.value,
        is_fixed=task.is_fixed,
        scheduled_start=task.scheduled_start,
        scheduled_end=task.scheduled_end,
        scheduled_day=task.scheduled_day,
        dependencies=json.dumps(task.dependencies or []),
        completed=task.completed,
        color=task.color
    )
    db.merge(db_task)
    db.commit()
    return task

@app.put("/api/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, task: Task, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id, DBTask.user_id == user.id).first()
    if db_task:
        db_task.title = task.title
        db_task.description = task.description or ""
        db_task.category = task.category.value
        db_task.estimated_hours = task.estimated_hours
        db_task.actual_hours = task.actual_hours
        db_task.deadline = task.deadline
        db_task.difficulty = task.difficulty.value
        db_task.priority = task.priority.value
        db_task.is_fixed = task.is_fixed
        db_task.scheduled_start = task.scheduled_start
        db_task.scheduled_end = task.scheduled_end
        db_task.scheduled_day = task.scheduled_day
        db_task.dependencies = json.dumps(task.dependencies or [])
        db_task.completed = task.completed
        db_task.color = task.color
        db.commit()
    return task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_task = db.query(DBTask).filter(DBTask.id == task_id, DBTask.user_id == user.id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return {"status": "deleted", "id": task_id}

@app.post("/api/tasks/sync-plan")
def sync_optimized_plan(tasks: List[Task], user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Persists accepted schedule plan into the user's database records"""
    for t in tasks:
        db_task = db.query(DBTask).filter(DBTask.id == t.id, DBTask.user_id == user.id).first()
        if db_task:
            db_task.scheduled_day = t.scheduled_day
            db_task.scheduled_start = t.scheduled_start
            db_task.scheduled_end = t.scheduled_end
            db_task.completed = t.completed
    db.commit()
    return {"status": "synced", "count": len(tasks)}

@app.post("/api/commitments/create", response_model=FixedCommitment)
def create_commitment(comm: FixedCommitment, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_comm = DBCommitment(
        id=comm.id,
        user_id=user.id,
        title=comm.title,
        day_of_week=comm.day_of_week,
        start_time=comm.start_time,
        end_time=comm.end_time,
        category=comm.category,
        recurring=comm.recurring,
        color=comm.color or "#3B82F6"
    )
    db.merge(db_comm)
    db.commit()
    return comm

@app.delete("/api/commitments/{comm_id}")
def delete_commitment(comm_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_comm = db.query(DBCommitment).filter(DBCommitment.id == comm_id, DBCommitment.user_id == user.id).first()
    if db_comm:
        db.delete(db_comm)
        db.commit()
    return {"status": "deleted", "id": comm_id}

# --- SCHEDULER & OPTIMIZATION ENDPOINTS ---

@app.post("/api/feasibility", response_model=WorkloadAnalysis)
def calculate_feasibility(request: ScheduleRequest):
    return compute_workload_feasibility(
        tasks=request.tasks,
        commitments=request.commitments,
        start_date_str=request.start_date,
        horizon_days=request.horizon_days,
        availability=request.availability,
        apply_calibration=request.apply_calibration
    )

@app.post("/api/optimize", response_model=OptimizationResponse)
def optimize_schedule(request: ScheduleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scheduler = TaskTideScheduler(
        tasks=request.tasks,
        commitments=request.commitments,
        start_date_str=request.start_date,
        horizon_days=request.horizon_days,
        availability=request.availability,
        apply_calibration=request.apply_calibration
    )

    # Solve all 3 strategies using Google OR-Tools CP-SAT
    opt_deadline = scheduler.solve_strategy(ScheduleStrategy.DEADLINE_FIRST)
    opt_balanced = scheduler.solve_strategy(ScheduleStrategy.BALANCED)
    opt_focus = scheduler.solve_strategy(ScheduleStrategy.FOCUS_FIRST)

    strategies_map = {
        ScheduleStrategy.DEADLINE_FIRST: (opt_deadline, [opt_balanced, opt_focus]),
        ScheduleStrategy.BALANCED: (opt_balanced, [opt_deadline, opt_focus]),
        ScheduleStrategy.FOCUS_FIRST: (opt_focus, [opt_balanced, opt_deadline]),
    }

    primary, alts = strategies_map.get(request.strategy, (opt_balanced, [opt_deadline, opt_focus]))

    analysis = compute_workload_feasibility(
        tasks=primary.scheduled_tasks if primary.scheduled_tasks else request.tasks,
        commitments=request.commitments,
        start_date_str=request.start_date,
        horizon_days=request.horizon_days,
        availability=request.availability,
        apply_calibration=request.apply_calibration
    )

    # Save snapshot in database
    try:
        snapshot = DBScheduleSnapshot(
            id=str(uuid.uuid4())[:8],
            user_id=user.id,
            timestamp=datetime.now().strftime("%H:%M:%S"),
            strategy=request.strategy.value,
            tasks_count=len(request.tasks),
            feasible=primary.is_feasible,
            snapshot_data=json.dumps([t.model_dump() for t in primary.scheduled_tasks])
        )
        db.add(snapshot)
        db.commit()
    except Exception as e:
        db.rollback()

    return OptimizationResponse(
        status="SUCCESS" if primary.is_feasible else "INFEASIBLE_WARN",
        primary_option=primary,
        alternative_options=alts,
        workload_analysis=analysis,
        calibration_applied=request.apply_calibration
    )

@app.post("/api/what-if", response_model=WhatIfResponse)
def simulate_what_if(req: WhatIfRequest):
    availability = DailyAvailability()
    if req.adjusted_max_hours_per_day:
        availability.max_work_hours_per_day = req.adjusted_max_hours_per_day

    orig_analysis = compute_workload_feasibility(
        tasks=req.base_tasks,
        commitments=req.commitments,
        start_date_str=req.start_date,
        horizon_days=7,
        availability=availability
    )

    new_tasks = [t.model_copy() for t in req.base_tasks]
    if req.removed_task_id:
        new_tasks = [t for t in new_tasks if t.id != req.removed_task_id]

    if req.modified_task:
        new_tasks = [t if t.id != req.modified_task.id else req.modified_task for t in new_tasks]

    if req.new_task:
        new_tasks.append(req.new_task)

    sim_analysis = compute_workload_feasibility(
        tasks=new_tasks,
        commitments=req.commitments,
        start_date_str=req.start_date,
        horizon_days=7,
        availability=availability
    )

    delta = round(sim_analysis.total_required_hours - orig_analysis.total_required_hours, 1)
    
    affected = []
    if req.new_task:
        affected.append(f"Added '{req.new_task.title}' (+{req.new_task.estimated_hours}h)")
    if req.modified_task:
        affected.append(f"Adjusted '{req.modified_task.title}' deadline/duration")

    collision_warnings = []
    if sim_analysis.capacity_gap_hours > orig_analysis.capacity_gap_hours:
        added_gap = round(sim_analysis.capacity_gap_hours - orig_analysis.capacity_gap_hours, 1)
        collision_warnings.append(
            f"⚡ Adding this task expands your capacity deficit by +{added_gap} hours."
        )

    for r in sim_analysis.deadline_risks:
        if r.risk_level in ["critical", "high"]:
            collision_warnings.append(f"⚠️ Clash at {r.deadline}: {r.task_title} has {r.capacity_gap:.1f}h deficit.")

    if not collision_warnings:
        mitigation = "✅ Feasible change: New workload can be safely absorbed into current available buffers."
    elif sim_analysis.capacity_gap_hours > 0:
        mitigation = (
            f"💡 Recommended Action: Postpone lowest-priority task or extend deadline by at least {sim_analysis.capacity_gap_hours:.1f}h."
        )
    else:
        mitigation = "💡 Recommended Action: Rebalance slots using the 'Balanced Workload' strategy."

    return WhatIfResponse(
        original_feasibility=orig_analysis.is_feasible,
        new_feasibility=sim_analysis.is_feasible,
        original_gap=orig_analysis.capacity_gap_hours,
        new_gap=sim_analysis.capacity_gap_hours,
        affected_tasks=affected,
        capacity_delta=delta,
        collision_warnings=collision_warnings,
        recommended_mitigation=mitigation,
        updated_analysis=sim_analysis
    )

@app.post("/api/decompose", response_model=DecompositionResponse)
def decompose_project(req: DecompositionRequest):
    return AIEngine.decompose_project(
        project_title=req.project_title,
        project_description=req.project_description,
        total_hours=req.total_hours,
        deadline=req.deadline,
        category=req.category
    )

@app.post("/api/extract-document", response_model=List[ExtractedTask])
def extract_tasks_from_doc(req: DocumentExtractionRequest):
    return AIEngine.extract_tasks_from_document(
        content=req.content,
        filename=req.filename or "assignment.txt"
    )

@app.get("/api/analytics")
def get_analytics():
    return {
        "calibration_metrics": {
            "overall_drift_factor": 1.22,
            "interpretation": "Your tasks typically take 22% longer than initial gut estimates.",
            "categories": [
                {"category": "Assignment (Coding/Proofs)", "multiplier": 1.28, "accuracy_pct": 78, "sample_size": 14},
                {"category": "Exam Prep & Review", "multiplier": 1.15, "accuracy_pct": 87, "sample_size": 9},
                {"category": "Internship Deliverables", "multiplier": 1.25, "accuracy_pct": 80, "sample_size": 18},
                {"category": "Project Heavy Lifting", "multiplier": 1.34, "accuracy_pct": 74, "sample_size": 8},
                {"category": "Personal & Administrative", "multiplier": 1.05, "accuracy_pct": 95, "sample_size": 12},
            ]
        },
        "weekly_completion_history": [
            {"week": "Week 1", "estimated_hours": 24, "actual_hours": 29.5, "completion_rate": 92},
            {"week": "Week 2", "estimated_hours": 22, "actual_hours": 26.0, "completion_rate": 88},
            {"week": "Week 3", "estimated_hours": 28, "actual_hours": 33.5, "completion_rate": 95},
            {"week": "Week 4 (Current)", "estimated_hours": 23, "actual_hours": 27.2, "completion_rate": 78},
        ],
        "burnout_trend": [
            {"day": "Mon", "strain_score": 65},
            {"day": "Tue", "strain_score": 88},
            {"day": "Wed", "strain_score": 82},
            {"day": "Thu", "strain_score": 54},
            {"day": "Fri", "strain_score": 45},
            {"day": "Sat", "strain_score": 30},
            {"day": "Sun", "strain_score": 25},
        ]
    }

@app.get("/api/schedule-history")
def get_schedule_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    snapshots = db.query(DBScheduleSnapshot).filter(DBScheduleSnapshot.user_id == user.id).order_by(DBScheduleSnapshot.timestamp.desc()).limit(10).all()
    history = []
    for s in snapshots:
        try:
            tasks_data = json.loads(s.snapshot_data)
        except Exception:
            tasks_data = []
        history.append({
            "id": s.id,
            "timestamp": s.timestamp,
            "strategy": s.strategy,
            "tasks_count": s.tasks_count,
            "feasible": s.feasible,
            "snapshot_tasks": tasks_data
        })
    return {"history": history}
