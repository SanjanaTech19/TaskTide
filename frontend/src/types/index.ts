export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TaskCategory = 'assignment' | 'exam_prep' | 'project' | 'internship' | 'personal';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  estimated_hours: number;
  actual_hours?: number | null;
  deadline: string; // YYYY-MM-DD
  difficulty: Difficulty;
  priority: Priority;
  is_fixed?: boolean;
  fixed_start?: string | null;
  fixed_end?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  scheduled_day?: string | null; // YYYY-MM-DD
  dependencies?: string[];
  completed: boolean;
  color?: string;
}

export interface FixedCommitment {
  id: string;
  title: string;
  day_of_week: number; // 0 = Mon, 6 = Sun
  start_time: string; // "09:00"
  end_time: string;   // "11:00"
  category: string;
  recurring: boolean;
  color?: string;
}

export interface DailyAvailability {
  day_start_hour: number;
  day_end_hour: number;
  max_work_hours_per_day: number;
  preferred_deep_work_start: number;
  preferred_deep_work_end: number;
}

export type ScheduleStrategy = 'deadline_first' | 'balanced' | 'focus_first';

export interface DayBreakdown {
  date: string;
  day_name: string;
  available_hours: number;
  allocated_hours: number;
  fixed_hours: number;
  utilization_pct: number;
  status: 'light' | 'optimal' | 'heavy' | 'overload';
  tasks: string[];
}

export interface DeadlineRisk {
  task_id: string;
  task_title: string;
  deadline: string;
  hours_needed: number;
  hours_available_before_deadline: number;
  capacity_gap: number;
  risk_level: 'safe' | 'moderate' | 'high' | 'critical';
  explanation: string;
}

export interface WorkloadAnalysis {
  total_required_hours: number;
  total_available_hours: number;
  capacity_gap_hours: number;
  is_feasible: boolean;
  burnout_risk_score: number;
  day_breakdowns: DayBreakdown[];
  deadline_risks: DeadlineRisk[];
  recommendations: string[];
}

export interface ScheduleOption {
  strategy: ScheduleStrategy;
  title: string;
  subtitle: string;
  is_feasible: boolean;
  scheduled_tasks: Task[];
  metrics: {
    max_daily_hours: number;
    average_daily_hours: number;
    active_days: number;
    slack_overdue_hours: number;
    feasibility_score: number;
  };
  trade_offs: {
    pros: string;
    cons: string;
    ideal_for: string;
  };
  infeasibility_details?: {
    slack_hours_needed: number;
    bottlenecks: string[];
    recommendation: string;
  } | null;
}

export interface OptimizationResponse {
  status: string;
  primary_option: ScheduleOption;
  alternative_options: ScheduleOption[];
  workload_analysis: WorkloadAnalysis;
  calibration_applied: boolean;
}

export interface WhatIfResponse {
  original_feasibility: boolean;
  new_feasibility: boolean;
  original_gap: number;
  new_gap: number;
  affected_tasks: string[];
  capacity_delta: number;
  collision_warnings: string[];
  recommended_mitigation: string;
  updated_analysis: WorkloadAnalysis;
}

export interface SubtaskItem {
  title: string;
  description: string;
  estimated_hours: number;
  difficulty: Difficulty;
  priority: Priority;
  order: number;
  dependencies: string[];
}

export interface DecompositionResponse {
  project_title: string;
  subtasks: SubtaskItem[];
  rationale: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  suggested_hours: number;
  deadline: string;
  difficulty: Difficulty;
  priority: Priority;
  category: TaskCategory;
  deliverables: string[];
}

export interface AnalyticsData {
  calibration_metrics: {
    overall_drift_factor: number;
    interpretation: string;
    categories: Array<{
      category: string;
      multiplier: number;
      accuracy_pct: number;
      sample_size: number;
    }>;
  };
  weekly_completion_history: Array<{
    week: string;
    estimated_hours: number;
    actual_hours: number;
    completion_rate: number;
  }>;
  burnout_trend: Array<{
    day: string;
    strain_score: number;
  }>;
}

export interface UserProfile {
  name: string;
  role: string;
  institution: string;
  avatar_initials: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  institution: string;
  avatar_initials: string;
  max_work_hours_per_day: number;
}

export interface AuthResponse {
  token: string;
  user: UserProfileResponse;
  tasks: Task[];
  commitments: FixedCommitment[];
  start_date: string;
  availability: DailyAvailability;
  initial_analysis: WorkloadAnalysis;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  role?: string;
  institution?: string;
  seed_demo_data?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
