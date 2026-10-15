import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Flame,
  RotateCcw
} from 'lucide-react';
import { Task, FixedCommitment, WhatIfResponse, TaskCategory, Priority, Difficulty } from '../types';
import { simulateWhatIf } from '../services/api';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseTasks: Task[];
  commitments: FixedCommitment[];
  startDateStr: string;
  onApplyScenario: (updatedTasks: Task[]) => void;
}

export const WhatIfSimulatorModal: React.FC<WhatIfSimulatorModalProps> = ({
  isOpen,
  onClose,
  baseTasks,
  commitments,
  startDateStr,
  onApplyScenario,
}) => {
  if (!isOpen) return null;

  // Simulator scenario inputs
  const [scenarioType, setScenarioType] = useState<'add_task' | 'reduce_hours' | 'earlier_deadline'>('add_task');
  
  // Scenario 1: Sudden task
  const [taskTitle, setTaskTitle] = useState('Surprise Distributed Systems Lab Quiz');
  const [taskHours, setTaskHours] = useState<number>(4.0);
  const [taskDeadline, setTaskDeadline] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );

  // Scenario 2: Reduce daily hours (sick day or overtime shift)
  const [adjustedDailyHours, setAdjustedDailyHours] = useState<number>(4.5);

  // Simulation result state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<WhatIfResponse | null>(null);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      let newTask: Task | undefined;
      let adjHours: number | undefined;

      if (scenarioType === 'add_task') {
        newTask = {
          id: `sim-${Date.now()}`,
          title: taskTitle,
          estimated_hours: taskHours,
          deadline: taskDeadline,
          category: 'assignment',
          difficulty: 'hard',
          priority: 'urgent',
          completed: false,
        };
      } else if (scenarioType === 'reduce_hours') {
        adjHours = adjustedDailyHours;
      }

      const res = await simulateWhatIf(baseTasks, commitments, startDateStr, {
        newTask,
        adjustedMaxHoursPerDay: adjHours,
      });

      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyToSchedule = () => {
    if (!simResult) return;
    if (scenarioType === 'add_task') {
      const addedTask: Task = {
        id: `task-sim-${Date.now()}`,
        title: taskTitle,
        estimated_hours: taskHours,
        deadline: taskDeadline,
        category: 'assignment',
        difficulty: 'hard',
        priority: 'urgent',
        completed: false,
      };
      onApplyScenario([...baseTasks, addedTask]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#151A2D]">
                What-If Scenario & Collision Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Simulate potential disruptions before committing changes to your week.
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

        {/* Scenario Selection Pills */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => {
              setScenarioType('add_task');
              setSimResult(null);
            }}
            className={`py-2 px-3 rounded-lg transition-all ${
              scenarioType === 'add_task'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Sudden Urgent Task
          </button>
          <button
            onClick={() => {
              setScenarioType('reduce_hours');
              setSimResult(null);
            }}
            className={`py-2 px-3 rounded-lg transition-all ${
              scenarioType === 'reduce_hours'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            - Reduced Daily Hours
          </button>
          <button
            onClick={() => {
              setScenarioType('earlier_deadline');
              setSimResult(null);
            }}
            className={`py-2 px-3 rounded-lg transition-all ${
              scenarioType === 'earlier_deadline'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⏳ Moved Deadline
          </button>
        </div>

        {/* Scenario Form Configuration */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
          {scenarioType === 'add_task' && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hypothetical Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskHours}
                    onChange={(e) => setTaskHours(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
                  />
                </div>
              </div>
            </div>
          )}

          {scenarioType === 'reduce_hours' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Constrained Daily Capacity Limit (Hours/Day)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={adjustedDailyHours}
                  onChange={(e) => setAdjustedDailyHours(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="font-bold text-sm text-[#151A2D] bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {adjustedDailyHours} hrs/day
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Simulates illness, midterms study fatigue, or additional workplace shift requirements.
              </p>
            </div>
          )}

          {scenarioType === 'earlier_deadline' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Select Task to Move Deadline Earlier by 2 Days
              </label>
              <select className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none">
                {baseTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (Currently due {t.deadline})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#A7E5C2]" />
            <span>{isSimulating ? 'Evaluating Ripple Effects...' : 'Run What-If Simulation'}</span>
          </button>
        </div>

        {/* Simulation Output Radar */}
        {simResult && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-[#151A2D]">
                Simulated Impact & Collision Analysis
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                simResult.new_feasibility
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {simResult.new_feasibility ? 'Safe to Absorb' : 'Causes Infeasibility'}
              </span>
            </div>

            {/* Gap Delta Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Original Gap</span>
                <div className="text-base font-bold text-slate-800">
                  {simResult.original_gap > 0 ? `-${simResult.original_gap}h Deficit` : '0h (Balanced)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-600 font-bold uppercase">New Capacity Deficit</span>
                <div className="text-base font-bold text-rose-700">
                  {simResult.new_gap > 0 ? `-${simResult.new_gap}h Deficit` : '0h (Safe)'}
                </div>
              </div>
            </div>

            {/* Collision Warnings List */}
            {simResult.collision_warnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Collision Warnings:</span>
                {simResult.collision_warnings.map((warn, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendation Mitigation */}
            <div className="p-3.5 rounded-xl bg-[#8878F5]/10 border border-[#8878F5]/30">
              <span className="font-bold text-[#8878F5] block mb-0.5">
                TaskTide System Guidance:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {simResult.recommended_mitigation}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Discard Simulation
          </button>
          {simResult && (
            <button
              onClick={handleApplyToSchedule}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-md shadow-[#8878F5]/20"
            >
              Commit This Scenario to Week
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
