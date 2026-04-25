import {
  createAction,
  createInitialPetStateFor,
  deserializeFromJSON,
  postProcessState,
  reduce,
  serializeToJSON,
  tick,
  type PetState,
  type PetLine,
} from '@pompom/core';
import { bindInput, type InputCommand } from './Input';
import { renderFrame } from './Render';
import { SceneManager } from './SceneManager';
import { MemoryGame } from './scenes/MemoryGame';
import { PuddingGame } from './scenes/PuddingGame';
import { SnakeGame } from './scenes/SnakeGame';
import { TetrisGame } from './scenes/TetrisGame';
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
import {
  CURRENT_STORAGE_KEY,
  getStorageLookupKeys,
  shouldForceReset,
} from './runtimeConfig';
import { createAudioEngine } from '../audio/AudioEngine';
import { createAmbientEngine } from '../audio/AmbientEngine';

const TICK_MS = 1000;
const SAVE_INTERVAL_MS = 5000;

/**
 * Inicia el game loop principal con UI retro.
 * Maneja ticks, persistencia, input y minijuegos.
 */
export function startGameLoop(canvas: HTMLCanvasElement, petLinePreference?: PetLine): () => void {
  console.log('[PomPom] Starting GameLoop with storage key:', CURRENT_STORAGE_KEY);
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
  minigameManager.registerScene('snake-game', SnakeGame);
  minigameManager.registerScene('tetris-game', TetrisGame);

  let petState = loadState(petLinePreference);
  let uiState = createInitialUiState();
  let lastTime = performance.now();
  let accumulator = 0;
  let lastSaveAt = 0;
  let pendingSave = false;
  let rafId = 0;
  let isResetting = false;

  // Oneshot action animations: prioridad sobre estado pasivo durante 1.5 segundos
  const ACTION_ANIM_DURATION_MS = 1500;
  const ACTION_TO_ANIM: Record<string, string> = {
    FEED: 'eat',
    PLAY: 'happy',
    REST: 'sleep',
    MEDICATE: 'happy',
    PET: 'happy',
  };
  let lastActionAnim: string | null = null;
  let lastActionAnimAt = 0;

  // --- Audio Engine ---
  const audio = createAudioEngine();
  audio.setEnabled(petState.settings.soundEnabled);
  audio.setReducedMotion(petState.settings.reducedMotion);

  // --- Ambient Music Engine ---
  const ambient = createAmbientEngine();
  ambient.setEnabled(petState.settings.soundEnabled);
  ambient.setReducedMotion(petState.settings.reducedMotion);

  // Estado previo para detectar transiciones críticas (muerte, alertas, evolución)
  let prevAlive = petState.alive;
  let prevHealth = petState.stats.health;
  let prevHunger = petState.stats.hunger;
  let prevSpecies = petState.species;

  // Iniciar música ambiental si empezamos en Home con pet vivo
  if (uiState.scene === 'Home' && petState.alive) {
    ambient.start();
  }

  // --- Visual System Initialization ---
  let spriteRenderer: any = null; // typed as SpriteRenderer
  let assetManager: any;
  let SPRITE_CONFIGS: any;
  let uiRenderer: any = null;
  let SpriteRenderer: any;
  let assetsReady = false;

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
      return Promise.allSettled(promises).then((results) => {
        let loaded = 0;
        for (const r of results) {
          if (r.status === 'rejected') console.warn('[PomPom] Sprite failed to load:', r.reason);
          else loaded++;
        }
        console.log(`[PomPom] Sprites: ${loaded}/${results.length} loaded`);
      });
    }).then(() => {
      // Mark assets ready and create initial sprite renderer
      assetsReady = true;
      updateSpriteRenderer(petState);
    });
  }).catch((e) => {
    console.error('Failed to load assets', e);
  });

  function updateSpriteRenderer(state: PetState) {
    const species = state.species;
    const config = SPRITE_CONFIGS[species] || SPRITE_CONFIGS['FLAN_BEBE']; // Fallback

    if (!spriteRenderer || spriteRenderer.assetKey !== species) {
      spriteRenderer = new SpriteRenderer(assetManager, species, config);
      spriteRenderer.displaySize = 128; // 1:1 with gridSize — no fractional scaling
      spriteRenderer.x = (320 - 128) / 2;
      // Center sprite in the area below the stats bar (stats end at y≈78, display bottom y≈220)
      spriteRenderer.y = Math.round((78 + 220 - 128) / 2); // = 85
    }

    // Update Animation State based on PetState
    // Priority: Dead > Sick > Action oneshot > Sad > Happy > Idle
    let anim = 'idle';
    if (!state.alive) {
      anim = 'dead';
    } else if (state.stats.health < 30) {
      anim = 'sick';
    } else if (lastActionAnim && performance.now() - lastActionAnimAt < ACTION_ANIM_DURATION_MS) {
      anim = lastActionAnim;
    } else if (state.stats.happiness < 30) {
      anim = 'sad';
    } else if (state.stats.happiness > 80) {
      anim = 'happy';
    }

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
    if (result.result === 'win') {
      audio.play('win');
    }
  });

  let fadeAlpha = 0;

  const loop = (now: number) => {
    const delta = now - lastTime;
    lastTime = now;

    if (fadeAlpha > 0) {
      fadeAlpha = Math.max(0, fadeAlpha - delta / 130);
    }

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

    // Update Sprite System — only once assets are fully loaded
    if (assetsReady) {
      updateSpriteRenderer(petState);
      if (spriteRenderer) {
        spriteRenderer.update(delta);
      }
    }

    // Detectar transiciones críticas: muerte, alertas, evolución
    if (prevAlive && !petState.alive) {
      audio.play('die');
    }
    if (petState.alive && petState.stats.health < 20 && prevHealth >= 20) {
      audio.play('alert');
    }
    if (petState.alive && petState.stats.hunger > 90 && prevHunger <= 90) {
      audio.play('alert');
    }
    if (petState.species !== prevSpecies) {
      audio.play('evolve');
    }
    prevAlive = petState.alive;
    prevHealth = petState.stats.health;
    prevHunger = petState.stats.hunger;
    prevSpecies = petState.species;

    // --- Ambient mood detection ---
    const isCritical = petState.stats.health < 20 || petState.stats.hunger > 90;
    ambient.setMood(isCritical ? 'critical' : 'home');

    // Render Frame
    renderFrame(ctx, petState, uiState, now, {
      minigameFrame: uiState.scene === 'Minigames' && uiState.minigameMode === 'playing' ? minigameCanvas : null,
      spriteRenderer, // Pass new renderer
      uiRenderer: uiRenderer || undefined,     // Pass new renderer
      assetManager,
      fadeAlpha,
    });

    if (pendingSave && now - lastSaveAt > SAVE_INTERVAL_MS) {
      saveState(petState);
      lastSaveAt = now;
      pendingSave = false;
    }

    rafId = requestAnimationFrame(loop);
  };

  const executeAction = (type: (typeof CARE_ACTIONS)[number]['type'], soundType: (typeof CARE_ACTIONS)[number]['sound']) => {
    const action = createAction(type, petState.totalTicks);
    petState = reduce(petState, action);
    petState = postProcessState(petState);
    pendingSave = true;
    audio.play(soundType);
    lastActionAnim = ACTION_TO_ANIM[type] ?? null;
    lastActionAnimAt = performance.now();
  };

  const toggleSetting = (id: string) => {
    const settings = petState.settings;
    switch (id) {
      case 'mute':
        petState = { ...petState, settings: { ...settings, soundEnabled: !settings.soundEnabled } };
        audio.setEnabled(petState.settings.soundEnabled);
        ambient.setEnabled(petState.settings.soundEnabled);
        break;
      case 'speed':
        petState = { ...petState, settings: { ...settings, speed: settings.speed === '1x' ? '2x' : '1x' } };
        break;
      case 'pause':
        petState = { ...petState, settings: { ...settings, paused: !settings.paused } };
        break;
      case 'reducedMotion':
        petState = { ...petState, settings: { ...settings, reducedMotion: !settings.reducedMotion } };
        audio.setReducedMotion(petState.settings.reducedMotion);
        ambient.setReducedMotion(petState.settings.reducedMotion);
        break;
      case 'reset':
        if (!uiState.settingsConfirmation) {
          uiState.settingsConfirmation = true;
          return; // Wait for confirmation
        }
        // Confirmed
        console.log('[PomPom] RESET CONFIRMED. Wiping data...');
        isResetting = true; // Prevent auto-save on unload
        for (const key of getStorageLookupKeys()) {
          localStorage.removeItem(key);
        }
        localStorage.removeItem('pompom-pet-line');
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
    fadeAlpha = 1;
    uiState.scene = scene;
    if (scene === 'Minigames') {
      uiState.minigameMode = 'select';
    }
    // Ambient music: solo en Home cuando el pet está vivo
    if (scene === 'Home' && petState.alive) {
      ambient.start();
    } else {
      ambient.stop();
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
          audio.play('ui');
        } else if (command === 'RIGHT') {
          uiState.menuIndex = wrapIndex(uiState.menuIndex + 1, BOTTOM_MENU.length);
          audio.play('ui');
        } else if (command === 'ENTER') {
          openScene(BOTTOM_MENU[uiState.menuIndex].id);
        }
        break;
      case 'CareMenu':
        if (command === 'LEFT') {
          uiState.careIndex = wrapIndex(uiState.careIndex - 1, CARE_ACTIONS.length);
          audio.play('ui');
        } else if (command === 'RIGHT') {
          uiState.careIndex = wrapIndex(uiState.careIndex + 1, CARE_ACTIONS.length);
          audio.play('ui');
        } else if (command === 'ENTER') {
          const selected = CARE_ACTIONS[uiState.careIndex];
          executeAction(selected.type, selected.sound);
        } else if (command === 'BACK') {
          audio.play('ui');
          openScene('Home');
        }
        break;
      case 'Gifts':
        if (command === 'LEFT') {
          uiState.giftIndex = wrapIndex(uiState.giftIndex - 1, petState.unlockedGifts.length);
          audio.play('ui');
        } else if (command === 'RIGHT') {
          uiState.giftIndex = wrapIndex(uiState.giftIndex + 1, petState.unlockedGifts.length);
          audio.play('ui');
        } else if (command === 'BACK') {
          audio.play('ui');
          openScene('Home');
        }
        break;
      case 'Album':
        if (command === 'LEFT') {
          navigateAlbum(-1);
          audio.play('ui');
        } else if (command === 'RIGHT') {
          navigateAlbum(1);
          audio.play('ui');
        } else if (command === 'BACK') {
          audio.play('ui');
          openScene('Home');
        }
        break;
      case 'Settings':
        if (uiState.settingsConfirmation) {
          if (command === 'ENTER') {
            toggleSetting('reset'); // Confirm reset
          } else if (command === 'BACK' || command === 'LEFT' || command === 'RIGHT') {
            uiState.settingsConfirmation = false; // Cancel
            audio.play('ui');
          }
        } else {
          if (command === 'LEFT') {
            uiState.settingsIndex = wrapIndex(uiState.settingsIndex - 1, SETTINGS_ITEMS.length);
            audio.play('ui');
          } else if (command === 'RIGHT') {
            uiState.settingsIndex = wrapIndex(uiState.settingsIndex + 1, SETTINGS_ITEMS.length);
            audio.play('ui');
          } else if (command === 'ENTER') {
            toggleSetting(SETTINGS_ITEMS[uiState.settingsIndex].id);
          } else if (command === 'BACK') {
            audio.play('ui');
            openScene('Home');
          }
        }
        break;
      case 'Minigames':
        if (uiState.minigameMode === 'select') {
          if (command === 'LEFT') {
            uiState.minigameIndex = wrapIndex(uiState.minigameIndex - 1, MINIGAMES.length);
            audio.play('ui');
          } else if (command === 'RIGHT') {
            uiState.minigameIndex = wrapIndex(uiState.minigameIndex + 1, MINIGAMES.length);
            audio.play('ui');
          } else if (command === 'ENTER') {
            const selected = MINIGAMES[uiState.minigameIndex];
            uiState.minigameMode = 'playing';
            const gameId = selected.id as keyof typeof petState.minigames.games;
            const gameStats = petState.minigames.games[gameId];
            minigameManager.setExtra({ bestScore: gameStats?.bestScore ?? 0, ...(selected.extra ?? {}) });
            minigameManager.switchScene(selected.scene);
          } else if (command === 'BACK') {
            audio.play('ui');
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

  // ── Visibilidad: protección contra suspend/resume del navegador ──
  // Cuando el SO apaga la pantalla o suspende la pestaña, requestAnimationFrame
  // se detiene. Al volver, el siguiente frame tiene un delta gigante (= tiempo
  // que el dispositivo estuvo suspendido) que procesaría ticks sin el límite
  // de salud offline. Este handler lo previene.
  let hiddenAt = 0;
  const onVisibilityChange = () => {
    if (document.hidden) {
      // Guardar inmediatamente para que lastSaved sea preciso
      if (!isResetting) {
        saveState(petState);
        lastSaveAt = performance.now();
      }
      hiddenAt = Date.now();
    } else {
      // Resetear lastTime para que el siguiente frame no tenga un delta enorme
      lastTime = performance.now();

      // Aplicar ticks offline con 25% y health floor, igual que en loadState
      if (hiddenAt > 0 && petState.alive && !petState.settings.paused) {
        const diffSeconds = Math.floor((Date.now() - hiddenAt) / 1000);
        if (diffSeconds > 30) {
          const realSeconds = Math.min(diffSeconds, 12 * 3600);
          const effectiveTicks = Math.round(realSeconds * 0.25);
          console.log(`[PomPom] Resume after ${realSeconds}s → applying ${effectiveTicks} offline ticks`);
          petState = tick(petState, effectiveTicks);
          if (!petState.alive) {
            petState = { ...petState, alive: true };
            petState.stats = { ...petState.stats, health: 5 };
            console.log('[PomPom] Visibility resume: offline health floor applied');
          }
          petState = postProcessState(petState);
          petState = applyWelcomeBackRecovery(petState);
          pendingSave = true;
        }
      }
      hiddenAt = 0;
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  rafId = requestAnimationFrame(loop);

  return () => {
    unbindInput();
    window.removeEventListener('beforeunload', beforeUnload);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    cancelAnimationFrame(rafId);
    ambient.stop();
  };
}

function loadState(petLinePreference?: PetLine): PetState {
  // Support ?reset in URL to force-clear saved data
  if (shouldForceReset(window.location.search)) {
    console.log('[PomPom] Force reset via ?reset param — clearing save data');
    for (const key of getStorageLookupKeys()) {
      localStorage.removeItem(key);
    }
    // Clean up the URL to prevent re-triggering on refresh
    window.history.replaceState({}, '', window.location.pathname);
    const fresh = createInitialPetStateFor(petLinePreference ?? 'flan');
    console.log('[PomPom] Fresh state:', fresh.species, 'health:', fresh.stats.health, 'alive:', fresh.alive);
    return fresh;
  }

  const raw = loadRawSave();
  if (!raw) {
    const fresh = createInitialPetStateFor(petLinePreference ?? 'flan');
    console.log('[PomPom] No save found, starting fresh:', fresh.species, 'health:', fresh.stats.health);
    return fresh;
  }

  // Extract lastSaved to calculate offline time
  let lastSaved: number | undefined;
  try {
    const parsed = JSON.parse(raw);
    lastSaved = parsed.lastSaved;
  } catch (e) {
    console.warn('[PomPom] Failed to parse lastSaved from raw save');
  }

  let loaded = deserializeFromJSON(raw);
  console.log('[PomPom] Loaded save:', loaded.species, 'health:', loaded.stats.health, 'alive:', loaded.alive, 'ticks:', loaded.totalTicks);

  // ── Catch-up Offline Ticks ──
  // B: apply only 25% of real elapsed time — 8h offline ≈ 2h of degradation.
  // C: pet cannot die from offline ticks alone (health floor = 5).
  if (lastSaved && !loaded.settings.paused && loaded.alive) {
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastSaved) / 1000);

    if (diffSeconds > 30) {
      const maxOfflineSeconds = 12 * 3600;
      const realSeconds = Math.min(diffSeconds, maxOfflineSeconds);
      const effectiveTicks = Math.round(realSeconds * 0.25); // B: 25% rate

      console.log(`[PomPom] Offline ${realSeconds}s → applying ${effectiveTicks} effective ticks (25%)`);
      loaded = tick(loaded, effectiveTicks);

      // C: health floor — pet can't die while offline, only in real-time
      if (!loaded.alive) {
        loaded = { ...loaded, alive: true };
        loaded.stats = { ...loaded.stats, health: 5 };
        console.log('[PomPom] Offline health floor applied — pet critical but alive');
      }

      loaded = postProcessState(loaded);
    }
  }

  // ── Welcome-back recovery (Less aggressive) ──
  // Only apply if the pet is alive but in very bad shape
  loaded = applyWelcomeBackRecovery(loaded);

  return loaded;
}

/**
 * Aplica una recuperación leve al volver tras mucho tiempo,
 * pero SIN revivir automáticamente ni borrar todo rastro de degradación.
 */
function applyWelcomeBackRecovery(state: PetState): PetState {
  // Si está muerto, se queda muerto. El jugador debe ver el Game Over.
  if (!state.alive) {
    return state;
  }

  // Solo aplicar si los stats están en niveles críticos
  const isCritical =
    state.stats.health < 20 ||
    state.stats.hunger > 90 ||
    state.stats.happiness < 10;

  if (!isCritical) {
    return state;
  }

  console.log('[PomPom] Applying mild welcome-back recovery for critical state');
  state = structuredClone(state);

  // Recovery is now very slight, just enough to give a chance to react
  if (state.stats.health < 30) state.stats.health = 30;
  if (state.stats.hunger > 85) state.stats.hunger = 85;

  return state;
}

function saveState(state: PetState): void {
  const serialized = serializeToJSON(state);
  localStorage.setItem(CURRENT_STORAGE_KEY, serialized);
  for (const key of getStorageLookupKeys()) {
    if (key !== CURRENT_STORAGE_KEY) {
      localStorage.removeItem(key);
    }
  }
}

function loadRawSave(): string | null {
  for (const key of getStorageLookupKeys()) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      if (key !== CURRENT_STORAGE_KEY) {
        localStorage.setItem(CURRENT_STORAGE_KEY, raw);
      }
      return raw;
    }
  }
  return null;
}
