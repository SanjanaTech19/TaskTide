from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from models import (
    Task, FixedCommitment, DailyAvailability,
    WorkloadAnalysis, DayBreakdown, DeadlineRisk, TaskCategory
)

# Learned duration calibration factors based on task category
DEFAULT_CALIBRATION_FACTORS = {
    TaskCategory.ASSIGNMENT: 1.25,   # Code & math assignments run ~25% longer
    TaskCategory.EXAM_PREP: 1.15,    # Revision expands ~15%
    TaskCategory.PROJECT: 1.30,      # Multi-step projects run ~30% longer
    TaskCategory.INTERNSHIP: 1.20,   # Workplace tasks encounter unexpected dependencies
    TaskCategory.PERSONAL: 1.05      # Personal errands run slightly over
}

def parse_date(date_str: str) -> datetime:
    try:
        return datetime.strptime(date_str.split("T")[0], "%Y-%m-%d")
    except Exception:
        return datetime.now()

def get_calibrated_hours(task: Task, apply_calibration: bool = True) -> float:
    if not apply_calibration:
        return task.estimated_hours
    factor = DEFAULT_CALIBRATION_FACTORS.get(task.category, 1.20)
    # If user provided difficulty, refine factor
    if task.difficulty == "hard":
        factor += 0.15
    elif task.difficulty == "easy":
        factor = max(1.0, factor - 0.15)
    return round(task.estimated_hours * factor, 1)

def compute_workload_feasibility(
    tasks: List[Task],
    commitments: List[FixedCommitment],
    start_date_str: str,
    horizon_days: int = 7,
    availability: DailyAvailability = DailyAvailability(),
    apply_calibration: bool = True
) -> WorkloadAnalysis:
    start_dt = parse_date(start_date_str)
    
    # 1. Calculate daily capacity and fixed hours
    day_capacities: List[Dict[str, Any]] = []
    total_avail_hours = 0.0

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for d in range(horizon_days):
        current_date = start_dt + timedelta(days=d)
        date_str = current_date.strftime("%Y-%m-%d")
        dow = current_date.weekday() # 0 = Monday, 6 = Sunday

        # Fixed commitment hours for this day of week
        fixed_hours_today = 0.0
        for comm in commitments:
            if comm.day_of_week == dow:
                try:
                    s_h, s_m = map(int, comm.start_time.split(":"))
                    e_h, e_m = map(int, comm.end_time.split(":"))
                    duration = (e_h * 60 + e_m - (s_h * 60 + s_m)) / 60.0
                    fixed_hours_today += max(0.0, duration)
                except Exception:
                    pass

        # Total window hours
        window_hours = max(0.0, float(availability.day_end_hour - availability.day_start_hour))
        
        # Max usable work hours = min(configured max_work_hours, window - fixed)
        free_window_hours = max(0.0, window_hours - fixed_hours_today)
        usable_hours = min(availability.max_work_hours_per_day, free_window_hours)
        total_avail_hours += usable_hours

        day_capacities.append({
            "date": date_str,
            "day_name": f"{day_names[dow][:3]} {current_date.strftime('%b %d')}",
            "dow": dow,
            "fixed_hours": round(fixed_hours_today, 1),
            "available_hours": round(usable_hours, 1),
            "allocated_hours": 0.0,
            "tasks": []
        })

    # 2. Analyze task requirements and deadlines
    active_tasks = [t for t in tasks if not t.completed]
    total_required_hours = 0.0
    deadline_risks: List[DeadlineRisk] = []

    # Map deadlines to day index
    for t in active_tasks:
        hrs = get_calibrated_hours(t, apply_calibration)
        total_required_hours += hrs
        
        t_deadline = parse_date(t.deadline)
        days_until_deadline = (t_deadline - start_dt).days

        # Hours available strictly before or on this deadline day
        available_before = 0.0
        limit_day = min(horizon_days, max(0, days_until_deadline + 1))
        for d_idx in range(limit_day):
            available_before += day_capacities[d_idx]["available_hours"]

        # Calculate competing tasks due on or before this deadline
        competing_hours = sum(
            get_calibrated_hours(other, apply_calibration)
            for other in active_tasks
            if (parse_date(other.deadline) - start_dt).days <= days_until_deadline
        )

        gap = round(competing_hours - available_before, 1)

        if gap > 0:
            if gap >= 4.0:
                risk_level = "critical"
            elif gap >= 2.0:
                risk_level = "high"
            else:
                risk_level = "moderate"
            explanation = (
                f"Requires {hrs:.1f}h, competing with {competing_hours:.1f}h total due by {t_deadline.strftime('%a %b %d')}. "
                f"Only {available_before:.1f}h available before this deadline ({gap:.1f}h capacity deficit)."
            )
        elif available_before - competing_hours < 2.0:
            risk_level = "moderate"
            explanation = (
                f"Feasible but tight: {competing_hours:.1f}h required out of {available_before:.1f}h available buffer before {t_deadline.strftime('%a %b %d')}."
            )
        else:
            risk_level = "safe"
            explanation = f"Comfortable margin: {available_before - competing_hours:.1f}h buffer available before deadline."

        deadline_risks.append(DeadlineRisk(
            task_id=t.id,
            task_title=t.title,
            deadline=t.deadline,
            hours_needed=hrs,
            hours_available_before_deadline=round(available_before, 1),
            capacity_gap=max(0.0, gap),
            risk_level=risk_level,
            explanation=explanation
        ))

    # 3. Overall Feasibility & Gap
    capacity_gap = max(0.0, round(total_required_hours - total_avail_hours, 1))
    is_feasible = (capacity_gap == 0.0) and all(r.risk_level != "critical" for r in deadline_risks)

    # 4. Burnout risk calculation
    utilization_ratio = (total_required_hours / max(0.1, total_avail_hours))
    base_burnout = min(100, int(utilization_ratio * 70))
    if capacity_gap > 0:
        base_burnout = min(100, base_burnout + int(capacity_gap * 5))
    critical_count = sum(1 for r in deadline_risks if r.risk_level == "critical")
    base_burnout = min(100, base_burnout + critical_count * 10)

    # 5. Build Day Breakdowns (Initial estimate before optimizer)
    # Simple proportional allocation to show baseline pressure
    day_breakdowns: List[DayBreakdown] = []
    for d in day_capacities:
        avail = d["available_hours"]
        # Distribute based on tasks scheduled or due
        alloc = 0.0
        for t in active_tasks:
            t_due = parse_date(t.deadline).strftime("%Y-%m-%d")
            if t.scheduled_day == d["date"]:
                alloc += get_calibrated_hours(t, apply_calibration)
                d["tasks"].append(t.title)
            elif not t.scheduled_day and t_due == d["date"]:
                # If not yet scheduled, show due tasks
                alloc += min(avail, get_calibrated_hours(t, apply_calibration))
                d["tasks"].append(f"{t.title} (due)")

        utilization = round((alloc / max(0.1, avail)) * 100, 1)
        if alloc > avail:
            status = "overload"
        elif utilization >= 85:
            status = "heavy"
        elif utilization >= 45:
            status = "optimal"
        else:
            status = "light"

        day_breakdowns.append(DayBreakdown(
            date=d["date"],
            day_name=d["day_name"],
            available_hours=d["available_hours"],
            allocated_hours=round(alloc, 1),
            fixed_hours=d["fixed_hours"],
            utilization_pct=min(150.0, utilization),
            status=status,
            tasks=d["tasks"]
        ))

    # 6. Actionable recommendations
    recommendations: List[str] = []
    if capacity_gap > 0:
        recommendations.append(
            f"⚠️ Total workload exceeds weekly capacity by {capacity_gap:.1f} hours ({total_required_hours:.1f}h required vs {total_avail_hours:.1f}h available). "
            "TaskTide cannot magically fit all tasks without rescheduling or adjusting scope."
        )
    
    overloaded_days = [d for d in day_breakdowns if d.status == "overload"]
    if overloaded_days:
        names = ", ".join([d.day_name for d in overloaded_days])
        recommendations.append(f"📅 Severe bottleneck detected on {names}. Move non-urgent tasks to lighter days.")

    urgent_risks = [r for r in deadline_risks if r.risk_level in ["critical", "high"]]
    for r in urgent_risks[:2]:
        recommendations.append(f"⏳ '{r.task_title}': {r.explanation}")

    if not recommendations:
        recommendations.append("✅ Schedule is well-balanced. All deliverables have sufficient buffer.")

    return WorkloadAnalysis(
        total_required_hours=round(total_required_hours, 1),
        total_available_hours=round(total_avail_hours, 1),
        capacity_gap_hours=capacity_gap,
        is_feasible=is_feasible,
        burnout_risk_score=base_burnout,
        day_breakdowns=day_breakdowns,
        deadline_risks=deadline_risks,
        recommendations=recommendations
    )
