/** =============================================================================
 * PLAYER PROFILES — Simulación Monte Carlo
 * Cada perfil decide acciones basado en thresholds de stats.
 * Todas las funciones son PURAS: reciben estado y devuelven ActionType | null.
 * null = no hace nada en este tick.
 * ============================================================================= */

import type { ActionType } from '../model/Actions';
import type { PetState } from '../model/PetState';
import { HUNGER_HEALTH_DAMAGE_THRESHOLD } from './constants';

// Perfiles disponibles
export type PlayerProfileId = 'perfect' | 'caretaker' | 'passive' | 'forgotten';

export interface PlayerProfile {
  id: PlayerProfileId;
  decideAction(state: PetState): ActionType | null;
}

// ---------------------------------------------------------------------------
// PERFECT — Actúa *antes* de que cualquier stat toque umbral crítico
// ---------------------------------------------------------------------------
export const PerfectPlayer: PlayerProfile = {
  id: 'perfect',
  decideAction(state): ActionType | null {
    const { hunger, happiness, energy, health } = state.stats;

    if (hunger > 60) return 'FEED';
    if (happiness < 50) return 'PLAY';
    if (energy < 40) return 'REST';
    if (health < 70) return 'MEDICATE';
    if (state.stats.affection < 80) return 'PET';
    return null;
  },
};

// ---------------------------------------------------------------------------
// CARETAKER — Cuida pero con delays y algo de ruido (aleatoriedad débil)
// ---------------------------------------------------------------------------
export const CaretakerPlayer: PlayerProfile = {
  id: 'caretaker',
  decideAction(state): ActionType | null {
    const { hunger, happiness, energy, health } = state.stats;
    const roll = Math.random();

    // 10% de inacción (target 0.10) - Menos bloqueo permite más APM
    if (roll < 0.10) return null;

    // Multi-nivel: mayor agresividad en mantenimiento preventivo
    if (hunger > 62) return 'FEED';
    if (hunger > 45 && roll < 0.5) return 'FEED'; // Antes 0.4
    if (happiness < 45) return 'PLAY'; // Antes 40
    if (energy < 25) return 'REST';
    if (health < 50) return 'MEDICATE';
    if (state.stats.affection < 55 && roll < 0.7) return 'PET'; // Antes <50 y 0.6
    return null;
  },
};

// ---------------------------------------------------------------------------
// PASSIVE — Solo actúa cuando stats están en zona de peligro
// ---------------------------------------------------------------------------
export const PassivePlayer: PlayerProfile = {
  id: 'passive',
  decideAction(state): ActionType | null {
    const { hunger, happiness, energy, health } = state.stats;
    const roll = Math.random();

    // 30% de inacción (target 0.30)
    if (roll < 0.30) return null;

    // Multi-nivel: hambre intermedia genera más acciones
    if (hunger > 72) return 'FEED';
    if (hunger > 50 && roll < 0.35) return 'FEED'; // nivel intermedio
    if (happiness < 30) return 'PLAY';
    if (energy < 20) return 'REST';
    if (health < 35) return 'MEDICATE';
    if (state.stats.affection < 30) return 'PET';
    return null;
  },
};

// ---------------------------------------------------------------------------
// FORGOTTEN — Casi no interactúa. Sobrevive solo por suerte.
// ---------------------------------------------------------------------------
export const ForgottenPlayer: PlayerProfile = {
  id: 'forgotten',
  decideAction(state): ActionType | null {
    const { hunger, happiness, energy, health } = state.stats;
    const roll = Math.random();

    // Solo actúa con probabilidad 2% cada tick (98% inacción), y solo si crisis aguda
    if (roll > 0.02) return null;

    if (hunger > 82) return 'FEED';
    if (happiness < 10) return 'PLAY';
    if (energy < 8) return 'REST';
    if (health < 30) return 'MEDICATE';
    if (state.stats.affection < 10) return 'PET';
    return null;
  },
};

// Mapa indexado
export const PLAYER_PROFILES: Record<PlayerProfileId, PlayerProfile> = {
  perfect: PerfectPlayer,
  caretaker: CaretakerPlayer,
  passive: PassivePlayer,
  forgotten: ForgottenPlayer,
};
