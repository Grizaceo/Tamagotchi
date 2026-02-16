import { describe, it, expect } from 'vitest';
import { deserialize } from '../src/persistence/serialize';

describe('Migration', () => {
  it('should migrate v1 data to v2 (counts and unlockedForms)', () => {
    const v1Data: any = {
      version: 1,
      state: {
        species: 'FLAN_ADULT',
        stats: { hunger: 50, happiness: 50, energy: 50, health: 50, affection: 50 },
        alive: true,
        minigames: { lastPlayed: {}, games: {} },
      },
      history: [
        { type: 'STAT_CHANGED', tick: 1, data: { action: 'FEED' } },
        { type: 'STAT_CHANGED', tick: 2, data: { action: 'FEED' } },
        { type: 'STAT_CHANGED', tick: 3, data: { action: 'PLAY' } },
        { type: 'EVOLVED', tick: 100, data: { from: 'FLAN_BEBE', to: 'FLAN_TEEN' } },
        { type: 'EVOLVED', tick: 300, data: { from: 'FLAN_TEEN', to: 'FLAN_ADULT' } },
      ],
      unlockedGifts: [],
      unlockedAchievements: [],
      album: {},
      settings: { difficulty: 'normal' },
    };

    const state = deserialize(v1Data);

    expect(state.counts).toBeDefined();
    expect(state.counts.feed).toBe(2);
    expect(state.counts.play).toBe(1);
    expect(state.counts.totalActions).toBe(3);

    expect(state.unlockedForms).toContain('FLAN_BEBE'); // Default
    expect(state.unlockedForms).toContain('FLAN_TEEN');
    expect(state.unlockedForms).toContain('FLAN_ADULT');
  });

  it('should truncate history but preserve counts', () => {
      const history = [];
      for(let i=0; i<100; i++) {
          history.push({ type: 'STAT_CHANGED', tick: i, data: { action: 'FEED' } });
      }

      const v1Data: any = {
      version: 1,
      state: {
        species: 'FLAN_ADULT',
        stats: { hunger: 50, happiness: 50, energy: 50, health: 50, affection: 50 },
        alive: true,
      },
      history: history,
      settings: {},
    };

    const state = deserialize(v1Data);

    // History should be truncated to last 50
    expect(state.history.length).toBe(50);
    // Counts should be calculated from FULL history (100) before truncation
    expect(state.counts.feed).toBe(100);
  });
});
