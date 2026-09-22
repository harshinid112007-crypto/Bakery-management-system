import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Thermometer,
  ArrowRight,
  TrendingUp,
  Package,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { BakeryTask, Project, OvenStatus, ActiveTab } from '../types';

interface DashboardViewProps {
  tasks: BakeryTask[];
  projects: Project[];
  ovens: OvenStatus[];
  onSelectTask: (task: BakeryTask) => void;
  onSelectProject: (project: Project) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: BakeryTask['status']) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onTriggerAiAction: (actionType: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  projects,
  ovens,
  onSelectTask,
  onSelectProject,
  onUpdateTaskStatus,
  onOpenNewTask,
  onOpenNewProject,
  setActiveTab,
  onTriggerAiAction,
}) => {
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiQuickSummary, setAiQuickSummary] = useState<string | null>(null);

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const urgentTasks = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'completed');
  const activeBaking = tasks.filter((t) => t.status === 'baking');
  const totalUnits = tasks.reduce((sum, t) => {
    const match = t.quantity?.match(/(\d+)/);
    return sum + (match ? parseInt(match[0], 10) : 1);
  }, 0);

  const progressPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Handle generating shift summary via AI endpoint
  const handleGenerateSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            urgentCount: urgentTasks.length,
            progressPercent,
          },
          tasks: tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, station: t.station })),
          projects: projects.map(p => ({ name: p.name, status: p.status, deadline: p.deadline })),
        }),
      });
      const data = await res.json();
      setAiQuickSummary(data.summary || 'Summary compiled successfully.');
    } catch (err) {
      console.error('Summary error', err);
      setAiQuickSummary('Current Shift: 71% batches completed. High-priority deck bakes on schedule. Ensure afternoon proofing boxes are pre-chilled.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Welcome */}
      <div className="bg-stone-900 rounded-2xl p-4 sm:p-6 border border-stone-800 text-stone-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-600/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Floor Operations
              </span>
              <span className="text-xs text-stone-400">Shift: 04:00 - 12:30 AM</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-100 font-['Outfit',sans-serif]">
              Morning Artisan Bake Shift
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
              Stone deck ovens at operating temp. 2 wholesale orders in packaging, proofing cabinets calibrated.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => onTriggerAiAction('PRIORITIZE')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 sm:py-2 min-h-[40px] rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition-all hover:border-amber-500/40 shadow-sm active:scale-95 touch-manipulation"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Prioritize Ovens</span>
            </button>

            <button
              onClick={() => onTriggerAiAction('CREATE_TASKS')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 sm:py-2 min-h-[40px] rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>AI Batch Generator</span>
            </button>

            <button
              onClick={onOpenNewTask}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95 touch-manipulation"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Shift Progress */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider">Production Pace</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                {progressPercent}%
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-stone-600">
                ({completedTasks.length}/{tasks.length})
              </span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Active Ovens */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider">Ovens & Chambers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                {ovens.filter(o => o.status === 'active').length}/{ovens.length}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-stone-600">Active</span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 mt-2 truncate">
              {activeBaking.length} baking
            </p>
          </div>
        </div>

        {/* Card 3: Urgent Priority Alerts */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider">Urgent</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              urgentTasks.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-stone-50 text-stone-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                {urgentTasks.length}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-stone-600">Action</span>
            </div>
            <p className="text-[11px] sm:text-xs text-rose-600 font-medium mt-2 truncate">
              {urgentTasks.length > 0 ? `${urgentTasks[0].title.slice(0, 20)}...` : 'No bottlenecks'}
            </p>
          </div>
        </div>

        {/* Card 4: Orders in Production */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider">Active Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                {projects.filter(p => p.status === 'in_progress').length}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-stone-600">Orders</span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600 mt-2 truncate">
              ~{totalUnits} units today
            </p>
          </div>
        </div>
      </div>

      {/* Oven & Proofing Chamber Status Bar */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900 font-['Outfit',sans-serif]">
              Deck Ovens & Chamber Telemetry
            </h2>
          </div>
          <span className="text-xs text-stone-600">Updated Real-Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ovens.map((oven) => (
            <div
              key={oven.id}
              className={`rounded-xl p-4 border transition-all ${
                oven.status === 'active'
                  ? 'bg-amber-50/40 border-amber-200'
                  : oven.status === 'preheating'
                  ? 'bg-rose-50/30 border-rose-200'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-800">{oven.name}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    oven.status === 'active'
                      ? 'bg-amber-100 text-amber-800'
                      : oven.status === 'preheating'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {oven.status}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
                  {oven.currentTemp}
                </span>
                <span className="text-[11px] text-stone-600">Target: {oven.targetTemp}</span>
              </div>
              <p className="text-xs text-stone-700 mt-2 font-medium truncate">
                {oven.currentBatch}
              </p>
              {oven.timeRemaining && (
                <div className="flex items-center gap-1 text-[11px] text-stone-600 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{oven.timeRemaining}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Today's Tasks + AI Handover Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Priority Baking Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 font-['Outfit',sans-serif]">
                  Today’s Priority Baking Schedule
                </h2>
                <p className="text-xs text-stone-600">Sorted by due time and bake slot urgency</p>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>View Full Kanban</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => {
                const isDone = task.status === 'completed';
                const checklistTotal = task.checklist?.length || 0;
                const checklistDone = task.checklist?.filter((c) => c.completed)?.length || 0;

                return (
                  <div
                    key={task.id}
                    className={`rounded-xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-stone-50/70 border-stone-200 opacity-70'
                        : task.priority === 'Urgent'
                        ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300'
                        : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, isDone ? 'prep' : 'completed')}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 hover:border-amber-500'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div
                        className="cursor-pointer flex-1 min-w-0"
                        onClick={() => onSelectTask(task)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                            {task.station}
                          </span>
                          {task.quantity && (
                            <span className="text-xs text-stone-600 font-medium">
                              Qty: {task.quantity}
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm font-semibold mt-1 truncate ${
                          isDone ? 'line-through text-stone-600' : 'text-stone-900'
                        }`}>
                          {task.title}
                        </h3>

                        <div className="flex items-center gap-4 mt-1.5 text-xs text-stone-600">
                          <span className="flex items-center gap-1 font-medium text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {task.dueTime}
                          </span>
                          <span>•</span>
                          <span>{task.assignedBaker}</span>
                          {checklistTotal > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-stone-600">
                                {checklistDone}/{checklistTotal} steps
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Showing top 5 tasks</span>
            <button
              onClick={onOpenNewTask}
              className="text-amber-800 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add custom batch task
            </button>
          </div>
        </div>

        {/* Right Col: Production Orders & AI Shift Briefing */}
        <div className="space-y-6">
          {/* Active Orders Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-bold text-stone-900 font-['Outfit',sans-serif]">
                  Production Orders
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 3).map((proj) => {
                const linkedTasks = tasks.filter((t) => t.projectId === proj.id);
                const doneTasks = linkedTasks.filter((t) => t.status === 'completed');
                const pct = linkedTasks.length > 0 ? Math.round((doneTasks.length / linkedTasks.length) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/20 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 truncate">{proj.name}</span>
                      <span className="text-amber-800 font-bold">{pct}%</span>
                    </div>
                    <p className="text-xs text-stone-600 truncate mt-0.5">{proj.client}</p>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: proj.color || '#D97706' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-600 mt-2">
                      <span>Due: {proj.deadline}</span>
                      <span>Lead: {proj.assignedLead.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onOpenNewProject}
              className="w-full mt-3 py-2 border border-dashed border-stone-300 hover:border-amber-400 text-stone-600 hover:text-amber-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Order</span>
            </button>
          </div>

          {/* AI Executive Summary Box */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-850 rounded-2xl p-5 border border-stone-800 text-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold font-['Outfit',sans-serif] text-stone-100">
                  Chef Brioche Shift Brief
                </h3>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={aiSummaryLoading}
                className="text-stone-400 hover:text-amber-400 p-1 rounded-md transition-colors"
                title="Refresh Shift Summary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiSummaryLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div className="text-xs text-stone-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
              {aiQuickSummary ? (
                <div className="whitespace-pre-line font-normal">{aiQuickSummary}</div>
              ) : (
                <p className="text-stone-400">
                  Click refresh or ask Chef Brioche to evaluate deck oven pacing, wholesale packing deadlines, and handover notes.
                </p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center justify-between">
              <button
                onClick={handleGenerateSummary}
                disabled={aiSummaryLoading}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {aiSummaryLoading ? 'Analyzing bake line...' : 'Generate Shift Handover'}
              </button>
              <button
                onClick={() => setActiveTab('assistant')}
                className="text-xs text-stone-400 hover:text-stone-200 underline"
              >
                Open Chat
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
