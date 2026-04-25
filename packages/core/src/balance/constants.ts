// =============================================================================
// BALANCE CONSTANTS — Source of truth para economía de stats
// Extraídas de tick.ts y reducer.ts (antes hardcodeadas)
// =============================================================================

export const CLAMP_MIN = 0;
export const CLAMP_MAX = 100;

// Degradación base por tick (1 tick ≈ 1 segundo)
// hunger sube, happiness y energy bajan
export interface DegradationRates {
  hunger: number; // + por tick (0 = saciado, 100 = muerto)
  happiness: number; // − por tick
  energy: number; // − por tick
}

export const DEGRADATION_BASE: DegradationRates = {
  hunger: 0.16, // Más rápido: 0→80 en ~8 min
  happiness: 0.10, // Más rápido: 80→0 en ~13 min
  energy: 0.05, // Más rápido
};

// Multiplicadores por dificultad (fuerza de degradación)
export type DifficultyKey = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_MULTIPLIERS: Record<DifficultyKey, number> = {
  easy: 0.5,
  normal: 1.0,
  hard: 1.5,
};

// Umbral a partir del cual el hambre empieza a dañar salud
export const HUNGER_HEALTH_DAMAGE_THRESHOLD = 80;

// Daño a salud por tick = (hunger − threshold) × factor
export const HUNGER_HEALTH_DAMAGE_FACTOR = 0.5; // Agresivo: daño masivo para evitar inmortalidad

// Recuperación natural de salud si hambre < umbral y health < clamp máx
export const HEALTH_REGEN_HUNGER_THRESHOLD = 50;
export const HEALTH_REGEN_PER_TICK = 0.02;

// =============================================================================
// RECOMPENSAS POR ACCIÓN
// =============================================================================

export interface ActionReward {
  hungerDelta: number; // + = más hambre, − = menos
  happinessDelta: number;
  energyDelta: number;
  healthDelta: number;
  affectionDelta: number;
}

export const ACTION_REWARDS: Record<string, ActionReward> = {
  FEED: { hungerDelta: -30, happinessDelta: +10, energyDelta: 0, healthDelta: 0, affectionDelta: 0 },
  PLAY: { hungerDelta: +5, happinessDelta: +25, energyDelta: -10, healthDelta: 0, affectionDelta: 0 },
  REST: { hungerDelta: +3, happinessDelta: 0, energyDelta: +40, healthDelta: 0, affectionDelta: 0 },
  MEDICATE: { hungerDelta: 0, happinessDelta: 0, energyDelta: 0, healthDelta: +40, affectionDelta: 0 },
  PET: { hungerDelta: 0, happinessDelta: +10, energyDelta: 0, healthDelta: 0, affectionDelta: +5 },
};

// Bonus de Medicate cuando affection > umbral
export const MEDICATE_HAPPINESS_BONUS_AFFECTION_THRESHOLD = 70;
export const MEDICATE_HAPPINESS_BONUS_AMOUNT = 20;

// =============================================================================
// MINIGAMES
// =============================================================================

export const MINIGAME_COOLDOWN_TICKS = 100;

export interface MinigameReward {
  happinessDelta: number;
  affectionDelta: number;
}

export const MINIGAME_REWARDS: Record<string, MinigameReward> = {
  perfect: { happinessDelta: +25, affectionDelta: +10 },
  win: { happinessDelta: +15, affectionDelta: +5 },
  loss: { happinessDelta: 0, affectionDelta: 0 },
};
