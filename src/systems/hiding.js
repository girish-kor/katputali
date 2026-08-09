/**
 * Hiding-spot enter/exit/peek logic (GAME_MECHANICS §3): entering locks the player at the spot
 * and untargetable-by-sight, but limits look range to a peek arc around the entry facing;
 * one interact press exits. Pure logic, no PlayCanvas dependency — testable per CODING_RULES §10.
 */

export function createHidingState() {
  return { isHiding: false, spotId: null, enterYaw: 0 };
}

export function enterHiding(state, spot, currentYaw) {
  state.isHiding = true;
  state.spotId = spot.id;
  state.enterYaw = currentYaw;
}

export function exitHiding(state) {
  state.isHiding = false;
  state.spotId = null;
}

/** Toggles hiding on interact — exits if already hiding at this spot, else enters it. */
export function toggleHiding(state, spot, currentYaw) {
  if (state.isHiding) {
    exitHiding(state);
    return { entered: false };
  }
  enterHiding(state, spot, currentYaw);
  return { entered: true };
}

/**
 * Clamps a desired look yaw to within maxPeekDeg of the yaw the player was facing when they
 * entered hiding, using the shortest signed angular difference so it wraps correctly at +/-180.
 */
export function clampPeekYaw(enterYaw, desiredYaw, maxPeekDeg) {
  let diff = ((desiredYaw - enterYaw + 540) % 360) - 180;
  const clamped = Math.max(-maxPeekDeg, Math.min(maxPeekDeg, diff));
  return enterYaw + clamped;
}
