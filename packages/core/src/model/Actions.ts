/**
 * Acciones que el jugador puede ejecutar
 */
export type ActionType = 'FEED' | 'PLAY' | 'REST' | 'MEDICATE' | 'PET' | 'PLAY_MINIGAME';

export interface Action {
  type: ActionType;
  timestamp: number; // Ticks cuando se ejecutó
  data?: Record<string, unknown>;
}

export function createAction(type: ActionType, timestamp: number, data?: Record<string, unknown>): Action {
  return { type, timestamp, data };
}
