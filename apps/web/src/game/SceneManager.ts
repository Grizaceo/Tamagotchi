import { Scene } from './scenes/Scene';
import type { SceneContext } from './scenes/Scene';

export class SceneManager {
    private currentScene: Scene | null = null;
    private scenes: Map<string, new (ctx: SceneContext) => Scene> = new Map();
    private context: SceneContext;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        this.context = {
            canvas,
            ctx,
            onSceneChange: (name) => this.switchScene(name),
        };
    }

    registerScene(name: string, sceneClass: new (ctx: SceneContext) => Scene) {
        this.scenes.set(name, sceneClass);
    }

    switchScene(name: string) {
        if (this.currentScene) {
            this.currentScene.destroy();
        }
        const SceneClass = this.scenes.get(name);
        if (!SceneClass) {
            console.error(`Scene ${name} not found`);
            return;
        }
        this.currentScene = new SceneClass(this.context);
        this.currentScene.init();
    }

    update(delta: number) {
        if (this.currentScene) {
            this.currentScene.update(delta);
        }
    }

    draw() {
        if (this.currentScene) {
            this.currentScene.draw();
        }
    }

    handleInput(e: KeyboardEvent) {
        if (this.currentScene) {
            this.currentScene.handleInput(e);
        }
    }
}
