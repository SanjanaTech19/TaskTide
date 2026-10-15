import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Sparkles,
  ListTodo,
  FileText,
  SlidersHorizontal,
  History,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserProfile, WorkloadAnalysis } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile?: UserProfile;
  analysis?: WorkloadAnalysis | null;
  onOpenWhatIf: () => void;
  onOpenAnalytics: () => void;
  applyCalibration: boolean;
  setApplyCalibration: (val: boolean) => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  analysis,
  onOpenWhatIf,
  onOpenAnalytics,
  applyCalibration,
  setApplyCalibration,
  onSignOut,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Smart Calendar', icon: Calendar },
    { id: 'workload', label: 'Workload Analysis', icon: BarChart3, badge: analysis?.capacity_gap_hours ? `-${analysis.capacity_gap_hours}h` : undefined },
    { id: 'optimizer', label: 'Optimization Studio', icon: Sparkles, highlight: true },
    { id: 'tasks', label: 'Task Manager & Decomposer', icon: ListTodo },
    { id: 'documents', label: 'Document-to-Tasks', icon: FileText, aiBadge: true },
  ];

  const hasCapacityGap = analysis && analysis.capacity_gap_hours > 0;

  return (
    <aside className="w-72 bg-[#151A2D] text-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30 select-none shadow-xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8878F5] to-[#A7E5C2] flex items-center justify-center shadow-lg shadow-[#8878F5]/20">
            <svg className="w-6 h-6 text-[#151A2D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12c.6 0 1.2-.4 1.4-1 1.1-2.9 3.8-5 7-5 3.6 0 6.6 2.6 7.4 6.1.2.9 1 1.5 1.9 1.5.1 0 .2 0 .3-.1" />
              <path d="M2 17c.7 0 1.3-.4 1.5-1 1-2.4 3.3-4.1 6-4.1 3.1 0 5.8 2.2 6.5 5.2.2.8.9 1.3 1.8 1.3.1 0 .2 0 .3-.1" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">TaskTide</span>
              <span className="text-[10px] uppercase font-semibold bg-[#8878F5]/20 text-[#8878F5] px-1.5 py-0.5 rounded border border-[#8878F5]/40">AI OR-Tools</span>
            </div>
            <p className="text-xs text-slate-400">Workload Feasibility System</p>
          </div>
        </div>
      </div>

      {/* User Mini Profile with Sign Out */}
      <div className="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#8878F5] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#8878F5]/30 shrink-0">
            {userProfile?.avatar_initials || 'AC'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userProfile?.name || 'Alex Chen'}</p>
            <p className="text-[11px] text-slate-400 truncate">{userProfile?.role || 'CS Junior & ML Intern'}</p>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-[#8878F5] text-white shadow-lg shadow-[#8878F5]/25 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-[#8878F5]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  {item.badge}
                </span>
              )}
              {item.aiBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#A7E5C2]/20 text-[#A7E5C2] border border-[#A7E5C2]/30 font-semibold">
                  AI Doc
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Simulation & Intelligence</div>
        
        {/* What-If Simulator Button */}
        <button
          onClick={onOpenWhatIf}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all border border-dashed border-slate-700/80 hover:border-[#8878F5]/60"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>What-If Simulator</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Sandbox</span>
        </button>

        {/* Analytics & History */}
        <button
          onClick={onOpenAnalytics}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Analytics & Drift</span>
          </div>
          <History className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Duration Learning Toggle */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8878F5]" /> Duration Learning
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applyCalibration}
                onChange={(e) => setApplyCalibration(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#8878F5]"></div>
            </label>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {applyCalibration
              ? 'Active: +22% empirical buffer applied based on past coding & ML sprint history.'
              : 'Inactive: Using raw optimistic task estimates.'}
          </p>
        </div>
      </div>

      {/* Feasibility Alert / Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
          hasCapacityGap
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200'
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
        }`}>
          {hasCapacityGap ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-[12px]">
              {hasCapacityGap ? `Capacity Deficit: ${analysis?.capacity_gap_hours}h` : 'Workload Feasible'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
              {hasCapacityGap
                ? 'Current commitments exceed available weekly work hours.'
                : 'All deliverables fit safely inside availability window.'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
