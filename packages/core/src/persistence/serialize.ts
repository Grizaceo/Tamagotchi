import type { PetState, InteractionCounts, MinigameStats } from '../model/PetState';
import type { SaveData } from '../model/SaveData';
import { SAVE_DATA_VERSION } from '../model/SaveData';
import { createInitialPetState } from '../model/PetState';

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
        lastPlayed: state.minigames.lastPlayed,
        games: state.minigames.games,
      },
    },
    history: state.history.map((event) => ({
      type: event.type,
      tick: event.timestamp,
      data: event.data as Record<string, unknown> | undefined,
    })),
    counts: state.counts,
    unlockedForms: state.unlockedForms, // Nuevo en v2
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

function sanitizeNonNegativeNumber(value: any, fallback: number = 0): number {
  if (typeof value !== 'number' || isNaN(value)) return fallback;
  return Math.max(0, value);
}

function sanitizeStringArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string');
}

/**
 * Convierte SaveData a PetState
 */
export function deserialize(data: SaveData): PetState {
  if (!data || !data.state || data.state.stats == null) {
    console.warn('SaveData corrupted, returning initial state');
    return createInitialPetState();
  }

  // Migración de counts (v1 -> v2)
  let counts: InteractionCounts;
  if (data.counts) {
    counts = {
      totalActions: sanitizeNonNegativeNumber(data.counts.totalActions),
      feed: sanitizeNonNegativeNumber(data.counts.feed),
      play: sanitizeNonNegativeNumber(data.counts.play),
      rest: sanitizeNonNegativeNumber(data.counts.rest),
      medicate: sanitizeNonNegativeNumber(data.counts.medicate),
      pet: sanitizeNonNegativeNumber(data.counts.pet),
    };
  } else {
    console.log('Migrating save data: Calculating counts from history...');
    counts = calculateCountsFromHistory(data.history || []);
  }

  // Migración de unlockedForms (v1 -> v2)
  let unlockedForms: string[];
  if (data.unlockedForms) {
    unlockedForms = sanitizeStringArray(data.unlockedForms);
  } else {
    console.log('Migrating save data: Calculating unlocked forms from history...');
    unlockedForms = calculateUnlockedFormsFromHistory(data.history || []);
    // Asegurar que la especie actual esté incluida
    if (data.state.species && !unlockedForms.includes(data.state.species)) {
      unlockedForms.push(data.state.species);
    }
  }

  const fullHistory = (data.history || []).map((h) => ({
    type: (h as any).type ?? 'STAT_CHANGED',
    timestamp: h.tick,
    data: (h as any).data,
  }));

  const truncatedHistory = fullHistory.length > 50 ? fullHistory.slice(-50) : fullHistory;

  const sanitizeMinigameStats = (stats: any): MinigameStats => ({
    lastPlayed: typeof stats?.lastPlayed === 'number' ? stats.lastPlayed : 0, // Allow negative? usually lastPlayed is timestamp. 0 is fine.
    bestScore: sanitizeNonNegativeNumber(stats?.bestScore),
    totalPlayed: sanitizeNonNegativeNumber(stats?.totalPlayed),
    totalWins: sanitizeNonNegativeNumber(stats?.totalWins),
    totalPerfect: sanitizeNonNegativeNumber(stats?.totalPerfect),
  });

  return {
    species: (data.state.species as any) || 'FLAN_BEBE',
    stats: {
      hunger: Math.max(0, Math.min(100, data.state.stats.hunger ?? 50)),
      happiness: Math.max(0, Math.min(100, data.state.stats.happiness ?? 50)),
      energy: Math.max(0, Math.min(100, data.state.stats.energy ?? 50)),
      health: Math.max(0, Math.min(100, data.state.stats.health ?? 50)),
      affection: Math.max(0, Math.min(100, data.state.stats.affection ?? 50)),
    },
    alive: data.state.alive ?? true,
    totalTicks: sanitizeNonNegativeNumber(data.totalTicks),
    history: truncatedHistory,
    counts: counts,
    unlockedForms: unlockedForms,
    unlockedGifts: sanitizeStringArray(data.unlockedGifts),
    unlockedAchievements: sanitizeStringArray(data.unlockedAchievements),
    album: data.album ?? {},
    minigames: {
      lastPlayed: {
        pudding: typeof data.state.minigames?.lastPlayed?.pudding === 'number' ? data.state.minigames.lastPlayed.pudding : -1000,
        memory: typeof data.state.minigames?.lastPlayed?.memory === 'number' ? data.state.minigames.lastPlayed.memory : -1000,
      },
      games: {
        pudding: sanitizeMinigameStats(data.state.minigames?.games?.pudding),
        memory: sanitizeMinigameStats(data.state.minigames?.games?.memory),
      },
    },
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

function calculateCountsFromHistory(history: any[]): InteractionCounts {
  const counts: InteractionCounts = {
    totalActions: 0,
    feed: 0,
    play: 0,
    rest: 0,
    medicate: 0,
    pet: 0,
  };

  for (const event of history) {
    if (event.data && typeof event.data.action === 'string') {
      const action = event.data.action;
      if (action === 'FEED') counts.feed++;
      if (action === 'PLAY') counts.play++;
      if (action === 'REST') counts.rest++;
      if (action === 'MEDICATE') counts.medicate++;
      if (action === 'PET') counts.pet++;

      if (['FEED', 'PLAY', 'REST', 'MEDICATE', 'PET'].includes(action)) {
        counts.totalActions++;
      }
    }
  }

  return counts;
}

function calculateUnlockedFormsFromHistory(history: any[]): string[] {
  const forms = new Set<string>();
  forms.add('FLAN_BEBE');

  for (const event of history) {
    if (event.type === 'EVOLVED' && event.data && typeof event.data.to === 'string') {
      forms.add(event.data.to);
    }
  }
  return Array.from(forms);
}

export function serializeToJSON(state: PetState): string {
  return JSON.stringify(serialize(state));
}

export function deserializeFromJSON(json: string): PetState {
  try {
    const data = JSON.parse(json) as SaveData;
    return deserialize(data);
  } catch (error) {
    console.error('Failed to deserialize SaveData:', error);
    return createInitialPetState();
  }
}
