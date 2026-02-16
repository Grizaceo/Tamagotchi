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
      affection: number;
    };
    alive: boolean;
    minigames: {
      lastPlayed: Record<string, number>; // gameId -> tick
      games?: Record<string, {
        lastPlayed: number;
        bestScore: number;
        totalPlayed: number;
        totalWins: number;
        totalPerfect: number;
      }>;
    };
  };
  history: Array<{
    type: string;
    tick: number;
    data?: Record<string, unknown>;
  }>;
  historyStats?: {
    actionCounts: Record<string, number>;
    totalActions: number;
    evolvedForms: string[];
  };
  unlockedGifts: string[];
  unlockedAchievements: string[];
  album: Record<string, unknown>;
  settings: {
    difficulty: 'easy' | 'normal' | 'hard';
    soundEnabled: boolean;
    animationsEnabled: boolean;
    reducedMotion: boolean;
    speed: '1x' | '2x';
    paused: boolean;
  };
}

export const SAVE_DATA_VERSION = 1;


