import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'prominent' | 'header';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running inside installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        id="pwa-install-app-button"
        type="button"
        onClick={handleInstallClick}
        title="Install Bakery Manager as a standalone Progressive Web App"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 touch-manipulation cursor-pointer ${
          variant === 'header'
            ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/40 hover:shadow-md'
            : variant === 'prominent'
            ? 'bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 shadow-md'
            : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="hidden xs:inline">Install App</span>
        <span className="xs:hidden">Install</span>
      </button>

      {/* Success Notification */}
      {justInstalled && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>Bakery Manager installed successfully!</span>
        </div>
      )}

      {/* Guide Dialog for iOS or Desktop Manual Install */}
      {showGuide && (
        <div
          id="pwa-install-guide-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Install Bakery Manager</h3>
                  <p className="text-[11px] text-stone-500">Fast, offline-ready native app</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-stone-600">
                <p className="font-semibold text-stone-800">
                  Follow these steps in Safari on your iPhone or iPad:
                </p>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-stone-700">
                  <Share2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900">Step 1:</span> Tap the <strong>Share</strong> button in the bottom Safari toolbar.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-stone-700">
                  <PlusSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900">Step 2:</span> Scroll down and tap <strong>Add to Home Screen</strong>.
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  The app will launch in standalone full-screen mode directly from your home screen.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-stone-600">
                <p className="font-semibold text-stone-800">
                  Install on Android, Chrome, Edge, or Brave:
                </p>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Look for the <strong>Install</strong> icon in the right side of your browser address bar.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Or click the browser menu (<strong>⋮</strong> or <strong>…</strong>) and select <strong>Install Bakery Manager</strong>.</span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Once installed, Bakery Manager runs in its own window with zero browser bars and quick dock/launcher access.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors min-h-[38px]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
