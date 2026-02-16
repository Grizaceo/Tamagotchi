import './style.css';
import { startGameLoop } from './game/GameLoop';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
if (!canvas) {
  throw new Error('Canvas #screen not found');
}

const stop = startGameLoop(canvas);

// ── PWA: register service worker ──
if ('serviceWorker' in navigator) {
  // FORCE UNREGISTER for debugging
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      console.log('[PomPom] Unregistering SW:', registration);
      registration.unregister();
    }
  });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => stop());
}
