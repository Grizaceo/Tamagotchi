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
    },
    alive: true,
    totalTicks: 0,
    history: [],
    unlockedGifts: [],
    unlockedAchievements: [],
    album: {},
    settings: {
      difficulty: 'normal',
      soundEnabled: true,
      animationsEnabled: true,
    },
  };
}
