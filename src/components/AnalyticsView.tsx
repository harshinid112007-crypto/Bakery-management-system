import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { BakeryTask, Project, OvenStatus } from '../types';
import { BAKERY_STATIONS } from '../data/initialData';

interface AnalyticsViewProps {
  tasks: BakeryTask[];
  projects: Project[];
  ovens: OvenStatus[];
  onTriggerAiAction: (actionType: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tasks,
  projects,
  ovens,
  onTriggerAiAction,
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Station breakdown
  const stationStats = BAKERY_STATIONS.map((station) => {
    const stationTasks = tasks.filter((t) => t.station === station);
    const stationDone = stationTasks.filter((t) => t.status === 'completed');
    const pct = stationTasks.length > 0 ? Math.round((stationDone.length / stationTasks.length) * 100) : 0;
    return {
      name: station,
      total: stationTasks.length,
      completed: stationDone.length,
      pct,
    };
  });

  // Priority breakdown
  const priorities: Array<{ priority: 'Urgent' | 'High' | 'Medium' | 'Low'; color: string; bg: string }> = [
    { priority: 'Urgent', color: 'bg-rose-500', bg: 'text-rose-700 bg-rose-50' },
    { priority: 'High', color: 'bg-amber-500', bg: 'text-amber-700 bg-amber-50' },
    { priority: 'Medium', color: 'bg-blue-500', bg: 'text-blue-700 bg-blue-50' },
    { priority: 'Low', color: 'bg-stone-400', bg: 'text-stone-700 bg-stone-100' },
  ];

  const priorityStats = priorities.map((p) => {
    const pTasks = tasks.filter((t) => t.priority === p.priority);
    const pDone = pTasks.filter((t) => t.status === 'completed');
    const pct = pTasks.length > 0 ? Math.round((pDone.length / pTasks.length) * 100) : 0;
    return {
      ...p,
      total: pTasks.length,
      done: pDone.length,
      pct,
    };
  });

  // Total quantity calculation
  const totalCalculatedUnits = tasks.reduce((sum, t) => {
    const match = t.quantity?.match(/(\d+)/);
    return sum + (match ? parseInt(match[0], 10) : 1);
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Analytics Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Real-Time Kitchen Metrics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-['Outfit',sans-serif]">
            Production & Progress Analytics
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Evaluate throughput, deck oven occupancy, station velocity, and shift bottleneck prevention.
          </p>
        </div>

        <button
          onClick={() => onTriggerAiAction('SUMMARIZE')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold transition-all shadow-sm self-stretch sm:self-start md:self-center active:scale-95 touch-manipulation"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Executive Analysis</span>
        </button>
      </div>

      {/* Top Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-700 font-bold uppercase tracking-wider">
            <span>Shift Velocity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
              {completionRate}%
            </span>
            <span className="text-[11px] sm:text-xs text-emerald-600 font-semibold">+8%</span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 mt-1 truncate">
            {completedTasks.length} of {totalTasks} cleared
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-700 font-bold uppercase tracking-wider">
            <span>Scheduled</span>
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
              ~{totalCalculatedUnits}
            </span>
            <span className="text-[11px] sm:text-xs text-stone-600 font-medium">Bakes</span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 mt-1 truncate">Across {projects.length} contracts</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-700 font-bold uppercase tracking-wider">
            <span>Oven Capacity</span>
            <Flame className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit',sans-serif]">
              {Math.round((ovens.filter((o) => o.status === 'active').length / ovens.length) * 100)}%
            </span>
            <span className="text-[11px] sm:text-xs text-amber-600 font-semibold">Active</span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 mt-1 truncate">Deck 1 & 2 at 245°C</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-700 font-bold uppercase tracking-wider">
            <span>Risk Index</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="mt-3 sm:mt-4 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-['Outfit',sans-serif]">
              Low
            </span>
            <span className="text-[11px] sm:text-xs text-stone-600 font-medium">Synced</span>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 mt-1 truncate">Lamination resting at 4°C</p>
        </div>
      </div>

      {/* Main Charts Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station Workload & Progress */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h2 className="text-base font-bold text-stone-900 font-['Outfit',sans-serif] mb-1">
            Throughput by Production Station
          </h2>
          <p className="text-xs text-stone-600 mb-6">Progress of tasks assigned to each department</p>

          <div className="space-y-4">
            {stationStats.map((station) => (
              <div key={station.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">{station.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600">
                      {station.completed}/{station.total} done
                    </span>
                    <span className="font-extrabold text-amber-800 w-10 text-right">
                      {station.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${station.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Tier Health */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <h2 className="text-base font-bold text-stone-900 font-['Outfit',sans-serif] mb-1">
            Task Execution by Priority Tier
          </h2>
          <p className="text-xs text-stone-600 mb-6">Urgent orders vs scheduled prep tasks</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {priorityStats.map((p) => (
              <div
                key={p.priority}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${p.bg}`}>
                    {p.priority}
                  </span>
                  <span className="text-xs font-bold text-stone-900">{p.pct}%</span>
                </div>
                <div className="text-xs text-stone-600 font-medium">
                  {p.done} of {p.total} completed
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${p.color} rounded-full`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Production Recommendation Card */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              AI Oven Sequence Optimization
            </h3>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Deck Oven 1 is currently baking Country Batards at 245°C. When finished in 14 minutes,
              re-steam immediately for Baguettes before venting down to 220°C for Sourdough Boules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
