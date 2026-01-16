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
  checkFn: (state: PetState) => boolean;
  description: string;
}

/**
 * Condiciones para desbloquear logros
 */
export const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  {
    achievementId: 'ach_caretaker',
    description: 'Realiza 50+ acciones totales',
    checkFn: (state) => getTotalActions(state) >= 50,
  },

  {
    achievementId: 'ach_perfect_pet',
    description: 'Especie actual es POMPOMPURIN',
    checkFn: (state) =>
      state.species === 'POMPOMPURIN' ||
      state.history.some((e) => e.type === 'EVOLVED' && (e.data as any)?.to === 'POMPOMPURIN'),
  },

  {
    achievementId: 'ach_foodie',
    description: 'Feed count >= 30',
    checkFn: (state) => countActionType(state, 'FEED') >= 30,
  },

  {
    achievementId: 'ach_playmate',
    description: 'Play count >= 25',
    checkFn: (state) => countActionType(state, 'PLAY') >= 25,
  },

  {
    achievementId: 'ach_healer',
    description: 'Medicate count >= 10',
    checkFn: (state) => countActionType(state, 'MEDICATE') >= 10,
  },

  {
    achievementId: 'ach_marathon',
    description: 'Total ticks >= 7200',
    checkFn: (state) => state.totalTicks >= 7200,
  },

  {
    achievementId: 'ach_all_forms',
    description: 'Historial contiene las 4 formas evolucionadas',
    checkFn: (state) => {
      const forms = new Set<string>();
      state.history.forEach((event) => {
        if (event.type === 'EVOLVED') {
          const toForm = (event.data as any)?.to;
          if (toForm) forms.add(toForm);
        }
      });
      // Debe incluir POMPOMPURIN, MUFFIN, BAGEL, SCONE
      return forms.has('POMPOMPURIN') && forms.has('MUFFIN') && forms.has('BAGEL') && forms.has('SCONE');
    },
  },
];

/**
 * Evalúa y desbloquea logros
 */
export function evaluateAchievementUnlocks(state: PetState): PetState {
  const newState = structuredClone(state);

  for (const condition of ACHIEVEMENT_CONDITIONS) {
    // Si ya está desbloqueado, saltar
    if (newState.unlockedAchievements.includes(condition.achievementId)) {
      continue;
    }

    // Evaluar condición
    if (condition.checkFn(newState)) {
      newState.unlockedAchievements.push(condition.achievementId);
    }
  }

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

// ============ Helpers privados ============

function countActionType(state: PetState, actionType: string): number {
  return state.history.filter((event) => {
    return event.data && (event.data as Record<string, unknown>).action === actionType;
  }).length;
}

function getTotalActions(state: PetState): number {
  return state.history.filter((event) => event.data && (event.data as Record<string, unknown>).action).length;
}
