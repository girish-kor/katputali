/**
 * Shared finite-state-machine pattern (ARCHITECTURE §4, CODING_RULES §3): an explicit
 * string-enum state list, one `enter(ctx)`/`update(ctx, dt)`/`exit(ctx)` handler set per state,
 * no ad hoc boolean-flag combinations standing in for state. Used by ai-putli and (later)
 * capture-struggle — see AI_SYSTEM §8.
 */

/**
 * @param {Object<string, {enter?: (ctx:any)=>void, update?: (ctx:any, dt:number)=>string|void, exit?: (ctx:any)=>void}>} states
 * @param {string} initialState
 * @param {any} ctx - opaque context object passed to every handler
 */
export function createFSM(states, initialState, ctx) {
  if (!states[initialState]) {
    throw new Error(`createFSM: unknown initial state "${initialState}"`);
  }

  let current = initialState;
  states[current].enter?.(ctx);

  function transition(nextState) {
    if (!states[nextState]) {
      throw new Error(`createFSM: unknown state "${nextState}"`);
    }
    if (nextState === current) return;
    states[current].exit?.(ctx);
    current = nextState;
    states[current].enter?.(ctx);
  }

  function update(dt) {
    const requested = states[current].update?.(ctx, dt);
    if (requested && requested !== current) transition(requested);
  }

  return {
    get state() { return current; },
    update,
    transition
  };
}
