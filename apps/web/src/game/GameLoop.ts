import {
  createAction,
  createInitialPetState,
  deserializeFromJSON,
  postProcessState,
  reduce,
  serializeToJSON,
  tick,
  type PetState,
} from '@pompom/core';
import { bindInput, type InputCommand } from './Input';
import { renderFrame } from './Render';
import { SceneManager } from './SceneManager';
import { MemoryGame } from './scenes/MemoryGame';
import { PuddingGame } from './scenes/PuddingGame';
import {
  ALBUM_PAGE_SIZE,
  BOTTOM_MENU,
  CARE_ACTIONS,
  MINIGAMES,
  SETTINGS_ITEMS,
  createInitialUiState,
  wrapIndex,
  type SceneId,
} from './Scenes';

const STORAGE_KEY = 'pompom-save';
const TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;

/**
 * Inicia el game loop principal con UI retro.
 * Maneja ticks, persistencia, input y minijuegos.
 */
export function startGameLoop(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const minigameCanvas = document.createElement('canvas');
  minigameCanvas.width = 320;
  minigameCanvas.height = 240;

  const minigameManager = new SceneManager(minigameCanvas, (sceneName) => {
    if (sceneName === 'select') {
      uiState.minigameMode = 'select';
      return;
    }
    minigameManager.switchScene(sceneName);
  });

  minigameManager.registerScene('pudding-game', PuddingGame);
  minigameManager.registerScene('memory-game', MemoryGame);

  let petState = loadState();
  let uiState = createInitialUiState();
  let lastTime = performance.now();
  let accumulator = 0;
  let lastSaveAt = 0;
  let pendingSave = false;
  let rafId = 0;

  let petSprite: HTMLImageElement | null = null;
  const spriteImage = new Image();
  spriteImage.src = '/descarga.jpg';
  spriteImage.onload = () => {
    petSprite = spriteImage;
  };

  minigameManager.setOnGameComplete((result) => {
    const action = createAction('PLAY_MINIGAME', petState.totalTicks, {
      gameId: result.gameId,
      result: result.result,
      score: result.score || 0,
    });
    petState = reduce(petState, action);
    petState = postProcessState(petState);
    pendingSave = true;
  });

  const loop = (now: number) => {
    const delta = now - lastTime;
    lastTime = now;

    if (!petState.settings.paused) {
      const speedFactor = petState.settings.speed === '2x' ? 2 : 1;
      accumulator += delta * speedFactor;
      while (accumulator >= TICK_MS) {
        petState = tick(petState, 1);
        petState = postProcessState(petState);
        accumulator -= TICK_MS;
        pendingSave = true;
      }
    } else {
      accumulator = 0;
    }

    if (uiState.scene === 'Minigames' && uiState.minigameMode === 'playing') {
      minigameManager.update(delta);
      minigameManager.draw();
    }

    renderFrame(ctx, petState, uiState, now, {
      minigameFrame: uiState.scene === 'Minigames' && uiState.minigameMode === 'playing' ? minigameCanvas : null,
      petSprite,
    });

    if (pendingSave && now - lastSaveAt > SAVE_INTERVAL_MS) {
      saveState(petState);
      lastSaveAt = now;
      pendingSave = false;
    }

    rafId = requestAnimationFrame(loop);
  };

  const executeAction = (type: (typeof CARE_ACTIONS)[number]['type']) => {
    const action = createAction(type, petState.totalTicks);
    petState = reduce(petState, action);
    petState = postProcessState(petState);
    pendingSave = true;
  };

  const toggleSetting = (id: string) => {
    const settings = petState.settings;
    switch (id) {
      case 'mute':
        petState = { ...petState, settings: { ...settings, soundEnabled: !settings.soundEnabled } };
        break;
      case 'speed':
        petState = { ...petState, settings: { ...settings, speed: settings.speed === '1x' ? '2x' : '1x' } };
        break;
      case 'pause':
        petState = { ...petState, settings: { ...settings, paused: !settings.paused } };
        break;
      case 'reducedMotion':
        petState = { ...petState, settings: { ...settings, reducedMotion: !settings.reducedMotion } };
        break;
      default:
        break;
    }
    pendingSave = true;
  };

  const navigateAlbum = (direction: number) => {
    const entries = Object.keys(petState.album);
    if (entries.length === 0) return;

    const currentIndex = uiState.albumPage * ALBUM_PAGE_SIZE + uiState.albumIndex;
    const nextIndex = wrapIndex(currentIndex + direction, entries.length);
    uiState.albumPage = Math.floor(nextIndex / ALBUM_PAGE_SIZE);
    uiState.albumIndex = nextIndex % ALBUM_PAGE_SIZE;
  };

  const openScene = (scene: SceneId) => {
    uiState.scene = scene;
    if (scene === 'Minigames') {
      uiState.minigameMode = 'select';
    }
  };

  const handleCommand = (command: InputCommand) => {
    if (uiState.scene === 'Minigames' && uiState.minigameMode === 'playing') {
      minigameManager.handleInput(command);
      return;
    }

    switch (uiState.scene) {
      case 'Home':
        if (command === 'LEFT') {
          uiState.menuIndex = wrapIndex(uiState.menuIndex - 1, BOTTOM_MENU.length);
        } else if (command === 'RIGHT') {
          uiState.menuIndex = wrapIndex(uiState.menuIndex + 1, BOTTOM_MENU.length);
        } else if (command === 'ENTER') {
          openScene(BOTTOM_MENU[uiState.menuIndex].id);
        }
        break;
      case 'CareMenu':
        if (command === 'LEFT') {
          uiState.careIndex = wrapIndex(uiState.careIndex - 1, CARE_ACTIONS.length);
        } else if (command === 'RIGHT') {
          uiState.careIndex = wrapIndex(uiState.careIndex + 1, CARE_ACTIONS.length);
        } else if (command === 'ENTER') {
          const selected = CARE_ACTIONS[uiState.careIndex];
          executeAction(selected.type);
        } else if (command === 'BACK') {
          openScene('Home');
        }
        break;
      case 'Gifts':
        if (command === 'LEFT') {
          uiState.giftIndex = wrapIndex(uiState.giftIndex - 1, petState.unlockedGifts.length);
        } else if (command === 'RIGHT') {
          uiState.giftIndex = wrapIndex(uiState.giftIndex + 1, petState.unlockedGifts.length);
        } else if (command === 'BACK') {
          openScene('Home');
        }
        break;
      case 'Album':
        if (command === 'LEFT') {
          navigateAlbum(-1);
        } else if (command === 'RIGHT') {
          navigateAlbum(1);
        } else if (command === 'BACK') {
          openScene('Home');
        }
        break;
      case 'Settings':
        if (command === 'LEFT') {
          uiState.settingsIndex = wrapIndex(uiState.settingsIndex - 1, SETTINGS_ITEMS.length);
        } else if (command === 'RIGHT') {
          uiState.settingsIndex = wrapIndex(uiState.settingsIndex + 1, SETTINGS_ITEMS.length);
        } else if (command === 'ENTER') {
          toggleSetting(['mute', 'speed', 'pause', 'reducedMotion'][uiState.settingsIndex]);
        } else if (command === 'BACK') {
          openScene('Home');
        }
        break;
      case 'Minigames':
        if (uiState.minigameMode === 'select') {
          if (command === 'LEFT') {
            uiState.minigameIndex = wrapIndex(uiState.minigameIndex - 1, MINIGAMES.length);
          } else if (command === 'RIGHT') {
            uiState.minigameIndex = wrapIndex(uiState.minigameIndex + 1, MINIGAMES.length);
          } else if (command === 'ENTER') {
            const selected = MINIGAMES[uiState.minigameIndex];
            uiState.minigameMode = 'playing';
            minigameManager.switchScene(selected.scene);
          } else if (command === 'BACK') {
            openScene('Home');
          }
        }
        break;
      default:
        break;
    }
  };

  const unbindInput = bindInput(handleCommand);

  const beforeUnload = () => {
    saveState(petState);
  };
  window.addEventListener('beforeunload', beforeUnload);

  rafId = requestAnimationFrame(loop);

  return () => {
    unbindInput();
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
