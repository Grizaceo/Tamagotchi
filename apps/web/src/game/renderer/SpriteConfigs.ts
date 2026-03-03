import type { SpriteConfig, AnimationDef, AnimationState } from './SpriteRenderer';
import { LoremPicsum } from '../utils/LoremPicsum';

const B = import.meta.env.BASE_URL;

function singleRowAnimations(frames: number): Record<AnimationState, AnimationDef> {
  return {
    idle: { row: 0, frames, loop: true, speed: 2 },
    walk: { row: 0, frames, loop: true, speed: 4 },
    eat: { row: 0, frames, loop: false, speed: 4 },
    happy: { row: 0, frames, loop: true, speed: 4 },
    sad: { row: 0, frames, loop: true, speed: 2 },
    sick: { row: 0, frames, loop: true, speed: 1 },
    sleep: { row: 0, frames, loop: true, speed: 1 },
    evolve: { row: 0, frames, loop: true, speed: 8 },
    dead: { row: 0, frames, loop: true, speed: 1 },
  };
}

export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
  // FIU line
  FIU_EGG: { src: `${B}assets/sprites/fiu/egg.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FIU_BABY: { src: `${B}assets/sprites/fiu/baby.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FIU_TEEN: { src: `${B}assets/sprites/fiu/teen.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FIU_PERFECT: { src: `${B}assets/sprites/fiu/perfect.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FIU_COMMON: { src: `${B}assets/sprites/fiu/common.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FIU_FAIL: { src: `${B}assets/sprites/fiu/fail.png`, gridSize: 128, animations: singleRowAnimations(3) },

  // Salchicha line
  SALCHICHA_EGG: { src: `${B}assets/sprites/salchicha/egg.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SALCHICHA_BABY: { src: `${B}assets/sprites/salchicha/baby.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SALCHICHA_TEEN: { src: `${B}assets/sprites/salchicha/teen.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SALCHICHA_PERFECT: { src: `${B}assets/sprites/salchicha/perfect.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SALCHICHA_BROWN: { src: `${B}assets/sprites/salchicha/brown.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SALCHICHA_FAIL: { src: `${B}assets/sprites/salchicha/fail.png`, gridSize: 128, animations: singleRowAnimations(4) },

  // Flan / PomPomPurin line
  FLAN_BEBE: { src: `${B}assets/sprites/flan/bebe.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FLAN_TEEN: { src: `${B}assets/sprites/flan/teen.png`, gridSize: 128, animations: singleRowAnimations(4) },
  FLAN_ADULT: { src: `${B}assets/sprites/flan/adult.png`, gridSize: 128, animations: singleRowAnimations(3) },
  POMPOMPURIN: { src: `${B}assets/sprites/flan/pompompurin.png`, gridSize: 128, animations: singleRowAnimations(3) },
  BAGEL: { src: `${B}assets/sprites/flan/bagel.png`, gridSize: 128, animations: singleRowAnimations(3) },
  MUFFIN: { src: `${B}assets/sprites/flan/muffin.png`, gridSize: 128, animations: singleRowAnimations(3) },
  SCONE: { src: `${B}assets/sprites/flan/scone.png`, gridSize: 128, animations: singleRowAnimations(4) },

  // Seal line
  SEAL_EGG: { src: `${B}assets/sprites/seal/egg.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SEAL_BABY: { src: `${B}assets/sprites/seal/baby.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SEAL_TEEN: { src: `${B}assets/sprites/seal/teen.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SEAL_PERFECT: { src: `${B}assets/sprites/seal/perfect.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SEAL_BROWN: { src: `${B}assets/sprites/seal/brown.png`, gridSize: 128, animations: singleRowAnimations(4) },
  SEAL_FAIL: { src: `${B}assets/sprites/seal/fail.png`, gridSize: 128, animations: singleRowAnimations(3) },
};

export const PLACEHOLDER_SPRITE: SpriteConfig = {
  src: LoremPicsum.getSeeded('tamagotchi', 1024, 1024),
  gridSize: 256,
  animations: singleRowAnimations(4),
};
