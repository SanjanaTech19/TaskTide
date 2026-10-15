import React, { useState } from 'react';
import {
  ListTodo,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileUp,
  Sliders,
  ChevronRight,
  Edit2
} from 'lucide-react';
import {
  Task, TaskCategory, Priority, Difficulty,
  SubtaskItem, ExtractedTask
} from '../types';
import { decomposeProject, extractDocumentTasks } from '../services/api';

interface TaskBreakdownViewProps {
  tasks: Task[];
  onAddTask: (newTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onOptimizeClick: () => void;
  initialMode?: 'tasks' | 'documents';
}

export const TaskBreakdownView: React.FC<TaskBreakdownViewProps> = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  onOptimizeClick,
  initialMode = 'tasks',
}) => {
  const [activeTab, setActiveTab] = useState<'manager' | 'decomposer' | 'doc_extractor'>(
    initialMode === 'documents' ? 'doc_extractor' : 'manager'
  );

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newHours, setNewHours] = useState<number>(3.0);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [newCategory, setNewCategory] = useState<TaskCategory>('assignment');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('medium');

  // Decomposer state
  const [decompTitle, setDecompTitle] = useState('Senior Capstone Machine Learning System');
  const [decompDesc, setDecompDesc] = useState('Build end-to-end model pipeline with evaluation metrics and LaTeX paper');
  const [decompHours, setDecompHours] = useState<number>(14.0);
  const [decompDeadline, setDecompDeadline] = useState(
    new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0]
  );
  const [decomposing, setDecomposing] = useState(false);
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [decompRationale, setDecompRationale] = useState('');

  // Document extractor state
  const [docText, setDocText] = useState(
    `CS 314 Operating Systems - Project 2: Multithreading & Synchronization
Deadline: Due Friday 11:59 PM.
Description: In this project, students will implement preemptive thread scheduling, condition variables, and semaphores.
Deliverable 1: Thread context switcher in assembly & locks implementation (estimated 4.5 hours).
Deliverable 2: Dining Philosophers synchronization test suite (estimated 3.0 hours).
Deliverable 3: Final benchmark report with latency graphs (estimated 2.5 hours).
Rubric: All unit tests must pass with zero race conditions.`
  );
  const [extracting, setExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);

  // Handle Decompose
  const handleRunDecompose = async () => {
    setDecomposing(true);
    try {
      const res = await decomposeProject(decompTitle, decompDesc, decompHours, decompDeadline, 'project');
      setSubtasks(res.subtasks);
      setDecompRationale(res.rationale);
    } catch (err) {
      console.error(err);
    } finally {
      setDecomposing(false);
    }
  };

  // Handle Add Decomposed Subtasks to Planner
  const handleAddSubtasksToPlanner = () => {
    subtasks.forEach((st, i) => {
      const created: Task = {
        id: `decomp-${Date.now()}-${i}`,
        title: st.title,
        description: st.description,
        category: 'project',
        estimated_hours: st.estimated_hours,
        deadline: decompDeadline,
        difficulty: st.difficulty,
        priority: st.priority,
        completed: false,
      };
      onAddTask(created);
    });
    setSubtasks([]);
    setActiveTab('manager');
  };

  // Handle Document Extract
  const handleExtractDoc = async () => {
    setExtracting(true);
    try {
      const res = await extractDocumentTasks(docText, 'CS314_Assignment.txt');
      setExtractedTasks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  // Add Extracted Task
  const handleAddExtractedTask = (item: ExtractedTask) => {
    const task: Task = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: item.title,
      description: item.description,
      category: item.category,
      estimated_hours: item.suggested_hours,
      deadline: item.deadline,
      difficulty: item.difficulty,
      priority: item.priority,
      completed: false,
    };
    onAddTask(task);
    setExtractedTasks((prev) => prev.filter((t) => t.title !== item.title));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      estimated_hours: Number(newHours),
      deadline: newDeadline,
      difficulty: newDifficulty,
      priority: newPriority,
      completed: false,
    };

    onAddTask(task);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 card-shadow flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'manager'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Task Manager ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('decomposer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'decomposer'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#8878F5]" />
            <span>AI Task Decomposer</span>
          </button>
          <button
            onClick={() => setActiveTab('doc_extractor')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'doc_extractor'
                ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI Document-to-Tasks</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Task Manager */}
      {activeTab === 'manager' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#151A2D]">Active Task Inventory</h3>
              <p className="text-xs text-slate-500">
                All registered deliverables with estimated duration, difficulty, and scheduling status.
              </p>
            </div>
            <button
              onClick={onOptimizeClick}
              className="text-xs font-bold text-[#8878F5] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize Schedule Now</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="py-3.5 flex items-start justify-between gap-4 group hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#8878F5] focus:ring-[#8878F5] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold text-[#151A2D] ${task.completed ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {task.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] capitalize font-medium text-slate-500">
                        • {task.difficulty}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimated_hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due {task.deadline}
                      </span>
                      {task.scheduled_day && (
                        <span className="text-[#8878F5] font-semibold">
                          Scheduled: {task.scheduled_day}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI Task Decomposer */}
      {activeTab === 'decomposer' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#8878F5]/10 text-[#8878F5]">
                Intelligent Project Decomposition
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151A2D] mt-1">
              Break Large Projects into Manageable, Sequenced Subtasks
            </h3>
            <p className="text-xs text-slate-500">
              AI suggests realistic step-by-step hours, cognitive difficulty, and milestone dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Project Title</label>
              <input
                type="text"
                value={decompTitle}
                onChange={(e) => setDecompTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Total Estimated Scope (Hours)</label>
              <input
                type="number"
                value={decompHours}
                onChange={(e) => setDecompHours(parseFloat(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Project Description & Scope</label>
              <textarea
                rows={2}
                value={decompDesc}
                onChange={(e) => setDecompDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleRunDecompose}
            disabled={decomposing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{decomposing ? 'Decomposing Project...' : 'Generate AI Subtask Breakdown'}</span>
          </button>

          {/* Generated Subtasks Preview */}
          {subtasks.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151A2D]">
                    Generated {subtasks.length} Milestone Phases
                  </h4>
                  <p className="text-xs text-slate-500">{decompRationale}</p>
                </div>
                <button
                  onClick={handleAddSubtasksToPlanner}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm"
                >
                  Add All to Schedule Planner
                </button>
              </div>

              <div className="space-y-2.5">
                {subtasks.map((st, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{st.title}</span>
                        <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {st.difficulty}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{st.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#8878F5]">{st.estimated_hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Document-to-Tasks Extraction */}
      {activeTab === 'doc_extractor' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                AI Document Understanding
              </span>
            </div>
            <h3 className="text-base font-bold text-[#151A2D] mt-1">
              Extract Tasks from Assignment Briefs, Syllabi & Project Specs
            </h3>
            <p className="text-xs text-slate-500">
              Paste or inspect requirements. The AI extracts structured deliverables, estimated durations, and submission deadlines.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-700 block">
              Assignment Document Content
            </label>
            <textarea
              rows={6}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
            />
          </div>

          <button
            onClick={handleExtractDoc}
            disabled={extracting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{extracting ? 'Analyzing Document Brief...' : 'Extract Deliverable Checklist'}</span>
          </button>

          {/* Extracted Tasks Reviewable Checklist */}
          {extractedTasks.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="font-bold text-sm text-[#151A2D]">
                Reviewable Extracted Checklist ({extractedTasks.length} Deliverables)
              </h4>

              <div className="space-y-3">
                {extractedTasks.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-sm flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8878F5]/10 text-[#8878F5]">
                          Due {item.deadline}
                        </span>
                      </div>
                      <p className="text-slate-500 mb-2">{item.description}</p>
                      {item.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.deliverables.map((del, dIdx) => (
                            <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              ✓ {del}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-2">
                      <div className="font-bold text-base text-[#151A2D]">
                        {item.suggested_hours}h
                      </div>
                      <button
                        onClick={() => handleAddExtractedTask(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-sm"
                      >
                        Add to Planner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#151A2D]">Register New Deliverable</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Raft Consensus Lab"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide brief deliverables and requirements..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="40"
                    value={newHours}
                    onChange={(e) => setNewHours(parseFloat(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="exam_prep">Exam Prep</option>
                    <option value="internship">Internship</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Calibration hint */}
              <div className="p-3 rounded-xl bg-[#8878F5]/10 border border-[#8878F5]/20 text-[11px] text-slate-600 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8878F5] shrink-0" />
                <span>
                  Empirical Calibration Active: {newHours}h estimate will be adjusted by +20% buffer in the CP-SAT scheduler.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-md shadow-[#8878F5]/20"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
