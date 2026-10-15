from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class TaskCategory(str, Enum):
    ASSIGNMENT = "assignment"
    EXAM_PREP = "exam_prep"
    PROJECT = "project"
    INTERNSHIP = "internship"
    PERSONAL = "personal"

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    category: TaskCategory = TaskCategory.ASSIGNMENT
    estimated_hours: float = 2.0
    actual_hours: Optional[float] = None
    deadline: str  # Format: "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS"
    difficulty: Difficulty = Difficulty.MEDIUM
    priority: Priority = Priority.MEDIUM
    is_fixed: bool = False
    fixed_start: Optional[str] = None  # Format: "YYYY-MM-DDTHH:MM:SS" or "HH:MM"
    fixed_end: Optional[str] = None
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    scheduled_day: Optional[str] = None  # "YYYY-MM-DD"
    dependencies: List[str] = Field(default_factory=list)  # list of task IDs
    completed: bool = False
    color: Optional[str] = None

class FixedCommitment(BaseModel):
    id: str
    title: str
    day_of_week: int  # 0 = Monday, ..., 6 = Sunday
    start_time: str   # "09:00"
    end_time: str     # "11:00"
    category: str     # "class", "work", "meeting", "personal"
    recurring: bool = True
    color: Optional[str] = "#3B82F6"

class DailyAvailability(BaseModel):
    day_start_hour: int = 8    # 8 AM
    day_end_hour: int = 22     # 10 PM
    max_work_hours_per_day: float = 7.0
    preferred_deep_work_start: int = 9  # 9 AM
    preferred_deep_work_end: int = 13   # 1 PM

class ScheduleStrategy(str, Enum):
    DEADLINE_FIRST = "deadline_first"
    BALANCED = "balanced"
    FOCUS_FIRST = "focus_first"

class DayBreakdown(BaseModel):
    date: str
    day_name: str
    available_hours: float
    allocated_hours: float
    fixed_hours: float
    utilization_pct: float
    status: str  # "light", "optimal", "heavy", "overload"
    tasks: List[str] = Field(default_factory=list)  # task titles

class DeadlineRisk(BaseModel):
    task_id: str
    task_title: str
    deadline: str
    hours_needed: float
    hours_available_before_deadline: float
    capacity_gap: float
    risk_level: str  # "safe", "moderate", "high", "critical"
    explanation: str

class WorkloadAnalysis(BaseModel):
    total_required_hours: float
    total_available_hours: float
    capacity_gap_hours: float
    is_feasible: bool
    burnout_risk_score: int  # 0 to 100
    day_breakdowns: List[DayBreakdown]
    deadline_risks: List[DeadlineRisk]
    recommendations: List[str]

class ScheduleRequest(BaseModel):
    tasks: List[Task]
    commitments: List[FixedCommitment]
    start_date: str  # "YYYY-MM-DD"
    horizon_days: int = 7
    strategy: ScheduleStrategy = ScheduleStrategy.BALANCED
    availability: DailyAvailability = Field(default_factory=DailyAvailability)
    apply_calibration: bool = True

class ScheduleOption(BaseModel):
    strategy: ScheduleStrategy
    title: str
    subtitle: str
    is_feasible: bool
    scheduled_tasks: List[Task]
    metrics: Dict[str, Any]
    trade_offs: Dict[str, str]  # "pros", "cons", "ideal_for"
    infeasibility_details: Optional[Dict[str, Any]] = None

class OptimizationResponse(BaseModel):
    status: str  # "SUCCESS" | "INFEASIBLE_WARN"
    primary_option: ScheduleOption
    alternative_options: List[ScheduleOption]
    workload_analysis: WorkloadAnalysis
    calibration_applied: bool

class WhatIfRequest(BaseModel):
    base_tasks: List[Task]
    commitments: List[FixedCommitment]
    start_date: str
    new_task: Optional[Task] = None
    modified_task: Optional[Task] = None
    removed_task_id: Optional[str] = None
    adjusted_max_hours_per_day: Optional[float] = None

class WhatIfResponse(BaseModel):
    original_feasibility: bool
    new_feasibility: bool
    original_gap: float
    new_gap: float
    affected_tasks: List[str]
    capacity_delta: float
    collision_warnings: List[str]
    recommended_mitigation: str
    updated_analysis: WorkloadAnalysis

class DecompositionRequest(BaseModel):
    project_title: str
    project_description: str
    total_hours: float
    deadline: str
    category: TaskCategory = TaskCategory.PROJECT

class SubtaskItem(BaseModel):
    title: str
    description: str
    estimated_hours: float
    difficulty: Difficulty
    priority: Priority
    order: int
    dependencies: List[str] = Field(default_factory=list)

class DecompositionResponse(BaseModel):
    project_title: str
    subtasks: List[SubtaskItem]
    rationale: str

class DocumentExtractionRequest(BaseModel):
    content: str
    filename: Optional[str] = "assignment.txt"

class ExtractedTask(BaseModel):
    title: str
    description: str
    suggested_hours: float
    deadline: str
    difficulty: Difficulty
    priority: Priority
    category: TaskCategory
    deliverables: List[str] = Field(default_factory=list)


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Student / Young Professional"
    institution: Optional[str] = "University / Company"
    seed_demo_data: bool = True

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    institution: str
    avatar_initials: str
    max_work_hours_per_day: float = 7.0

class AuthResponse(BaseModel):
    token: str
    user: UserProfileResponse
    tasks: List[Task]
    commitments: List[FixedCommitment]
    start_date: str
    availability: DailyAvailability
    initial_analysis: WorkloadAnalysis
