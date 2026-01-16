import type { Stats } from './Stats';
import type { GameSettings } from './Settings';
import type { GameEvent } from './Events';

export interface MinigameStats {
  lastPlayed: number; // timestamp del último juego
  bestScore: number;
  totalPlayed: number;
  totalWins: number;
  totalPerfect: number;
}

export type MinigameId = 'pudding' | 'memory';

export interface MinigamesState {
  lastPlayed: Record<MinigameId, number>; // For cooldown tracking
  games: Record<MinigameId, MinigameStats>;
}

export interface PetState {
  species: 'FLAN_BEBE' | 'FLAN_TEEN' | 'FLAN_ADULT' | 'POMPOMPURIN' | 'MUFFIN' | 'BAGEL' | 'SCONE';
  stats: Stats;
  alive: boolean;
  totalTicks: number;
  history: GameEvent[];
  unlockedGifts: string[];
  unlockedAchievements: string[];
  album: Record<string, unknown>;
  minigames: MinigamesState;
  settings: GameSettings;
}

export function createInitialPetState(): PetState {
  return {
    species: 'FLAN_BEBE',
    stats: {
      hunger: 30,
      happiness: 70,
      energy: 60,
      health: 90,
      affection: 20,
    },
    alive: true,
    totalTicks: 0,
    history: [],
    unlockedGifts: [],
    unlockedAchievements: [],
    album: {},
    minigames: {
      lastPlayed: {
        pudding: -1000,
        memory: -1000,
      },
      games: {
        pudding: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        memory: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
      },
    },
    settings: {
      difficulty: 'normal',
      soundEnabled: true,
      animationsEnabled: true,
      reducedMotion: false,
      speed: '1x',
      paused: false,
    },
  };
}
