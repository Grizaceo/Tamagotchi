export type AnimationState = 'idle' | 'walk' | 'eat' | 'happy' | 'sad' | 'sick' | 'sleep' | 'evolve';

/** Explicit source rectangle for one frame inside a sprite sheet. */
export interface FrameRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface AnimationDef {
    row: number;
    /** Starting column offset (default 0). */
    col?: number;
    frames: number;
    loop: boolean;
    speed: number;
    /** Optional explicit source rects — overrides grid calculation when present. */
    frameRects?: FrameRect[];
}

export interface SpriteConfig {
    src: string;
    /** Column width in the sprite sheet (horizontal spacing). */
    gridSize: number;
    /** Row height in the sprite sheet (vertical spacing). Defaults to gridSize. */
    rowHeight?: number;
    animations: Record<AnimationState, AnimationDef>;
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
            img.onerror = (e) => {
                console.error(`[AssetManager] Failed to load ${key} from ${src}`, e);
                reject(e);
            };
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
    private _assetKey: string;

    public x: number = 0;
    public y: number = 0;
    public flipX: boolean = false;
    /** Display size on canvas (sprites are scaled from gridSize to this) */
    public displaySize: number = 96;

    constructor(assetManager: AssetManager, assetKey: string, config: SpriteConfig) {
        this.assetManager = assetManager;
        this._assetKey = assetKey;
        this.config = config;
    }

    get assetKey(): string {
        return this._assetKey;
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
        const img = this.assetManager.get(this._assetKey);
        if (!img) {
            return;
        }

        const animConfig = this.config.animations[this.currentAnim];
        if (!animConfig) {
            return;
        }

        // Determine source rectangle
        let srcX: number;
        let srcY: number;
        let srcW: number;
        let srcH: number;

        if (animConfig.frameRects && animConfig.frameRects[this.frameIndex]) {
            // Explicit per-frame rect — highest priority
            const rect = animConfig.frameRects[this.frameIndex];
            srcX = rect.x;
            srcY = rect.y;
            srcW = rect.w;
            srcH = rect.h;
        } else {
            // Grid-based calculation
            const colW = this.config.gridSize;
            const rowH = this.config.rowHeight ?? this.config.gridSize;
            const startCol = animConfig.col ?? 0;
            srcX = (startCol + this.frameIndex) * colW;
            srcY = animConfig.row * rowH;
            srcW = colW;
            srcH = rowH;
        }

        // Calculate display size maintaining aspect ratio
        const aspect = srcW / srcH;
        let drawW: number;
        let drawH: number;
        if (aspect >= 1) {
            drawW = this.displaySize;
            drawH = this.displaySize / aspect;
        } else {
            drawH = this.displaySize;
            drawW = this.displaySize * aspect;
        }
        // Center within the displaySize box
        const offsetX = (this.displaySize - drawW) / 2;
        const offsetY = (this.displaySize - drawH) / 2;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (this.flipX) {
            ctx.translate(this.x + this.displaySize, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH);
        } else {
            ctx.translate(this.x, this.y);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH);
        }

        ctx.restore();
    }
}
