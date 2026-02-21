
import { describe, it, expect } from 'vitest';
import { deserializeFromJSON } from '../src/persistence/serialize';
import { createInitialPetState } from '../src/model/PetState';

describe('Security: Input Validation', () => {
  it('should sanitize negative counts in SaveData', () => {
    const json = JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      lastSaved: Date.now(),
      totalTicks: 0,
      state: {
        species: 'FLAN_BEBE',
        stats: { hunger: 50, happiness: 50, energy: 50, health: 50, affection: 50 },
        alive: true,
      },
      counts: {
        totalActions: -100, // Invalid
        feed: -5,          // Invalid
        play: 'NaN',       // Invalid type
      },
      history: [],
      settings: {},
    });

    const recovered = deserializeFromJSON(json);

    // Expecting sanitation to default values or clamping
    expect(recovered.counts.totalActions).toBeGreaterThanOrEqual(0);
    expect(recovered.counts.feed).toBeGreaterThanOrEqual(0);
    expect(typeof recovered.counts.play).toBe('number');
    expect(isNaN(recovered.counts.play)).toBe(false);
  });

  it('should sanitize invalid unlockedForms', () => {
    const json = JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      lastSaved: Date.now(),
      totalTicks: 0,
      state: {
        species: 'FLAN_BEBE',
        stats: { hunger: 50, happiness: 50, energy: 50, health: 50, affection: 50 },
        alive: true,
      },
      unlockedForms: ['FLAN_BEBE', 123, '<script>alert(1)</script>'], // Invalid types/content
      history: [],
      settings: {},
    });

    const recovered = deserializeFromJSON(json);

    expect(recovered.unlockedForms).toContain('FLAN_BEBE');
    // Should filter out non-strings or sanitize them?
    // At minimum, it should be an array of strings.
    recovered.unlockedForms.forEach(form => {
      expect(typeof form).toBe('string');
    });
  });

  it('should validate minigame scores', () => {
     const json = JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      lastSaved: Date.now(),
      totalTicks: 0,
      state: {
        species: 'FLAN_BEBE',
        stats: { hunger: 50, happiness: 50, energy: 50, health: 50, affection: 50 },
        alive: true,
        minigames: {
             games: {
                 pudding: { bestScore: 999999999999999, totalPlayed: -1 }
             }
        }
      },
      history: [],
      settings: {},
    });
     const recovered = deserializeFromJSON(json);
     // Scores should probably be reasonable? Or at least numbers.
     // totalPlayed should be >= 0
     expect(recovered.minigames.games.pudding.totalPlayed).toBeGreaterThanOrEqual(0);
  });
});
