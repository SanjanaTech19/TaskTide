import React from 'react';
import { Sparkles, SlidersHorizontal, AlertCircle, ShieldAlert, CheckCircle, Flame } from 'lucide-react';
import { WorkloadAnalysis } from '../types';

interface HeaderProps {
  activeTab: string;
  analysis?: WorkloadAnalysis | null;
  onOptimizeClick: () => void;
  onWhatIfClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  analysis,
  onOptimizeClick,
  onWhatIfClick,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Smart Dashboard',
      subtitle: 'Overview of today\'s focus, workload capacity, and urgent deadlines',
    },
    calendar: {
      title: 'Smart Calendar & Non-Overlap Workspace',
      subtitle: 'Visual time blocks distinguishing fixed commitments from flexible tasks',
    },
    workload: {
      title: 'Workload Feasibility Analysis',
      subtitle: 'Mathematical capacity comparison, collision detection, and burnout monitoring',
    },
    optimizer: {
      title: 'Optimization Studio (OR-Tools Engine)',
      subtitle: 'Compare multi-strategy schedules with transparent trade-off analysis',
    },
    tasks: {
      title: 'Task Manager & Project Decomposer',
      subtitle: 'Manage deliverables, configure difficulty, and break down complex projects',
    },
    documents: {
      title: 'AI Document-to-Tasks Extraction',
      subtitle: 'Upload assignment briefs or syllabi into verifiable schedule checklists',
    },
  };

  const current = titles[activeTab] || titles.dashboard;
  const burnout = analysis?.burnout_risk_score ?? 0;
  const hasGap = (analysis?.capacity_gap_hours || 0) > 0;

  return (
    <header className="bg-[#FAF8FF]/85 backdrop-blur-md sticky top-0 z-20 border-b border-[#E5E0FA] px-8 py-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>TaskTide</span>
          <span>/</span>
          <span className="text-[#8878F5] font-bold">{current.title}</span>
        </div>
        <h1 className="text-xl font-bold text-[#151A2D] tracking-tight m-0">{current.title}</h1>
        <p className="text-xs text-slate-500 m-0">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Burnout Score Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
          <Flame className={`w-4 h-4 ${burnout > 75 ? 'text-rose-500 animate-pulse' : burnout > 50 ? 'text-amber-500' : 'text-emerald-500'}`} />
          <span className="text-slate-600 font-medium">Strain Score:</span>
          <span className={`font-bold ${burnout > 75 ? 'text-rose-600' : burnout > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {burnout}/100
          </span>
        </div>

        {/* Feasibility Pill */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
          hasGap
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {hasGap ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
          <span>{hasGap ? `${analysis?.capacity_gap_hours}h Over Capacity` : '100% Feasible Plan'}</span>
        </div>

        {/* What-If Sandbox Shortcut */}
        <button
          onClick={onWhatIfClick}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
          <span>What-If Sandbox</span>
        </button>

        {/* Optimize CTA */}
        <button
          onClick={onOptimizeClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8878F5] hover:bg-[#7766ee] transition-all shadow-md shadow-[#8878F5]/25 hover:shadow-lg hover:shadow-[#8878F5]/35 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Optimize My Week</span>
        </button>
      </div>
    </header>
  );
};
