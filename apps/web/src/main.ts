import './style.css';
import { startGameLoop } from './game/GameLoop';
import type { PetLine } from '@pompom/core';
import { shouldForceReset, shouldUnregisterServiceWorker } from './game/runtimeConfig';

// Polyfill for CanvasRenderingContext2D.roundRect (for older browsers and Vitest/JSDOM)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    w: number,
    h: number,
    radii: number | number[]
  ) {
    if (typeof radii === 'number') radii = [radii];
    if (radii.length === 1) radii = [radii[0], radii[0], radii[0], radii[0]];
    if (radii.length === 2) radii = [radii[0], radii[1], radii[0], radii[1]];
    if (radii.length === 3) radii = [radii[0], radii[1], radii[2], radii[1]];

    const rtl = radii[0];
    const rtr = radii[1];
    const rbr = radii[2];
    const rbl = radii[3];

    this.beginPath();
    this.moveTo(x + rtl, y);
    this.lineTo(x + w - rtr, y);
    this.arcTo(x + w, y, x + w, y + rtr, rtr);
    this.lineTo(x + w, y + h - rbr);
    this.arcTo(x + w, y + h, x + w - rbr, y + h, rbr);
    this.lineTo(x + rbl, y + h);
    this.arcTo(x, y + h, x, y + h - rbl, rbl);
    this.lineTo(x, y + rtl);
    this.arcTo(x, y, x + rtl, y, rtl);
    this.closePath();
    return this;
  };
}

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
if (!canvas) {
  throw new Error('Canvas #screen not found');
}

// ?reset: limpia save + preferencia de mascota ANTES de selectPetLine()
// para que el overlay de selección aparezca.
if (shouldForceReset(window.location.search)) {
  const keysToRemove = [
    'pompom-save-v3',
    'pompom-save-v2',
    'pompom-save-debug-v1',
    'pompom-save-v1',
    'pompom-pet-line',
  ];
  for (const k of keysToRemove) localStorage.removeItem(k);
}

selectPetLine().then((petLine) => {
  const stop = startGameLoop(canvas, petLine);

  // ── PWA: register service worker ──
  if ('serviceWorker' in navigator) {
    if (shouldUnregisterServiceWorker(window.location.search, import.meta.env.DEV)) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          console.log('[PomPom] Unregistering SW:', registration);
          registration.unregister();
        }
      });
    } else if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((error) => {
          console.error('[PomPom] Failed to register SW:', error);
        });
      });
    }
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => stop());
  }
});

function selectPetLine(): Promise<PetLine> {
  // Si hay un save existente, la línea se leerá del save — no importa este valor
  const savedRaw = localStorage.getItem('pompom-save-v3');
  if (savedRaw) return Promise.resolve('flan');

  // Si ya eligió antes, reusar
  const stored = localStorage.getItem('pompom-pet-line');
  if (stored === 'flan' || stored === 'seal' || stored === 'fiu' || stored === 'salchicha') {
    return Promise.resolve(stored);
  }

  // Primera vez o después de reset: mostrar overlay de selección
  return showPetSelectOverlay();
}

function showPetSelectOverlay(): Promise<PetLine> {
  const overlay = document.getElementById('pet-select');
  if (!overlay) return Promise.resolve('flan');

  overlay.removeAttribute('hidden');

  return new Promise((resolve) => {
    overlay.addEventListener('click', function handler(e) {
      const btn = (e.target as HTMLElement).closest('[data-pet]') as HTMLElement | null;
      if (!btn) return;

      const pet = btn.dataset.pet as PetLine;
      localStorage.setItem('pompom-pet-line', pet);
      overlay.setAttribute('hidden', '');
      overlay.removeEventListener('click', handler);
      resolve(pet);
    });
  });
}
