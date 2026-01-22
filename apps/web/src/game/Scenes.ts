import type { ActionType } from '@pompom/core';

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

export function getIconIndexForScene(sceneId: SceneId): number {
  switch (sceneId) {
    case 'Home':
      return 5; // stats
    case 'CareMenu':
      return 0; // food
    case 'Gifts':
      return 7; // gift
    case 'Album':
      return 8; // album
    case 'Minigames':
      return 2; // play
    case 'Settings':
    default:
      return -1; // No icon
  }
}
