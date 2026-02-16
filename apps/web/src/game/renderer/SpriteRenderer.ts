export type AnimationState = 'idle' | 'walk' | 'eat' | 'happy' | 'sad' | 'sick' | 'sleep' | 'evolve';

export interface SpriteConfig {
    src: string;
    gridSize: number; // e.g. 48
    animations: Record<AnimationState, { row: number; frames: number; loop: boolean; speed: number }>;
}

export class AssetManager {
    private images: Record<string, HTMLImageElement> = {};

    async load(key: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    get(key: string): HTMLImageElement | undefined {
        return this.images[key];
    }
}

export class SpriteRenderer {
    private config: SpriteConfig;
    private currentAnim: AnimationState = 'idle';
    private frameIndex: number = 0;
    private frameTimer: number = 0;
    private assetManager: AssetManager;
    private assetKey: string;

    public x: number = 0;
    public y: number = 0;
    public flipX: boolean = false;

    constructor(assetManager: AssetManager, assetKey: string, config: SpriteConfig) {
        this.assetManager = assetManager;
        this.assetKey = assetKey;
        this.config = config;
    }

    setAnimation(anim: AnimationState) {
        if (this.currentAnim !== anim) {
            this.currentAnim = anim;
            this.frameIndex = 0;
            this.frameTimer = 0;
        }
    }

    update(delta: number) {
        const animConfig = this.config.animations[this.currentAnim];
        if (!animConfig) return;

        this.frameTimer += delta;
        // Speed is frames per second, so interval is 1000/speed
        const interval = 1000 / animConfig.speed;

        if (this.frameTimer >= interval) {
            this.frameTimer = 0;
            this.frameIndex++;
            if (this.frameIndex >= animConfig.frames) {
                if (animConfig.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = animConfig.frames - 1; // Stay on last frame
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const img = this.assetManager.get(this.assetKey);
        if (!img) return;

        const animConfig = this.config.animations[this.currentAnim];
        if (!animConfig) return;

        const row = animConfig.row;
        const col = this.frameIndex;
        const size = this.config.gridSize;

        const srcX = col * size;
        const srcY = row * size;

        ctx.save();
        // Pixel art scaling
        ctx.imageSmoothingEnabled = false;

        if (this.flipX) {
            ctx.translate(this.x + size, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, srcX, srcY, size, size, 0, 0, size, size);
        } else {
            ctx.translate(this.x, this.y);
            ctx.drawImage(img, srcX, srcY, size, size, 0, 0, size, size);
        }

        ctx.restore();
    }
}
