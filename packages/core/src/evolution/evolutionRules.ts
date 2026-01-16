/**
 * Reglas de evolución para Tamagotchi
 * Define los caminos de evolución basados en condiciones deterministas
 */

export type EvolutionSpecies = 'FLAN_TEEN' | 'FLAN_ADULT' | 'POMPOMPURIN' | 'MUFFIN' | 'BAGEL' | 'SCONE';

export interface EvolutionRule {
  targetSpecies: EvolutionSpecies;
  name: string;
  description: string;
  conditions: {
    minTicks?: number;          // Minutos jugados aprox (1 tick = 1 seg)
    minHappiness?: number;      // 0-100
    maxHunger?: number;         // 0-100
    minHealth?: number;         // 0-100
    minEnergy?: number;         // 0-100
    maxFeeds?: number;          // Máximo número de alimentaciones para este camino
    minPlayCount?: number;      // Mínimo número de veces jugado
    maxSleepInterruptions?: number; // Para el camino BAGEL (sueño irregular)
    minCleanliness?: number;    // Para SCONE (limpieza alta - nota: basado en inversión de cuidados)
  };
  priority: number;             // Para resolver conflictos (mayor = menor prioridad)
}

/**
 * Catálogo de reglas de evolución
 * Se evalúan en orden de prioridad (menor número = más prioritario)
 */
export const EVOLUTION_RULES: EvolutionRule[] = [
  {
    targetSpecies: 'POMPOMPURIN',
    name: 'Perfect Care',
    description: 'Cuidados perfectos: alto afecto, salud excelente, dieta balanceada',
    conditions: {
      minTicks: 3600,      // 1 hora mínimo
      minHappiness: 85,
      minHealth: 85,
      maxHunger: 30,
      minEnergy: 50,
    },
    priority: 1,           // Máxima prioridad
  },

  {
    targetSpecies: 'BAGEL',
    name: 'Irregular Sleep',
    description: 'Patrones de sueño erráticos: cuidados inconsistentes',
    conditions: {
      minTicks: 1800,      // 30 minutos
      maxSleepInterruptions: 100, // Basado en acciones REST inconsistentes
      minHealth: 40,
      minHappiness: 30,
    },
    priority: 2,
  },

  {
    targetSpecies: 'MUFFIN',
    name: 'Snack Addict + Low Discipline',
    description: 'Muchos refrigerios, poca actividad: pet perezoso',
    conditions: {
      minTicks: 2400,      // 40 minutos
      maxFeeds: 200,       // Muchas alimentaciones (acumuladas en historia)
      minPlayCount: 5,     // Muy poco juego
      minHealth: 50,
    },
    priority: 3,
  },

  {
    targetSpecies: 'SCONE',
    name: 'Clean but Distant',
    description: 'Limpieza alta pero bajo afecto: cuidado mecánico',
    conditions: {
      minTicks: 2400,
      minCleanliness: 70,  // Basado en ausencia de acciones "afectuosas"
      minHappiness: 0,     // Puede estar triste
      maxHunger: 50,
    },
    priority: 4,
  },
];

/**
 * Obtiene todas las reglas ordenadas por prioridad
 */
export function getSortedRules(): EvolutionRule[] {
  return [...EVOLUTION_RULES].sort((a, b) => a.priority - b.priority);
}

/**
 * Busca una regla específica por species
 */
export function getRuleBySpecies(species: EvolutionSpecies): EvolutionRule | undefined {
  return EVOLUTION_RULES.find((r) => r.targetSpecies === species);
}
