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

export type MinigameId = 'pudding' | 'memory' | 'snake';

export interface MinigamesState {
  lastPlayed: Record<MinigameId, number>; // For cooldown tracking
  games: Record<MinigameId, MinigameStats>;
}

export interface InteractionCounts {
  totalActions: number;
  feed: number;
  play: number;
  rest: number;
  medicate: number;
  pet: number;
}

export type PetLine = 'flan' | 'seal' | 'fiu' | 'salchicha';

export type PetSpecies =
  | 'FLAN_BEBE'
  | 'FLAN_TEEN'
  | 'FLAN_ADULT'
  | 'POMPOMPURIN'
  | 'BAGEL'
  | 'MUFFIN'
  | 'SCONE'
  | 'SEAL_EGG'
  | 'SEAL_BABY'
  | 'SEAL_TEEN'
  | 'SEAL_PERFECT'
  | 'SEAL_BROWN'
  | 'SEAL_FAIL'
  | 'FIU_EGG'
  | 'FIU_BABY'
  | 'FIU_TEEN'
  | 'FIU_PERFECT'
  | 'FIU_COMMON'
  | 'FIU_FAIL'
  | 'SALCHICHA_EGG'
  | 'SALCHICHA_BABY'
  | 'SALCHICHA_TEEN'
  | 'SALCHICHA_PERFECT'
  | 'SALCHICHA_BROWN'
  | 'SALCHICHA_FAIL';

export function getBaseSpeciesForLine(petLine: PetLine): PetSpecies {
  switch (petLine) {
    case 'seal':
      return 'SEAL_EGG';
    case 'fiu':
      return 'FIU_EGG';
    case 'salchicha':
      return 'SALCHICHA_EGG';
    case 'flan':
    default:
      return 'FLAN_BEBE';
  }
}

export interface PetState {
  petLine: PetLine;
  species: PetSpecies;
  stats: Stats;
  alive: boolean;
  totalTicks: number;
  history: GameEvent[]; // Note: Now capped at N recent events for UI log
  counts: InteractionCounts; // Aggregated counts for game logic
  unlockedForms: string[]; // List of species forms this pet has evolved into (persistent)
  unlockedGifts: string[];
  unlockedAchievements: string[];
  album: Record<string, unknown>;
  minigames: MinigamesState;
  settings: GameSettings;
}

export function createInitialPetState(): PetState {
  return createInitialPetStateFor('flan');
}

export function createInitialPetStateFor(petLine: PetLine): PetState {
  console.log(`[PomPom Core] createInitialPetState called - Line=${petLine}`);
  const initialSpecies = getBaseSpeciesForLine(petLine);
  return {
    petLine,
    species: initialSpecies,
    stats: {
      hunger: 5,
      happiness: 80,
      energy: 80,
      health: 100,
      affection: 30,
    },
    alive: true,
    totalTicks: 0,
    history: [],
    counts: {
      totalActions: 0,
      feed: 0,
      play: 0,
      rest: 0,
      medicate: 0,
      pet: 0,
    },
    unlockedForms: [initialSpecies], // Always starts with base form
    unlockedGifts: [],
    unlockedAchievements: [],
    album: {},
    minigames: {
      lastPlayed: {
        pudding: -1000,
        memory: -1000,
        snake: -1000,
      },
      games: {
        pudding: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        memory: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
        snake: { lastPlayed: 0, bestScore: 0, totalPlayed: 0, totalWins: 0, totalPerfect: 0 },
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
