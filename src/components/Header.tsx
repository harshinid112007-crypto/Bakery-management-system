import React from 'react';
import {
  Croissant,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Bot,
  Plus,
  Search,
  Sparkles,
  Flame,
  Clock,
  X,
} from 'lucide-react';
import { ActiveTab, BakeryTask, Project } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onToggleAiDrawer: () => void;
  isAiDrawerOpen: boolean;
  tasks: BakeryTask[];
  projects: Project[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenNewTask,
  onOpenNewProject,
  onToggleAiDrawer,
  tasks,
}) => {
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent' && t.status !== 'completed').length;

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as ActiveTab, label: 'Tasks & Board', icon: CheckSquare, badge: tasks.filter(t => t.status !== 'completed').length },
    { id: 'projects' as ActiveTab, label: 'Orders & Projects', icon: FolderKanban },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'assistant' as ActiveTab, label: 'AI Assistant', icon: Bot, isAi: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-stone-950 shadow-md shadow-amber-900/30">
              <Croissant className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-stone-100 font-['Outfit',sans-serif]">
                  Crumb & Crust
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Bakery OS
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">Artisan Production & AI Manager</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batches, breads, pastries, orders..."
                className="w-full bg-stone-800/90 text-sm text-stone-200 placeholder-stone-400 pl-9 pr-8 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Shift Progress Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-300">Morning Shift</span>
              <span className="font-bold text-amber-400">{progressPct}%</span>
              <div className="w-12 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Urgent Alert badge */}
            {urgentCount > 0 && (
              <div
                onClick={() => setActiveTab('tasks')}
                className="cursor-pointer hidden sm:flex items-center gap-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-500/25 transition-colors"
                title={`${urgentCount} urgent tasks requiring immediate attention`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>{urgentCount} Urgent</span>
              </div>
            )}

            {/* AI Assistant Quick Trigger */}
            <button
              id="header-ai-assistant-btn"
              onClick={onToggleAiDrawer}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chef Brioche AI</span>
            </button>

            {/* Action Buttons */}
            <button
              id="header-add-task-btn"
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-600/30 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batches, breads, orders..."
              className="w-full bg-stone-800 text-sm text-stone-200 placeholder-stone-400 pl-9 pr-8 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 border-t border-stone-800/80 pt-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-amber-500 text-amber-400 bg-stone-800/60'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.isAi && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
