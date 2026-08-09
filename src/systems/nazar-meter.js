/**
 * Nazar (curse) meter (GAME_MECHANICS §5): rises passively over time, spikes on first entry to
 * tainted rooms, mitigated by ward items, and triggers a temporary hallucination at max — purely
 * a tension/misdirection effect, never a loss condition on its own. Pure logic, no PlayCanvas
 * dependency — testable per CODING_RULES §10.
 */

export function createNazarState() {
  return { value: 0, hallucinating: false, hallucinationSecondsRemaining: 0, visitedTaintedRooms: new Set() };
}

/** Passive fill + hallucination countdown. Call once per frame. */
export function updateNazar(state, dt, config) {
  if (state.hallucinating) {
    state.hallucinationSecondsRemaining -= dt;
    if (state.hallucinationSecondsRemaining <= 0) {
      state.hallucinating = false;
      state.hallucinationSecondsRemaining = 0;
      state.value = config.baselineAfterPenalty;
    }
    return;
  }

  state.value = Math.min(config.max, state.value + config.fillPerSecond * dt);
  if (state.value >= config.max) {
    state.hallucinating = true;
    state.hallucinationSecondsRemaining = config.hallucinationSeconds;
  }
}

/** Fixed bump on first visit to a tainted room this run (courtyard puppet-stage, Sohni Bai's room). */
export function enterTaintedRoom(state, roomId, config) {
  if (state.visitedTaintedRooms.has(roomId)) return;
  state.visitedTaintedRooms.add(roomId);
  state.value = Math.min(config.max, state.value + config.taintedRoomIncrement);
}

/** Consumes a ward item to reduce the meter. Returns false if already at 0 (nothing to mitigate). */
export function mitigateWithWard(state, config) {
  if (state.value <= 0) return false;
  state.value = Math.max(0, state.value - config.wardMitigation);
  return true;
}
