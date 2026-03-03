import type { PetLine, PetSpecies } from '../model/PetState';

export type EvolutionSpecies = PetSpecies;

export interface EvolutionRule {
  targetSpecies: EvolutionSpecies;
  name: string;
  description: string;
  conditions: {
    minTicks?: number;
    minHappiness?: number;
    maxHunger?: number;
    minHealth?: number;
    minEnergy?: number;
    maxEnergy?: number;
    maxFeeds?: number;
    minFeeds?: number;
    maxPlayCount?: number;
    minPlayCount?: number;
    maxSleepInterruptions?: number;
    maxAffectionRatio?: number;
  };
  priority: number;
}

const FLAN_RULES: EvolutionRule[] = [
  {
    targetSpecies: 'POMPOMPURIN',
    name: 'Perfect Care',
    description: 'High affection, excellent health, balanced diet',
    conditions: {
      minTicks: 1200,
      minHappiness: 85,
      minHealth: 85,
      maxHunger: 25,
      minEnergy: 65,
    },
    priority: 1,
  },
  {
    targetSpecies: 'MUFFIN',
    name: 'Snack Addict',
    description: 'Many snacks, almost no play: sedentary pet',
    conditions: {
      minTicks: 900,
      minFeeds: 30,
      maxPlayCount: 6,
      minHealth: 45,
    },
    priority: 2,
  },
  {
    targetSpecies: 'SCONE',
    name: 'Mechanical Care',
    description: 'Low affection, functional care only',
    conditions: {
      minTicks: 900,
      maxAffectionRatio: 25,
      maxHunger: 55,
      minHealth: 35,
    },
    priority: 3,
  },
  {
    targetSpecies: 'BAGEL',
    name: 'Default Adult',
    description: 'Fallback adult form',
    conditions: {
      minTicks: 900,
    },
    priority: 4,
  },
];

export function getSortedRules(petLine: PetLine): EvolutionRule[] {
  if (petLine === 'flan') {
    return [...FLAN_RULES].sort((a, b) => a.priority - b.priority);
  }
  return [];
}
