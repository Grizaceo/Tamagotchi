/**
 * AudioEngine.ts — Motor de sonido retro "Beepbox" usando Web Audio API nativa.
 * Nivel 2: Feedback rico por tipo de acción + evolución + estados críticos.
 */

export type SoundType =
  // Navegación UI
  | 'ui'
  // Acciones de cuidado específicas
  | 'feed' | 'play' | 'rest' | 'medicate' | 'pet'
  // Eventos especiales
  | 'win'
  | 'die'
  | 'alert'
  | 'evolve';

interface AudioEngine {
  play(type: SoundType): void;
  setEnabled(enabled: boolean): void;
  setReducedMotion(respecting: boolean): void;
}

/**
 * Crea el motor de audio con Web Audio API.
 * Respetamos reducedMotion: algunos usuarios asocian sonido a movimiento.
 */
export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let enabled = true;
  let respectReducedMotion = false;

  function ensureCtx(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  /**
   * Oscilador básico con envolvente ADR simplificada.
   */
  function beep(
    freq: number,
    type: OscillatorType,
    duration: number,
    sweep: number = 0,
    gain: number = 0.15
  ): void {
    if (!enabled) return;
    if (respectReducedMotion) return;

    const audioCtx = ensureCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (sweep !== 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq + sweep),
        audioCtx.currentTime + duration
      );
    }

    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);

    setTimeout(() => {
      osc.disconnect();
      gainNode.disconnect();
    }, duration * 1000 + 100);
  }

  // ── Navegación UI ──
  function playUi(): void {
    beep(880, 'square', 0.06, 200, 0.12);
  }

  // ── Acciones de cuidado específicas ──
  function playFeed(): void {
    // Bloop medio-bajo tipo "comer" (Game Boy bubble)
    const audioCtx = ensureCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 280);
  }

  function playPlay(): void {
    // Chirp rápido saltarín
    const audioCtx = ensureCtx();
    const now = audioCtx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = now + i * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0.12, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.1);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 200);
    });
  }

  function playRest(): void {
    // Suspiro descendente suave
    const audioCtx = ensureCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 450);
  }

  function playMedicate(): void {
    // Clink metálico agudo (curación)
    const audioCtx = ensureCtx();
    const now = audioCtx.currentTime;
    [1200, 1500].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = now + i * 0.04;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0.1, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.08);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 150);
    });
  }

  function playPet(): void {
    // Latido de corazón — dos beeps graves separados
    const audioCtx = ensureCtx();
    const now = audioCtx.currentTime;
    [280, 280].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = now + i * 0.18;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0.14, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 300);
    });
  }

  // ── Eventos especiales ──
  function playWin(): void {
    // Chime ascendente de 3 notas (fanfarria miniatura)
    const audioCtx = ensureCtx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const startTime = audioCtx.currentTime;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = startTime + i * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.3);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 400);
    });
  }

  function playDie(): void {
    // Beep grave descendente — game over
    const audioCtx = ensureCtx();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.6);

    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.8);

    setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 900);
  }

  function playAlert(): void {
    // Doble beep de alerta cuando stats críticos
    const audioCtx = ensureCtx();
    const now = audioCtx.currentTime;
    [880, 880].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = now + i * 0.15;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0.12, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 300);
    });
  }

  function playEvolve(): void {
    // Fanfarria de 5 notas brillante — evolución!
    const audioCtx = ensureCtx();
    const notes = [523.25, 659.25, 783.99, 880, 1046.5]; // C5 E5 G5 A5 C6
    const startTime = audioCtx.currentTime;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const t = startTime + i * 0.1;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.4);

      setTimeout(() => { osc.disconnect(); gainNode.disconnect(); }, 500);
    });
  }

  return {
    play(type: SoundType): void {
      switch (type) {
        case 'ui': playUi(); break;
        case 'feed': playFeed(); break;
        case 'play': playPlay(); break;
        case 'rest': playRest(); break;
        case 'medicate': playMedicate(); break;
        case 'pet': playPet(); break;
        case 'win': playWin(); break;
        case 'die': playDie(); break;
        case 'alert': playAlert(); break;
        case 'evolve': playEvolve(); break;
      }
    },
    setEnabled(val: boolean): void {
      enabled = val;
    },
    setReducedMotion(val: boolean): void {
      respectReducedMotion = val;
    },
  };
}
