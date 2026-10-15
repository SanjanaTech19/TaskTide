import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface OptimizationModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STAGES = [
  { id: 1, text: 'Scanning weekly availability & fixed commitments' },
  { id: 2, text: 'Building non-overlap constraints in Google OR-Tools CP-SAT' },
  { id: 3, text: 'Resolving deadline collisions & cognitive switching costs' },
  { id: 4, text: 'Synthesizing Deadline-First, Balanced, and Deep-Work plans' },
];

export const OptimizationModal: React.FC<OptimizationModalProps> = ({ isOpen, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 450);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8878F5] to-[#A7E5C2] mx-auto flex items-center justify-center shadow-lg shadow-[#8878F5]/30">
          <Sparkles className="w-8 h-8 text-[#151A2D] animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#151A2D]">
            Optimizing Your Workload
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Running mathematical constraint solver across 7-day horizon...
          </p>
        </div>

        {/* Stages list */}
        <div className="space-y-3 text-left">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStage;
            const isCurrent = idx === currentStage;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-xl border text-xs flex items-center gap-3 transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : isCurrent
                    ? 'bg-[#8878F5]/10 border-[#8878F5]/40 text-[#8878F5] font-semibold ring-1 ring-[#8878F5]/20'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-[#8878F5] animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{stage.text}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400">
          Google OR-Tools CP-SAT Solver v9.15 • Deterministic Non-Overlap
        </div>
      </motion.div>
    </div>
  );
};
