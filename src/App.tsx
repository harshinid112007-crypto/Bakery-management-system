import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TaskManagerView } from './components/TaskManagerView';
import { ProjectsView } from './components/ProjectsView';
import { AnalyticsView } from './components/AnalyticsView';
import { AiAssistant } from './components/AiAssistant';
import { AiChatDrawer } from './components/AiChatDrawer';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { ActiveTab, BakeryTask, Project, OvenStatus, TaskStatus } from './types';
import { INITIAL_TASKS, INITIAL_PROJECTS, INITIAL_OVENS, BAKERS } from './data/initialData';
import { Sparkles, RotateCcw } from 'lucide-react';

const LOCAL_STORAGE_TASKS_KEY = 'crumb_and_crust_tasks_v1';
const LOCAL_STORAGE_PROJECTS_KEY = 'crumb_and_crust_projects_v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Core Data State (Initialized from LocalStorage or defaults)
  const [tasks, setTasks] = useState<BakeryTask[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
    }
    return INITIAL_TASKS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load projects from local storage', e);
    }
    return INITIAL_PROJECTS;
  });

  const [ovens] = useState<OvenStatus[]>(INITIAL_OVENS);

  // AI Drawer & Triggers
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string | undefined>(undefined);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BakeryTask | null>(null);
  const [taskModalInitialStatus, setTaskModalInitialStatus] = useState<TaskStatus>('prep');
  const [taskModalInitialProjectId, setTaskModalInitialProjectId] = useState<string | undefined>(undefined);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Micro-toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects', e);
    }
  }, [projects]);

  // Task Operations
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isFinishing = newStatus === 'completed';
          return {
            ...t,
            status: newStatus,
            completedAt: isFinishing ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
    showToast(`Task moved to ${newStatus.toUpperCase()}`);
  };

  const handleSaveTask = (taskData: Partial<BakeryTask>) => {
    if (taskData.id) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as BakeryTask) : t))
      );
      showToast('Batch task updated successfully');
    } else {
      // Create new
      const newTask: BakeryTask = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'New Baking Task',
        description: taskData.description || '',
        station: taskData.station || 'Breads',
        priority: taskData.priority || 'Medium',
        status: taskData.status || taskModalInitialStatus || 'prep',
        dueTime: taskData.dueTime || '07:00 AM',
        estimatedMinutes: taskData.estimatedMinutes || 30,
        quantity: taskData.quantity,
        assignedBaker: taskData.assignedBaker || BAKERS[0],
        projectId: taskData.projectId,
        ovenSlot: taskData.ovenSlot,
        checklist: taskData.checklist || [],
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      showToast('New baking task scheduled on floor');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task removed from schedule');
  };

  // Add multiple tasks generated by AI
  const handleAddAiSuggestedTasks = (newTasks: Array<Partial<BakeryTask>>) => {
    const formatted: BakeryTask[] = newTasks.map((t, idx) => ({
      id: `task-ai-${Date.now()}-${idx}`,
      title: t.title || 'AI Scheduled Task',
      description: t.description || 'Generated by Chef Brioche AI',
      station: t.station || 'Viennoiserie',
      priority: t.priority || 'High',
      status: 'prep',
      dueTime: t.dueTime || '06:30 AM',
      estimatedMinutes: t.estimatedMinutes || 40,
      quantity: t.quantity || '48 pcs',
      assignedBaker: t.assignedBaker || BAKERS[0],
      checklist: (t.checklist as any) || [
        { id: 'c1', text: 'Verify temperature & ingredient scaling', completed: false },
        { id: 'c2', text: 'Execute step instructions according to SOP', completed: false },
      ],
      createdAt: new Date().toISOString(),
    }));

    setTasks((prev) => [...formatted, ...prev]);
    showToast(`Added ${formatted.length} AI-generated tasks to board!`);
  };

  // Project Operations
  const handleSaveProject = (projectData: Partial<Project>) => {
    if (projectData.id) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectData.id ? ({ ...p, ...projectData } as Project) : p))
      );
      showToast('Order details updated');
    } else {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'New Order',
        client: projectData.client,
        description: projectData.description || '',
        deadline: projectData.deadline || 'Today, 12:00 PM',
        status: projectData.status || 'in_progress',
        targetUnits: projectData.targetUnits || 100,
        category: projectData.category || 'Wholesale B2B',
        assignedLead: projectData.assignedLead || BAKERS[0],
        color: projectData.color || '#D97706',
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [newProj, ...prev]);
      showToast('New production order created');
    }
  };

  // AI Quick Actions Handler
  const handleTriggerAiAction = (actionType: string, customPrompt?: string) => {
    if (actionType === 'PRIORITIZE') {
      setInitialAiPrompt('Please evaluate all currently active tasks and advise on the priority sequence and oven allocations to prevent bottlenecks.');
    } else if (actionType === 'SUMMARIZE') {
      setInitialAiPrompt('Summarize today’s shift progress, batch completion status, and afternoon handover instructions.');
    } else if (actionType === 'CREATE_TASKS') {
      setInitialAiPrompt(customPrompt || 'Generate an optimized production schedule breakdown with tasks, timing, and checklist for 50 Butter Croissants and 30 Sourdough Batards.');
    }
    setIsAiDrawerOpen(true);
  };

  // Reset to default data
  const handleResetData = () => {
    if (confirm('Reset to initial artisan bakery sample schedule and orders?')) {
      setTasks(INITIAL_TASKS);
      setProjects(INITIAL_PROJECTS);
      localStorage.removeItem(LOCAL_STORAGE_TASKS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PROJECTS_KEY);
      showToast('Reset to default bakery production dataset');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/60 text-stone-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-xl shadow-xl border border-stone-800 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewTask={() => {
          setSelectedTask(null);
          setTaskModalInitialStatus('prep');
          setTaskModalInitialProjectId(undefined);
          setIsTaskModalOpen(true);
        }}
        onOpenNewProject={() => {
          setSelectedProject(null);
          setIsProjectModalOpen(true);
        }}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        isAiDrawerOpen={isAiDrawerOpen}
        tasks={tasks}
        projects={projects}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            projects={projects}
            ovens={ovens}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            onSelectProject={(proj) => {
              setSelectedProject(proj);
              setIsProjectModalOpen(true);
            }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenNewTask={() => {
              setSelectedTask(null);
              setTaskModalInitialStatus('prep');
              setTaskModalInitialProjectId(undefined);
              setIsTaskModalOpen(true);
            }}
            onOpenNewProject={() => {
              setSelectedProject(null);
              setIsProjectModalOpen(true);
            }}
            setActiveTab={setActiveTab}
            onTriggerAiAction={handleTriggerAiAction}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManagerView
            tasks={tasks}
            projects={projects}
            searchQuery={searchQuery}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onOpenNewTask={(initialStatus) => {
              setSelectedTask(null);
              setTaskModalInitialStatus(initialStatus || 'prep');
              setTaskModalInitialProjectId(undefined);
              setIsTaskModalOpen(true);
            }}
            onTriggerAiAction={handleTriggerAiAction}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            onOpenNewProject={() => {
              setSelectedProject(null);
              setIsProjectModalOpen(true);
            }}
            onOpenNewTaskForProject={(projectId) => {
              setSelectedTask(null);
              setTaskModalInitialStatus('prep');
              setTaskModalInitialProjectId(projectId);
              setIsTaskModalOpen(true);
            }}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onTriggerAiForProject={(projectName) => {
              handleTriggerAiAction(
                'CREATE_TASKS',
                `Break down the production schedule and tasks for our order: "${projectName}". Include stations, bake times, and checklist steps.`
              );
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            tasks={tasks}
            projects={projects}
            ovens={ovens}
            onTriggerAiAction={handleTriggerAiAction}
          />
        )}

        {activeTab === 'assistant' && (
          <AiAssistant
            tasks={tasks}
            projects={projects}
            onAddTasks={handleAddAiSuggestedTasks}
            onSelectTask={(task) => {
              setSelectedTask(task);
              setIsTaskModalOpen(true);
            }}
            initialPrompt={initialAiPrompt}
            onClearInitialPrompt={() => setInitialAiPrompt(undefined)}
          />
        )}
      </main>

      {/* Floating AI Assistant Trigger Pill (Visible on any tab when drawer is closed) */}
      {!isAiDrawerOpen && activeTab !== 'assistant' && (
        <button
          id="floating-ai-button"
          onClick={() => setIsAiDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-stone-900 hover:bg-stone-800 text-stone-100 px-4 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold group-hover:rotate-12 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5 font-['Outfit',sans-serif]">
              <span>Chef Brioche</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-stone-400 block leading-none">AI Floor Assistant</span>
          </div>
        </button>
      )}

      {/* Floating AI Chat Drawer */}
      <AiChatDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        tasks={tasks}
        projects={projects}
        onAddTasks={handleAddAiSuggestedTasks}
        initialPrompt={initialAiPrompt}
        onClearInitialPrompt={() => setInitialAiPrompt(undefined)}
      />

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        initialStatus={taskModalInitialStatus}
        initialProjectId={taskModalInitialProjectId}
        projects={projects}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Project Modal (Create & Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={selectedProject}
        onSaveProject={handleSaveProject}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white/60 py-4 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 font-['Outfit',sans-serif]">Crumb & Crust Bakery Manager</span>
            <span>•</span>
            <span>AI Operations & Floor Telemetry</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-stone-600 hover:text-stone-900 flex items-center gap-1 text-[11px] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Data
            </button>
            <span>•</span>
            <span>Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
