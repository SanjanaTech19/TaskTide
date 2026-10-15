import {
  Task, FixedCommitment, DailyAvailability, ScheduleStrategy,
  OptimizationResponse, WorkloadAnalysis, WhatIfResponse,
  DecompositionResponse, ExtractedTask, AnalyticsData, UserProfile, TaskCategory,
  AuthResponse, LoginCredentials, SignUpCredentials
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'tasktide_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- AUTH API ---

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function signup(credentials: SignUpCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sign up failed' }));
    throw new Error(err.detail || 'Sign up failed');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function demoLogin(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Demo login failed');
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchMe(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json();
}

export function logout() {
  clearAuthToken();
}

// --- DATABASE TASK PERSISTENCE ---

export async function saveTaskApi(task: Task): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to save task to database');
  return res.json();
}

export async function updateTaskApi(taskId: string, task: Task): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to update task in database');
  return res.json();
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function syncPlanApi(tasks: Task[]): Promise<void> {
  await fetch(`${API_BASE}/tasks/sync-plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tasks),
  });
}

export async function saveCommitmentApi(comm: FixedCommitment): Promise<FixedCommitment> {
  const res = await fetch(`${API_BASE}/commitments/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(comm),
  });
  if (!res.ok) throw new Error('Failed to save commitment');
  return res.json();
}

export async function deleteCommitmentApi(commId: string): Promise<void> {
  await fetch(`${API_BASE}/commitments/${commId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

// --- WORKSPACE & SCHEDULING ---

export async function fetchInitialState(): Promise<{
  user_profile: UserProfile;
  tasks: Task[];
  commitments: FixedCommitment[];
  start_date: string;
  availability: DailyAvailability;
  initial_analysis: WorkloadAnalysis;
}> {
  const res = await fetch(`${API_BASE}/initial-state`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load workspace state');
  return res.json();
}

export async function optimizeSchedule(
  tasks: Task[],
  commitments: FixedCommitment[],
  startDate: string,
  strategy: ScheduleStrategy = 'balanced',
  availability: DailyAvailability,
  applyCalibration: boolean = true
): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      tasks,
      commitments,
      start_date: startDate,
      horizon_days: 7,
      strategy,
      availability,
      apply_calibration: applyCalibration,
    }),
  });
  if (!res.ok) throw new Error('Failed to optimize schedule');
  return res.json();
}

export async function checkFeasibility(
  tasks: Task[],
  commitments: FixedCommitment[],
  startDate: string,
  availability: DailyAvailability,
  applyCalibration: boolean = true
): Promise<WorkloadAnalysis> {
  const res = await fetch(`${API_BASE}/feasibility`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      tasks,
      commitments,
      start_date: startDate,
      horizon_days: 7,
      strategy: 'balanced',
      availability,
      apply_calibration: applyCalibration,
    }),
  });
  if (!res.ok) throw new Error('Failed to evaluate workload feasibility');
  return res.json();
}

export async function simulateWhatIf(
  baseTasks: Task[],
  commitments: FixedCommitment[],
  startDate: string,
  params: {
    newTask?: Task;
    modifiedTask?: Task;
    removedTaskId?: string;
    adjustedMaxHoursPerDay?: number;
  }
): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/what-if`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      base_tasks: baseTasks,
      commitments,
      start_date: startDate,
      new_task: params.newTask,
      modified_task: params.modifiedTask,
      removed_task_id: params.removedTaskId,
      adjusted_max_hours_per_day: params.adjustedMaxHoursPerDay,
    }),
  });
  if (!res.ok) throw new Error('Failed to simulate scenario');
  return res.json();
}

export async function decomposeProject(
  projectTitle: string,
  projectDescription: string,
  totalHours: number,
  deadline: string,
  category: TaskCategory = 'project'
): Promise<DecompositionResponse> {
  const res = await fetch(`${API_BASE}/decompose`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      project_title: projectTitle,
      project_description: projectDescription,
      total_hours: totalHours,
      deadline,
      category,
    }),
  });
  if (!res.ok) throw new Error('Failed to decompose project');
  return res.json();
}

export async function extractDocumentTasks(
  content: string,
  filename: string
): Promise<ExtractedTask[]> {
  const res = await fetch(`${API_BASE}/extract-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, filename }),
  });
  if (!res.ok) throw new Error('Failed to extract tasks from document');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchScheduleHistory(): Promise<{ history: any[] }> {
  const res = await fetch(`${API_BASE}/schedule-history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}
