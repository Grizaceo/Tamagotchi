import { createInitialPetState, reduce, Action, PetState } from '@pompom/core';

class GameCore {
    private state: PetState;
    private listeners: ((state: PetState) => void)[] = [];

    constructor() {
        this.state = createInitialPetState();
    }

    getState() {
        return this.state;
    }

    dispatch(action: Action) {
        this.state = reduce(this.state, action);
        this.notify();
    }

    subscribe(listener: (state: PetState) => void) {
        this.listeners.push(listener);
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }
}

export const gameCore = new GameCore();
