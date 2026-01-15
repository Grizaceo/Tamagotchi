import { Stats } from './Stats';
import { GameSettings } from './Settings';
import { GameEvent } from './Events';

export interface PetState {
  species: 'FLAN_BEBE' | 'FLAN_TEEN' | 'FLAN_ADULT' | 'POMPOMPURIN' | 'MUFFIN' | 'BAGEL' | 'SCONE';
  stats: Stats;
  alive: boolean;
  totalTicks: number;
  history: GameEvent[];
  unlockedGifts: string[];
  unlockedAchievements: string[];
  album: Record<string, unknown>;
  minigames: {
    lastPlayed: Record<string, number>;
  };
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
      lastPlayed: {},
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
