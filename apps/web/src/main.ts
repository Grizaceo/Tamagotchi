import './style.css';
import { startGameLoop } from './game/GameLoop';
import type { PetLine } from '@pompom/core';
import { shouldUnregisterServiceWorker } from './game/runtimeConfig';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
if (!canvas) {
  throw new Error('Canvas #screen not found');
}

const petLine = selectPetLine();
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

function selectPetLine(): PetLine {
  const savedRaw = localStorage.getItem('pompom-save-v3');
  if (savedRaw) {
    return 'flan'; // existing save will include petLine; preference is ignored here
  }
  const storedChoice = localStorage.getItem('pompom-pet-line');
  if (storedChoice === 'seal' || storedChoice === 'flan' || storedChoice === 'fiu' || storedChoice === 'salchicha') {
    return storedChoice;
  }
  const choice = window.prompt(
    'Elige mascota inicial: "flan", "seal", "fiu" o "salchicha" (default flan)',
    'flan',
  );
  const normalized = normalizePetLineChoice(choice);
  localStorage.setItem('pompom-pet-line', normalized);
  return normalized;
}

function normalizePetLineChoice(choice: string | null): PetLine {
  const normalized = (choice || '').trim().toLowerCase();
  if (normalized === 'seal' || normalized === 'fiu' || normalized === 'salchicha') {
    return normalized;
  }
  return 'flan';
}
