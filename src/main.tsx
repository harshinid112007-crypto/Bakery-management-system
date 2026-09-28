import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with auto-update only in production builds
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Application update detected.');
    },
    onOfflineReady() {
      console.log('[PWA] Bakery Manager cached for offline usage.');
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration notice:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
