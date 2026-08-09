/**
 * Authoritative tunable values, per DATA_MODEL §4. No gameplay value from this table may be
 * hardcoded elsewhere — see CODING_RULES §1.
 */

export const DIFFICULTY_PRESETS = {
  easy: { praharSeconds: 240, hearingRadius: 6, sightRange: 8, sightAngleDeg: 60, patrolSpeed: 1.6, chaseSpeed: 2.6, searchPersistenceSec: 8, hidingDiscoveryChance: 0.15 },
  normal: { praharSeconds: 180, hearingRadius: 8, sightRange: 10, sightAngleDeg: 70, patrolSpeed: 1.9, chaseSpeed: 3.1, searchPersistenceSec: 12, hidingDiscoveryChance: 0.25 },
  hard: { praharSeconds: 135, hearingRadius: 10, sightRange: 12, sightAngleDeg: 80, patrolSpeed: 2.2, chaseSpeed: 3.6, searchPersistenceSec: 16, hidingDiscoveryChance: 0.35 }
};

export const DEFAULT_DIFFICULTY = 'normal';

/** Not difficulty-scoped — only Putli's speed/senses vary by preset above. */
export const PLAYER_MOVEMENT = {
  walkSpeed: 1.8,
  sprintSpeed: 3.4,
  crouchSpeed: 0.9,
  capsuleRadius: 0.3,
  standHeight: 1.75,
  crouchHeight: 1.0,
  crouchTransitionSec: 0.2,
  stepHeight: 0.2,
  gravity: 18,
  staminaMax: 100,
  staminaDrainPerSec: 20,
  staminaRegenPerSec: 12.5,
  staminaMinToSprint: 5,
  mouseSensitivity: 0.15,
  maxPitchDeg: 85,
  crouchNoiseRadius: 1.5,
  walkNoiseRadius: 4,
  sprintNoiseRadius: 8,
  peekMaxYawDeg: 45
};

/** Putli AI timing — not difficulty-scoped, see DATA_MODEL §4. */
export const AI_TIMING = {
  activationGraceSeconds: 45,
  sensorTickIntervalMs: 175,
  investigateTimeoutSec: 6,
  chaseToSearchTimeoutSec: 4,
  captureRadius: 0.75,
  hidingSpotCheckCount: 2,
  captureSequenceSeconds: 2
};

/** GAME_MECHANICS §3 — a noise trap's fixed emission radius, deliberately louder than sprint. */
export const NOISE_TRAP_RADIUS = 10;
