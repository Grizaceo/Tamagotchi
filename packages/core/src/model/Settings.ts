/**
 * Configuración del juego
 */
export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

export function createDefaultSettings(): GameSettings {
  return {
    difficulty: 'normal',
    soundEnabled: true,
    animationsEnabled: true,
  };
}
