export interface MinigameResult {
  gameId: 'pudding' | 'memory';
  result: 'win' | 'perfect' | 'loss';
  score?: number;
}

export interface SceneContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    onSceneChange: (sceneName: string) => void;
    onGameComplete?: (result: MinigameResult) => void;
}

export abstract class Scene {
    protected context: SceneContext;

    constructor(context: SceneContext) {
        this.context = context;
    }

    abstract init(): void;
    abstract update(delta: number): void;
    abstract draw(): void;
    abstract handleInput(e: KeyboardEvent): void;

    // Opcional: limpiar al salir de la escena
    destroy(): void { }
}
