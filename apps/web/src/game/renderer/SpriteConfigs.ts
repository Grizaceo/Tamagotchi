import type { SpriteConfig, AnimationDef, AnimationState } from './SpriteRenderer';
import type { FrameRect } from './SpriteRenderer';
import { LoremPicsum } from '../utils/LoremPicsum';

/**
 * Pompompurin sprite sheet — 1024×1024 JPEG.
 *
 * Pixel-measured layout (from analyze-sprites.js):
 *   Row 0: idle   — 2 frames (y=15–163, x≈332 & 532, ~160px wide, ~149px tall)
 *   Row 1: walk   — 4 frames (y=179–332, x≈164/348/542/722, ~133px wide, ~154px tall)
 *   Row 2: eat    — 4 frames (y=353–506, x≈148/332/522/706, ~160px wide, ~154px tall)
 *   Row 3: happy/sad — 4 frames (y=517–670, x≈133/322/537/727, ~165px wide, ~154px tall)
 *   Row 4: misc/sick — 4 frames (y=691–844, x≈133/312/548/727, ~164px wide, ~154px tall)
 *   Row 5: sleep  — 2 frames (y=860–1003 incl. Z's, x≈327 & 537, ~165px wide)
 */

/**
 * Helper: create a FrameRect with a small safety‐margin around the detected bounding box.
 * We pad outward by `pad` px on each side so tiny stray pixels aren't clipped.
 */
function fr(x: number, y: number, w: number, h: number, pad = 4): FrameRect {
    return {
        x: Math.max(0, x - pad),
        y: Math.max(0, y - pad),
        w: w + pad * 2,
        h: h + pad * 2,
    };
}

// ── Idle (Row 0): 2 sprites centred at x≈332 & x≈532, y 15-163 ──
const IDLE_RECTS: FrameRect[] = [
    fr(332, 15, 160, 149),
    fr(532, 15, 160, 149),
];

// ── Walk (Row 1): 4 sprites, y 179-332, x at 164/348/542/722 ──
const WALK_RECTS: FrameRect[] = [
    fr(164, 179, 133, 154),
    fr(348, 179, 134, 154),
    fr(542, 179, 134, 154),
    fr(722, 179, 133, 154),
];

// ── Eat (Row 2): 4 sprites, y 353-506, x at 148/332/522/706 ──
const EAT_RECTS: FrameRect[] = [
    fr(148, 353, 160, 154),
    fr(332, 353, 165, 154),
    fr(522, 353, 159, 154),
    fr(706, 353, 160, 154),
];

// ── Happy (Row 3 first 2): y 517-670, x at 133/322 ──
const HAPPY_RECTS: FrameRect[] = [
    fr(133, 517, 164, 154),
    fr(322, 517, 165, 154),
];

// ── Sad (Row 3 last 2): y 517-670, x at 537/727 ──
const SAD_RECTS: FrameRect[] = [
    fr(537, 517, 165, 154),
    fr(727, 517, 164, 154),
];

// ── Sick (Row 4 last 2): y 691-844, x at 548/727 ──
const SICK_RECTS: FrameRect[] = [
    fr(548, 691, 164, 154),
    fr(727, 691, 164, 154),
];

// ── Sleep (Row 5/7 including Z): y 860-1003, x at 327/537 ──
const SLEEP_RECTS: FrameRect[] = [
    fr(327, 860, 165, 144),
    fr(537, 860, 165, 144),
];

// ── Misc (Row 4 first 2): y 691-844, x at 133/312 ──
const MISC_RECTS: FrameRect[] = [
    fr(133, 691, 164, 154),
    fr(312, 691, 164, 154),
];

const POMPOM_ANIMATIONS: Record<AnimationState, AnimationDef> = {
    idle: { row: 0, frames: 2, loop: true, speed: 2, frameRects: IDLE_RECTS },
    walk: { row: 1, frames: 4, loop: true, speed: 4, frameRects: WALK_RECTS },
    eat: { row: 2, frames: 4, loop: false, speed: 4, frameRects: EAT_RECTS },
    happy: { row: 3, frames: 2, loop: true, speed: 4, frameRects: HAPPY_RECTS },
    sad: { row: 3, frames: 2, loop: true, speed: 2, frameRects: SAD_RECTS },
    sick: { row: 4, frames: 2, loop: true, speed: 1, frameRects: SICK_RECTS },
    sleep: { row: 5, frames: 2, loop: true, speed: 1, frameRects: SLEEP_RECTS },
    evolve: { row: 0, frames: 2, loop: true, speed: 10, frameRects: IDLE_RECTS },
    dead: { row: 4, frames: 2, loop: true, speed: 1, frameRects: MISC_RECTS }, // Use "Misc" for dead
};

/**
 * Other species — keep using grid‐based calculation until their sheets are
 * pixel-analysed too. With rowHeight == gridSize (256) this behaves exactly
 * like the original code.
 */
const COMMON_ANIMATIONS_GRID: Record<AnimationState, AnimationDef> = {
    idle: { row: 0, frames: 2, loop: true, speed: 2 },
    walk: { row: 1, frames: 4, loop: true, speed: 4 },
    eat: { row: 2, frames: 4, loop: false, speed: 4 },
    happy: { row: 3, frames: 2, loop: true, speed: 4 },
    sad: { row: 3, frames: 2, loop: true, speed: 2 },
    sick: { row: 3, frames: 2, loop: true, speed: 1 },
    sleep: { row: 3, frames: 2, loop: true, speed: 1 },
    evolve: { row: 0, frames: 2, loop: true, speed: 10 },
    dead: { row: 3, frames: 2, loop: true, speed: 1 }, // Fallback to sick row
};

/* // ── Simple Grid (Rows 0-7) ──
const SIMPLE_GRID_ANIMATIONS: Record<AnimationState, AnimationDef> = {
    idle: { row: 0, frames: 2, loop: true, speed: 2 },
    walk: { row: 1, frames: 4, loop: true, speed: 4 },
    eat: { row: 2, frames: 4, loop: false, speed: 4 },
    happy: { row: 3, frames: 2, loop: true, speed: 4 },
    sad: { row: 4, frames: 2, loop: true, speed: 2 },
    sick: { row: 5, frames: 2, loop: true, speed: 1 },
    sleep: { row: 6, frames: 2, loop: true, speed: 1 },
    evolve: { row: 0, frames: 2, loop: true, speed: 10 },
    dead: { row: 7, frames: 2, loop: true, speed: 1 },
}; */

// ── FLAN BEBE v3 (1 row, 4 frames total) ──
const FLAN_BEBE_ANIMATIONS_V3: Record<AnimationState, AnimationDef> = {
    idle: { row: 0, frames: 4, loop: true, speed: 2 },
    walk: { row: 0, frames: 4, loop: true, speed: 4 },   // Reuse row 0
    eat: { row: 0, frames: 4, loop: false, speed: 4 },   // Reuse row 0
    happy: { row: 0, frames: 4, loop: true, speed: 4 },  // Reuse row 0
    sad: { row: 0, frames: 4, loop: true, speed: 2 },
    sick: { row: 0, frames: 4, loop: true, speed: 1 },
    sleep: { row: 0, frames: 4, loop: true, speed: 1 },
    evolve: { row: 0, frames: 4, loop: true, speed: 10 },
    dead: { row: 0, frames: 4, loop: true, speed: 1 },
};

/* // ── FLAN BEBE v2 (4 rows) ──
const FLAN_BEBE_ANIMATIONS_V2: Record<AnimationState, AnimationDef> = {
    idle: { row: 0, frames: 4, loop: true, speed: 2 },
    walk: { row: 1, frames: 4, loop: true, speed: 4 },
    eat: { row: 2, frames: 4, loop: false, speed: 4 },
    happy: { row: 3, frames: 4, loop: true, speed: 4 },
    sad: { row: 0, frames: 4, loop: true, speed: 2 },    // Reuse Idle
    sick: { row: 0, frames: 4, loop: true, speed: 1 },   // Reuse Idle
    sleep: { row: 0, frames: 4, loop: true, speed: 1 },  // Reuse Idle
    evolve: { row: 0, frames: 4, loop: true, speed: 10 },// Reuse Idle
    dead: { row: 0, frames: 4, loop: true, speed: 1 },   // Reuse Idle
}; */

export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
    'FLAN_BEBE': {
        src: '/assets/sprites/flan_bebe.png?v=2',
        gridSize: 40,
        animations: FLAN_BEBE_ANIMATIONS_V3,
    },
    'FLAN_TEEN': {
        // Placeholder: use baby sprite clean
        src: '/assets/sprites/flan_bebe.png?v=2',
        gridSize: 40,
        animations: FLAN_BEBE_ANIMATIONS_V3,
    },
    'FLAN_ADULT': {
        src: '/assets/sprites/pompompurin.png',
        gridSize: 256,
        animations: POMPOM_ANIMATIONS,
    },
    'POMPOMPURIN': {
        src: '/assets/sprites/pompompurin.png',
        gridSize: 256,
        animations: POMPOM_ANIMATIONS,
    },
    'MUFFIN': {
        src: '/assets/sprites/muffin.png',
        gridSize: 256,
        animations: COMMON_ANIMATIONS_GRID,
    },
    'BAGEL': {
        src: '/assets/sprites/bagel.png',
        gridSize: 256,
        animations: COMMON_ANIMATIONS_GRID,
    },
    'SCONE': {
        src: '/assets/sprites/scone.png',
        gridSize: 256,
        animations: COMMON_ANIMATIONS_GRID,
    },
};

/**
 * Example placeholder sprite configuration using Lorem Picsum.
 * Usage: Replace an existing sprite config with PLACEHOLDER_SPRITE
 * or use it as a fallback.
 */
export const PLACEHOLDER_SPRITE: SpriteConfig = {
    // Generates a consistent 1024x1024 image seeded with 'tamagotchi'
    src: LoremPicsum.getSeeded('tamagotchi', 1024, 1024),
    gridSize: 256,
    animations: COMMON_ANIMATIONS_GRID,
};
