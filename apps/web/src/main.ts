import './style.css';
import { startGameLoop } from './game/GameLoop';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
if (!canvas) {
  throw new Error('Canvas #screen not found');
}

const stop = startGameLoop(canvas);

// ── PWA: register service worker ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // SW registration failed — app still works, just no offline support
  });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => stop());
}
