export interface SceneContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    onSceneChange: (sceneName: string) => void;
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
