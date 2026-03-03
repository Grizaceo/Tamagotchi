import type { PetState, InteractionCounts } from '../model/PetState';
import type { SaveData } from '../model/SaveData';
import { SAVE_DATA_VERSION } from '../model/SaveData';
import { createInitialPetState, getBaseSpeciesForLine, type PetLine } from '../model/PetState';

export function serialize(state: PetState): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    createdAt: Date.now(),
    lastSaved: Date.now(),
    totalTicks: state.totalTicks,
    state: {
      petLine: state.petLine,
      species: state.species,
      stats: { ...state.stats },
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
    unlockedForms: state.unlockedForms,
    unlockedGifts: state.unlockedGifts,
    unlockedAchievements: state.unlockedAchievements,
    album: state.album,
    settings: { ...state.settings },
  };
}

export function deserialize(data: SaveData): PetState {
  if (!data || !data.state || data.state.stats == null) {
    console.warn('SaveData corrupted, returning initial state');
    return createInitialPetState();
  }

  const petLine = normalizePetLine(data.state.petLine);
  const settings = data.settings ?? {};

  // Counts migration
  const counts: InteractionCounts = data.counts ?? calculateCountsFromHistory(data.history || []);

  // Unlocked forms migration
  let unlockedForms: string[];
  if (data.unlockedForms) {
    unlockedForms = data.unlockedForms;
  } else {
    const base = getBaseSpeciesForLine(petLine);
    unlockedForms = calculateUnlockedFormsFromHistory(data.history || [], base);
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

  return {
    petLine,
    species: (data.state.species as any) || getBaseSpeciesForLine(petLine),
    stats: {
      hunger: clamp01(data.state.stats.hunger),
      happiness: clamp01(data.state.stats.happiness),
      energy: clamp01(data.state.stats.energy),
      health: clamp01(data.state.stats.health),
      affection: clamp01(data.state.stats.affection),
    },
    alive: data.state.alive ?? true,
    totalTicks: data.totalTicks ?? 0,
    history: truncatedHistory,
    counts,
    unlockedForms,
    unlockedGifts: data.unlockedGifts ?? [],
    unlockedAchievements: data.unlockedAchievements ?? [],
    album: data.album ?? {},
    minigames: {
      lastPlayed: {
        pudding: data.state.minigames?.lastPlayed?.pudding ?? -1000,
        memory: data.state.minigames?.lastPlayed?.memory ?? -1000,
        snake: (data.state.minigames?.lastPlayed as any)?.snake ?? -1000,
      },
      games: {
        pudding: data.state.minigames?.games?.pudding ?? { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        memory: data.state.minigames?.games?.memory ?? { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        snake: (data.state.minigames?.games as any)?.snake ?? { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
      },
    },
    settings: {
      difficulty: (settings as any).difficulty ?? 'normal',
      soundEnabled: (settings as any).soundEnabled ?? true,
      animationsEnabled: (settings as any).animationsEnabled ?? true,
      reducedMotion: (settings as any).reducedMotion ?? false,
      speed: (settings as any).speed === '2x' ? '2x' : '1x',
      paused: (settings as any).paused ?? false,
    },
  };
}

function clamp01(value: number | undefined): number {
  const v = value ?? 50;
  return Math.max(0, Math.min(100, v));
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

function calculateUnlockedFormsFromHistory(history: any[], baseSpecies: string): string[] {
  const forms = new Set<string>();
  forms.add(baseSpecies);
  for (const event of history) {
    if (event.type === 'EVOLVED' && event.data && typeof event.data.to === 'string') {
      forms.add(event.data.to);
    }
  }
  return Array.from(forms);
}

function normalizePetLine(petLine: unknown): PetLine {
  if (petLine === 'seal' || petLine === 'fiu' || petLine === 'salchicha') {
    return petLine;
  }
  return 'flan';
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
