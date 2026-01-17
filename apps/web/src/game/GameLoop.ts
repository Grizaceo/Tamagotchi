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
export async function startGameLoop(canvas: HTMLCanvasElement): Promise<() => void> {
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

  // --- Visual System Initialization ---
  const { AssetManager, SpriteRenderer } = await import('./renderer/SpriteRenderer');
  const { UIRenderer } = await import('./renderer/UIRenderer');
  const { SPRITE_CONFIGS } = await import('./renderer/SpriteConfigs'); // Dynamic import to avoid circular dep issues if any, or just cleaner

  const assetManager = new AssetManager();
  const uiRenderer = new UIRenderer(assetManager);

  // Pre-load assets
  try {
    await uiRenderer.load();
    for (const key in SPRITE_CONFIGS) {
      await assetManager.load(key, SPRITE_CONFIGS[key].src);
    }
  } catch (e) {
    console.error('Failed to load assets', e);
  }

  // SpriteRenderer instance (re-created when species changes or specific one reused)
  // We'll keep one and update config, or create a map. 
  // Simpler: Just create one based on current state and update it.
  let spriteRenderer: any = null; // typed as SpriteRenderer

  function updateSpriteRenderer(state: PetState) {
    const species = state.species;
    const config = SPRITE_CONFIGS[species] || SPRITE_CONFIGS['FLAN_BEBE']; // Fallback

    if (!spriteRenderer || spriteRenderer.assetKey !== species) {
      spriteRenderer = new SpriteRenderer(assetManager, species, config);
      // Scale sprite to fit on 320x240 canvas - 96px gives good visibility
      spriteRenderer.displaySize = 96;
      // Center sprite on screen (account for header ~20px and footer ~35px)
      spriteRenderer.x = (320 - spriteRenderer.displaySize) / 2;
      spriteRenderer.y = 20 + ((240 - 20 - 35 - spriteRenderer.displaySize) / 2); // Center in play area
    }

    // Update Animation State based on PetState
    // Priority: Sick > Sleep > Sad > Happy > Eat > Walk/Idle
    let anim = 'idle';
    if (!state.alive) anim = 'sick'; // Dead/Sick generic
    else if (state.stats.health < 30) anim = 'sick';
    else if (state.stats.happiness < 30) anim = 'sad';
    else if (state.stats.happiness > 80) anim = 'happy';

    // Check specific actions from history?
    // For now, state-based.
    // Ideally we listen to "ACtions" dispatched to trigger oneshot animations (eat).
    // But for this step, basic state loop.

    spriteRenderer.setAnimation(anim);
  }

  // petSprite was deprecated in favor of SpriteRenderer

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

    // Update Sprite System - always call updateSpriteRenderer to ensure it gets created
    updateSpriteRenderer(petState);
    if (spriteRenderer) {
      spriteRenderer.update(delta);
    }

    // Render Frame
    renderFrame(ctx, petState, uiState, now, {
      minigameFrame: uiState.scene === 'Minigames' && uiState.minigameMode === 'playing' ? minigameCanvas : null,
      petSprite: null, // Legacy
      spriteRenderer, // Pass new renderer
      uiRenderer,     // Pass new renderer
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
