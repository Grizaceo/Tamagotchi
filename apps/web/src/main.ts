import { SceneManager } from './game/SceneManager'
import { MainScene } from './game/scenes/MainScene'
import { MinigameSelect } from './game/scenes/MinigameSelect'
import { PuddingGame } from './game/scenes/PuddingGame'
import { MemoryGame } from './game/scenes/MemoryGame'

const canvas = document.querySelector<HTMLCanvasElement>('#screen')!
const manager = new SceneManager(canvas)

manager.registerScene('main', MainScene)
manager.registerScene('minigame-select', MinigameSelect)
manager.registerScene('pudding-game', PuddingGame)
manager.registerScene('memory-game', MemoryGame)

manager.switchScene('main')

let lastTime = 0
function loop(time: number) {
    const delta = time - lastTime
    lastTime = time

    manager.update(delta)
    manager.draw()

    requestAnimationFrame(loop)
}

window.addEventListener('keydown', (e) => manager.handleInput(e))

requestAnimationFrame(loop)

console.log('Game loop started')
