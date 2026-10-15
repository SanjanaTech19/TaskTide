import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { WorkloadAnalysis, DayBreakdown, DeadlineRisk } from '../types';

interface WorkloadAnalysisViewProps {
  analysis?: WorkloadAnalysis | null;
  onOptimizeClick: () => void;
  onOpenWhatIf: () => void;
}

export const WorkloadAnalysisView: React.FC<WorkloadAnalysisViewProps> = ({
  analysis,
  onOptimizeClick,
  onOpenWhatIf,
}) => {
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading workload feasibility data...
      </div>
    );
  }

  const hasCapacityGap = analysis.capacity_gap_hours > 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Core Feasibility Diagnostic Banner */}
      <div className={`p-6 rounded-2xl border ${
        hasCapacityGap
          ? 'bg-gradient-to-r from-rose-50 via-white to-amber-50/30 border-rose-200'
          : 'bg-gradient-to-r from-emerald-50 via-white to-mint/10 border-emerald-200'
      } card-shadow`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              hasCapacityGap
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}>
              {hasCapacityGap ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                  hasCapacityGap
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {hasCapacityGap ? 'Capacity Deficit Flagged' : 'Workload Feasible'}
                </span>
                <span className="text-xs text-slate-500">Constraint-Based Verification</span>
              </div>

              <h2 className="text-xl font-bold text-[#151A2D] mt-1.5">
                {hasCapacityGap
                  ? `Weekly Overload: ${analysis.capacity_gap_hours} Hours Gap Before Deadlines`
                  : 'All Tasks Satisfy Available Window & Deadline Constraints'}
              </h2>

              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {hasCapacityGap
                  ? `You have ${analysis.total_required_hours} hours of work required, but only ${analysis.total_available_hours} hours of unblocked focus time available. TaskTide refuses to present a fake schedule that pretends every deliverable fits without decision-making.`
                  : `Your ${analysis.total_required_hours} hours of work fit cleanly within your ${analysis.total_available_hours} available hours, leaving a comfortable cushion for unexpected interruptions.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <button
              onClick={onOpenWhatIf}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              Simulate Alternatives
            </button>
            <button
              onClick={onOptimizeClick}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-md shadow-[#8878F5]/25"
            >
              Optimize with CP-SAT
            </button>
          </div>
        </div>
      </div>

      {/* 2. Day-by-Day Load vs Availability Visual Meters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#151A2D]">
              Day-by-Day Load Distribution vs Daily Limit
            </h3>
            <p className="text-xs text-slate-500">
              Visualizes fixed commitments (lectures/work) and available task slots per day.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-800"></div>
              <span>Fixed Commitments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#8878F5]"></div>
              <span>Allocated Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-200"></div>
              <span>Free Buffer</span>
            </div>
          </div>
        </div>

        {/* Daily Capacity Columns */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {analysis.day_breakdowns.map((day) => {
            const isOverload = day.status === 'overload';
            const isHeavy = day.status === 'heavy';
            const totalLoad = day.allocated_hours + day.fixed_hours;

            return (
              <motion.div
                key={day.date}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isOverload
                    ? 'bg-rose-50/60 border-rose-200 shadow-sm'
                    : isHeavy
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50/60 border-slate-200/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>{day.day_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      isOverload
                        ? 'bg-rose-200 text-rose-800'
                        : isHeavy
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {day.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Tasks:</span>
                      <strong className="text-slate-800">{day.allocated_hours}h</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Fixed:</span>
                      <span className="text-slate-700">{day.fixed_hours}h</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Avail:</span>
                      <span className="text-slate-700">{day.available_hours}h</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                    <motion.div
                      className="bg-slate-800 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(50, (day.fixed_hours / 12) * 100)}%` }}
                      transition={{ duration: 0.75, ease: 'easeOut' as const }}
                      title={`Fixed: ${day.fixed_hours}h`}
                    />
                    <motion.div
                      className={`h-full ${isOverload ? 'bg-rose-500' : 'bg-[#8878F5]'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(50, (day.allocated_hours / 12) * 100)}%` }}
                      transition={{ duration: 0.75, delay: 0.1, ease: 'easeOut' as const }}
                      title={`Tasks: ${day.allocated_hours}h`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                    {day.utilization_pct}% capacity
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. Deadline-Risk Indicators with Interactive Explanations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#151A2D]">
              Deadline Collision & Competing Task Radar
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates if enough cumulative hours exist before each specific cutoff date.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {analysis.deadline_risks.length} Tracked Deliverables
          </span>
        </div>

        <div className="space-y-3">
          {analysis.deadline_risks.map((risk) => {
            const isExpanded = expandedRiskId === risk.task_id;
            const isCritical = risk.risk_level === 'critical';
            const isHigh = risk.risk_level === 'high';

            return (
              <motion.div
                key={risk.task_id}
                layout
                className={`rounded-xl border transition-all ${
                  isCritical
                    ? 'border-rose-200 bg-rose-50/40'
                    : isHigh
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div
                  onClick={() => setExpandedRiskId(isExpanded ? null : risk.task_id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCritical
                        ? 'bg-rose-500 text-white'
                        : isHigh
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#8878F5] text-white'
                    }`}>
                      {isCritical ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#151A2D] truncate">
                          {risk.task_title}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {risk.risk_level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                        <span>Deadline: <strong>{risk.deadline}</strong></span>
                        <span>Effort: <strong>{risk.hours_needed}h</strong></span>
                        <span>Available Buffer: <strong>{risk.hours_available_before_deadline}h</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {risk.capacity_gap > 0 && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg">
                        -{risk.capacity_gap}h Deficit
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detailed Causal Explanation */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 bg-white/70 rounded-b-xl text-xs space-y-2">
                        <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200/80">
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                            <Info className="w-3.5 h-3.5 text-[#8878F5]" /> Causal Diagnosis:
                          </p>
                          <p className="text-slate-600 leading-relaxed">
                            {risk.explanation}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>OR-Tools Recommendation: Reschedule flexible components to preceding days.</span>
                          <button
                            onClick={onOptimizeClick}
                            className="font-bold text-[#8878F5] hover:underline"
                          >
                            Run Automated Rebalance →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Actionable Feasibility Recommendations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-3">
        <h3 className="text-base font-bold text-[#151A2D] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8878F5]" /> Actionable System Recommendations
        </h3>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#8878F5] shrink-0 mt-1.5"></div>
              <p className="leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
