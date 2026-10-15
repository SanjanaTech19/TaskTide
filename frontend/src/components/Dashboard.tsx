import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, WorkloadAnalysis, FixedCommitment, UserProfile } from '../types';

interface DashboardProps {
  userProfile?: UserProfile;
  tasks: Task[];
  commitments: FixedCommitment[];
  analysis?: WorkloadAnalysis | null;
  onToggleTask: (taskId: string) => void;
  onOptimizeClick: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenWhatIf: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  tasks,
  commitments,
  analysis,
  onToggleTask,
  onOptimizeClick,
  onNavigateTab,
  onOpenWhatIf,
}) => {
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Today's tasks (due today or within 2 days, or scheduled)
  const todayTasks = activeTasks.slice(0, 4);

  // Trigger celebratory confetti on task complete
  const handleComplete = (taskId: string) => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#8878F5', '#A7E5C2', '#3B82F6'],
    });
    onToggleTask(taskId);
  };

  const highestRisk = analysis?.deadline_risks?.find(
    (r) => r.risk_level === 'critical' || r.risk_level === 'high'
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* 1. Greeting & Date Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#151A2D] tracking-tight">
            Good day, {userProfile?.name?.split(' ')[0] || 'Alex'} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            You have <strong className="text-[#151A2D]">{activeTasks.length} active deliverables</strong> this week.
            {analysis && analysis.capacity_gap_hours > 0 ? (
              <span className="text-rose-600 font-semibold ml-1">
                One severe capacity bottleneck needs immediate attention.
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold ml-1">
                Your weekly schedule is mathematically feasible.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOptimizeClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-md shadow-[#8878F5]/25 hover:shadow-lg hover:shadow-[#8878F5]/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Optimize My Week</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Urgent Attention Banner (If capacity gap or collision exists) */}
      {highestRisk && (
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/40 to-white border border-rose-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                  Capacity Bottleneck Detected
                </span>
                <span className="text-xs text-slate-500">Due: {highestRisk.deadline}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {highestRisk.task_title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
                {highestRisk.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <button
              onClick={() => onNavigateTab('workload')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors"
            >
              Analyze Gap
            </button>
            <button
              onClick={onOptimizeClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Auto-Resolve
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. Workload Feasibility Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Card 1: Hours Required */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Required Work</span>
            <Clock className="w-4 h-4 text-[#8878F5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151A2D]">
              {analysis?.total_required_hours ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">hours</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            Across {activeTasks.length} active deliverables
          </p>
        </motion.div>

        {/* Card 2: Hours Available */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Available Capacity</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151A2D]">
              {analysis?.total_available_hours ?? 49.0}
            </span>
            <span className="text-xs text-slate-400 font-medium">hours</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            After fixed lectures & commitments
          </p>
        </motion.div>

        {/* Card 3: Capacity Gap / Surplus */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Capacity Margin</span>
            {analysis && analysis.capacity_gap_hours > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#A7E5C2]" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            {analysis && analysis.capacity_gap_hours > 0 ? (
              <>
                <span className="text-3xl font-extrabold text-rose-600">
                  -{analysis.capacity_gap_hours}
                </span>
                <span className="text-xs text-rose-500 font-semibold">h deficit</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-emerald-600">
                  +{((analysis?.total_available_hours ?? 0) - (analysis?.total_required_hours ?? 0)).toFixed(1)}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">h buffer</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {analysis && analysis.capacity_gap_hours > 0
              ? 'Impossible without rescheduling'
              : 'Safe cushion for revisions'}
          </p>
        </motion.div>

        {/* Card 4: Burnout Strain Score */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow cursor-default"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Burnout Strain</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">
              {analysis?.burnout_risk_score ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                (analysis?.burnout_risk_score ?? 0) > 75
                  ? 'bg-rose-500'
                  : (analysis?.burnout_risk_score ?? 0) > 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${analysis?.burnout_risk_score ?? 0}%` }}
              transition={{ duration: 0.85, ease: 'easeOut' as const }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Two Column Workspace: Today's Focus vs Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Today's Focus Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#151A2D]">Today's Focus & Action List</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#8878F5]/10 text-[#8878F5] font-semibold">
                {activeTasks.length} pending
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-[#8878F5] hover:text-[#7866f0] flex items-center gap-1"
            >
              <span>Manage all tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {todayTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 card-hover flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <motion.button
                      whileTap={{ scale: 0.75 }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => handleComplete(task.id)}
                      className="mt-0.5 text-slate-300 hover:text-[#8878F5] transition-colors focus:outline-none"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-[#151A2D] truncate">
                          {task.title}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#8878F5]/10 text-[#8878F5]">
                          {task.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {task.description || 'No detailed instructions.'}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {task.estimated_hours}h estimated
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due {task.deadline}
                        </span>
                        <span className="capitalize text-slate-500 font-medium">
                          • {task.difficulty} load
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onNavigateTab('optimizer')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Slot in Calendar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {completedTasks.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Completed Today ({completedTasks.length})
                </p>
                <AnimatePresence>
                  {completedTasks.slice(0, 2).map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs text-slate-400 line-through mb-2"
                    >
                      <span>{t.title}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggleTask(t.id)}
                        className="text-slate-400 hover:text-slate-600 no-underline text-[11px]"
                      >
                        Undo
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 1 Col: Upcoming Deadlines & What-If Quick Sandbox */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Upcoming Deadlines Radar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#151A2D]">Upcoming Deadlines Radar</h3>
              <span className="text-[11px] text-slate-400 font-medium">This Week</span>
            </div>

            <div className="space-y-3.5">
              {analysis?.deadline_risks?.slice(0, 4).map((risk) => (
                <div key={risk.task_id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#151A2D] truncate max-w-[170px]">
                      {risk.task_title}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      risk.risk_level === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : risk.risk_level === 'high'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {risk.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>Due: {risk.deadline}</span>
                    <span>{risk.hours_needed}h needed</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        risk.capacity_gap > 0 ? 'bg-rose-500' : 'bg-[#8878F5]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (risk.hours_needed / Math.max(1, risk.hours_available_before_deadline)) * 100)}%`,
                      }}
                      transition={{ duration: 0.85, ease: 'easeOut' as const }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick What-If Simulator Card */}
          <div className="bg-gradient-to-br from-[#151A2D] to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#A7E5C2]" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#A7E5C2]">
                What-If Simulator
              </span>
            </div>
            <h4 className="text-sm font-bold">Simulate a surprise deadline or unexpected shift</h4>
            <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
              Test how an unexpected 4-hour lab or sick day will ripple across your entire week before committing.
            </p>
            <button
              onClick={onOpenWhatIf}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Simulator Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
