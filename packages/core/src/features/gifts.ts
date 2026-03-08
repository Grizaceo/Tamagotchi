import type { PetState } from '../model/PetState';

/**
 * Catálogo de regalos disponibles (8-12 items)
 */
export interface Gift {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export const GIFT_CATALOG: Gift[] = [
  {
    id: 'gift_first_meal',
    name: 'Primer Bocadillo',
    description: 'Tu primer cuidado: alimento reconfortante',
    emoji: '🍪',
  },
  {
    id: 'gift_playtime_joy',
    name: 'Alegría de Jugar',
    description: 'Una pelota suave para horas de diversión',
    emoji: '🎾',
  },
  {
    id: 'gift_dreams',
    name: 'Almohada de Sueños',
    description: 'Duerme mejor y sueña con aventuras',
    emoji: '🛏️',
  },
  {
    id: 'gift_health_potion',
    name: 'Poción de Salud',
    description: 'Brinda fuerzas en momentos difíciles',
    emoji: '💚',
  },
  {
    id: 'gift_affection',
    name: 'Corazón de Papel',
    description: 'Un símbolo delicado de tu cariño',
    emoji: '💝',
  },
  {
    id: 'gift_perfect_care',
    name: 'Corona de Cuidador',
    description: 'Alcanzaste el pico de perfección en el cuidado',
    emoji: '👑',
  },
  {
    id: 'gift_resilience',
    name: 'Espíritu Resiliente',
    description: 'Superaste desafíos con gracia',
    emoji: '🌟',
  },
  {
    id: 'gift_milestone_100',
    name: 'Gema de Centenario',
    description: 'Jugaste 100+ minutos juntos',
    emoji: '💎',
  },
  {
    id: 'gift_mystery',
    name: 'Caja Sorpresa',
    description: 'Un regalo misterioso y único',
    emoji: '🎁',
  },
  {
    id: 'gift_judge_evolution',
    name: 'Justicia Pompom',
    description: 'La ley del más tierno (Evolución Perfecta)',
    emoji: '⚖️',
  },
];

/**
 * Contexto optimizado para evaluación de condiciones
 */
export interface GiftUnlockContext {
  actionCounts: Map<string, number>;
  evolvedTo: Set<string>;
}

/**
 * Interfaz para describir una condición de desbloqueo
 */
export interface GiftUnlockCondition {
  giftId: string;
  checkFn: (state: PetState, context: GiftUnlockContext) => boolean;
  description: string;
}

/**
 * Condiciones de desbloqueo para cada regalo (determinista)
 */
export const GIFT_UNLOCK_CONDITIONS: GiftUnlockCondition[] = [
  {
    giftId: 'gift_first_meal',
    description: 'Alimenta al pet al menos una vez',
    checkFn: (_state, context) => (context.actionCounts.get('FEED') || 0) >= 1,
  },

  {
    giftId: 'gift_playtime_joy',
    description: 'Juega con el pet al menos 3 veces',
    checkFn: (_state, context) => (context.actionCounts.get('PLAY') || 0) >= 3,
  },

  {
    giftId: 'gift_dreams',
    description: 'Deja dormir al pet al menos 5 veces',
    checkFn: (_state, context) => (context.actionCounts.get('REST') || 0) >= 5,
  },

  {
    giftId: 'gift_health_potion',
    description: 'Cura al pet al menos 2 veces',
    checkFn: (_state, context) => (context.actionCounts.get('MEDICATE') || 0) >= 2,
  },

  {
    giftId: 'gift_affection',
    description: 'Acaricia al pet al menos 10 veces',
    checkFn: (_state, context) => (context.actionCounts.get('PET') || 0) >= 10,
  },

  {
    giftId: 'gift_perfect_care',
    description: 'Alcanza evolución POMPOMPURIN (cuidados perfectos)',
    checkFn: (state, context) =>
      state.species === 'POMPOMPURIN' || context.evolvedTo.has('POMPOMPURIN'),
  },

  {
    giftId: 'gift_resilience',
    description: 'Sobrevive 1800+ ticks (30+ minutos)',
    checkFn: (state) => state.totalTicks >= 1800,
  },

  {
    giftId: 'gift_milestone_100',
    description: 'Acumula 6000+ ticks (100+ minutos de juego)',
    checkFn: (state) => state.totalTicks >= 6000,
  },

  {
    giftId: 'gift_mystery',
    description: 'Lleva al pet a forma adulta con salud > 70',
    checkFn: (state) =>
      (state.species === 'FLAN_ADULT' || isEvolved(state)) && state.stats.health > 70,
  },

  {
    giftId: 'gift_judge_evolution',
    description: 'Evoluciona a Pompompurin (Evolución Perfecta)',
    checkFn: (state, context) =>
      state.species === 'POMPOMPURIN' || context.evolvedTo.has('POMPOMPURIN'),
  },
];

/**
 * Desbloquea regalos si se cumplen condiciones
 * Retorna estado actualizado con regalos desbloqueados
 */
export function evaluateGiftUnlocks(state: PetState): PetState {
  // Optimización: Usar contadores agregados (O(1))
  const counts = state.counts || {
    totalActions: 0,
    feed: 0,
    play: 0,
    rest: 0,
    medicate: 0,
    pet: 0
  };

  const context: GiftUnlockContext = {
    actionCounts: new Map([
      ['FEED', counts.feed],
      ['PLAY', counts.play],
      ['REST', counts.rest],
      ['MEDICATE', counts.medicate],
      ['PET', counts.pet]
    ]),
    evolvedTo: new Set([
      ...(state.unlockedForms || []),
      state.species
    ])
  };

  const newUnlocks: string[] = [];

  for (const condition of GIFT_UNLOCK_CONDITIONS) {
    // Si ya está desbloqueado, saltar
    if (state.unlockedGifts.includes(condition.giftId)) {
      continue;
    }

    // Evaluar condición
    if (condition.checkFn(state, context)) {
      newUnlocks.push(condition.giftId);
    }
  }

  // Si no hay nuevos regalos, devolver el estado original
  if (newUnlocks.length === 0) {
    return state;
  }

  // Si hay nuevos regalos, clonar y actualizar
  const newState = structuredClone(state);
  newState.unlockedGifts.push(...newUnlocks);
  return newState;
}

/**
 * Obtiene los detalles de un regalo por ID
 */
export function getGiftById(id: string): Gift | undefined {
  return GIFT_CATALOG.find((g) => g.id === id);
}

/**
 * Obtiene todos los regalos desbloqueados
 */
export function getUnlockedGifts(state: PetState): Gift[] {
  return state.unlockedGifts
    .map((id) => getGiftById(id))
    .filter((gift): gift is Gift => gift !== undefined);
}

// ============ Helpers privados ============

function isEvolved(state: PetState): boolean {
  return [
    'POMPOMPURIN',
    'MUFFIN',
    'BAGEL',
    'SCONE',
    'SEAL_PERFECT',
    'SEAL_BROWN',
    'SEAL_FAIL',
    'FIU_PERFECT',
    'FIU_COMMON',
    'FIU_FAIL',
    'SALCHICHA_PERFECT',
    'SALCHICHA_BROWN',
    'SALCHICHA_FAIL',
  ].includes(state.species);
}
