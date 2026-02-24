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

const STORAGE_KEY = 'pompom-save-debug-v1'; // Force fresh save
const TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;

/**
 * Inicia el game loop principal con UI retro.
 * Maneja ticks, persistencia, input y minijuegos.
 */
export function startGameLoop(canvas: HTMLCanvasElement): () => void {
  console.log('[PomPom] Starting GameLoop with DEBUG key:', STORAGE_KEY);
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
  let isResetting = false;

  // --- Visual System Initialization ---
  let spriteRenderer: any = null; // typed as SpriteRenderer
  let assetManager: any;
  let SPRITE_CONFIGS: any;
  let uiRenderer: any = null;
  let SpriteRenderer: any;

  Promise.all([
    import('./renderer/SpriteRenderer'),
    import('./renderer/UIRenderer'),
    import('./renderer/SpriteConfigs'),
    import('./assets/PlaceholderIcons'),
  ]).then(([modSprite, modUI, modConfig, modIcons]) => {
    const { AssetManager, SpriteRenderer: SR } = modSprite;
    const { UIRenderer } = modUI;
    const { loadPlaceholders } = modIcons;
    SPRITE_CONFIGS = modConfig.SPRITE_CONFIGS;
    SpriteRenderer = SR;

    assetManager = new AssetManager();
    uiRenderer = new UIRenderer(assetManager);

    return uiRenderer.load().then(() => {
      // Load placeholder icons
      return loadPlaceholders(assetManager);
    }).then(() => {
      const promises = [];
      for (const key in SPRITE_CONFIGS) {
        promises.push(assetManager.load(key, SPRITE_CONFIGS[key].src));
      }
      return Promise.all(promises);
    }).then(() => {
      // Create the initial sprite renderer now that assets are loaded
      updateSpriteRenderer(petState);
    });
  }).catch((e) => {
    console.error('Failed to load assets', e);
  });

  function updateSpriteRenderer(state: PetState) {
    const species = state.species;
    const config = SPRITE_CONFIGS[species] || SPRITE_CONFIGS['FLAN_BEBE']; // Fallback

    console.log(`[PomPom Debug] updateSpriteRenderer: species=${species}, health=${state.stats.health}, alive=${state.alive}, usingConfigFor=${SPRITE_CONFIGS[species] ? species : 'FALLBACK(FLAN_BEBE)'}`);

    if (!spriteRenderer || spriteRenderer.assetKey !== species) {
      console.log(`[PomPom Debug] Creating new SpriteRenderer for ${species}`);
      spriteRenderer = new SpriteRenderer(assetManager, species, config);
      spriteRenderer.displaySize = 96; // Render at 96px on 320×240 canvas
      spriteRenderer.x = (320 - 96) / 2;
      spriteRenderer.y = (240 - 96) / 2 + 10; // A bit lower than center
    }

    // Update Animation State based on PetState
    // Priority: Dead > Sick > Sleep > Sad > Happy > Eat > Walk/Idle
    let anim = 'idle';
    if (!state.alive) anim = 'dead';
    else if (state.stats.health < 30) anim = 'sick';
    else if (state.stats.happiness < 30) anim = 'sad';
    else if (state.stats.happiness > 80) anim = 'happy';

    // Check specific actions from history?
    // For now, state-based.
    // Ideally we listen to "ACtions" dispatched to trigger oneshot animations (eat).
    // But for this step, basic state loop.

    spriteRenderer.setAnimation(anim);
  }



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

      let ticksToProcess = 0;
      while (accumulator >= TICK_MS) {
        ticksToProcess++;
        accumulator -= TICK_MS;
      }

      if (ticksToProcess > 0) {
        petState = tick(petState, ticksToProcess);
        petState = postProcessState(petState);
        pendingSave = true;
      }
    } else {
      accumulator = 0;
    }

    if (uiState.scene === 'Minigames' && uiState.minigameMode === 'playing') {
      minigameManager.update(delta);
      minigameManager.draw();
    }

    // Update Sprite System — create or update sprite renderer once assets are loaded
    if (SPRITE_CONFIGS && SpriteRenderer) {
      updateSpriteRenderer(petState);
      if (spriteRenderer) {
        spriteRenderer.update(delta);
      }
    }

    // Render Frame
    renderFrame(ctx, petState, uiState, now, {
      minigameFrame: uiState.scene === 'Minigames' && uiState.minigameMode === 'playing' ? minigameCanvas : null,
      spriteRenderer, // Pass new renderer
      uiRenderer: uiRenderer || undefined,     // Pass new renderer
      assetManager,
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
      case 'reset':
        if (!uiState.settingsConfirmation) {
          uiState.settingsConfirmation = true;
          return; // Wait for confirmation
        }
        // Confirmed
        console.log('[PomPom] RESET CONFIRMED. Wiping data...');
        isResetting = true; // Prevent auto-save on unload
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
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
        if (uiState.settingsConfirmation) {
          if (command === 'ENTER') {
            toggleSetting('reset'); // Confirm reset
          } else if (command === 'BACK' || command === 'LEFT' || command === 'RIGHT') {
            uiState.settingsConfirmation = false; // Cancel
          }
        } else {
          if (command === 'LEFT') {
            uiState.settingsIndex = wrapIndex(uiState.settingsIndex - 1, SETTINGS_ITEMS.length);
          } else if (command === 'RIGHT') {
            uiState.settingsIndex = wrapIndex(uiState.settingsIndex + 1, SETTINGS_ITEMS.length);
          } else if (command === 'ENTER') {
            toggleSetting(SETTINGS_ITEMS[uiState.settingsIndex].id);
          } else if (command === 'BACK') {
            openScene('Home');
          }
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
    if (!isResetting) {
      saveState(petState);
    }
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
  // Support ?reset in URL to force-clear saved data (DEV ONLY)
  if (import.meta.env.DEV && window.location.search.includes('reset')) {
    console.log('[PomPom] Force reset via ?reset param — clearing save data');
    localStorage.removeItem(STORAGE_KEY);
    // Clean up the URL to prevent re-triggering on refresh
    window.history.replaceState({}, '', window.location.pathname);
    const fresh = createInitialPetState();
    // Defensive coding: Force species to be FLAN_BEBE just in case
    fresh.species = 'FLAN_BEBE';
    console.log('[PomPom] Fresh state:', fresh.species, 'health:', fresh.stats.health, 'alive:', fresh.alive);
    return fresh;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = createInitialPetState();
    // Defensive coding: Force species to be FLAN_BEBE just in case
    fresh.species = 'FLAN_BEBE';
    console.log('[PomPom] No save found, starting fresh:', fresh.species, 'health:', fresh.stats.health);
    return fresh;
  }
  let loaded = deserializeFromJSON(raw);
  console.log('[PomPom] Loaded save:', loaded.species, 'health:', loaded.stats.health, 'alive:', loaded.alive, 'ticks:', loaded.totalTicks);

  // ── Welcome-back recovery ──
  // When the player returns after being offline, apply a gentle recovery
  // so the pet isn't permanently stuck in a sick/dying state.
  loaded = applyWelcomeBackRecovery(loaded);

  return loaded;
}

/**
 * Aplica recuperación de "bienvenida" al cargar el estado guardado.
 * Si la mascota estaba descuidada (hambre alta, salud baja), se recupera
 * parcialmente para que el jugador no la encuentre siempre enferma.
 * Simula que la mascota "descansó" mientras el jugador no estaba.
 */
function applyWelcomeBackRecovery(state: PetState): PetState {
  // Si la mascota murió por descuido, revivirla con stats bajos pero viables
  if (!state.alive) {
    console.log('[PomPom] Pet was dead — reviving with low but viable stats');
    state = structuredClone(state);
    state.alive = true;
    state.stats.health = 100;
    state.stats.hunger = 40;   // somewhat hungry but not critical
    state.stats.happiness = 30;
    state.stats.energy = 50;
    return state;
  }

  const needsRecovery =
    state.stats.health < 40 ||
    state.stats.hunger > 70 ||
    state.stats.happiness < 20;

  if (!needsRecovery) {
    return state;
  }

  console.log('[PomPom] Applying welcome-back recovery — pet was in bad shape');
  state = structuredClone(state);

  // Reduce hunger (the pet "rested" and digested while offline)
  if (state.stats.hunger > 40) {
    state.stats.hunger = Math.max(40, state.stats.hunger - 30);
  }

  // Recover health partially - bump to 50 to avoid immediate sick loop
  if (state.stats.health < 50) {
    state.stats.health = Math.min(100, Math.max(80, state.stats.health + 40));
  }

  // Bump happiness a bit
  if (state.stats.happiness < 30) {
    state.stats.happiness = Math.min(100, state.stats.happiness + 30);
  }

  // Recover energy
  if (state.stats.energy < 30) {
    state.stats.energy = Math.min(100, state.stats.energy + 30);
  }

  console.log('[PomPom] After recovery — health:', state.stats.health,
    'hunger:', state.stats.hunger, 'happiness:', state.stats.happiness);

  return state;
}

function saveState(state: PetState): void {
  localStorage.setItem(STORAGE_KEY, serializeToJSON(state));
}
