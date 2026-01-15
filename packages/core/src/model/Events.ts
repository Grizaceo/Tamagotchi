/**
 * Eventos que ocurren durante el juego
 */
export type EventType = 'STAT_CHANGED' | 'DIED' | 'EVOLVED' | 'GIFT_UNLOCKED' | 'MINIGAME_WIN' | 'MINIGAME_PERFECT';

export interface GameEvent {
  type: EventType;
  timestamp: number; // Ticks cuando ocurrió
  data?: Record<string, unknown>;
}

export function createEvent(type: EventType, timestamp: number, data?: Record<string, unknown>): GameEvent {
  return { type, timestamp, data };
}
