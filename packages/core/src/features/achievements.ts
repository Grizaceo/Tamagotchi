import type { PetState } from '../model/PetState';

/**
 * Logros del jugador
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * Estadísticas optimizadas para evaluación de logros
 */
export interface AchievementStats {
  actionCounts: Record<string, number>;
  totalActions: number;
  evolvedForms: Set<string>;
}

export const ACHIEVEMENT_CATALOG: Achievement[] = [
  {
    id: 'ach_caretaker',
    name: 'Cuidador Responsable',
    description: 'Realiza 50 acciones de cuidado',
    icon: '🏅',
  },
  {
    id: 'ach_perfect_pet',
    name: 'Mascota Perfecta',
    description: 'Alcanza POMPOMPURIN (cuidados perfectos)',
    icon: '👑',
  },
  {
    id: 'ach_foodie',
    name: 'Amante del Buen Comer',
    description: 'Alimenta al pet 30 veces',
    icon: '🍽️',
  },
  {
    id: 'ach_playmate',
    name: 'Compañero de Juegos',
    description: 'Juega con el pet 25 veces',
    icon: '🎮',
  },
  {
    id: 'ach_healer',
    name: 'Sanador',
    description: 'Cura al pet 10 veces',
    icon: '⚕️',
  },
  {
    id: 'ach_marathon',
    name: 'Maratonista',
    description: 'Mantén el pet vivo durante 7200+ ticks (2+ horas)',
    icon: '🏃',
  },
  {
    id: 'ach_all_forms',
    name: 'Coleccionista de Formas',
    description: 'Desbloquea todas las formas evolucionadas',
    icon: '🌈',
  },
];

/**
 * Interfaz para condiciones de logro
 */
export interface AchievementCondition {
  achievementId: string;
  checkFn: (state: PetState, stats: AchievementStats) => boolean;
  description: string;
}

/**
 * Condiciones para desbloquear logros
 */
export const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  {
    achievementId: 'ach_caretaker',
    description: 'Realiza 50+ acciones totales',
    checkFn: (_state, stats) => stats.totalActions >= 50,
  },

  {
    achievementId: 'ach_perfect_pet',
    description: 'Especie actual es POMPOMPURIN',
    checkFn: (state, stats) =>
      state.species === 'POMPOMPURIN' ||
      stats.evolvedForms.has('POMPOMPURIN'),
  },

  {
    achievementId: 'ach_foodie',
    description: 'Feed count >= 30',
    checkFn: (_state, stats) => (stats.actionCounts['FEED'] || 0) >= 30,
  },

  {
    achievementId: 'ach_playmate',
    description: 'Play count >= 25',
    checkFn: (_state, stats) => (stats.actionCounts['PLAY'] || 0) >= 25,
  },

  {
    achievementId: 'ach_healer',
    description: 'Medicate count >= 10',
    checkFn: (_state, stats) => (stats.actionCounts['MEDICATE'] || 0) >= 10,
  },

  {
    achievementId: 'ach_marathon',
    description: 'Total ticks >= 7200',
    checkFn: (state) => state.totalTicks >= 7200,
  },

  {
    achievementId: 'ach_all_forms',
    description: 'Historial contiene las 4 formas evolucionadas',
    checkFn: (_state, stats) => {
      // Debe incluir POMPOMPURIN, MUFFIN, BAGEL, SCONE
      return stats.evolvedForms.has('POMPOMPURIN') &&
             stats.evolvedForms.has('MUFFIN') &&
             stats.evolvedForms.has('BAGEL') &&
             stats.evolvedForms.has('SCONE');
    },
  },
];

/**
 * Evalúa y desbloquea logros
 */
export function evaluateAchievementUnlocks(state: PetState): PetState {
  // Pre-calculate stats in a single pass from the input state
  const stats: AchievementStats = {
    actionCounts: {},
    totalActions: 0,
    evolvedForms: new Set<string>(),
  };

  for (const event of state.history) {
    if (event.data && typeof (event.data as any).action === 'string') {
      const action = (event.data as any).action;
      stats.actionCounts[action] = (stats.actionCounts[action] || 0) + 1;
      stats.totalActions++;
    }

    if (event.type === 'EVOLVED') {
      const toForm = (event.data as any)?.to;
      if (toForm) {
        stats.evolvedForms.add(toForm);
      }
    }
  }

  const newUnlocks: string[] = [];

  for (const condition of ACHIEVEMENT_CONDITIONS) {
    // Si ya está desbloqueado, saltar
    if (state.unlockedAchievements.includes(condition.achievementId)) {
      continue;
    }

    // Evaluar condición using stats
    if (condition.checkFn(state, stats)) {
      newUnlocks.push(condition.achievementId);
    }
  }

  // Si no hay nuevos logros, devolver el estado original
  if (newUnlocks.length === 0) {
    return state;
  }

  // Si hay nuevos logros, clonar y actualizar
  const newState = structuredClone(state);
  newState.unlockedAchievements.push(...newUnlocks);
  return newState;
}

/**
 * Obtiene los detalles de un logro por ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENT_CATALOG.find((a) => a.id === id);
}

/**
 * Obtiene todos los logros desbloqueados
 */
export function getUnlockedAchievements(state: PetState): Achievement[] {
  return state.unlockedAchievements
    .map((id) => getAchievementById(id))
    .filter((ach): ach is Achievement => ach !== undefined);
}
