import { PetState, createInitialPetState } from '../model/PetState';
import { SaveData, SAVE_DATA_VERSION } from '../model/SaveData';

/**
 * Convierte PetState a SaveData para persistencia
 */
export function serialize(state: PetState): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    createdAt: Date.now(),
    lastSaved: Date.now(),
    totalTicks: state.totalTicks,
    state: {
      species: state.species,
      stats: {
        hunger: state.stats.hunger,
        happiness: state.stats.happiness,
        energy: state.stats.energy,
        health: state.stats.health,
        affection: state.stats.affection,
      },
      alive: state.alive,
      minigames: {
        lastPlayed: {}, // TODO: populate from minigame tracking
      },
    },
    history: state.history.map((event, idx) => ({
      tick: event.timestamp,
      statChanges: event.data as Record<string, number> | undefined,
    })),
    unlockedGifts: state.unlockedGifts,
    unlockedAchievements: state.unlockedAchievements,
    album: state.album,
    settings: {
      difficulty: state.settings.difficulty,
      soundEnabled: state.settings.soundEnabled,
      animationsEnabled: state.settings.animationsEnabled,
      reducedMotion: state.settings.reducedMotion,
      speed: state.settings.speed,
      paused: state.settings.paused,
    },
  };
}

/**
 * Convierte SaveData a PetState
 * Maneja versionado para migrar datos de versiones antiguas si es necesario
 */
export function deserialize(data: SaveData): PetState {
  // Validar versión
  if (data.version !== SAVE_DATA_VERSION) {
    console.warn(
      `SaveData version mismatch: got ${data.version}, expected ${SAVE_DATA_VERSION}. Applying migrations...`
    );
    return migrateFromOlderVersion(data);
  }

  // Validar que el estado sea válido
  if (!data.state || data.state.stats == null) {
    console.warn('SaveData corrupted, returning initial state');
    return createInitialPetState();
  }

  return {
    species: (data.state.species as 'FLAN_BEBE' | 'FLAN_TEEN' | 'FLAN_ADULT' | 'POMPOMPURIN' | 'MUFFIN' | 'BAGEL' | 'SCONE') || 'FLAN_BEBE',
    stats: {
      hunger: Math.max(0, Math.min(100, data.state.stats.hunger ?? 50)),
      happiness: Math.max(0, Math.min(100, data.state.stats.happiness ?? 50)),
      energy: Math.max(0, Math.min(100, data.state.stats.energy ?? 50)),
      health: Math.max(0, Math.min(100, data.state.stats.health ?? 50)),
      affection: Math.max(0, Math.min(100, data.state.stats.affection ?? 50)),
    },
    alive: data.state.alive ?? true,
    totalTicks: data.totalTicks ?? 0,
    history: data.history.map((h, idx) => ({
      type: 'STAT_CHANGED',
      timestamp: h.tick,
      data: h.statChanges,
    })),
    unlockedGifts: data.unlockedGifts ?? [],
    unlockedAchievements: data.unlockedAchievements ?? [],
    album: data.album ?? {},
    settings: {
      difficulty: data.settings.difficulty ?? 'normal',
      soundEnabled: data.settings.soundEnabled ?? true,
      animationsEnabled: data.settings.animationsEnabled ?? true,
      reducedMotion: data.settings.reducedMotion ?? false,
      speed: data.settings.speed === '2x' ? '2x' : '1x',
      paused: data.settings.paused ?? false,
    },
  };
}

/**
 * Maneja migración de versiones antiguas
 */
function migrateFromOlderVersion(data: SaveData): PetState {
  // Por ahora, solo hay v1. Si llega una versión mayor o menor, usa default.
  console.warn('No migration path for SaveData version', data.version);
  return createInitialPetState();
}

/**
 * Serializa PetState a JSON string
 */
export function serializeToJSON(state: PetState): string {
  return JSON.stringify(serialize(state));
}

/**
 * Deserializa PetState desde JSON string
 */
export function deserializeFromJSON(json: string): PetState {
  try {
    const data = JSON.parse(json) as SaveData;
    return deserialize(data);
  } catch (error) {
    console.error('Failed to deserialize SaveData:', error);
    return createInitialPetState();
  }
}
