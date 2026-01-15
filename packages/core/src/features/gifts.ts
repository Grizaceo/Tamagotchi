import { PetState } from '../model/PetState';

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
];

/**
 * Interfaz para describir una condición de desbloqueo
 */
export interface GiftUnlockCondition {
  giftId: string;
  checkFn: (state: PetState) => boolean;
  description: string;
}

/**
 * Condiciones de desbloqueo para cada regalo (determinista)
 */
export const GIFT_UNLOCK_CONDITIONS: GiftUnlockCondition[] = [
  {
    giftId: 'gift_first_meal',
    description: 'Alimenta al pet al menos una vez',
    checkFn: (state) => countAction(state, 'FEED') >= 1,
  },

  {
    giftId: 'gift_playtime_joy',
    description: 'Juega con el pet al menos 3 veces',
    checkFn: (state) => countAction(state, 'PLAY') >= 3,
  },

  {
    giftId: 'gift_dreams',
    description: 'Deja dormir al pet al menos 5 veces',
    checkFn: (state) => countAction(state, 'REST') >= 5,
  },

  {
    giftId: 'gift_health_potion',
    description: 'Cura al pet al menos 2 veces',
    checkFn: (state) => countAction(state, 'MEDICATE') >= 2,
  },

  {
    giftId: 'gift_affection',
    description: 'Acaricia al pet al menos 10 veces',
    checkFn: (state) => countAction(state, 'PET') >= 10,
  },

  {
    giftId: 'gift_perfect_care',
    description: 'Alcanza evolución POMPOMPURIN (cuidados perfectos)',
    checkFn: (state) =>
      state.species === 'POMPOMPURIN' ||
      state.history.some((e) => e.type === 'EVOLVED' && (e.data as any)?.to === 'POMPOMPURIN'),
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
];

/**
 * Desbloquea regalos si se cumplen condiciones
 * Retorna estado actualizado con regalos desbloqueados
 */
export function evaluateGiftUnlocks(state: PetState): PetState {
  const newState = structuredClone(state);

  for (const condition of GIFT_UNLOCK_CONDITIONS) {
    // Si ya está desbloqueado, saltar
    if (newState.unlockedGifts.includes(condition.giftId)) {
      continue;
    }

    // Evaluar condición
    if (condition.checkFn(newState)) {
      newState.unlockedGifts.push(condition.giftId);
    }
  }

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

function countAction(state: PetState, actionType: string): number {
  return state.history.filter((event) => {
    return event.data && (event.data as Record<string, unknown>).action === actionType;
  }).length;
}

function isEvolved(state: PetState): boolean {
  return ['POMPOMPURIN', 'MUFFIN', 'BAGEL', 'SCONE'].includes(state.species);
}
