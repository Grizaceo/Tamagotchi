/**
 * Estadísticas del Tamagotchi (0-100)
 */
export interface Stats {
  hunger: number;    // 0 = satisfecho, 100 = muerto
  happiness: number; // 0 = muy triste, 100 = muy feliz
  energy: number;    // 0 = dormido, 100 = hiperactivo
  health: number;    // 0 = enfermo, 100 = saludable
  affection: number; // 0 = huraño, 100 = cariñoso
}


export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}
