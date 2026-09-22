import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  Clock,
  User,
  ArrowRight,
  Flame,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  Filter,
  CornerDownLeft,
} from 'lucide-react';
import {
  BakeryTask,
  Project,
  NaturalLanguageSearchResponse,
  NaturalLanguageSearchFilter,
} from '../types';
import { performNaturalLanguageSearch } from '../services/api';

interface NaturalLanguageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: BakeryTask[];
  projects: Project[];
  onSelectTask: (task: BakeryTask) => void;
  onSelectProject: (project: Project) => void;
  onApplyFiltersToBoard?: (filters: NaturalLanguageSearchFilter) => void;
  initialQuery?: string;
}

const QUICK_SEARCH_EXAMPLES = [
  { label: '🔥 Urgent tasks in Ovens', query: 'Show all urgent tasks currently in ovens or needing baking' },
  { label: '🥐 Proofing viennoiserie', query: 'Viennoiserie croissants and pastries in proofing or prep' },
  { label: '👨‍🍳 Chef Marcus assignments', query: 'All active batches assigned to Chef Marcus' },
  { label: '📦 Wholesale orders due today', query: 'Wholesale delivery orders scheduled for today' },
  { label: '⏱️ Quick tasks under 30 mins', query: 'Quick tasks with estimated time under 30 minutes' },
  { label: '🎂 Custom cake decoration', query: 'Custom cake sponge stacking and finishing tasks' },
];

export const NaturalLanguageSearchModal: React.FC<NaturalLanguageSearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onSelectTask,
  onSelectProject,
  onApplyFiltersToBoard,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<NaturalLanguageSearchResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'projects'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and run initial query if provided
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);

      if (initialQuery && initialQuery.trim()) {
        setQuery(initialQuery);
        handleSearch(initialQuery);
      }
    } else {
      setError(null);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (searchQueryText: string) => {
    const trimmed = searchQueryText.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await performNaturalLanguageSearch(trimmed, tasks, projects);
      setSearchResult(result);
    } catch (err: any) {
      console.error('Natural language search error:', err);
      setError(err.message || 'Unable to process search with AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleQuickPillClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    handleSearch(exampleQuery);
  };

  if (!isOpen) return null;

  const matchedTasks = searchResult?.matchingTasks || [];
  const matchedProjects = searchResult?.matchingProjects || [];
  const totalResults = matchedTasks.length + matchedProjects.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-16 p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        id="ai-natural-search-modal"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto sm:my-0 max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight font-['Outfit',sans-serif]">
                  AI Record Search Assistant
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 hidden xs:inline-block">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400">
                Ask in plain English to search tasks, recipes, orders, and schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-stone-50 border-b border-stone-200 shrink-0">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                id="ai-natural-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask e.g., 'What urgent tasks need baking?'..."
                className="w-full bg-white text-xs sm:text-sm text-stone-900 placeholder-stone-400 pl-10 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="ai-natural-search-submit-btn"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-3 sm:px-4 py-2.5 min-h-[40px] bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer active:scale-95 touch-manipulation"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Search</span>
                  <CornerDownLeft className="w-3.5 h-3.5 opacity-70 ml-0.5 hidden sm:inline" />
                </>
              )}
            </button>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[11px] font-semibold text-stone-600 mr-1 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Try:
            </span>
            {QUICK_SEARCH_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickPillClick(ex.query)}
                className="text-[11px] font-medium px-2.5 py-1 min-h-[30px] rounded-lg bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 transition-colors shadow-2xs shrink-0 whitespace-nowrap touch-manipulation"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </form>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">
                Chef Brioche AI is analyzing bakery records...
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Evaluating schedule timestamps, oven reservations, stations, priorities, and order deadlines with Gemini.
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-sm mb-1">Search Error</p>
                <p className="text-red-800 mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => handleSearch(query)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px] hover:bg-red-500 transition-colors"
                >
                  Retry Search
                </button>
              </div>
            </div>
          )}

          {/* Results State */}
          {!isLoading && !error && searchResult && (
            <div className="space-y-5">
              {/* AI Query Interpretation Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-amber-600 text-white shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block sm:inline mr-2">
                      Interpreted Query:
                    </span>
                    <span className="text-stone-700">{searchResult.interpretation}</span>

                    {/* Filter Pills Extracted */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {searchResult.extractedFilters.station && searchResult.extractedFilters.station !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-amber-200/70 border border-amber-300 text-amber-900 text-[10px] font-bold rounded-md">
                          Station: {searchResult.extractedFilters.station}
                        </span>
                      )}
                      {searchResult.extractedFilters.priority && searchResult.extractedFilters.priority !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-amber-200/70 border border-amber-300 text-amber-900 text-[10px] font-bold rounded-md">
                          Priority: {searchResult.extractedFilters.priority}
                        </span>
                      )}
                      {searchResult.extractedFilters.status && searchResult.extractedFilters.status !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-amber-200/70 border border-amber-300 text-amber-900 text-[10px] font-bold rounded-md">
                          Status: {searchResult.extractedFilters.status}
                        </span>
                      )}
                      {searchResult.extractedFilters.assignedBaker && searchResult.extractedFilters.assignedBaker !== 'ALL' && (
                        <span className="px-2 py-0.5 bg-amber-200/70 border border-amber-300 text-amber-900 text-[10px] font-bold rounded-md">
                          Baker: {searchResult.extractedFilters.assignedBaker}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Apply to Board Button */}
                {onApplyFiltersToBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyFiltersToBoard(searchResult.extractedFilters);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors shrink-0 self-start sm:self-center"
                    title="Apply these filters to the main Kanban board"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Apply to Board</span>
                  </button>
                )}
              </div>

              {/* Sub-Tabs: Filter by Tasks or Orders */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'all'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    All Results ({totalResults})
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'tasks'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tasks ({matchedTasks.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'projects'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Orders ({matchedProjects.length})</span>
                  </button>
                </div>

                <span className="text-[11px] text-stone-600 hidden sm:inline">
                  {totalResults === 1 ? '1 match found' : `${totalResults} matches found`}
                </span>
              </div>

              {/* Empty Results State */}
              {totalResults === 0 && (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-600">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">
                    No matching bakery records found
                  </h3>
                  <p className="text-xs text-stone-600 max-w-sm mx-auto">
                    Try searching for specific stations (e.g. "Breads", "Ovens"), baker names ("Marcus", "Sophie"), or keywords like "croissant", "urgent", or "sourdough".
                  </p>
                </div>
              )}

              {/* Matching Tasks Section */}
              {(activeTab === 'all' || activeTab === 'tasks') && matchedTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Matched Baking Tasks ({matchedTasks.length})</span>
                  </h3>

                  <div className="space-y-2.5">
                    {matchedTasks.map(({ task, relevanceScore, matchReason }) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onSelectTask(task);
                          onClose();
                        }}
                        className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  task.priority === 'Urgent'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : task.priority === 'High'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {task.priority}
                              </span>

                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                                {task.station}
                              </span>

                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 capitalize">
                                Stage: {task.status}
                              </span>

                              {relevanceScore >= 80 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{relevanceScore}% Match</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            )}

                            {/* AI Match Reason */}
                            <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/90 px-2 py-1 rounded-md border border-amber-200/80 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-medium">Why matched: {matchReason}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                            <div className="text-[11px] text-stone-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-600" />
                              <span>{task.dueTime}</span>
                            </div>
                            <div className="text-[11px] font-medium text-stone-700 flex items-center gap-1 mt-1">
                              <User className="w-3 h-3 text-stone-600" />
                              <span>{task.assignedBaker}</span>
                            </div>
                            <span className="text-xs text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 mt-2">
                              <span>Open</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Projects Section */}
              {(activeTab === 'all' || activeTab === 'projects') && matchedProjects.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-amber-600" />
                    <span>Matched Production Orders ({matchedProjects.length})</span>
                  </h3>

                  <div className="space-y-2.5">
                    {matchedProjects.map(({ project, relevanceScore, matchReason }) => (
                      <div
                        key={project.id}
                        onClick={() => {
                          onSelectProject(project);
                          onClose();
                        }}
                        className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                                {project.category}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 capitalize">
                                {project.status.replace('_', ' ')}
                              </span>
                              {relevanceScore >= 80 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{relevanceScore}% Match</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                              {project.name}
                            </h4>

                            {project.client && (
                              <p className="text-xs text-stone-600 font-medium mt-0.5">
                                Client: {project.client}
                              </p>
                            )}

                            {/* AI Match Reason */}
                            <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/90 px-2 py-1 rounded-md border border-amber-200/80 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-medium">Why matched: {matchReason}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                            <span className="text-xs font-bold text-stone-900">
                              {project.targetUnits} units
                            </span>
                            <span className="text-[11px] text-stone-600 mt-1">
                              {project.deadline}
                            </span>
                            <span className="text-xs text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 mt-2">
                              <span>View Order</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Query Suggestions */}
              {searchResult.suggestedFollowUps && searchResult.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                    Suggested queries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResult.suggestedFollowUps.map((su, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickPillClick(su)}
                        className="text-[11px] text-stone-700 hover:text-amber-900 bg-stone-100 hover:bg-amber-100/70 px-2.5 py-1 rounded-md transition-colors text-left"
                      >
                        "{su}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial State before any search */}
          {!isLoading && !error && !searchResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-600">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Natural Language Record Search
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                  Type questions in plain English to search across all bakery stations, dough mixes, proofing retarders, deck ovens, and wholesale customer orders.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs text-stone-700 space-y-1.5">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  What you can search:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-600 text-[11px]">
                  <li>Station queries: <code className="text-amber-800 font-mono">"Baking tasks in deck ovens"</code></li>
                  <li>Baker assignments: <code className="text-amber-800 font-mono">"What is Chef Marcus assigned to?"</code></li>
                  <li>Timing filters: <code className="text-amber-800 font-mono">"Tasks due before 7 AM taking under 40 min"</code></li>
                  <li>Order matching: <code className="text-amber-800 font-mono">"Wholesale orders for Café Luna"</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-medium text-stone-700">Tip:</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded font-mono text-[10px]">Enter</kbd> to search</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
