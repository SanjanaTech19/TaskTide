import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SmartCalendar } from './components/SmartCalendar';
import { WorkloadAnalysisView } from './components/WorkloadAnalysisView';
import { OptimizationStudio } from './components/OptimizationStudio';
import { TaskBreakdownView } from './components/TaskBreakdownView';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { OptimizationModal } from './components/OptimizationModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AuthPage } from './components/AuthPage';
import {
  Task, FixedCommitment, DailyAvailability,
  WorkloadAnalysis, ScheduleStrategy, OptimizationResponse, UserProfile, AuthResponse
} from './types';
import {
  fetchInitialState, optimizeSchedule, checkFeasibility,
  getAuthToken, fetchMe, logout, saveTaskApi, updateTaskApi, deleteTaskApi, syncPlanApi,
  saveCommitmentApi, deleteCommitmentApi
} from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [originalTasksSnapshot, setOriginalTasksSnapshot] = useState<Task[]>([]);
  const [commitments, setCommitments] = useState<FixedCommitment[]>([]);
  const [startDateStr, setStartDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<DailyAvailability>({
    day_start_hour: 8,
    day_end_hour: 22,
    max_work_hours_per_day: 7.0,
    preferred_deep_work_start: 9,
    preferred_deep_work_end: 13,
  });
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<ScheduleStrategy>('balanced');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);

  // Modals state
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState<boolean>(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [applyCalibration, setApplyCalibration] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check auth session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      setIsAuthChecking(false);
      return;
    }

    fetchMe()
      .then((data) => {
        applyAuthData(data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, []);

  const applyAuthData = (data: AuthResponse) => {
    setUserProfile({
      name: data.user.name,
      role: data.user.role,
      institution: data.user.institution,
      avatar_initials: data.user.avatar_initials,
    });
    setTasks(data.tasks);
    setOriginalTasksSnapshot(data.tasks);
    setCommitments(data.commitments);
    setStartDateStr(data.start_date);
    setAvailability(data.availability);
    setAnalysis(data.initial_analysis);
  };

  const handleAuthSuccess = (data: AuthResponse) => {
    applyAuthData(data);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    logout();
    setIsAuthenticated(false);
    setUserProfile(undefined);
    setTasks([]);
  };

  // Re-run feasibility analysis when tasks or calibration toggle change
  const refreshFeasibility = async (
    updatedTasks: Task[] = tasks,
    calib: boolean = applyCalibration,
    updatedCommitments: FixedCommitment[] = commitments
  ) => {
    try {
      const res = await checkFeasibility(
        updatedTasks,
        updatedCommitments,
        startDateStr,
        availability,
        calib
      );
      setAnalysis(res);
    } catch (err) {
      console.error('Failed to update feasibility:', err);
    }
  };

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const toggled = { ...t, completed: !t.completed };
        updateTaskApi(t.id, toggled).catch(console.error);
        return toggled;
      }
      return t;
    });
    setTasks(updated);
    refreshFeasibility(updated);
  };

  // Add task & persist to SQLite database
  const handleAddTask = (newTask: Task) => {
    const updated = [...tasks, newTask];
    setTasks(updated);
    refreshFeasibility(updated);
    saveTaskApi(newTask).catch(console.error);
  };

  // Delete task & persist to SQLite database
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    refreshFeasibility(updated);
    deleteTaskApi(taskId).catch(console.error);
  };

  // Add fixed commitment & persist to SQLite database
  const handleAddCommitment = (newComm: FixedCommitment) => {
    const updated = [...commitments, newComm];
    setCommitments(updated);
    refreshFeasibility(tasks, applyCalibration, updated);
    saveCommitmentApi(newComm).catch(console.error);
  };

  // Delete fixed commitment & persist to SQLite database
  const handleDeleteCommitment = (commId: string) => {
    const updated = commitments.filter((c) => c.id !== commId);
    setCommitments(updated);
    refreshFeasibility(tasks, applyCalibration, updated);
    deleteCommitmentApi(commId).catch(console.error);
  };

  // Trigger optimization sequence
  const handleOptimizeClick = () => {
    setIsOptimizeModalOpen(true);
  };

  // Complete optimization loading sequence
  const handleOptimizationComplete = async () => {
    setIsOptimizeModalOpen(false);
    setIsLoading(true);
    try {
      const res = await optimizeSchedule(
        tasks,
        commitments,
        startDateStr,
        currentStrategy,
        availability,
        applyCalibration
      );
      setOptimizationResult(res);
      setAnalysis(res.workload_analysis);
      setActiveTab('optimizer');
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch strategy inside Optimization Studio
  const handleSelectStrategy = async (strategy: ScheduleStrategy) => {
    setCurrentStrategy(strategy);
    try {
      const res = await optimizeSchedule(
        tasks,
        commitments,
        startDateStr,
        strategy,
        availability,
        applyCalibration
      );
      setOptimizationResult(res);
      setAnalysis(res.workload_analysis);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept proposed plan & sync to SQLite database
  const handleAcceptPlan = (scheduledTasks: Task[]) => {
    setTasks(scheduledTasks);
    refreshFeasibility(scheduledTasks);
    syncPlanApi(scheduledTasks).catch(console.error);
    setActiveTab('calendar');
  };

  // Keep original
  const handleKeepOriginal = () => {
    setTasks(originalTasksSnapshot);
    refreshFeasibility(originalTasksSnapshot);
    setActiveTab('calendar');
  };

  // Manual calendar task update
  const handleUpdateTaskSchedule = (taskId: string, day: string, startHour: number) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const item = {
          ...t,
          scheduled_day: day,
          scheduled_start: `${day}T${startHour.toString().padStart(2, '0')}:00:00`,
        };
        updateTaskApi(t.id, item).catch(console.error);
        return item;
      }
      return t;
    });
    setTasks(updated);
    refreshFeasibility(updated);
  };

  // If checking auth state, show a clean loading screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#151A2D] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8878F5] to-[#A7E5C2] flex items-center justify-center animate-pulse shadow-lg shadow-[#8878F5]/30 mb-4">
          <svg className="w-6 h-6 text-[#151A2D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 12c.6 0 1.2-.4 1.4-1 1.1-2.9 3.8-5 7-5 3.6 0 6.6 2.6 7.4 6.1.2.9 1 1.5 1.9 1.5.1 0 .2 0 .3-.1" />
            <path d="M2 17c.7 0 1.3-.4 1.5-1 1-2.4 3.3-4.1 6-4.1 3.1 0 5.8 2.2 6.5 5.2.2.8.9 1.3 1.8 1.3.1 0 .2 0 .3-.1" />
          </svg>
        </div>
        <p className="text-sm font-semibold tracking-wide">Connecting to TaskTide Engine...</p>
      </div>
    );
  }

  // If not authenticated, render Login/Sign-up page
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#EFEAFF] flex text-[#151A2D]">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        analysis={analysis}
        onOpenWhatIf={() => setIsWhatIfModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        applyCalibration={applyCalibration}
        setApplyCalibration={(val) => {
          setApplyCalibration(val);
          refreshFeasibility(tasks, val);
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          analysis={analysis}
          onOptimizeClick={handleOptimizeClick}
          onWhatIfClick={() => setIsWhatIfModalOpen(true)}
        />

        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <Dashboard
              userProfile={userProfile}
              tasks={tasks}
              commitments={commitments}
              analysis={analysis}
              onToggleTask={handleToggleTask}
              onOptimizeClick={handleOptimizeClick}
              onNavigateTab={setActiveTab}
              onOpenWhatIf={() => setIsWhatIfModalOpen(true)}
            />
          )}

          {activeTab === 'calendar' && (
            <SmartCalendar
              tasks={tasks}
              commitments={commitments}
              startDateStr={startDateStr}
              availability={availability}
              onOptimizeClick={handleOptimizeClick}
              onUpdateTaskSchedule={handleUpdateTaskSchedule}
              onAddCommitment={handleAddCommitment}
              onDeleteCommitment={handleDeleteCommitment}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadAnalysisView
              analysis={analysis}
              onOptimizeClick={handleOptimizeClick}
              onOpenWhatIf={() => setIsWhatIfModalOpen(true)}
            />
          )}

          {activeTab === 'optimizer' && (
            <OptimizationStudio
              originalTasks={originalTasksSnapshot}
              optimizationResult={optimizationResult}
              onAcceptPlan={handleAcceptPlan}
              onKeepOriginal={handleKeepOriginal}
              onSelectStrategy={handleSelectStrategy}
              currentStrategy={currentStrategy}
              isLoading={isLoading}
              onRunOptimization={handleOptimizeClick}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskBreakdownView
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleTask}
              onOptimizeClick={handleOptimizeClick}
              initialMode="tasks"
            />
          )}

          {activeTab === 'documents' && (
            <TaskBreakdownView
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleTask}
              onOptimizeClick={handleOptimizeClick}
              initialMode="documents"
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <OptimizationModal
        isOpen={isOptimizeModalOpen}
        onComplete={handleOptimizationComplete}
      />

      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        baseTasks={tasks}
        commitments={commitments}
        startDateStr={startDateStr}
        onApplyScenario={(updatedTasks) => {
          setTasks(updatedTasks);
          refreshFeasibility(updatedTasks);
        }}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        onRestoreSnapshot={(snapshotTasks) => {
          setTasks(snapshotTasks);
          refreshFeasibility(snapshotTasks);
        }}
      />
    </div>
  );
}

export default App;
