import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-stone-900 text-stone-100 px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-500/40 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Bakery assets & cached records are active</span>
    </div>
  );
};
