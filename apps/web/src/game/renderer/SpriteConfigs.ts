import type { SpriteConfig } from './SpriteRenderer';

// Animation config based on actual spritesheet layout
// Pom Pom Purin spritesheet is 1024x1024 with sprites in ~128px grid (8 columns conceptually)
// But actual sprites occupy left portion with varying frame counts per row
const COMMON_ANIMATIONS = {
    idle: { row: 0, frames: 2, loop: true, speed: 2 },
    walk: { row: 1, frames: 4, loop: true, speed: 4 },
    eat: { row: 2, frames: 4, loop: false, speed: 4 },
    happy: { row: 3, frames: 2, loop: true, speed: 4 },
    sad: { row: 4, frames: 4, loop: true, speed: 2 },
    sick: { row: 5, frames: 4, loop: true, speed: 1 },
    sleep: { row: 6, frames: 2, loop: true, speed: 1 },
    evolve: { row: 0, frames: 2, loop: true, speed: 10 }, // Uses Idle animation
};

// Spritesheets are 1024x1024 with 4 columns of sprites
// Grid size = 1024 / 4 = 256px per cell
const GRID_SIZE = 256;

export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
    'FLAN_BEBE': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'FLAN_TEEN': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'FLAN_ADULT': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'POMPOMPURIN': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'MUFFIN': {
        src: '/assets/muffin_spritesheet_1768545516744.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'BAGEL': {
        src: '/assets/bagel_spritesheet_1768545538660.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    },
    'SCONE': {
        src: '/assets/scone_spritesheet_1768545626414.png',
        gridSize: GRID_SIZE,
        animations: COMMON_ANIMATIONS
    }
};
