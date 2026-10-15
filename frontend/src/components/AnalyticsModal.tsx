import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  RotateCcw,
  History,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { AnalyticsData, Task } from '../types';
import { fetchAnalytics, fetchScheduleHistory } from '../services/api';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSnapshot: (tasks: Task[]) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  onRestoreSnapshot,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');

  useEffect(() => {
    if (!isOpen) return;
    fetchAnalytics().then(setData).catch(console.error);
    fetchScheduleHistory().then((res) => setHistoryList(res.history || [])).catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#151A2D]">
                Personalized Duration Learning & History
              </h3>
              <p className="text-xs text-slate-500">
                Empirical drift calibration and snapshot restore system.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-base"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estimation Accuracy & Drift
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Schedule History & Undo ({historyList.length})
          </button>
        </div>

        {/* TAB 1: Analytics */}
        {activeTab === 'analytics' && data && (
          <div className="space-y-5 text-xs">
            {/* Drift Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8878F5]/10 via-[#A7E5C2]/10 to-transparent border border-[#8878F5]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8878F5] tracking-wider">
                  Personalized Calibration Factor
                </span>
                <div className="text-2xl font-extrabold text-[#151A2D] mt-0.5">
                  +{((data.calibration_metrics.overall_drift_factor - 1) * 100).toFixed(0)}% Empirical Expansion
                </div>
                <p className="text-slate-500 mt-1">
                  {data.calibration_metrics.interpretation}
                </p>
              </div>
            </div>

            {/* Category Multipliers List */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">
                Category-Specific Drift Calibration:
              </span>
              <div className="space-y-2">
                {data.calibration_metrics.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{cat.category}</span>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {cat.sample_size} logged historical tasks
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#8878F5]">
                        {cat.multiplier}x Multiplier
                      </span>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {cat.accuracy_pct}% baseline accuracy
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Weeks Completion History */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">
                Estimated vs Actual Workload (Past 4 Weeks):
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                {data.weekly_completion_history.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">{w.week}</span>
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {w.actual_hours}h
                    </div>
                    <span className="text-[10px] text-slate-500">
                      (Est: {w.estimated_hours}h)
                    </span>
                    <div className="text-[10px] font-bold text-emerald-600 mt-1">
                      {w.completion_rate}% done
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Schedule History & Undo */}
        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            {historyList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No previous schedule snapshots yet. Run the Optimizer to generate versions.
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 uppercase">
                          {item.strategy.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Snapshot #{idx + 1} at {item.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        {item.tasks_count} tasks • {item.feasible ? 'Mathematically Feasible' : 'Relaxed Plan'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (item.snapshot_tasks) {
                          onRestoreSnapshot(item.snapshot_tasks);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#8878F5]" />
                      <span>Restore Plan</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
