import './style.css';
import { startGameLoop } from './game/GameLoop';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
if (!canvas) {
  throw new Error('Canvas #screen not found');
}

startGameLoop(canvas).then(stop => {
  if (import.meta.hot) {
    import.meta.hot.dispose(() => stop());
  }
});
