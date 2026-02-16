import type { PetState } from '@pompom/core';
import { getGiftById } from '@pompom/core';
import { ALBUM_PAGE_SIZE, CARE_ACTIONS, MINIGAMES, SETTINGS_ITEMS } from './Scenes';
import type { UiState } from './Scenes';
import type { AnimationState, SpriteRenderer, AssetManager } from './renderer/SpriteRenderer';
import type { UIRenderer } from './renderer/UIRenderer';

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
    const selection = ui.scene === 'Home' ? ui.menuIndex : -1;
    options.uiRenderer.setSelectedIcon(selection);
    options.uiRenderer.draw(ctx, state);
  }

  // 2. Main Scene
  const display = { x: 0, y: 20, w: width, h: height - 40 };
  drawScene(ctx, state, ui, display, now, options);
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
      drawHome(ctx, state, body, now, options);
      break;
    case 'CareMenu':
      drawCareMenu(ctx, ui, body);
      break;
    case 'Gifts':
      drawGifts(ctx, state, ui, body, options?.spriteRenderer, options?.assetManager);
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


// ... (imports remain)

// ... (drawHome function)
function drawHome(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  area: Rect,
  _now: number,
  options?: RenderOptions
): void {
  // Compact stats height
  const statsHeight = 32;
  drawStats(ctx, state, { x: area.x, y: area.y, w: area.w, h: statsHeight }, options?.spriteRenderer, options?.assetManager);

  if (options?.spriteRenderer) {
    // Fill behind the sprite
    const sr = options.spriteRenderer;
    // We assume sprite position is handled in GameLoop or here.
    // Let's verify overlap visual:
    // Stats end at y + 32. 
    // Sprite usually starts lower.

    // Debug helper: draw sprite box
    // ctx.strokeStyle = 'red';
    // ctx.strokeRect(sr.x, sr.y, sr.displaySize, sr.displaySize);

    ctx.fillRect(sr.x, sr.y, sr.displaySize, sr.displaySize);
    sr.draw(ctx);
  } else {
    // Fallback: draw a simple placeholder pet
    drawFallbackPet(ctx, state, { x: area.x, y: area.y + statsHeight + 8, w: area.w, h: area.h - statsHeight - 20 });
  }

  // Draw Game Over overlay if dead
  if (!state.alive) {
    drawGameOver(ctx, area);
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, area: Rect) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(area.x, area.y, area.w, area.h);

  ctx.fillStyle = PALETTE.accent;
  ctx.font = '20px "Cascadia Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText("GAME OVER", area.x + area.w / 2, area.y + area.h / 2);

  ctx.fillStyle = PALETTE.screen;
  ctx.font = '10px "Cascadia Mono", monospace';
  ctx.fillText("Use Settings -> Reset", area.x + area.w / 2, area.y + area.h / 2 + 15);
  ctx.textAlign = 'left';
}

function drawFallbackPet(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  area: Rect
): void {
  const centerX = area.x + area.w / 2;
  const centerY = area.y + area.h / 2;

  // Body
  ctx.fillStyle = '#f8d547';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#ffe680';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 4, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat (beret)
  ctx.fillStyle = '#6b3e26';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - 18, 14, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(centerX - 8, centerY - 6, 4, 4);
  ctx.fillRect(centerX + 4, centerY - 6, 4, 4);

  // Nose/mouth
  ctx.fillRect(centerX - 2, centerY + 2, 4, 3);

  // Species label
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '8px "Cascadia Mono", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(state.species.replace('_', ' '), centerX, area.y + area.h - 12);
  ctx.textAlign = 'start';
}

// Reuse objects to avoid allocation in render loop
const STATS_POOL: { label: string; value: number; icon: AnimationState }[] = [
  { label: 'HUNGER', value: 0, icon: 'eat' },
  { label: 'HAPPY', value: 0, icon: 'happy' },
  { label: 'ENERGY', value: 0, icon: 'sleep' },
  { label: 'HEALTH', value: 0, icon: 'sick' },
  { label: 'LOVE', value: 0, icon: 'idle' },
];

function drawStats(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  area: Rect,
  spriteRenderer?: SpriteRenderer,
  assetManager?: AssetManager
): void {
  STATS_POOL[0].value = 100 - state.stats.hunger; // Invert
  STATS_POOL[1].value = state.stats.happiness;
  STATS_POOL[2].value = state.stats.energy;
  STATS_POOL[3].value = state.stats.health;
  STATS_POOL[4].value = state.stats.affection;

  // Compact Top Layout: 1 row of 5 items
  // ITEM: [ICON] [BAR___]
  const paddingX = 4;
  const itemWidth = (area.w - (paddingX * 6)) / 5;
  const startX = area.x + paddingX;
  const startY = area.y + 4;

  // Draw labels above or inside? 
  // Let's do icon + mini bar below it.

  STATS_POOL.forEach((stat, i) => {
    const x = startX + i * (itemWidth + paddingX);
    const y = startY;

    drawCompactStat(ctx, x, y, itemWidth, stat, spriteRenderer, assetManager);
  });
}

function drawCompactStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  stat: { label: string; value: number; icon: AnimationState },
  spriteRenderer?: SpriteRenderer,
  assetManager?: AssetManager
) {
  const iconSize = 12;
  const centerX = x + w / 2;

  // 1. Icon
  // Try to use placeholder first
  let drawn = false;
  if (assetManager) {
    const iconMap: Record<string, string> = {
      'eat': 'icon_hunger',
      'happy': 'icon_happy',
      'sleep': 'icon_energy',
      'sick': 'icon_health',
      'idle': 'icon_love',
    };
    const key = iconMap[stat.icon];
    const img = assetManager.get(key);
    if (img) {
      ctx.drawImage(img, centerX - iconSize / 2, y, iconSize, iconSize);
      drawn = true;
    }
  }

  if (!drawn && spriteRenderer) {
    spriteRenderer.drawFrame(ctx, stat.icon, 0, centerX - iconSize / 2, y, iconSize);
  } else if (!drawn) {
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.beginPath();
    ctx.arc(centerX, y + iconSize / 2, iconSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Bar (below icon)
  const barH = 4;
  const barY = y + iconSize + 2;

  ctx.fillStyle = PALETTE.inkSoft; // bg
  ctx.fillRect(x, barY, w, barH);

  const fillW = Math.max(0, Math.min(1, stat.value / 100)) * (w - 2);
  ctx.fillStyle = stat.value < 30 ? '#FF5252' : PALETTE.accent; // Red if low
  ctx.fillRect(x + 1, barY + 1, fillW, barH - 2);

  // 3. Label (tiny, below bar)
  // Try to use label sprite
  let labelDrawn = false;
  if (assetManager) {
    const labelMap: Record<string, string> = {
      'HUNGER': 'label_hunger',
      'HAPPY': 'label_happy',
      'ENERGY': 'label_energy',
      'HEALTH': 'label_health',
      'LOVE': 'label_love',
    };
    const key = labelMap[stat.label];
    const img = assetManager.get(key);
    if (img) {
      // Center label
      // Sprite is variable width, height ~7px * scale 2 = 14px
      // let's draw it at scale 1 or 2? Generated as scale 2 (14px height).
      // That might be too big for "tiny" label.
      // Generated script said: "Resize to be slightly larger... Target height around 12-16px"
      // Original text font was 6px.
      // Let's draw it centered.
      const drawW = img.width;
      const drawH = img.height;

      // If it's too wide, scale down?
      // w is area width.

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, centerX - drawW / 2, barY + barH + 2, drawW, drawH);
      labelDrawn = true;
    }
  }

  if (!labelDrawn) {
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.font = '6px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(stat.label.substring(0, 3), centerX, barY + barH + 6);
    ctx.textAlign = 'left';
  }
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

function drawGifts(
  ctx: CanvasRenderingContext2D,
  state: PetState,
  ui: UiState,
  area: Rect,
  spriteRenderer?: SpriteRenderer,
  assetManager?: AssetManager
): void {
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

  // Text details
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.fillText(gift.name.toUpperCase(), detailArea.x, detailArea.y);
  ctx.fillStyle = PALETTE.ink;
  wrapText(ctx, gift.description, detailArea.x, detailArea.y + 16, detailArea.w, 12);

  // Special rendering for Judge Pompom
  if (gift.id === 'gift_judge_evolution' && assetManager) {
    const img = assetManager.get('gift_judge');
    if (img) {
      const spriteSize = 64;
      const spriteX = detailArea.x + (detailArea.w - spriteSize) / 2;
      const spriteY = detailArea.y + detailArea.h - spriteSize;

      // Draw background circle
      ctx.fillStyle = PALETTE.screenShade;
      ctx.beginPath();
      ctx.arc(spriteX + spriteSize / 2, spriteY + spriteSize / 2, spriteSize / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(img, spriteX, spriteY, spriteSize, spriteSize);
      return;
    }
  }

  // Show Pet Reaction (Happy Sprite) below description if there is space
  if (spriteRenderer) {
    const spriteSize = 64;
    const spriteX = detailArea.x + (detailArea.w - spriteSize) / 2;
    const spriteY = detailArea.y + detailArea.h - spriteSize;

    // Draw background circle for the sprite
    ctx.fillStyle = PALETTE.screenShade;
    ctx.beginPath();
    ctx.arc(spriteX + spriteSize / 2, spriteY + spriteSize / 2, spriteSize / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    // Force draw 'happy' animation frame 0 (or animated if we could update it, but static is fine for UI)
    // Actually spriteRenderer.drawFrame handles static frame drawing.
    // Use animation 'happy', frame 0 (or maybe toggle frames based on global time?)
    // Let's use frame 0 for simplicity.

    const time = Date.now() / 250; // Simple animation loop for UI
    const frame = Math.floor(time) % 2;

    spriteRenderer.drawFrame(ctx, 'happy', frame, spriteX, spriteY, spriteSize);
  }
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

  if (ui.settingsConfirmation) {
    // Draw overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(area.x, area.y, area.w, area.h);

    ctx.fillStyle = PALETTE.screen;
    ctx.fillRect(area.x + 10, area.y + 20, area.w - 20, 60);
    ctx.strokeRect(area.x + 10, area.y + 20, area.w - 20, 60);

    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.fillText('REALLY RESET?', area.x + area.w / 2, area.y + 35);
    ctx.fillText('All data will be lost!', area.x + area.w / 2, area.y + 45);

    ctx.fillStyle = PALETTE.accent;
    ctx.fillText('ENTER: Confirm', area.x + area.w / 2, area.y + 60);
    ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText('BACK: Cancel', area.x + area.w / 2, area.y + 70);
    ctx.textAlign = 'left';
  }
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
    case 'reset':
      return '>>>';
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

export type RenderOptions = {
  minigameFrame?: HTMLCanvasElement | null;
  spriteRenderer?: SpriteRenderer;
  uiRenderer?: UIRenderer;
  assetManager?: AssetManager;
};
