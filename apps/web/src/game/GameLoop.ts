import {
  createAction,
  createInitialPetState,
  deserializeFromJSON,
  evaluateGiftUnlocks,
  reduce,
  serializeToJSON,
  tick,
  type PetState,
} from '@pompom/core';
import { SceneManager } from './SceneManager';
import { MainScene } from './scenes/MainScene';
import { MinigameSelect } from './scenes/MinigameSelect';
import { PuddingGame } from './scenes/PuddingGame';
import { MemoryGame } from './scenes/MemoryGame';
import type { MinigameResult } from './scenes/Scene';

const STORAGE_KEY = 'pompom-save';
const TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;

/**
 * Inicia el game loop principal con SceneManager
 * Maneja: ticks de juego, persistencia, transiciones de escenas, rewards
 */
export function startGameLoop(canvas: HTMLCanvasElement): () => void {
  const sceneManager = new SceneManager(canvas);

  // Registrar todas las escenas
  sceneManager.registerScene('main', MainScene);
  sceneManager.registerScene('minigame-select', MinigameSelect);
  sceneManager.registerScene('pudding-game', PuddingGame);
  sceneManager.registerScene('memory-game', MemoryGame);

  let petState = loadState();
  let lastTime = performance.now();
  let accumulator = 0;
  let lastSaveAt = 0;
  let pendingSave = false;
  let rafId = 0;

  // Iniciar en MainScene
  sceneManager.switchScene('main');

  // Vincular evento de game complete (minijuego terminado)
  const onGameComplete = (result: MinigameResult) => {
    const action = createAction('PLAY_MINIGAME', petState.totalTicks, {
      gameId: result.gameId,
      result: result.result,
      score: result.score || 0,
    });
    petState = reduce(petState, action);
    pendingSave = true;
    // Volver a MainScene después de procesar reward
    setTimeout(() => {
      sceneManager.switchScene('main');
    }, 1000);
  };

  // Pasar callback a sceneManager context
  (sceneManager as any).context.onGameComplete = onGameComplete;

  const loop = (now: number) => {
    const delta = now - lastTime;
    lastTime = now;

    // Ticks de juego
    if (!petState.settings.paused) {
      const speedFactor = petState.settings.speed === '2x' ? 2 : 1;
      accumulator += delta * speedFactor;
      while (accumulator >= TICK_MS) {
        petState = evaluateGiftUnlocks(tick(petState, 1));
        accumulator -= TICK_MS;
        pendingSave = true;
      }
    } else {
      accumulator = 0;
    }

    // Actualizar y renderizar escena
    sceneManager.update(delta);
    sceneManager.draw();

    // Guardar estado periódicamente
    if (pendingSave && now - lastSaveAt > SAVE_INTERVAL_MS) {
      saveState(petState);
      lastSaveAt = now;
      pendingSave = false;
    }

    rafId = requestAnimationFrame(loop);
  };

  // Manejar input de teclado
  const handleKeyDown = (e: KeyboardEvent) => {
    sceneManager.handleInput(e);
  };

  window.addEventListener('keydown', handleKeyDown);

  const beforeUnload = () => {
    saveState(petState);
  };
  window.addEventListener('beforeunload', beforeUnload);

  rafId = requestAnimationFrame(loop);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('beforeunload', beforeUnload);
    cancelAnimationFrame(rafId);
  };
}

function loadState(): PetState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialPetState();
  }
  return deserializeFromJSON(raw);
}

function saveState(state: PetState): void {
  localStorage.setItem(STORAGE_KEY, serializeToJSON(state));
}
