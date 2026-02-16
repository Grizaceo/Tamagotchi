export type AnimationState = 'idle' | 'walk' | 'eat' | 'happy' | 'sad' | 'sick' | 'sleep' | 'evolve' | 'dead';

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

        this.drawFrameInternal(ctx, img, animConfig, this.frameIndex, this.x, this.y, this.displaySize, this.flipX);
    }

    /**
     * Draw a specific frame of an animation at a given position/size.
     * Useful for UI icons (e.g. stat bars).
     */
    drawFrame(
        ctx: CanvasRenderingContext2D,
        anim: AnimationState,
        frameIndex: number,
        x: number,
        y: number,
        size: number,
        flipX: boolean = false
    ) {
        const img = this.assetManager.get(this._assetKey);
        const animConfig = this.config.animations[anim];
        if (!img || !animConfig) return;

        // Clamp frame index
        const actualFrame = Math.max(0, Math.min(frameIndex, animConfig.frames - 1));
        this.drawFrameInternal(ctx, img, animConfig, actualFrame, x, y, size, flipX);
    }

    private drawFrameInternal(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        animConfig: AnimationDef,
        frameIndex: number,
        x: number,
        y: number,
        displaySize: number,
        flipX: boolean
    ) {
        // Determine source rectangle
        let srcX: number;
        let srcY: number;
        let srcW: number;
        let srcH: number;

        if (animConfig.frameRects && animConfig.frameRects[frameIndex]) {
            // Explicit per-frame rect — highest priority
            const rect = animConfig.frameRects[frameIndex];
            srcX = rect.x;
            srcY = rect.y;
            srcW = rect.w;
            srcH = rect.h;
        } else {
            // Grid-based calculation
            const colW = this.config.gridSize;
            const rowH = this.config.rowHeight ?? this.config.gridSize;
            const startCol = animConfig.col ?? 0;
            srcX = (startCol + frameIndex) * colW;
            srcY = animConfig.row * rowH;
            srcW = colW;
            srcH = rowH;

            // Debug log once per second-ish to avoid spam, or checking specific condition
            if (Math.random() < 0.01) {
                console.log(`[SpriteRenderer Debug] asset=${this._assetKey} frame=${frameIndex} gridSize=${colW} srcRect=[${srcX}, ${srcY}, ${srcW}, ${srcH}] imgSize=[${img.width}, ${img.height}]`);
            }
        }

        // Calculate display size maintaining aspect ratio
        const aspect = srcW / srcH;
        let drawW: number;
        let drawH: number;
        if (aspect >= 1) {
            drawW = displaySize;
            drawH = displaySize / aspect;
        } else {
            drawH = displaySize;
            drawW = displaySize * aspect;
        }
        // Center within the displaySize box
        const offsetX = (displaySize - drawW) / 2;
        const offsetY = (displaySize - drawH) / 2;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (flipX) {
            ctx.translate(x + displaySize, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH);
        } else {
            ctx.translate(x, y);
            ctx.drawImage(img, srcX, srcY, srcW, srcH, offsetX, offsetY, drawW, drawH);
        }

        ctx.restore();
    }
}

