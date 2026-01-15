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
  return () => window.removeEventListener('keydown', handler);
}
