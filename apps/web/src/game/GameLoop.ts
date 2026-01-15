import {
  createAction,
  createInitialPetState,
  deserializeFromJSON,
  evaluateGiftUnlocks,
  reduce,
  serializeToJSON,
  tick,
  type ActionType,
  type PetState,
} from '@pompom/core';
import { bindInput, type InputCommand } from './Input';
import {
  ALBUM_PAGE_SIZE,
  BOTTOM_MENU,
  CARE_ACTIONS,
  SETTINGS_ITEMS,
  createInitialUiState,
  getMenuIndex,
  wrapIndex,
  type UiState,
} from './Scenes';
import { renderFrame } from './Render';

const STORAGE_KEY = 'pompom-save';
const TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;

export function startGameLoop(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  let petState = loadState();
  let uiState = createInitialUiState();

  let lastTime = performance.now();
  let accumulator = 0;
  let lastSaveAt = 0;
  let pendingSave = false;
  let rafId = 0;

  const stopInput = bindInput((command) => {
    const updated = handleInput(command, petState, uiState);
    petState = updated.petState;
    uiState = updated.uiState;
    if (updated.changed) {
      pendingSave = true;
    }
  });

  const beforeUnload = () => {
    saveState(petState);
  };
  window.addEventListener('beforeunload', beforeUnload);

  const loop = (now: number) => {
    const delta = now - lastTime;
    lastTime = now;

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

    renderFrame(ctx, petState, uiState, now);

    if (pendingSave && now - lastSaveAt > SAVE_INTERVAL_MS) {
      saveState(petState);
      lastSaveAt = now;
      pendingSave = false;
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  return () => {
    stopInput();
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

function handleInput(
  command: InputCommand,
  petState: PetState,
  uiState: UiState
): { petState: PetState; uiState: UiState; changed: boolean } {
  let nextState = petState;
  let nextUi = { ...uiState };
  let changed = false;

  if (uiState.scene === 'Home') {
    if (command === 'LEFT') {
      nextUi.menuIndex = wrapIndex(uiState.menuIndex - 1, BOTTOM_MENU.length);
      changed = true;
    } else if (command === 'RIGHT') {
      nextUi.menuIndex = wrapIndex(uiState.menuIndex + 1, BOTTOM_MENU.length);
      changed = true;
    } else if (command === 'ENTER') {
      nextUi.scene = BOTTOM_MENU[uiState.menuIndex].id;
      changed = true;
    }
    return { petState: nextState, uiState: nextUi, changed };
  }

  if (command === 'BACK') {
    nextUi.scene = 'Home';
    return { petState: nextState, uiState: nextUi, changed: true };
  }

  switch (uiState.scene) {
    case 'CareMenu':
      if (command === 'LEFT') {
        nextUi.careIndex = wrapIndex(uiState.careIndex - 1, CARE_ACTIONS.length);
        changed = true;
      } else if (command === 'RIGHT') {
        nextUi.careIndex = wrapIndex(uiState.careIndex + 1, CARE_ACTIONS.length);
        changed = true;
      } else if (command === 'ENTER') {
        const actionType = CARE_ACTIONS[uiState.careIndex].type;
        nextState = applyAction(nextState, actionType);
        changed = true;
      }
      break;
    case 'Gifts':
      if (command === 'LEFT' || command === 'RIGHT') {
        const giftCount = nextState.unlockedGifts.length;
        if (giftCount > 0) {
          const direction = command === 'LEFT' ? -1 : 1;
          nextUi.giftIndex = wrapIndex(uiState.giftIndex + direction, giftCount);
          changed = true;
        }
      }
      break;
    case 'Album':
      if (command === 'LEFT' || command === 'RIGHT') {
        const entries = Object.keys(nextState.album);
        const totalPages = Math.max(1, Math.ceil(entries.length / ALBUM_PAGE_SIZE));
        if (entries.length > 0) {
          const direction = command === 'LEFT' ? -1 : 1;
          const pageStart = uiState.albumPage * ALBUM_PAGE_SIZE;
          const pageCount = Math.min(ALBUM_PAGE_SIZE, entries.length - pageStart);
          let nextIndex = uiState.albumIndex + direction;

          if (nextIndex < 0 && uiState.albumPage > 0) {
            nextUi.albumPage = uiState.albumPage - 1;
            const prevCount = Math.min(
              ALBUM_PAGE_SIZE,
              entries.length - nextUi.albumPage * ALBUM_PAGE_SIZE
            );
            nextUi.albumIndex = Math.max(0, prevCount - 1);
          } else if (nextIndex >= pageCount && uiState.albumPage < totalPages - 1) {
            nextUi.albumPage = uiState.albumPage + 1;
            nextUi.albumIndex = 0;
          } else {
            nextUi.albumIndex = wrapIndex(nextIndex, pageCount);
          }
          changed = true;
        }
      }
      break;
    case 'Settings':
      if (command === 'LEFT') {
        nextUi.settingsIndex = wrapIndex(uiState.settingsIndex - 1, SETTINGS_ITEMS.length);
        changed = true;
      } else if (command === 'RIGHT') {
        nextUi.settingsIndex = wrapIndex(uiState.settingsIndex + 1, SETTINGS_ITEMS.length);
        changed = true;
      } else if (command === 'ENTER') {
        nextState = applySetting(nextState, SETTINGS_ITEMS[uiState.settingsIndex].id);
        changed = true;
      }
      break;
    case 'Minigames':
      if (command === 'LEFT' || command === 'RIGHT') {
        nextUi.menuIndex = getMenuIndex('Minigames');
        changed = true;
      }
      break;
  }

  return { petState: nextState, uiState: nextUi, changed };
}

function applyAction(state: PetState, actionType: ActionType): PetState {
  const nextState = reduce(state, createAction(actionType, state.totalTicks));
  return evaluateGiftUnlocks(nextState);
}

function applySetting(state: PetState, id: string): PetState {
  const settings = { ...state.settings };

  switch (id) {
    case 'mute':
      settings.soundEnabled = !settings.soundEnabled;
      break;
    case 'speed':
      settings.speed = settings.speed === '1x' ? '2x' : '1x';
      break;
    case 'pause':
      settings.paused = !settings.paused;
      break;
    case 'reducedMotion':
      settings.reducedMotion = !settings.reducedMotion;
      break;
  }

  return { ...state, settings };
}
