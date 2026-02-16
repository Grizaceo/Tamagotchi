export type InputCommand = 'LEFT' | 'RIGHT' | 'ENTER' | 'BACK';

const KEY_MAP: Record<string, InputCommand> = {
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Enter: 'ENTER',
  Escape: 'BACK',
};

export function bindInput(onCommand: (command: InputCommand) => void): () => void {
  const handler = (event: KeyboardEvent) => {
    const command = KEY_MAP[event.code];
    if (!command) return;
    event.preventDefault();
    onCommand(command);
  };

  window.addEventListener('keydown', handler);

  const buttons = document.querySelectorAll<HTMLElement>('.ctrl-btn');
  const btnHandler = (e: Event) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const cmd = target.getAttribute('data-cmd') as InputCommand;
    if (cmd) {
      target.classList.add('pressed');
      setTimeout(() => target.classList.remove('pressed'), 100);
      onCommand(cmd);
    }
  };

  buttons.forEach((btn) => {
    btn.addEventListener('pointerdown', btnHandler);
    // Prevent context menu on long press
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  return () => {
    window.removeEventListener('keydown', handler);
    buttons.forEach((btn) => btn.removeEventListener('pointerdown', btnHandler));
  };
}
