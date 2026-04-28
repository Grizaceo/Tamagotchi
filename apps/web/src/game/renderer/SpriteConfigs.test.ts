import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SPRITE_CONFIGS } from './SpriteConfigs';
import { ICON_MAP } from '../assets/PlaceholderIcons';

function imageSize(filePath: string): { width: number; height: number } {
  const data = readFileSync(filePath);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // PNG: IHDR starts at byte 16
  if (data.subarray(0, 8).equals(pngSig)) {
    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    return { width, height };
  }

  // JPEG: scan markers until SOF0/SOF2.
  if (data[0] === 0xff && data[1] === 0xd8) {
    let i = 2;
    while (i < data.length - 9) {
      if (data[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = data[i + 1];
      const len = data.readUInt16BE(i + 2);
      if ((marker === 0xc0 || marker === 0xc2) && i + 8 < data.length) {
        const height = data.readUInt16BE(i + 5);
        const width = data.readUInt16BE(i + 7);
        return { width, height };
      }
      i += 2 + len;
    }
    throw new Error(`Unsupported JPEG layout: ${filePath}`);
  }

  throw new Error(`Unsupported image format: ${filePath}`);
}

function toPublicPath(assetUrl: string): string {
  const relative = assetUrl.startsWith('/') ? assetUrl.slice(1) : assetUrl;
  return join(process.cwd(), 'public', relative);
}

describe('Sprite wiring', () => {
  it('maps all species to local spritesheets', () => {
    const species = [
      'FIU_EGG',
      'FIU_BABY',
      'FIU_TEEN',
      'FIU_PERFECT',
      'FIU_COMMON',
      'FIU_FAIL',
      'SALCHICHA_EGG',
      'SALCHICHA_BABY',
      'SALCHICHA_TEEN',
      'SALCHICHA_PERFECT',
      'SALCHICHA_BROWN',
      'SALCHICHA_FAIL',
      'FLAN_BEBE',
      'FLAN_TEEN',
      'FLAN_ADULT',
      'POMPOMPURIN',
      'BAGEL',
      'MUFFIN',
      'SCONE',
      'SEAL_EGG',
      'SEAL_BABY',
      'SEAL_TEEN',
      'SEAL_PERFECT',
      'SEAL_BROWN',
      'SEAL_FAIL',
    ] as const;

    for (const name of species) {
      const cfg = SPRITE_CONFIGS[name];
      expect(cfg).toBeDefined();

      const full = toPublicPath(cfg.src);
      expect(existsSync(full)).toBe(true);

      const { width, height } = imageSize(full);
      expect(height % cfg.gridSize).toBe(0);
      expect(height / cfg.gridSize).toBeGreaterThanOrEqual(1);
      expect(width % cfg.gridSize).toBe(0);
      expect(width / cfg.gridSize).toBeGreaterThanOrEqual(cfg.animations.idle.frames);
    }
  });

  it('uses local UI icons required by renderer', () => {
    const requiredKeys = [
      'icon_hunger',
      'icon_happy',
      'icon_energy',
      'icon_health',
      'icon_love',
      'menu_care',
      'menu_gifts',
      'menu_album',
      'menu_settings',
      'menu_games',
    ] as const;

    for (const key of requiredKeys) {
      const url = ICON_MAP[key];
      expect(url).toBeDefined();
      expect(url.includes('assets/ui/')).toBe(true);
      expect(existsSync(toPublicPath(url))).toBe(true);
    }
  });
});
