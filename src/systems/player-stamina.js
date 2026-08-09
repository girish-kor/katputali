/**
 * Pure stamina state logic (PHYSICS §4, DATA_MODEL §4 PLAYER_MOVEMENT). Sprint is gated by
 * stamina rather than being a free input toggle: it cannot START below staminaMinToSprint, but
 * once sprinting it may continue all the way down to 0.
 */

/**
 * @param {boolean} wantsSprint - sprint key held
 * @param {boolean} wasSprinting - sprint was already active last frame
 * @param {number} stamina - current stamina, 0..staminaMax
 * @param {{ staminaMinToSprint: number }} config
 * @returns {boolean} whether sprint is active this frame
 */
export function resolveSprintActive(wantsSprint, wasSprinting, stamina, config) {
  if (!wantsSprint || stamina <= 0) return false;
  if (wasSprinting) return true;
  return stamina >= config.staminaMinToSprint;
}

/**
 * @param {number} stamina
 * @param {boolean} isSprinting
 * @param {boolean} isMoving
 * @param {number} dt
 * @param {{ staminaMax: number, staminaDrainPerSec: number, staminaRegenPerSec: number }} config
 * @returns {number} new stamina, clamped to [0, staminaMax]
 */
export function updateStamina(stamina, isSprinting, isMoving, dt, config) {
  let next = stamina;
  if (isSprinting && isMoving) {
    next -= config.staminaDrainPerSec * dt;
  } else {
    next += config.staminaRegenPerSec * dt;
  }
  return Math.max(0, Math.min(config.staminaMax, next));
}
