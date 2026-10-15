import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Move,
  Clock,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  Tag,
  Plus,
  Trash2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Task, FixedCommitment, DailyAvailability, Priority, Difficulty, TaskCategory } from '../types';

interface SmartCalendarProps {
  tasks: Task[];
  commitments: FixedCommitment[];
  startDateStr: string;
  availability: DailyAvailability;
  onOptimizeClick: () => void;
  onUpdateTaskSchedule: (taskId: string, day: string, startHour: number) => void;
  onAddCommitment?: (comm: FixedCommitment) => void;
  onDeleteCommitment?: (commId: string) => void;
  onAddTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const SmartCalendar: React.FC<SmartCalendarProps> = ({
  tasks,
  commitments,
  startDateStr,
  availability,
  onOptimizeClick,
  onUpdateTaskSchedule,
  onAddCommitment,
  onDeleteCommitment,
  onAddTask,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCommitment, setSelectedCommitment] = useState<FixedCommitment | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Add to Calendar Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'commitment' | 'new_task' | 'slot_existing'>('commitment');
  const [selectedSlot, setSelectedSlot] = useState<{ dayStr: string; dayOfWeek: number; hour: number } | null>(null);

  // Form states for Fixed Commitment
  const [commTitle, setCommTitle] = useState('');
  const [commCategory, setCommCategory] = useState<'class' | 'work' | 'meeting' | 'personal'>('class');
  const [commStartTime, setCommStartTime] = useState('10:00');
  const [commEndTime, setCommEndTime] = useState('11:30');
  const [commColor, setCommColor] = useState('#3B82F6');

  // Form states for New Flexible Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskHours, setTaskHours] = useState<number>(2.0);
  const [taskDeadline, setTaskDeadline] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('assignment');
  const [taskDifficulty, setTaskDifficulty] = useState<Difficulty>('medium');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');

  // Selected existing unscheduled task
  const [selectedExistingTaskId, setSelectedExistingTaskId] = useState<string>('');

  // Days in week
  const startDt = new Date(startDateStr);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDt);
    d.setDate(startDt.getDate() + i);
    return {
      dateObj: d,
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      dayOfWeek: (d.getDay() + 6) % 7, // 0 = Mon, 6 = Sun
    };
  });

  const hours = Array.from(
    { length: availability.day_end_hour - availability.day_start_hour },
    (_, i) => availability.day_start_hour + i
  );

  // Helper to get commitments for a day
  const getCommitmentsForDay = (dayOfWeek: number) => {
    return commitments.filter((c) => c.day_of_week === dayOfWeek);
  };

  // Helper to get scheduled tasks for a date
  const getTasksForDay = (dateStr: string) => {
    return tasks.filter((t) => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return t.scheduled_day === dateStr;
    });
  };

  // Open slot modal for a specific day and hour
  const handleSlotClick = (dayStr: string, dayOfWeek: number, hour: number) => {
    setSelectedSlot({ dayStr, dayOfWeek, hour });
    const sH = hour.toString().padStart(2, '0');
    const eH = Math.min(22, hour + 1).toString().padStart(2, '0');
    setCommStartTime(`${sH}:00`);
    setCommEndTime(`${eH}:30`);
    setIsAddModalOpen(true);
  };

  // Open generic modal from header
  const handleOpenGeneralAddModal = () => {
    const firstDay = weekDays[0];
    setSelectedSlot({ dayStr: firstDay.dateStr, dayOfWeek: firstDay.dayOfWeek, hour: 10 });
    setCommStartTime('10:00');
    setCommEndTime('11:30');
    setIsAddModalOpen(true);
  };

  // Submit Fixed Commitment
  const handleSaveCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle.trim()) return;

    const newComm: FixedCommitment = {
      id: `comm-${Date.now()}`,
      title: commTitle.trim(),
      day_of_week: selectedSlot?.dayOfWeek ?? 0,
      start_time: commStartTime,
      end_time: commEndTime,
      category: commCategory,
      recurring: true,
      color: commColor,
    };

    onAddCommitment?.(newComm);
    setIsAddModalOpen(false);
    setCommTitle('');
  };

  // Submit New Task
  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedSlot) return;

    const startH = selectedSlot.hour.toString().padStart(2, '0');
    const endH = Math.min(22, selectedSlot.hour + Math.ceil(taskHours)).toString().padStart(2, '0');

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      description: 'Scheduled directly from calendar slot.',
      category: taskCategory,
      estimated_hours: Number(taskHours),
      deadline: taskDeadline,
      difficulty: taskDifficulty,
      priority: taskPriority,
      scheduled_day: selectedSlot.dayStr,
      scheduled_start: `${selectedSlot.dayStr}T${startH}:00:00`,
      scheduled_end: `${selectedSlot.dayStr}T${endH}:00:00`,
      completed: false,
    };

    onAddTask?.(newTask);
    setIsAddModalOpen(false);
    setTaskTitle('');
  };

  // Slot an Existing Task
  const handleSlotExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingTaskId || !selectedSlot) return;

    onUpdateTaskSchedule(selectedExistingTaskId, selectedSlot.dayStr, selectedSlot.hour);
    setIsAddModalOpen(false);
  };

  // Tasks without schedule
  const unscheduledTasks = tasks.filter((t) => !t.scheduled_day || !t.scheduled_start);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Calendar Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E0FA] card-shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#151A2D]">
              {startDt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#8878F5]/10 text-[#8878F5] font-semibold">
              Planning Horizon: 7 Days
            </span>
          </div>
        </div>

        {/* View Mode Switcher, Filter & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#8878F5]"
            >
              <option value="all">All Categories</option>
              <option value="assignment">Assignments</option>
              <option value="project">Projects</option>
              <option value="exam_prep">Exam Prep</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-[#151A2D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-[#151A2D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white text-[#151A2D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
          </div>

          {/* + Add to Calendar Button */}
          <button
            onClick={handleOpenGeneralAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event / Task</span>
          </button>

          {/* Re-optimize Slots */}
          <button
            onClick={onOptimizeClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#8878F5] hover:bg-[#7866f0] transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-optimize Slots</span>
          </button>
        </div>
      </div>

      {/* Legend & Hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white/70 p-3.5 rounded-xl border border-[#E5E0FA]">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-semibold text-slate-700">Fixed Commitments (Classes, Labs — Unmovable)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#8878F5] shadow-sm"></div>
            <span className="font-semibold text-slate-700">Flexible Work (Movable)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded border border-dashed border-[#8878F5]/60 bg-[#8878F5]/10"></div>
            <span className="text-slate-600">Click any empty cell to schedule</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Info className="w-3.5 h-3.5 text-[#8878F5]" />
          <span>No-Overlap Constraint Active: Tasks will never collide with fixed classes.</span>
        </div>
      </div>

      {/* Unscheduled Tasks Notice Bar */}
      {unscheduledTasks.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium">
              You have <strong>{unscheduledTasks.length} unslotted deliverables</strong> in your inventory.
            </span>
          </div>
          <button
            onClick={onOptimizeClick}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
          >
            Auto-Schedule with AI Optimizer →
          </button>
        </div>
      )}

      {/* Week Grid View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-[#E5E0FA] card-shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-600">
            <div className="py-3 px-2 border-r border-slate-200/60 text-slate-400">Time</div>
            {weekDays.map((day) => (
              <div key={day.dateStr} className="py-3 px-2 border-r border-slate-200/60 last:border-r-0">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">{day.dayName}</div>
                <div className="text-base font-bold text-[#151A2D] mt-0.5">{day.dayNumber}</div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[62px]">
                {/* Hour label */}
                <div className="py-2 px-3 border-r border-slate-200/60 text-[11px] font-medium text-slate-400 bg-slate-50/30 flex items-start justify-end select-none">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* 7 Days Columns */}
                {weekDays.map((day) => {
                  const dayCommitments = getCommitmentsForDay(day.dayOfWeek);
                  // Check if any commitment is in this hour
                  const activeCommitment = dayCommitments.find((c) => {
                    const startH = parseInt(c.start_time.split(':')[0], 10);
                    const endH = parseInt(c.end_time.split(':')[0], 10);
                    return hour >= startH && hour < endH;
                  });

                  // Check if any task is scheduled in this hour
                  const dayTasks = getTasksForDay(day.dateStr);
                  const activeTask = dayTasks.find((t) => {
                    if (!t.scheduled_start) return false;
                    const taskStartH = parseInt(t.scheduled_start.split('T')[1]?.split(':')[0] || '0', 10);
                    const dur = Math.ceil(t.estimated_hours || 2);
                    return hour >= taskStartH && hour < taskStartH + dur;
                  });

                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => {
                        if (!activeCommitment && !activeTask) {
                          handleSlotClick(day.dateStr, day.dayOfWeek, hour);
                        }
                      }}
                      className={`p-1 border-r border-slate-100 last:border-r-0 relative group transition-colors ${
                        !activeCommitment && !activeTask
                          ? 'cursor-pointer hover:bg-[#8878F5]/10'
                          : ''
                      }`}
                    >
                      {/* Fixed Commitment Block */}
                      {activeCommitment && (
                        <motion.div
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCommitment(activeCommitment);
                          }}
                          className="w-full h-full p-2 rounded-xl bg-slate-900 text-white shadow-sm flex flex-col justify-between border-l-4 border-blue-400 cursor-pointer hover:bg-slate-800 select-none group"
                          title={`Locked: ${activeCommitment.title} (${activeCommitment.start_time} - ${activeCommitment.end_time})`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {activeCommitment.title}
                            </span>
                            <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {activeCommitment.start_time} - {activeCommitment.end_time}
                          </span>
                        </motion.div>
                      )}

                      {/* Flexible Planned Task Block */}
                      {!activeCommitment && activeTask && (
                        <motion.div
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(activeTask);
                          }}
                          className="w-full h-full p-2 rounded-xl bg-gradient-to-r from-[#8878F5] to-[#7866f0] text-white shadow-md shadow-[#8878F5]/20 flex flex-col justify-between border-l-4 border-[#A7E5C2] cursor-pointer select-none"
                          title={`Flexible: ${activeTask.title} (${activeTask.estimated_hours}h)`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {activeTask.title}
                            </span>
                            <span className="text-[9px] uppercase px-1 rounded bg-black/20 text-[#A7E5C2] font-semibold">
                              {activeTask.estimated_hours}h
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-white/80 mt-1">
                            <span className="capitalize">{activeTask.priority}</span>
                            <span className="capitalize font-mono">{activeTask.difficulty}</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Empty cell hover indicator */}
                      {!activeCommitment && !activeTask && (
                        <div className="w-full h-full rounded-xl border border-transparent group-hover:border-dashed group-hover:border-[#8878F5]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-[#8878F5] font-semibold flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Add Event / Task to Calendar */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#151A2D]">
                  Add to Calendar
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSlot
                    ? `Selected: ${selectedSlot.dayStr} at ${selectedSlot.hour}:00`
                    : 'Choose what you want to add to your schedule'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddMode('commitment')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  addMode === 'commitment'
                    ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔒 Fixed Commitment
              </button>
              <button
                type="button"
                onClick={() => setAddMode('new_task')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  addMode === 'new_task'
                    ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 Flexible Task
              </button>
              {unscheduledTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddMode('slot_existing')}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    addMode === 'slot_existing'
                      ? 'bg-white text-[#151A2D] shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Slot Existing ({unscheduledTasks.length})
                </button>
              )}
            </div>

            {/* FORM 1: Fixed Commitment */}
            {addMode === 'commitment' && (
              <form onSubmit={handleSaveCommitment} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Event Title (Lecture, Lab, Shift, Meeting)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems Lecture or Gym Session"
                    value={commTitle}
                    onChange={(e) => setCommTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={commCategory}
                      onChange={(e) => setCommCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                    >
                      <option value="class">University Class / Lecture</option>
                      <option value="work">Workplace Standup / Shift</option>
                      <option value="meeting">Team Meeting</option>
                      <option value="personal">Personal / Wellbeing / Gym</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Day of Week</label>
                    <select
                      value={selectedSlot?.dayOfWeek ?? 0}
                      onChange={(e) => {
                        const dow = parseInt(e.target.value, 10);
                        if (selectedSlot) {
                          setSelectedSlot({ ...selectedSlot, dayOfWeek: dow });
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                    >
                      <option value={0}>Every Monday</option>
                      <option value={1}>Every Tuesday</option>
                      <option value={2}>Every Wednesday</option>
                      <option value={3}>Every Thursday</option>
                      <option value={4}>Every Friday</option>
                      <option value={5}>Every Saturday</option>
                      <option value={6}>Every Sunday</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={commStartTime}
                      onChange={(e) => setCommStartTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={commEndTime}
                      onChange={(e) => setCommEndTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>
                    Locked Slot: TaskTide constraint engine will prevent flexible tasks from ever overlapping this time.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm"
                  >
                    Lock onto Calendar
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: New Flexible Task */}
            {addMode === 'new_task' && (
              <form onSubmit={handleSaveNewTask} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Systems Lab 3 Submission"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#8878F5] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={taskHours}
                      onChange={(e) => setTaskHours(parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Final Deadline</label>
                    <input
                      type="date"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value as any)}
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
                      value={taskDifficulty}
                      onChange={(e) => setTaskDifficulty(e.target.value as any)}
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
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] shadow-md shadow-[#8878F5]/25"
                  >
                    Schedule to This Slot
                  </button>
                </div>
              </form>
            )}

            {/* FORM 3: Slot Existing Task */}
            {addMode === 'slot_existing' && (
              <form onSubmit={handleSlotExisting} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Select Unslotted Task to Place at {selectedSlot?.dayStr} {selectedSlot?.hour}:00
                  </label>
                  <select
                    value={selectedExistingTaskId}
                    onChange={(e) => setSelectedExistingTaskId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="">-- Choose an unscheduled task --</option>
                    {unscheduledTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.estimated_hours}h • Due {t.deadline})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedExistingTaskId}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#8878F5] hover:bg-[#7866f0] disabled:opacity-50"
                  >
                    Place onto Slot
                  </button>
                </div>
              </form>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Fixed Commitment Details / Delete */}
      <AnimatePresence>
        {selectedCommitment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-600" /> Fixed Commitment
                </span>
                <button
                  onClick={() => setSelectedCommitment(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#151A2D]">{selectedCommitment.title}</h4>
                <p className="text-slate-500 mt-0.5 capitalize">
                  Category: {selectedCommitment.category}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-semibold text-slate-700">
                  Time: {selectedCommitment.start_time} - {selectedCommitment.end_time}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Recurring weekly commitment</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onDeleteCommitment?.(selectedCommitment.id);
                    setSelectedCommitment(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
                <button
                  onClick={() => setSelectedCommitment(null)}
                  className="px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Flexible Task Details */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#8878F5]/10 text-[#8878F5]">
                  {selectedTask.category}
                </span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-base font-bold text-[#151A2D] mb-1">
                {selectedTask.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {selectedTask.description || 'No detailed instructions provided.'}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl mb-4">
                <div>
                  <span className="text-slate-400">Duration:</span>
                  <p className="font-semibold text-slate-800">{selectedTask.estimated_hours} hours</p>
                </div>
                <div>
                  <span className="text-slate-400">Deadline:</span>
                  <p className="font-semibold text-slate-800">{selectedTask.deadline}</p>
                </div>
                <div>
                  <span className="text-slate-400">Difficulty:</span>
                  <p className="font-semibold text-slate-800 capitalize">{selectedTask.difficulty}</p>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Date:</span>
                  <p className="font-semibold text-[#8878F5]">{selectedTask.scheduled_day || 'Auto-allocated'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {onDeleteTask && (
                  <button
                    onClick={() => {
                      onDeleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      onOptimizeClick();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8878F5] hover:bg-[#7866f0]"
                  >
                    Re-solve Position
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
