/**
 * Estructura persistente del estado del juego
 */
export interface SaveData {
  version: number;
  createdAt: number; // Timestamp en ms
  lastSaved: number; // Timestamp en ms
  totalTicks: number;
  state: {
    species: string;
    stats: {
      hunger: number;
      happiness: number;
      energy: number;
      health: number;
    };
    alive: boolean;
  };
  history: Array<{
    tick: number;
    statChanges?: Record<string, number>;
  }>;
  settings: {
    difficulty: 'easy' | 'normal' | 'hard';
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
}

export const SAVE_DATA_VERSION = 1;

export function createEmptySaveData(): SaveData {
  const now = Date.now();
  return {
    version: SAVE_DATA_VERSION,
    createdAt: now,
    lastSaved: now,
    totalTicks: 0,
    state: {
      species: 'FLAN_BEBE',
      stats: {
        hunger: 30,
        happiness: 70,
        energy: 60,
        health: 90,
      },
      alive: true,
    },
    history: [],
    settings: {
      difficulty: 'normal',
      soundEnabled: true,
      animationsEnabled: true,
    },
  };
}
