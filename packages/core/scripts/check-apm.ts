import { createInitialPetStateFor } from '../src/model/PetState';
import { createAction } from '../src/model/Actions';
import { tick } from '../src/engine/tick';
import { reduce } from '../src/engine/reducer';
import { CaretakerPlayer, PerfectPlayer, PassivePlayer, ForgottenPlayer } from '../src/balance/player-profiles';

function runProfile(player: any, ticks = 3600) {
  let state = createInitialPetStateFor('flan');
  let actions = 0;
  for (let t = 0; t < ticks; t++) {
    if (!state.alive) break;
    const act = player.decideAction(state);
    if (act) {
        state = reduce(state, createAction(act as any, state.totalTicks));
        actions++;
    } else {
        state = tick(state, 1, false);
    }
  }
  return actions / (ticks / 60);
}

console.log(`Perfect   APM: ${runProfile(PerfectPlayer).toFixed(2)}`);
console.log(`Caretaker APM: ${runProfile(CaretakerPlayer).toFixed(2)}`);
console.log(`Passive   APM: ${runProfile(PassivePlayer).toFixed(2)}`);
console.log(`Forgotten APM: ${runProfile(ForgottenPlayer).toFixed(2)}`);
