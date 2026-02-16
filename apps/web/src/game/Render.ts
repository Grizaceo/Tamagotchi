import type { PetState } from '@pompom/core';
import { getGiftById } from '@pompom/core';
import {
  ALBUM_PAGE_SIZE,
  CARE_ACTIONS,
  MINIGAMES,
  SETTINGS_ITEMS,
  getMenuIndex,
  mapMenuIndexToIcon,
} from './Scenes';
import type { UiState } from './Scenes';

const PALETTE = {
  frame: '#3a2f1f',
  frameShadow: '#241b11',
  bezel: '#4a3c28',
  screen: '#c7d5b6',
  screenShade: '#b7c8a1',
  ink: '#2a2a22',
  inkSoft: '#4c4b3d',
  accent: '#c96b3b',
  accentSoft: '#dfb07a',
};

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  ui: UiState,
  now: number,
  options?: RenderOptions
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.imageSmoothingEnabled = false;

  // Clear
  ctx.fillStyle = PALETTE.screen; // Background color
  ctx.fillRect(0, 0, width, height);

  // 1. Draw UI (Header/Footer/Icons)
  if (options?.uiRenderer) {
    // Map UI state to renderer selection
    const activeIndex = ui.scene === 'Home' ? ui.menuIndex : getMenuIndex(ui.scene);
    const selection = mapMenuIndexToIcon(activeIndex, state);
    options.uiRenderer.setSelectedIcon(selection);
    options.uiRenderer.draw(ctx, state);
  }

  // 2. Main Scene (Sprite)
  if (ui.scene === 'Home') {
    if (options?.spriteRenderer) {
      options.spriteRenderer.draw(ctx);
    }
  } else {
    // Other scenes (Menus, Minigames)
    // Use legacy drawing for menus for now, adapted to overlays
    const display = { x: 0, y: 20, w: width, h: height - 40 }; // Adjusted to fit between header/footer
    drawScene(ctx, state, ui, display, now, options);
  }
}

// @ts-ignore
function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = PALETTE.frameShadow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = PALETTE.frame;
  ctx.fillRect(4, 4, width - 8, height - 8);
  ctx.strokeStyle = PALETTE.accentSoft;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, width - 8, height - 8);
}

// @ts-ignore
function drawScreen(ctx: CanvasRenderingContext2D, screen: Rect): void {
  ctx.fillStyle = PALETTE.bezel;
  ctx.fillRect(screen.x, screen.y, screen.w, screen.h);

  ctx.fillStyle = PALETTE.screen;
  ctx.fillRect(screen.x + 4, screen.y + 4, screen.w - 8, screen.h - 8);

  ctx.strokeStyle = PALETTE.screenShade;
  ctx.lineWidth = 1;
  for (let y = screen.y + 6; y < screen.y + screen.h - 6; y += 4) {
    ctx.beginPath();
    ctx.moveTo(screen.x + 6, y);
    ctx.lineTo(screen.x + screen.w - 6, y);
    ctx.stroke();
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  ui: UiState,
  display: Rect,
  now: number,
  options?: RenderOptions
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(display.x, display.y, display.w, display.h);
  ctx.clip();
  ctx.fillStyle = PALETTE.screen;
  ctx.fillRect(display.x, display.y, display.w, display.h);

  const header = { x: display.x + 6, y: display.y + 6, w: display.w - 12, h: 18 };
  drawHeader(ctx, ui.scene, header);

  const body = {
    x: display.x + 6,
    y: display.y + 26,
    w: display.w - 12,
    h: display.h - 32,
  };

  switch (ui.scene) {
    case 'Home':
      drawHome(ctx, state, body, now, options?.petSprite ?? null);
      break;
    case 'CareMenu':
      drawCareMenu(ctx, ui, body);
      break;
    case 'Gifts':
      drawGifts(ctx, state, ui, body);
      break;
    case 'Album':
      drawAlbum(ctx, state, ui, body);
      break;
    case 'Settings':
      drawSettings(ctx, state, ui, body);
      break;
    case 'Minigames':
      drawMinigames(ctx, ui, body, options?.minigameFrame ?? null);
      break;
  }

  ctx.restore();
}

function drawHeader(ctx: CanvasRenderingContext2D, title: string, area: Rect): void {
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillRect(area.x, area.y, area.w, area.h);
  ctx.fillStyle = PALETTE.screen;
  ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), area.x + 6, area.y + area.h / 2);
}

function drawHome(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  area: Rect,
  now: number,
  petSprite: HTMLImageElement | null
): void {
  drawStats(ctx, state, { x: area.x, y: area.y, w: area.w, h: 24 });

  const petArea = { x: area.x, y: area.y + 28, w: area.w, h: area.h - 40 };
  drawPet(ctx, state, petArea, now, petSprite);

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'alphabetic';
  const infoLine = `SPD ${state.settings.speed}  ${state.settings.paused ? 'PAUSE' : 'RUN'}`;
  ctx.fillText(infoLine, area.x + 4, area.y + area.h - 4);
}

// Reuse objects to avoid allocation in render loop
const STATS_POOL = [
  { label: 'H', value: 0 },
  { label: 'P', value: 0 },
  { label: 'E', value: 0 },
  { label: 'S', value: 0 },
];

function drawStats(ctx: CanvasRenderingContext2D, state: PetState, area: Rect): void {
  STATS_POOL[0].value = state.stats.hunger;
  STATS_POOL[1].value = state.stats.happiness;
  STATS_POOL[2].value = state.stats.energy;
  STATS_POOL[3].value = state.stats.health;

  const barWidth = Math.floor(area.w / STATS_POOL.length) - 4;
  const barHeight = 10;

  for (let i = 0; i < STATS_POOL.length; i++) {
    const stat = STATS_POOL[i];
    const x = area.x + i * (barWidth + 4);
    const y = area.y + 8;
    drawStatBar(ctx, x, y, barWidth, barHeight, stat.value, stat.label);
  }
}

function drawStatBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  label: string
): void {
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillRect(x, y, w, h);

  const fillWidth = Math.max(0, Math.min(1, value / 100)) * (w - 2);
  ctx.fillStyle = PALETTE.accent;
  ctx.fillRect(x + 1, y + 1, fillWidth, h - 2);

  ctx.fillStyle = PALETTE.screen;
  ctx.font = '8px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x + 2, y - 7);
}

function drawPet(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  area: Rect,
  now: number,
  petSprite: HTMLImageElement | null
): void {
  const allowMotion = state.settings.animationsEnabled && !state.settings.reducedMotion;
  const bob = allowMotion ? Math.sin(now / 250) * 2 : 0;
  const blink = allowMotion ? Math.floor(now / 900) % 6 === 0 : false;

  const centerX = area.x + area.w / 2;
  const centerY = area.y + area.h / 2 + bob;

  if (petSprite && petSprite.complete && petSprite.naturalWidth > 0) {
    const maxW = area.w * 0.7;
    const maxH = area.h * 0.7;
    const scale = Math.min(maxW / petSprite.naturalWidth, maxH / petSprite.naturalHeight);
    const drawW = petSprite.naturalWidth * scale;
    const drawH = petSprite.naturalHeight * scale;
    const x = centerX - drawW / 2;
    const y = centerY - drawH / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(petSprite, x, y, drawW, drawH);
  } else {
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.screen;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.ink;
    if (!blink) {
      ctx.fillRect(centerX - 8, centerY - 6, 4, 4);
      ctx.fillRect(centerX + 4, centerY - 6, 4, 4);
    } else {
      ctx.fillRect(centerX - 8, centerY - 4, 4, 2);
      ctx.fillRect(centerX + 4, centerY - 4, 4, 2);
    }

    ctx.fillRect(centerX - 2, centerY + 2, 4, 3);
  }

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '8px "Cascadia Mono", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(state.species.replace('_', ' '), centerX, area.y + area.h - 12);
  ctx.textAlign = 'start';
}

function drawCareMenu(ctx: CanvasRenderingContext2D, ui: UiState, area: Rect): void {
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('Select an action', area.x + 4, area.y + 4);

  const gap = 6;
  const itemW = Math.floor((area.w - gap * (CARE_ACTIONS.length - 1)) / CARE_ACTIONS.length);
  const y = area.y + 28;

  CARE_ACTIONS.forEach((action, index) => {
    const x = area.x + index * (itemW + gap);
    ctx.fillStyle = index === ui.careIndex ? PALETTE.accent : PALETTE.inkSoft;
    ctx.fillRect(x, y, itemW, 24);
    ctx.fillStyle = PALETTE.screen;
    ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(action.label.toUpperCase(), x + itemW / 2, y + 12);
  });
  ctx.textAlign = 'start';
}

function drawGifts(ctx: CanvasRenderingContext2D, state: PetState, ui: UiState, area: Rect): void {
  const gifts = state.unlockedGifts;
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';

  if (gifts.length === 0) {
    ctx.fillText('No gifts unlocked yet.', area.x + 4, area.y + 4);
    return;
  }

  const listArea = { x: area.x + 4, y: area.y + 4, w: area.w * 0.52, h: area.h - 8 };
  const detailArea = { x: area.x + area.w * 0.58, y: area.y + 4, w: area.w * 0.38, h: area.h - 8 };

  gifts.forEach((giftId, idx) => {
    const y = listArea.y + idx * 14;
    if (y > listArea.y + listArea.h - 12) return;
    const selected = idx === ui.giftIndex;
    ctx.fillStyle = selected ? PALETTE.accent : PALETTE.inkSoft;
    ctx.fillText(selected ? `> ${giftId}` : `  ${giftId}`, listArea.x, y);
  });

  const gift = getGiftById(gifts[ui.giftIndex]);
  if (!gift) return;

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(gift.name.toUpperCase(), detailArea.x, detailArea.y);
  ctx.fillStyle = PALETTE.ink;
  wrapText(ctx, gift.description, detailArea.x, detailArea.y + 16, detailArea.w, 12);
}

function drawAlbum(ctx: CanvasRenderingContext2D, state: PetState, ui: UiState, area: Rect): void {
  const entries = Object.keys(state.album);
  const totalPages = Math.max(1, Math.ceil(entries.length / ALBUM_PAGE_SIZE));
  const page = Math.min(ui.albumPage, totalPages - 1);
  const start = page * ALBUM_PAGE_SIZE;
  const pageEntries = entries.slice(start, start + ALBUM_PAGE_SIZE);

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';

  if (entries.length === 0) {
    ctx.fillText('Album is empty.', area.x + 4, area.y + 4);
    return;
  }

  pageEntries.forEach((entry, idx) => {
    const y = area.y + 6 + idx * 16;
    const selected = idx === ui.albumIndex;
    ctx.fillStyle = selected ? PALETTE.accent : PALETTE.inkSoft;
    ctx.fillText(selected ? `> ${entry}` : `  ${entry}`, area.x + 6, y);
  });

  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(`Page ${page + 1}/${totalPages}`, area.x + 6, area.y + area.h - 14);
}

function drawSettings(ctx: CanvasRenderingContext2D, state: PetState, ui: UiState, area: Rect): void {
  ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';

  SETTINGS_ITEMS.forEach((item, idx) => {
    const y = area.y + 6 + idx * 16;
    const selected = idx === ui.settingsIndex;
    ctx.fillStyle = selected ? PALETTE.accent : PALETTE.inkSoft;
    ctx.fillText(`${selected ? '>' : ' '} ${item.label}`, area.x + 6, y);

    const value = getSettingValue(item.id, state);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(value, area.x + area.w * 0.6, y);
  });
}

function getSettingValue(id: string, state: PetState): string {
  switch (id) {
    case 'mute':
      return state.settings.soundEnabled ? 'OFF' : 'ON';
    case 'speed':
      return state.settings.speed;
    case 'pause':
      return state.settings.paused ? 'ON' : 'OFF';
    case 'reducedMotion':
      return state.settings.reducedMotion ? 'ON' : 'OFF';
    default:
      return '';
  }
}

function drawMinigames(
  ctx: CanvasRenderingContext2D,
  ui: UiState,
  area: Rect,
  minigameFrame: HTMLCanvasElement | null
): void {
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
  ctx.textBaseline = 'top';

  if (ui.minigameMode === 'playing' && minigameFrame) {
    const scale = Math.min(area.w / minigameFrame.width, area.h / minigameFrame.height);
    const drawW = minigameFrame.width * scale;
    const drawH = minigameFrame.height * scale;
    const x = area.x + (area.w - drawW) / 2;
    const y = area.y + (area.h - drawH) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(minigameFrame, x, y, drawW, drawH);
    return;
  }

  ctx.fillText('Select a minigame', area.x + 6, area.y + 6);
  MINIGAMES.forEach((game, index) => {
    const y = area.y + 28 + index * 16;
    const selected = index === ui.minigameIndex;
    ctx.fillStyle = selected ? PALETTE.accent : PALETTE.inkSoft;
    ctx.fillText(selected ? `> ${game.label}` : `  ${game.label}`, area.x + 6, y);
  });

  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('LEFT/RIGHT to choose', area.x + 6, area.y + area.h - 26);
  ctx.fillText('ENTER to play - BACK to exit', area.x + 6, area.y + area.h - 14);
}

// function drawBottomBar(ctx: CanvasRenderingContext2D, ui: UiState, bar: Rect): void {
/* function drawBottomBar(ctx: CanvasRenderingContext2D, ui: UiState, bar: Rect): void {
  ctx.fillStyle = PALETTE.screenShade;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);

  const slotW = bar.w / BOTTOM_MENU.length;
  BOTTOM_MENU.forEach((item, idx) => {
    const x = bar.x + idx * slotW;
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.strokeStyle = PALETTE.inkSoft;
    ctx.strokeRect(x + 2, bar.y + 4, slotW - 4, bar.h - 10);

    ctx.fillStyle = PALETTE.ink;
    ctx.font = '8px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, x + slotW / 2, bar.y + bar.h / 2);
  });

  const activeIndex = ui.scene === 'Home' ? ui.menuIndex : getMenuIndex(ui.scene);
  const cursorX = bar.x + activeIndex * slotW + slotW / 2;
  const cursorY = bar.y + bar.h - 4;

  ctx.fillStyle = PALETTE.accent;
  ctx.beginPath();
  ctx.moveTo(cursorX - 4, cursorY - 4);
  ctx.lineTo(cursorX + 4, cursorY - 4);
  ctx.lineTo(cursorX, cursorY);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'start';
} */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const testLine = `${line}${word} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, cursorY);
      line = `${word} `;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    ctx.fillText(line.trim(), x, cursorY);
  }
}

type Rect = { x: number; y: number; w: number; h: number };

import { SpriteRenderer } from './renderer/SpriteRenderer';
import { UIRenderer } from './renderer/UIRenderer';

export type RenderOptions = {
  minigameFrame?: HTMLCanvasElement | null;
  petSprite?: HTMLImageElement | null;
  spriteRenderer?: SpriteRenderer;
  uiRenderer?: UIRenderer;
};
