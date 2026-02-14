export type InputCommand = 'LEFT' | 'RIGHT' | 'ENTER' | 'BACK';

const KEY_MAP: Record<string, InputCommand> = {
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Enter: 'ENTER',
  Escape: 'BACK',
};

/**
 * Binds keyboard + on-screen touch buttons to game commands.
 * Returns a cleanup function to unbind everything.
 */
export function bindInput(onCommand: (command: InputCommand) => void): () => void {
  // ── Keyboard ──
  const keyHandler = (event: KeyboardEvent) => {
    const command = KEY_MAP[event.code];
    if (!command) return;
    event.preventDefault();
    onCommand(command);
  };
  window.addEventListener('keydown', keyHandler);

  // ── Touch buttons ──
  const buttons = document.querySelectorAll<HTMLButtonElement>('.ctrl-btn[data-cmd]');
  const touchHandlers: Array<{ el: HTMLButtonElement; start: EventListener; end: EventListener }> = [];

  buttons.forEach((btn) => {
    const cmd = btn.dataset.cmd as InputCommand | undefined;
    if (!cmd) return;

    const fireCommand = () => {
      btn.classList.add('pressed');
      onCommand(cmd);
    };

    const releaseVisual = () => {
      btn.classList.remove('pressed');
    };

    // Pointer events work for both touch and mouse
    btn.addEventListener('pointerdown', fireCommand);
    btn.addEventListener('pointerup', releaseVisual);
    btn.addEventListener('pointerleave', releaseVisual);

    // Prevent context menu on long press
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    touchHandlers.push({ el: btn, start: fireCommand, end: releaseVisual });
  });

  // ── Cleanup ──
  return () => {
    window.removeEventListener('keydown', keyHandler);
    touchHandlers.forEach(({ el, start, end }) => {
      el.removeEventListener('pointerdown', start);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointerleave', end);
    });
  };
}
