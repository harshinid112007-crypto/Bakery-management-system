import React, { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Flame,
  LayoutGrid,
  List,
  Sparkles,
  Tag,
  CheckSquare,
} from 'lucide-react';
import { BakeryTask, TaskStatus, Station, TaskPriority, Project } from '../types';
import { BAKERY_STATIONS, BAKERS } from '../data/initialData';

interface TaskManagerViewProps {
  tasks: BakeryTask[];
  projects: Project[];
  searchQuery: string;
  onSelectTask: (task: BakeryTask) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTask: (initialStatus?: TaskStatus) => void;
  onTriggerAiAction: (actionType: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; description: string; color: string }[] = [
  { id: 'prep', label: 'Prep & Doughs', description: 'Autolyse, scaling, bulk ferment', color: 'border-blue-400' },
  { id: 'proofing', label: 'Proofing & Retarder', description: 'Shaping, bannetons, lamination', color: 'border-purple-400' },
  { id: 'baking', label: 'In Ovens', description: 'Stone deck, rack convection, steam', color: 'border-amber-500' },
  { id: 'finishing', label: 'Decor & Finishing', description: 'Cooling, glazing, assembly, box', color: 'border-emerald-400' },
  { id: 'completed', label: 'Ready & Dispatched', description: 'HACCP checked & packaged', color: 'border-stone-400' },
];

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  tasks,
  projects,
  searchQuery,
  onSelectTask,
  onUpdateTaskStatus,
  onDeleteTask: _onDeleteTask,
  onOpenNewTask,
  onTriggerAiAction,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedStation, setSelectedStation] = useState<Station | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedBaker, setSelectedBaker] = useState<string>('ALL');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Global Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchStation = task.station.toLowerCase().includes(q);
        const matchBaker = task.assignedBaker.toLowerCase().includes(q);
        const matchTags = task.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchStation && !matchBaker && !matchTags) {
          return false;
        }
      }

      // Station filter
      if (selectedStation !== 'ALL' && task.station !== selectedStation) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      // Project filter
      if (selectedProject !== 'ALL' && task.projectId !== selectedProject) {
        return false;
      }

      // Baker filter
      if (selectedBaker !== 'ALL' && task.assignedBaker !== selectedBaker) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedStation, selectedPriority, selectedProject, selectedBaker]);

  // Advance or revert status
  const moveTask = (task: BakeryTask, direction: 'next' | 'prev') => {
    const statuses: TaskStatus[] = ['prep', 'proofing', 'baking', 'finishing', 'completed'];
    const currentIndex = statuses.indexOf(task.status);
    if (direction === 'next' && currentIndex < statuses.length - 1) {
      onUpdateTaskStatus(task.id, statuses[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateTaskStatus(task.id, statuses[currentIndex - 1]);
    }
  };

  const clearFilters = () => {
    setSelectedStation('ALL');
    setSelectedPriority('ALL');
    setSelectedProject('ALL');
    setSelectedBaker('ALL');
  };

  const hasActiveFilters =
    selectedStation !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedProject !== 'ALL' ||
    selectedBaker !== 'ALL' ||
    Boolean(searchQuery);

  return (
    <div className="space-y-6 pb-12">
      {/* Control Header & Filters Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-['Outfit',sans-serif]">
              Baking Task Operations
            </h1>
            <p className="text-xs text-stone-600">
              Manage production batches across prep, proofing, deck ovens, and finishing stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* AI Assistant Quick Generator */}
            <button
              onClick={() => onTriggerAiAction('CREATE_TASKS')}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">AI Batch Plan</span>
            </button>

            {/* Add Task */}
            <button
              id="kanban-new-task-btn"
              onClick={() => onOpenNewTask()}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-600/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filter Rows */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-stone-700 font-semibold mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Station Filter */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value as Station | 'ALL')}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Stations</option>
            {BAKERY_STATIONS.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | 'ALL')}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">🔥 Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-medium max-w-[180px] truncate"
          >
            <option value="ALL">All Orders/Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Baker Filter */}
          <select
            value={selectedBaker}
            onChange={(e) => setSelectedBaker(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">All Bakers</option>
            {BAKERS.map((baker) => (
              <option key={baker} value={baker}>
                {baker.split(' ')[0]} {baker.split(' ')[1]}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-stone-700 hover:text-stone-900 underline font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-stone-600 font-medium">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </div>

      {/* View Mode: Kanban */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-stone-100/70 rounded-2xl p-3 border border-stone-200/80 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`border-t-4 ${col.color} bg-white rounded-xl p-3 shadow-2xs mb-3`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-stone-900 font-['Outfit',sans-serif]">
                      {col.label}
                    </span>
                    <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                    {col.description}
                  </p>
                </div>

                {/* Column Tasks Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 px-2 text-stone-600 text-xs border border-dashed border-stone-300 rounded-xl">
                      No tasks in this station
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isDone = task.status === 'completed';
                      const checklistTotal = task.checklist?.length || 0;
                      const checklistDone = task.checklist?.filter((c) => c.completed)?.length || 0;
                      const checklistPercent =
                        checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

                      return (
                        <div
                          key={task.id}
                          className={`bg-white rounded-xl p-3.5 border transition-all hover:shadow-md cursor-pointer ${
                            task.priority === 'Urgent' && !isDone
                              ? 'border-rose-300 ring-1 ring-rose-200'
                              : 'border-stone-200 hover:border-amber-300'
                          }`}
                          onClick={() => onSelectTask(task)}
                        >
                          {/* Priority and Station tags */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                task.priority === 'Urgent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : task.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : task.priority === 'Medium'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {task.priority === 'Urgent' && '🔥 '}
                              {task.priority}
                            </span>
                            <span className="text-[11px] text-stone-700 font-medium truncate">
                              {task.station}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4
                            className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
                              isDone ? 'line-through text-stone-600' : 'text-stone-900'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Quantity & Oven slot info */}
                          <div className="mt-2 space-y-1">
                            {task.quantity && (
                              <div className="text-[11px] text-stone-700 font-medium flex items-center gap-1">
                                <Tag className="w-3 h-3 text-stone-600" />
                                <span>Batch: {task.quantity}</span>
                              </div>
                            )}
                            {task.ovenSlot && (
                              <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                                <Flame className="w-3 h-3 text-amber-600" />
                                <span className="truncate">{task.ovenSlot}</span>
                              </div>
                            )}
                          </div>

                          {/* Checklist mini progress */}
                          {checklistTotal > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-stone-100">
                              <div className="flex items-center justify-between text-[10px] text-stone-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3 text-stone-600" />
                                  Checklist
                                </span>
                                <span>
                                  {checklistDone}/{checklistTotal} ({checklistPercent}%)
                                </span>
                              </div>
                              <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${checklistPercent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Footer Info & Move Buttons */}
                          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1 text-[11px] text-stone-600">
                            <span className="flex items-center gap-1 font-semibold text-stone-700">
                              <Clock className="w-3 h-3 text-stone-600" />
                              {task.dueTime}
                            </span>

                            {/* Stage move buttons */}
                            <div
                              className="flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.id !== 'prep' && (
                                <button
                                  onClick={() => moveTask(task, 'prev')}
                                  title="Move to previous stage"
                                  className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  onClick={() => moveTask(task, 'next')}
                                  title="Advance to next stage"
                                  className="w-6 h-6 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center font-bold transition-colors"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add task to column */}
                <button
                  onClick={() => onOpenNewTask(col.id)}
                  className="mt-3 py-2 border border-dashed border-stone-300 hover:border-stone-400 hover:bg-white text-stone-600 hover:text-stone-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to {col.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode: List / Table */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task & Description</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Time</th>
                  <th className="py-3 px-4">Assigned Baker</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-600">
                      No baking tasks found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    const checklistTotal = task.checklist?.length || 0;
                    const checklistDone = task.checklist?.filter((c) => c.completed)?.length || 0;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`hover:bg-amber-50/20 cursor-pointer transition-colors ${
                          isDone ? 'bg-stone-50/40 opacity-75' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-stone-900 truncate">{task.title}</div>
                          <div className="text-stone-600 text-xs truncate mt-0.5">
                            {task.description}
                          </div>
                          {task.quantity && (
                            <span className="text-[11px] text-amber-800 font-medium">
                              Qty: {task.quantity}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md text-xs font-semibold">
                            {task.station}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              task.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'High'
                                ? 'bg-amber-100 text-amber-800'
                                : task.priority === 'Medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="bg-stone-50 border border-stone-200 text-stone-800 rounded-md px-2 py-1 text-xs font-semibold"
                          >
                            <option value="prep">Prep & Doughs</option>
                            <option value="proofing">Proofing</option>
                            <option value="baking">In Oven</option>
                            <option value="finishing">Finishing</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-stone-800">
                          {task.dueTime}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-700">
                          {task.assignedBaker}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-700">
                          {checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateTaskStatus(task.id, isDone ? 'prep' : 'completed');
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-stone-300 hover:border-emerald-600 text-stone-600 hover:text-emerald-600'
                            }`}
                            title={isDone ? 'Mark in progress' : 'Mark completed'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
