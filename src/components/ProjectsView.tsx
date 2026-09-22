import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Project, BakeryTask } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  tasks: BakeryTask[];
  onOpenNewProject: () => void;
  onOpenNewTaskForProject: (projectId: string) => void;
  onSelectTask: (task: BakeryTask) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: BakeryTask['status']) => void;
  onTriggerAiForProject: (projectName: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  onOpenNewProject,
  onOpenNewTaskForProject,
  onSelectTask,
  onUpdateTaskStatus,
  onTriggerAiForProject,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  const filteredProjects = projects.filter((p) => {
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Wholesale & Event Contracts
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-['Outfit',sans-serif]">
              Production Orders & Projects
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">
              Track wholesale agreements, tiered event cakes, and scheduled retail market drops.
            </p>
          </div>

          <button
            onClick={onOpenNewProject}
            className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3.5 py-2.5 sm:py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-600/20 active:scale-95 touch-manipulation self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Order / Project</span>
          </button>
        </div>

        {/* Status filter buttons */}
        <div className="pt-3 border-t border-stone-100 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs w-max">
            {['ALL', 'in_progress', 'scheduled', 'review', 'completed'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setSelectedStatus(statusKey)}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg font-semibold capitalize transition-all whitespace-nowrap touch-manipulation ${
                  selectedStatus === statusKey
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                {statusKey === 'ALL' ? 'All Orders' : statusKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects List with Linked Task Details */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const completedTasks = projectTasks.filter((t) => t.status === 'completed');
          const isExpanded = expandedProjectId === project.id;
          const progressPercent =
            projectTasks.length > 0
              ? Math.round((completedTasks.length / projectTasks.length) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Main Card Summary */}
              <div
                className="p-5 cursor-pointer hover:bg-stone-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className="w-3.5 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#D97706' }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        {project.category}
                      </span>
                      <span className="text-xs text-stone-600 font-medium">
                        Client: <strong className="text-stone-800">{project.client}</strong>
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-stone-900 font-['Outfit',sans-serif]">
                      {project.name}
                    </h2>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">
                      {project.description}
                    </p>

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-600 font-medium">
                      <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Deadline: {project.deadline}
                      </span>
                      <span>•</span>
                      <span>Target: {project.targetUnits} items</span>
                      <span>•</span>
                      <span>Lead: {project.assignedLead}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar and toggle */}
                <div className="flex items-center gap-6 self-end md:self-center">
                  <div className="w-36 text-right">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-600 font-medium">Production</span>
                      <span className="font-extrabold text-stone-900">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: project.color || '#D97706',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-stone-600 mt-1 block">
                      {completedTasks.length} of {projectTasks.length} tasks ready
                    </span>
                  </div>

                  <button
                    className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:text-stone-900"
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Tasks & Actions Drawer */}
              {isExpanded && (
                <div className="p-5 border-t border-stone-100 bg-stone-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4 text-amber-600" />
                      Associated Production Tasks ({projectTasks.length})
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTriggerAiForProject(project.name)}
                        className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>AI Plan Schedule</span>
                      </button>

                      <button
                        onClick={() => onOpenNewTaskForProject(project.id)}
                        className="flex items-center gap-1 text-xs text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>

                  {projectTasks.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-stone-200 text-xs text-stone-600">
                      No tasks assigned yet to this order. Click &quot;AI Plan Schedule&quot; or &quot;Add Task&quot; above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectTasks.map((task) => {
                        const isDone = task.status === 'completed';
                        return (
                          <div
                            key={task.id}
                            onClick={() => onSelectTask(task)}
                            className="bg-white p-3.5 rounded-xl border border-stone-200 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateTaskStatus(task.id, isDone ? 'prep' : 'completed');
                                }}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-stone-300'
                                }`}
                              >
                                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <div className="min-w-0">
                                <h4
                                  className={`text-xs font-bold truncate ${
                                    isDone ? 'line-through text-stone-600' : 'text-stone-900'
                                  }`}
                                >
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-stone-600 mt-1">
                                  <span>{task.station}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-amber-800">{task.dueTime}</span>
                                  {task.quantity && (
                                    <>
                                      <span>•</span>
                                      <span>{task.quantity}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
                                task.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
