/**
 * AmbientEngine.ts — Soundtrack procedural 8-bit para Tamagotchi.
 * Genera arpegios retro continuos con 2 moods: 'home' (alegre) y 'critical' (tenso).
 * Zero assets externos. Web Audio API nativa.
 */

export type AmbientMood = 'home' | 'critical';

interface AmbientEngine {
  start(): void;
  stop(): void;
  setMood(mood: AmbientMood): void;
  setEnabled(enabled: boolean): void;
  setReducedMotion(respecting: boolean): void;
}

/** Escala pentatónica mayor C (alegre). */
const HOME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
/** Escala pentatónica menor A (tenso). */
const CRITICAL_NOTES = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

const BPM = 100;
const SIXTEENTH = 60 / BPM / 4; // ~0.15s

export function createAmbientEngine(): AmbientEngine {
  let ctx: AudioContext | null = null;
  let enabled = true;
  let respectReducedMotion = false;
  let active = false;
  let currentMood: AmbientMood = 'home';
  let nextNoteTime = 0;
  let schedTimer: ReturnType<typeof setTimeout> | null = null;
  let masterGain: GainNode | null = null;
  let stepIndex = 0;

  // Arpegio predefinido (notas de la escala por índice)
  const pattern = [0, 2, 4, 2, 0, 2, 3, 2, 0, 1, 4, 2];

  function ensureCtx(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function notesForMood(mood: AmbientMood): number[] {
    return mood === 'home' ? HOME_NOTES : CRITICAL_NOTES;
  }

  function scheduleNote(time: number, freq: number, duration: number): void {
    if (!ctx || !masterGain) return;
    const osc = ctx.createOscillator();
    const gn = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // Vibrato sutil con LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5, time);
    lfoGain.gain.setValueAtTime(1.5, time);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(time);
    lfo.stop(time + duration);

    gn.gain.setValueAtTime(0, time);
    gn.gain.linearRampToValueAtTime(0.06, time + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gn);
    gn.connect(masterGain);
    osc.start(time);
    osc.stop(time + duration);

    // Cleanup
    const totalMs = (duration + 0.1) * 1000 + 50;
    setTimeout(() => {
      osc.disconnect();
      gn.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
    }, totalMs);
  }

  function scheduler(): void {
    if (!active || !ctx || !masterGain) return;

    const notes = notesForMood(currentMood);
    const lookahead = 0.1; // segundos de lookahead
    const scheduleAhead = 0.3; // cuánto agendamos por delante

    while (nextNoteTime < ctx.currentTime + scheduleAhead) {
      const idx = pattern[stepIndex % pattern.length];
      const freq = notes[idx % notes.length];
      scheduleNote(nextNoteTime, freq, SIXTEENTH * 2);
      nextNoteTime += SIXTEENTH;
      stepIndex++;
    }

    schedTimer = setTimeout(scheduler, lookahead * 1000);
  }

  return {
    start(): void {
      if (!enabled || respectReducedMotion || active) return;
      const audioCtx = ensureCtx();
      active = true;
      if (!masterGain) {
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        // Fade-in
        masterGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 1.0);
      }
      nextNoteTime = audioCtx.currentTime + 0.05;
      stepIndex = 0;
      scheduler();
    },

    stop(): void {
      if (!active) return;
      active = false;
      if (schedTimer) {
        clearTimeout(schedTimer);
        schedTimer = null;
      }
      if (ctx && masterGain) {
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + 0.6);
        setTimeout(() => {
          if (masterGain) {
            masterGain.disconnect();
            masterGain = null;
          }
        }, 700);
      }
    },

    setMood(mood: AmbientMood): void {
      if (currentMood === mood) return;
      currentMood = mood;
      // Cross-fade: bajar masterGain y subir con nuevo mood
      if (active && ctx && masterGain) {
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        masterGain.gain.linearRampToValueAtTime(0.4, now + 1.2);
      }
    },

    setEnabled(val: boolean): void {
      enabled = val;
      if (!val && active) {
        this.stop();
      }
    },

    setReducedMotion(val: boolean): void {
      respectReducedMotion = val;
      if (val && active) {
        this.stop();
      }
    },
  };
}
