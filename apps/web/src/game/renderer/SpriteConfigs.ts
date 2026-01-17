import type { SpriteConfig } from './SpriteRenderer';

const COMMON_ANIMATIONS = {
    idle: { row: 0, frames: 4, loop: true, speed: 2 },
    walk: { row: 1, frames: 4, loop: true, speed: 4 },
    eat: { row: 2, frames: 4, loop: false, speed: 4 },
    happy: { row: 3, frames: 2, loop: true, speed: 4 },
    sad: { row: 4, frames: 4, loop: true, speed: 2 },
    sick: { row: 5, frames: 4, loop: true, speed: 1 },
    sleep: { row: 6, frames: 2, loop: true, speed: 1 },
    evolve: { row: 0, frames: 4, loop: true, speed: 10 }, // Placeholder, uses Idle fast
};

export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
    'FLAN_BEBE': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png', // Assuming same sprite for now, just scaled or limited? Or uses Flan basic
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'FLAN_TEEN': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'FLAN_ADULT': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'POMPOMPURIN': {
        src: '/assets/tamagotchi_spritesheet_1768544718465.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'MUFFIN': {
        src: '/assets/muffin_spritesheet_1768545516744.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'BAGEL': {
        src: '/assets/bagel_spritesheet_1768545538660.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    },
    'SCONE': {
        src: '/assets/scone_spritesheet_1768545626414.png',
        gridSize: 48,
        animations: COMMON_ANIMATIONS
    }
};
