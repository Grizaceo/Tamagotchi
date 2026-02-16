import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { reduce } from '../src/engine/reducer';
import { createAction } from '../src/model/Actions';
import { deserialize } from '../src/persistence/serialize';
import type { SaveData } from '../src/model/SaveData';

describe('History DoS Protection', () => {
  it('truncates history when it exceeds 2000 events', () => {
    let state = createInitialPetState();

    // Add 2100 events manually
    for (let i = 0; i < 2100; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
      state.historyStats.totalActions++;
      state.historyStats.actionCounts['FEED'] = (state.historyStats.actionCounts['FEED'] || 0) + 1;
    }

    expect(state.history.length).toBe(2100);

    // Trigger reduce with a new action
    state = reduce(state, createAction('PLAY', 2101));

    // Should be truncated to 2000
    expect(state.history.length).toBe(2000);

    // Should keep the MOST RECENT events
    // Last event should be the PLAY we just did
    expect(state.history[state.history.length - 1].data?.action).toBe('PLAY');
    expect(state.history[state.history.length - 1].timestamp).toBe(2101);

    // Stats should still reflect TOTAL history (2100 + 1)
    expect(state.historyStats.totalActions).toBe(2101);
    expect(state.historyStats.actionCounts['FEED']).toBe(2100);
    expect(state.historyStats.actionCounts['PLAY']).toBe(1);
  });

  it('migrates old save data by calculating stats', () => {
    // Create "old" data without historyStats
    const oldData: any = {
      version: 1,
      state: {
        species: 'FLAN_BEBE',
        stats: { hunger: 0, happiness: 0, energy: 0, health: 0, affection: 0 },
        alive: true,
        minigames: { lastPlayed: {} }
      },
      history: [
        { type: 'STAT_CHANGED', tick: 1, data: { action: 'FEED' } },
        { type: 'STAT_CHANGED', tick: 2, data: { action: 'FEED' } },
        { type: 'STAT_CHANGED', tick: 3, data: { action: 'PLAY' } },
        { type: 'EVOLVED', tick: 10, data: { from: 'FLAN_BEBE', to: 'FLAN_TEEN' } }
      ],
      unlockedGifts: [],
      unlockedAchievements: [],
      album: {},
      settings: { difficulty: 'normal' },
      totalTicks: 100
    };

    const state = deserialize(oldData as SaveData);

    expect(state.historyStats).toBeDefined();
    expect(state.historyStats.totalActions).toBe(3);
    expect(state.historyStats.actionCounts['FEED']).toBe(2);
    expect(state.historyStats.actionCounts['PLAY']).toBe(1);
    expect(state.historyStats.evolvedForms).toContain('FLAN_TEEN');
  });
});
