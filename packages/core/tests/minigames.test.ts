import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { reduce } from '../src/engine/reducer';
import { createAction } from '../src/model/Actions';

describe('Minigame Logic', () => {
    it('should apply rewards for winning a minigame', () => {
        const state = createInitialPetState();
        state.stats.happiness = 50;
        state.stats.affection = 10;

        const action = createAction('PLAY_MINIGAME', 10, { gameId: 'pudding', result: 'win', score: 100 });
        const newState = reduce(state, action);

        // 50 - 0.03 (tick) + 15 (win) = 64.97
        expect(newState.stats.happiness).toBeCloseTo(64.97);
        expect(newState.stats.affection).toBe(15);   // 10 + 5
        expect(newState.minigames.lastPlayed['pudding']).toBe(1); // totalTicks was 0, tick(1) makes it 1
    });

    it('should apply higher rewards for a perfect minigame', () => {
        const state = createInitialPetState();
        state.stats.happiness = 50;
        state.stats.affection = 10;

        const action = createAction('PLAY_MINIGAME', 10, { gameId: 'memory', result: 'perfect', score: 200 });
        const newState = reduce(state, action);

        // 50 - 0.03 (tick) + 25 (perfect) = 74.97
        expect(newState.stats.happiness).toBeCloseTo(74.97);
        expect(newState.stats.affection).toBe(20);   // 10 + 10
    });

    it('should not give rewards if minigame is in cooldown', () => {
        let state = createInitialPetState();
        state.totalTicks = 150;
        state.minigames.lastPlayed['pudding'] = 100;
        state.stats.happiness = 50;

        const action = createAction('PLAY_MINIGAME', 160, { gameId: 'pudding', result: 'win' });
        const newState = reduce(state, action);

        // 150 -> 151 (tick). 151 - 100 = 51. Cooldown is 100.
        // 50 - 0.03 = 49.97
        expect(newState.stats.happiness).toBeCloseTo(49.97);
    });

    it('should allow rewards after cooldown expires', () => {
        let state = createInitialPetState();
        state.totalTicks = 200;
        state.minigames.lastPlayed['pudding'] = 100;
        state.stats.happiness = 50;

        const action = createAction('PLAY_MINIGAME', 210, { gameId: 'pudding', result: 'win' });
        const newState = reduce(state, action);

        // 200 -> 201 (tick). 201 - 100 = 101. Cooldown is 100. OK.
        // 50 - 0.03 + 15 = 64.97
        expect(newState.stats.happiness).toBeCloseTo(64.97);
    });
});
