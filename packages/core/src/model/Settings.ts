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


