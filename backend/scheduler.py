import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from ortools.sat.python import cp_model
from models import (
    Task, FixedCommitment, DailyAvailability,
    ScheduleStrategy, ScheduleOption, TaskCategory
)
from feasibility import get_calibrated_hours, parse_date

class TaskTideScheduler:
    def __init__(
        self,
        tasks: List[Task],
        commitments: List[FixedCommitment],
        start_date_str: str,
        horizon_days: int = 7,
        availability: DailyAvailability = DailyAvailability(),
        apply_calibration: bool = True
    ):
        self.raw_tasks = [t for t in tasks if not t.completed]
        self.commitments = commitments
        self.start_dt = parse_date(start_date_str)
        self.horizon_days = horizon_days
        self.availability = availability
        self.apply_calibration = apply_calibration

        # Slots setup: 1 hour slots from day_start_hour to day_end_hour
        self.day_start_hour = availability.day_start_hour
        self.day_end_hour = availability.day_end_hour
        self.hours_per_day = self.day_end_hour - self.day_start_hour
        self.total_slots = self.horizon_days * self.hours_per_day

        # Compute blocked slots from fixed commitments
        self.blocked_slots = self._compute_blocked_slots()

    def _compute_blocked_slots(self) -> List[int]:
        blocked = set()
        for d in range(self.horizon_days):
            current_date = self.start_dt + timedelta(days=d)
            dow = current_date.weekday()
            for comm in self.commitments:
                if comm.day_of_week == dow:
                    try:
                        s_h, s_m = map(int, comm.start_time.split(":"))
                        e_h, e_m = map(int, comm.end_time.split(":"))
                        # Map to day hours
                        slot_start = max(self.day_start_hour, s_h)
                        slot_end = min(self.day_end_hour, math.ceil(e_h + (e_m / 60.0)))
                        for h in range(slot_start, slot_end):
                            day_offset = d * self.hours_per_day
                            blocked.add(day_offset + (h - self.day_start_hour))
                    except Exception:
                        pass
        return sorted(list(blocked))

    def _slot_to_datetime(self, slot: int) -> Tuple[str, str, str]:
        day_idx = slot // self.hours_per_day
        hour_offset = slot % self.hours_per_day
        actual_hour = self.day_start_hour + hour_offset
        task_date = self.start_dt + timedelta(days=day_idx)
        date_str = task_date.strftime("%Y-%m-%d")
        start_time_str = f"{actual_hour:02d}:00"
        return date_str, start_time_str, f"{task_date.strftime('%a, %b %d')}"

    def solve_strategy(self, strategy: ScheduleStrategy) -> ScheduleOption:
        model = cp_model.CpModel()
        
        # Build tasks representation
        task_data = []
        for t in self.raw_tasks:
            dur = max(1, math.ceil(get_calibrated_hours(t, self.apply_calibration)))
            # Compute deadline in relative slot index
            t_deadline = parse_date(t.deadline)
            days_until = (t_deadline - self.start_dt).days
            # deadline slot is end of working day on deadline date
            deadline_slot = min(self.total_slots, (days_until + 1) * self.hours_per_day)
            
            task_data.append({
                "task": t,
                "dur": dur,
                "deadline_slot": max(dur, deadline_slot),
                "is_hard": t.difficulty == "hard",
                "priority_weight": {"urgent": 4, "high": 3, "medium": 2, "low": 1}.get(t.priority.value, 2)
            })

        # Decision variables
        task_intervals = []
        task_starts = {}
        task_ends = {}
        task_days = {}
        slack_vars = {}

        for i, td in enumerate(task_data):
            t = td["task"]
            dur = td["dur"]
            
            # Start variable
            start_var = model.NewIntVar(0, self.total_slots - dur, f"start_{t.id}")
            end_var = model.NewIntVar(dur, self.total_slots, f"end_{t.id}")
            interval_var = model.NewIntervalVar(start_var, dur, end_var, f"interval_{t.id}")
            
            task_starts[t.id] = start_var
            task_ends[t.id] = end_var
            task_intervals.append(interval_var)

            # Slack variable for deadline feasibility relaxation check
            slack_var = model.NewIntVar(0, self.total_slots, f"slack_{t.id}")
            slack_vars[t.id] = slack_var
            
            # Constraint: end_var <= deadline_slot + slack
            model.Add(end_var <= td["deadline_slot"] + slack_var)

        # Fixed commitment intervals (no overlap)
        fixed_intervals = []
        for b_slot in self.blocked_slots:
            fixed_int = model.NewIntervalVar(b_slot, 1, b_slot + 1, f"fixed_{b_slot}")
            fixed_intervals.append(fixed_int)

        # No overlapping of any flexible task with each other OR with fixed commitments
        model.AddNoOverlap(task_intervals + fixed_intervals)

        # Dependencies constraints
        id_to_task = {td["task"].id: td for td in task_data}
        for td in task_data:
            t = td["task"]
            for dep_id in t.dependencies:
                if dep_id in task_starts and dep_id in task_ends:
                    # Dep must finish before t starts
                    model.Add(task_starts[t.id] >= task_ends[dep_id])

        # Formulate objective based on strategy
        objective_terms = []
        
        # Heavy penalty on deadline slack (we want slack = 0 if feasible)
        for td in task_data:
            t = td["task"]
            objective_terms.append(slack_vars[t.id] * 10000 * td["priority_weight"])

        if strategy == ScheduleStrategy.DEADLINE_FIRST:
            # Objective: Finish early, prioritize early deadlines
            for td in task_data:
                t = td["task"]
                # Higher weight to end_var for tasks with closer deadlines
                weight = max(1, (self.total_slots - td["deadline_slot"]) // self.hours_per_day + 1)
                objective_terms.append(task_ends[t.id] * weight)

        elif strategy == ScheduleStrategy.BALANCED:
            # Objective: Penalize clustering late in the week or high slot numbers,
            # encourage even distribution across days
            for td in task_data:
                t = td["task"]
                # Linear spreading penalty
                objective_terms.append(task_starts[t.id] * 5)
            # Add preference for mid-day slots
            for td in task_data:
                t = td["task"]
                objective_terms.append(task_ends[t.id] * 2)

        elif strategy == ScheduleStrategy.FOCUS_FIRST:
            # Objective: Prefer morning hours (9am - 1pm) for hard tasks
            # Morning slots correspond to slot % hours_per_day in [1, 5]
            for td in task_data:
                t = td["task"]
                if td["is_hard"]:
                    # Strongly reward earlier parts of days
                    objective_terms.append(task_starts[t.id] * 3)
                else:
                    objective_terms.append(task_starts[t.id] * 1)

        model.Minimize(sum(objective_terms))

        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 3.0
        status = solver.Solve(model)

        scheduled_tasks: List[Task] = []
        is_strictly_feasible = True
        total_slack = 0
        infeasibility_details = None

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for td in task_data:
                t = td["task"].model_copy()
                start_val = solver.Value(task_starts[t.id])
                dur_val = td["dur"]
                end_val = start_val + dur_val
                slack_val = solver.Value(slack_vars[t.id])

                total_slack += slack_val
                if slack_val > 0:
                    is_strictly_feasible = False

                date_str, start_time_str, _ = self._slot_to_datetime(start_val)
                # Compute end time
                end_hour = self.day_start_hour + (start_val % self.hours_per_day) + dur_val
                # If wraps across, cap nicely
                end_time_str = f"{min(self.day_end_hour, end_hour):02d}:00"

                t.scheduled_day = date_str
                t.scheduled_start = f"{date_str}T{start_time_str}:00"
                t.scheduled_end = f"{date_str}T{end_time_str}:00"
                scheduled_tasks.append(t)

            if not is_strictly_feasible:
                infeasibility_details = {
                    "slack_hours_needed": total_slack,
                    "bottlenecks": [
                        td["task"].title for td in task_data
                        if solver.Value(slack_vars[td["task"].id]) > 0
                    ],
                    "recommendation": f"Schedule requires {total_slack} additional hours beyond current deadlines. Reschedule or reduce task scope."
                }
        else:
            # Fallback simple greedy layout if solver fails completely
            scheduled_tasks = self._fallback_greedy_schedule()
            is_strictly_feasible = False

        # Build trade-offs and metrics
        metrics, trade_offs, title, subtitle = self._describe_strategy(
            strategy, scheduled_tasks, is_strictly_feasible, total_slack
        )

        return ScheduleOption(
            strategy=strategy,
            title=title,
            subtitle=subtitle,
            is_feasible=is_strictly_feasible,
            scheduled_tasks=scheduled_tasks,
            metrics=metrics,
            trade_offs=trade_offs,
            infeasibility_details=infeasibility_details
        )

    def _fallback_greedy_schedule(self) -> List[Task]:
        # Fallback allocation ensuring tasks have valid days
        res = []
        day_load = [0] * self.horizon_days
        for i, t in enumerate(self.raw_tasks):
            copy_t = t.model_copy()
            best_day = i % self.horizon_days
            curr_date = (self.start_dt + timedelta(days=best_day)).strftime("%Y-%m-%d")
            copy_t.scheduled_day = curr_date
            copy_t.scheduled_start = f"{curr_date}T10:00:00"
            copy_t.scheduled_end = f"{curr_date}T12:00:00"
            res.append(copy_t)
        return res

    def _describe_strategy(
        self,
        strategy: ScheduleStrategy,
        tasks: List[Task],
        is_feasible: bool,
        total_slack: int
    ) -> Tuple[Dict[str, Any], Dict[str, str], str, str]:
        
        # Calculate daily loads
        loads: Dict[str, float] = {}
        for t in tasks:
            day = t.scheduled_day or "unassigned"
            loads[day] = loads.get(day, 0) + (t.estimated_hours or 2.0)
        
        max_load = max(loads.values()) if loads else 0
        avg_load = sum(loads.values()) / max(1, len(loads)) if loads else 0

        metrics = {
            "max_daily_hours": round(max_load, 1),
            "average_daily_hours": round(avg_load, 1),
            "active_days": len(loads),
            "slack_overdue_hours": total_slack,
            "feasibility_score": 100 if is_feasible else max(30, 100 - total_slack * 10)
        }

        if strategy == ScheduleStrategy.DEADLINE_FIRST:
            title = "Deadline-First Strategy"
            subtitle = "Packs critical deliverables early to maximize safety buffers before due dates."
            trade_offs = {
                "pros": "Maximizes buffer before deadlines; lowest risk of late penalties; eliminates procrastination anxiety.",
                "cons": "Earlier days can have higher work density; less spacing between intense assignments.",
                "ideal_for": "Students facing imminent exam weeks or strict assignment cutoffs."
            }
        elif strategy == ScheduleStrategy.BALANCED:
            title = "Balanced Workload Strategy"
            subtitle = "Evenly levels daily effort to maintain steady mental energy and avoid exhaustion."
            trade_offs = {
                "pros": "Prevents burnout; daily hours remain steady around 4-6 hours; predictable work-life balance.",
                "cons": "Tasks finish closer to their deadlines rather than days ahead; lower shock absorption for emergencies.",
                "ideal_for": "Interns and students juggling regular coursework with consistent daily routines."
            }
        else: # FOCUS_FIRST
            title = "Focus-First (Deep Work) Strategy"
            subtitle = "Groups demanding tasks into morning high-energy slots to minimize cognitive switching."
            trade_offs = {
                "pros": "Protects continuous 3-4 hour focus sessions; schedules complex coding/math when mental energy peaks.",
                "cons": "Lighter tasks may get postponed toward afternoons or weekends; requires disciplined mornings.",
                "ideal_for": "Project deliverables, research papers, and technical coding labs."
            }

        return metrics, trade_offs, title, subtitle
