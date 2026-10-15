import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Undo2,
  Check,
  Zap,
  Coffee,
  Target,
  RotateCcw
} from 'lucide-react';
import {
  Task, ScheduleStrategy, ScheduleOption,
  OptimizationResponse, WorkloadAnalysis
} from '../types';

interface OptimizationStudioProps {
  originalTasks: Task[];
  optimizationResult: OptimizationResponse | null;
  onAcceptPlan: (tasks: Task[]) => void;
  onKeepOriginal: () => void;
  onSelectStrategy: (strategy: ScheduleStrategy) => void;
  currentStrategy: ScheduleStrategy;
  isLoading: boolean;
  onRunOptimization: () => void;
}

export const OptimizationStudio: React.FC<OptimizationStudioProps> = ({
  originalTasks,
  optimizationResult,
  onAcceptPlan,
  onKeepOriginal,
  onSelectStrategy,
  currentStrategy,
  isLoading,
  onRunOptimization,
}) => {
  const [viewTab, setViewTab] = useState<'comparison' | 'proposed'>('comparison');

  // Active option from optimization result
  const activeOption = optimizationResult
    ? optimizationResult.primary_option.strategy === currentStrategy
      ? optimizationResult.primary_option
      : optimizationResult.alternative_options.find((o) => o.strategy === currentStrategy) ||
        optimizationResult.primary_option
    : null;

  const strategiesList: Array<{
    id: ScheduleStrategy;
    title: string;
    icon: any;
    badge: string;
    tagline: string;
  }> = [
    {
      id: 'deadline_first',
      title: 'Deadline-First Strategy',
      icon: Zap,
      badge: 'Zero Lateness',
      tagline: 'Packs urgent work early to maximize emergency buffers.',
    },
    {
      id: 'balanced',
      title: 'Balanced Workload Strategy',
      icon: Coffee,
      badge: 'Burnout Prevention',
      tagline: 'Flattens daily effort evenly at 4-6h/day to avoid fatigue.',
    },
    {
      id: 'focus_first',
      title: 'Focus-First (Deep Work)',
      icon: Target,
      badge: 'Cognitive Flow',
      tagline: 'Reserves morning high-energy hours for hard technical code.',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Strategy Switcher Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#8878F5]/10 text-[#8878F5]">
                Google OR-Tools CP-SAT Constraint Engine
              </span>
              <span className="text-xs text-slate-400">• Multi-Strategy Generator</span>
            </div>
            <h2 className="text-xl font-bold text-[#151A2D] mt-1">
              Optimization Studio: Comparative Decision Support
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Compare trade-offs between competing strategies. Each schedule satisfies non-overlap constraints with your fixed lectures and meetings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onKeepOriginal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Keep Original</span>
            </button>
            <button
              onClick={() => {
                if (activeOption) {
                  onAcceptPlan(activeOption.scheduled_tasks);
                }
              }}
              disabled={!activeOption}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] transition-all shadow-md shadow-[#8878F5]/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Accept & Apply This Plan</span>
            </button>
          </div>
        </div>

        {/* 3 Strategy Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategiesList.map((strat) => {
            const Icon = strat.icon;
            const isSelected = currentStrategy === strat.id;

            return (
              <motion.div
                key={strat.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => onSelectStrategy(strat.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#8878F5] bg-[#8878F5]/10 shadow-md shadow-[#8878F5]/15 ring-2 ring-[#8878F5]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#8878F5] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#151A2D]">{strat.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    isSelected ? 'bg-[#8878F5] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {strat.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {strat.tagline}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Infeasibility / Slack Alert Banner (Honest Constraint Reporting) */}
      {activeOption && !activeOption.is_feasible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3.5 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-amber-900">
              Honest Feasibility Report: Constraints Exceed Hard Deadlines
            </h4>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Under current fixed commitments and estimated hours, this plan requires{' '}
              <strong>+{activeOption.metrics.slack_overdue_hours}h slack</strong> to accommodate all deliverables.
              TaskTide has scheduled the tasks using mathematical relaxation, but you will need to extend deadlines or reduce scope on bottleneck items.
            </p>
            {activeOption.infeasibility_details && (
              <p className="mt-1 font-semibold text-amber-900">
                Identified Bottlenecks: {activeOption.infeasibility_details.bottlenecks?.join(', ')}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Strategy Trade-Offs Matrix Card with Fluid Morph Animation */}
      {activeOption && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#151A2D] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8878F5]" />
              Trade-Off Analysis: What You Gain vs What You Sacrifice
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#8878F5]/10 text-[#8878F5] font-bold">
              Feasibility Score: {activeOption.metrics.feasibility_score}/100
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeOption.strategy}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 transition-shadow hover:shadow-md"
                >
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What You Gain
                  </span>
                  <p className="text-emerald-900/80 leading-relaxed">
                    {activeOption.trade_offs.pros}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 transition-shadow hover:shadow-md"
                >
                  <span className="font-bold text-amber-800 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> What You Sacrifice
                  </span>
                  <p className="text-amber-900/80 leading-relaxed">
                    {activeOption.trade_offs.cons}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-[#8878F5]/10 border border-[#8878F5]/20 transition-shadow hover:shadow-md"
                >
                  <span className="font-bold text-[#8878F5] flex items-center gap-1.5 mb-1.5">
                    <Target className="w-4 h-4 text-[#8878F5]" /> Ideal Scenario
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {activeOption.trade_offs.ideal_for}
                  </p>
                </motion.div>
              </div>

              {/* Key Metrics Strip with Spring Scale */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Peak Day Effort</span>
                  <div className="text-lg font-bold text-[#151A2D] mt-0.5">
                    {activeOption.metrics.max_daily_hours} hrs
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Daily Work</span>
                  <div className="text-lg font-bold text-[#151A2D] mt-0.5">
                    {activeOption.metrics.average_daily_hours} hrs/day
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Active Work Days</span>
                  <div className="text-lg font-bold text-[#151A2D] mt-0.5">
                    {activeOption.metrics.active_days} / 7 days
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Lateness Slack</span>
                  <div className={`text-lg font-bold mt-0.5 ${activeOption.metrics.slack_overdue_hours > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeOption.metrics.slack_overdue_hours === 0 ? '0h (On Time)' : `+${activeOption.metrics.slack_overdue_hours}h`}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Side-by-Side Comparison: Original vs Proposed Schedule */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#151A2D]">
              Side-by-Side Schedule Transformation
            </h3>
            <p className="text-xs text-slate-500">
              Notice how flexible tasks have been relocated away from overloaded days and protected from fixed commitments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Original Unoptimized / Current State */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Original Plan</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  Manual / Unbalanced
                </span>
              </div>
              <span className="text-xs text-slate-400">{originalTasks.length} tasks</span>
            </div>

            <div className="space-y-2.5">
              {originalTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-sm flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-800">{t.title}</span>
                    <div className="flex items-center gap-3 text-slate-400 mt-1">
                      <span>Due: {t.deadline}</span>
                      <span>{t.estimated_hours}h</span>
                      <span className="capitalize">{t.difficulty}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                    {t.scheduled_day || 'Unslotted'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Proposed Plan (OR-Tools CP-SAT) */}
          <div className="p-5 rounded-2xl bg-[#8878F5]/5 border border-[#8878F5]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#8878F5]/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8878F5] uppercase">
                  OR-Tools Proposed Plan
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#8878F5] text-white font-semibold">
                  Optimized
                </span>
              </div>
              <span className="text-xs text-[#8878F5] font-semibold">
                {activeOption?.scheduled_tasks.length || 0} scheduled
              </span>
            </div>

            <div className="space-y-2.5">
              {activeOption?.scheduled_tasks.map((t) => {
                const orig = originalTasks.find((o) => o.id === t.id);
                const wasMoved = orig && orig.scheduled_day !== t.scheduled_day;

                return (
                  <motion.div
                    key={t.id}
                    layout
                    className={`p-3 rounded-xl bg-white border text-xs shadow-sm flex items-start justify-between gap-3 ${
                      wasMoved
                        ? 'border-[#8878F5] ring-2 ring-[#8878F5]/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{t.title}</span>
                        {wasMoved && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Relocated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 mt-1">
                        <span>Due: {t.deadline}</span>
                        <span>{t.estimated_hours}h</span>
                        <span className="text-[#8878F5] font-semibold">
                          Time: {t.scheduled_start?.split('T')[1]?.slice(0, 5) || '10:00'} - {t.scheduled_end?.split('T')[1]?.slice(0, 5) || '12:00'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-[#8878F5] bg-[#8878F5]/10 px-2 py-0.5 rounded-lg block">
                        {t.scheduled_day || 'Assigned'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onKeepOriginal}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Keep Original Schedule
          </button>
          <button
            onClick={() => {
              if (activeOption) {
                onAcceptPlan(activeOption.scheduled_tasks);
              }
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] transition-all shadow-lg shadow-[#8878F5]/25 hover:shadow-xl"
          >
            Accept & Commit This Plan
          </button>
        </div>
      </div>
    </div>
  );
};
