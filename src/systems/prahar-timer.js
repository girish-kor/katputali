/**
 * Prahar countdown timer (GAME_MECHANICS §6): 4 real-time Prahars per run; reaching the start
 * of Prahar 5 ends the run. Pure logic, no PlayCanvas dependency — testable per CODING_RULES §10.
 */

export function createPraharState(praharSeconds) {
  return { current: 1, secondsRemaining: praharSeconds, lossTriggered: false };
}

/** @returns {'advanced'|'loss'|null} */
export function updatePrahar(state, dt, praharSeconds) {
  if (state.lossTriggered) return null;

  state.secondsRemaining -= dt;
  if (state.secondsRemaining > 0) return null;

  if (state.current >= 4) {
    state.lossTriggered = true;
    state.secondsRemaining = 0;
    return 'loss';
  }

  state.current++;
  state.secondsRemaining += praharSeconds; // carries over any overshoot from this frame's dt
  return 'advanced';
}

/** Failed-struggle penalty (GAME_MECHANICS §4): subtracts from remaining time, doesn't add elapsed time. */
export function applyPraharPenalty(state, penaltySeconds) {
  state.secondsRemaining -= penaltySeconds;
}
