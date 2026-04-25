import { createInitialPetStateFor } from '../src/model/PetState';
import { createAction } from '../src/model/Actions';
import { tick } from '../src/engine/tick';
import { reduce } from '../src/engine/reducer';
import { CaretakerPlayer } from '../src/balance/player-profiles';

function runCaretaker8h() {
  let state = createInitialPetStateFor('flan');
  let actions = 0;
  const ticks = 8 * 3600;
  for (let t = 0; t < ticks; t++) {
    if (!state.alive) break;
    const act = CaretakerPlayer.decideAction(state);
    if (act) {
        state = reduce(state, createAction(act as any, state.totalTicks));
        actions++;
    } else {
        state = tick(state, 1, false);
    }
  }
  console.log(`8h Survival: ${state.alive ? 'ALIVE' : 'DEAD'}`);
  console.log(`APM: ${actions / (ticks / 60)}`);
  console.log(`Alive: ${state.alive ? 'YES' : 'NO'}`);
}
runCaretaker8h();