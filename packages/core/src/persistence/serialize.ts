import type { PetState, InteractionCounts } from '../model/PetState';
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
    counts = data.counts;
  } else {
    console.log('Migrating save data: Calculating counts from history...');
    counts = calculateCountsFromHistory(data.history || []);
  }

  // Migración de unlockedForms (v1 -> v2)
  let unlockedForms: string[];
  if (Array.isArray(data.unlockedForms)) {
    unlockedForms = data.unlockedForms.filter(f => typeof f === 'string');
  } else {
    console.log('Migrating save data: Calculating unlocked forms from history...');
    unlockedForms = calculateUnlockedFormsFromHistory(data.history || []);
    // Asegurar que la especie actual esté incluida
    if (typeof data.state.species === 'string' && !unlockedForms.includes(data.state.species)) {
      unlockedForms.push(data.state.species);
    }
  }

  const fullHistory = (data.history || []).map((h) => ({
    type: (h as any).type ?? 'STAT_CHANGED',
    timestamp: h.tick,
    data: (h as any).data,
  }));

  const truncatedHistory = fullHistory.length > 50 ? fullHistory.slice(-50) : fullHistory;

  return {
    species: (typeof data.state.species === 'string' ? data.state.species : 'FLAN_BEBE') as any,
    stats: {
      hunger: Math.max(0, Math.min(100, data.state.stats.hunger ?? 50)),
      happiness: Math.max(0, Math.min(100, data.state.stats.happiness ?? 50)),
      energy: Math.max(0, Math.min(100, data.state.stats.energy ?? 50)),
      health: Math.max(0, Math.min(100, data.state.stats.health ?? 50)),
      affection: Math.max(0, Math.min(100, data.state.stats.affection ?? 50)),
    },
    alive: data.state.alive ?? true,
    totalTicks: data.totalTicks ?? 0,
    history: truncatedHistory,
    counts: counts,
    unlockedForms: unlockedForms,
    unlockedGifts: Array.isArray(data.unlockedGifts) ? data.unlockedGifts.filter(g => typeof g === 'string') : [],
    unlockedAchievements: Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements.filter(a => typeof a === 'string') : [],
    album: data.album ?? {},
    minigames: {
      lastPlayed: data.state.minigames?.lastPlayed ?? { pudding: -1000, memory: -1000 },
      games: data.state.minigames?.games ?? {
        pudding: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        memory: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
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
