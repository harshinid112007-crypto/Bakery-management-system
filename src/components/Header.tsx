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
  Database,
} from 'lucide-react';
import { ActiveTab, BakeryTask, Project } from '../types';
import { DatabaseHealth } from '../services/api';
import { PWAInstallButton } from './PWAInstallButton';

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
  dbHealth: DatabaseHealth | null;
  onOpenDbModal: () => void;
  onOpenAiSearch: (initialQuery?: string) => void;
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
  dbHealth,
  onOpenDbModal,
  onOpenAiSearch,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-stone-950 shadow-md shadow-amber-900/30 shrink-0">
              <Croissant className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-stone-100 font-['Outfit',sans-serif]">
                  Crumb & Crust
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Bakery OS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 hidden sm:block">Artisan Production & AI Manager</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onOpenAiSearch(searchQuery);
                  }
                }}
                placeholder="Search batches, breads, or ask AI e.g. 'urgent tasks'..."
                className="w-full bg-stone-800/90 text-sm text-stone-200 placeholder-stone-400 pl-9 pr-24 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-stone-400 hover:text-stone-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  id="header-ai-search-btn"
                  onClick={() => onOpenAiSearch(searchQuery)}
                  title="Natural Language Record Search Assistant (Gemini)"
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>AI Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile AI Search Button */}
            <button
              id="header-mobile-ai-search-btn"
              onClick={() => onOpenAiSearch(searchQuery)}
              className="md:hidden flex items-center justify-center min-w-[38px] min-h-[38px] p-2 rounded-xl bg-stone-800 border border-stone-700 text-amber-400 hover:bg-stone-700 active:scale-95 transition-all touch-manipulation"
              title="AI Record Search"
              aria-label="Open AI Record Search"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {/* Database Status Button */}
            <button
              id="header-database-btn"
              onClick={onOpenDbModal}
              title={dbHealth?.message || 'Supabase PostgreSQL Status'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                dbHealth?.connected
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : dbHealth?.configured
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-700/80'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${dbHealth?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{dbHealth?.connected ? 'Supabase Live' : 'Supabase PG'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbHealth?.connected
                    ? 'bg-emerald-400 animate-pulse'
                    : dbHealth?.configured
                    ? 'bg-amber-400'
                    : 'bg-stone-400'
                }`}
              />
            </button>

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

            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="header" />

            {/* AI Assistant Quick Trigger */}
            <button
              id="header-ai-assistant-btn"
              onClick={onToggleAiDrawer}
              className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1.5 sm:py-1.5 min-h-[38px] rounded-xl sm:rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xs:inline sm:inline">AI Copilot</span>
              <span className="xs:hidden inline">AI</span>
            </button>

            {/* Action Buttons */}
            <button
              id="header-add-task-btn"
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3 sm:px-3.5 py-1.5 min-h-[38px] rounded-xl sm:rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-600/30 active:scale-95 touch-manipulation shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden text-xs">Task</span>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onOpenAiSearch(searchQuery);
                  }
                }}
                placeholder="Search batches, orders, or ask AI..."
                className="w-full bg-stone-800 text-xs sm:text-sm text-stone-200 placeholder-stone-400 pl-9 pr-8 py-2 min-h-[40px] rounded-xl border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => onOpenAiSearch(searchQuery)}
              className="px-2.5 py-2 min-h-[40px] rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 flex items-center gap-1 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 border-t border-stone-800/80 pt-1 overflow-x-auto no-scrollbar scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 sm:py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap border-b-2 touch-manipulation ${
                  isActive
                    ? 'border-amber-500 text-amber-400 bg-stone-800/80'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.isAi && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
