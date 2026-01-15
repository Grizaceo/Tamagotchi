/**
 * Acciones que el jugador puede ejecutar
 */
export type ActionType = 'FEED' | 'PLAY' | 'REST' | 'MEDICATE' | 'PET';

export interface Action {
  type: ActionType;
  timestamp: number; // Ticks cuando se ejecutó
}

export function createAction(type: ActionType, timestamp: number): Action {
  return { type, timestamp };
}
