/**
 * Configuración del juego
 */
export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  speed: '1x' | '2x';
  paused: boolean;
}

export function createDefaultSettings(): GameSettings {
  return {
    difficulty: 'normal',
    soundEnabled: true,
    animationsEnabled: true,
    reducedMotion: false,
    speed: '1x',
    paused: false,
  };
}
