import type { ActionType, PetState } from '@pompom/core';

export type SceneId = 'Home' | 'CareMenu' | 'Gifts' | 'Album' | 'Settings' | 'Minigames';

export type MinigameMode = 'select' | 'playing';

export interface UiState {
  scene: SceneId;
  menuIndex: number;
  careIndex: number;
  giftIndex: number;
  albumIndex: number;
  albumPage: number;
  settingsIndex: number;
  minigameIndex: number;
  minigameMode: MinigameMode;
}

export const BOTTOM_MENU: Array<{ id: SceneId; label: string; icon: string }> = [
  { id: 'Home', label: 'Home', icon: 'HM' },
  { id: 'CareMenu', label: 'Care', icon: 'CR' },
  { id: 'Gifts', label: 'Gifts', icon: 'GF' },
  { id: 'Album', label: 'Album', icon: 'AL' },
  { id: 'Settings', label: 'Setup', icon: 'ST' },
  { id: 'Minigames', label: 'Games', icon: 'MG' },
];

export const CARE_ACTIONS: Array<{ type: ActionType; label: string }> = [
  { type: 'FEED', label: 'Feed' },
  { type: 'PLAY', label: 'Play' },
  { type: 'REST', label: 'Rest' },
  { type: 'MEDICATE', label: 'Heal' },
  { type: 'PET', label: 'Pet' },
];

export const SETTINGS_ITEMS = [
  { id: 'mute', label: 'Mute' },
  { id: 'speed', label: 'Speed' },
  { id: 'pause', label: 'Pause' },
  { id: 'reducedMotion', label: 'ReducedMotion' },
];

export const ALBUM_PAGE_SIZE = 4;

export const MINIGAMES = [
  { id: 'pudding', label: 'Pudding Catch', scene: 'pudding-game' },
  { id: 'memory', label: 'Memory 2x2', scene: 'memory-game' },
];

export function createInitialUiState(): UiState {
  return {
    scene: 'Home',
    menuIndex: 0,
    careIndex: 0,
    giftIndex: 0,
    albumIndex: 0,
    albumPage: 0,
    settingsIndex: 0,
    minigameIndex: 0,
    minigameMode: 'select',
  };
}

export function wrapIndex(next: number, size: number): number {
  if (size <= 0) return 0;
  if (next < 0) return size - 1;
  if (next >= size) return 0;
  return next;
}

export function getMenuIndex(scene: SceneId): number {
  const idx = BOTTOM_MENU.findIndex((item) => item.id === scene);
  return idx === -1 ? 0 : idx;
}

/**
 * Maps a menu index (from BOTTOM_MENU) to an icon index (from UIRenderer ICONS)
 * ICONS: 0:food, 1:light, 2:play, 3:medicine, 4:toilet, 5:stats, 6:discipline, 7:gift, 8:album
 */
export function mapMenuIndexToIcon(menuIndex: number, state: PetState): number {
  const sceneId = BOTTOM_MENU[menuIndex]?.id;
  switch (sceneId) {
    case 'Home':
      return 5; // Stats
    case 'CareMenu':
      return state.stats.health < 30 ? 3 : 0; // Medicine if sick, else Food
    case 'Gifts':
      return 7; // Gift
    case 'Album':
      return 8; // Album
    case 'Settings':
      return 6; // Discipline (Setup)
    case 'Minigames':
      return 2; // Play
    default:
      return -1;
  }
}
