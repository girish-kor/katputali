/**
 * Capture & struggle system (GAME_MECHANICS §4, CONTROLS §4). Pure logic, no PlayCanvas
 * dependency — testable per CODING_RULES §10.
 *
 * Flow: capture 1-2 -> struggle QTE -> success releases, or one automatic retry on failure ->
 * a second failure still releases (never an instant unrecoverable loss on its own) but adds a
 * Prahar time penalty. Capture 3 is immediately fatal, no struggle chance.
 */

export function createCaptureState() {
  return { captureCount: 0 };
}

/** @returns {{ outcome: 'fatal' }|{ outcome: 'struggle' }} */
export function beginCapture(state) {
  state.captureCount++;
  if (state.captureCount >= 3) return { outcome: 'fatal' };
  return { outcome: 'struggle' };
}

export function createStruggleState() {
  return { active: false, timeRemaining: 0, correctCount: 0, lastKey: null, retryUsed: false };
}

export function startStruggle(struggle, windowSeconds) {
  struggle.active = true;
  struggle.timeRemaining = windowSeconds;
  struggle.correctCount = 0;
  struggle.lastKey = null;
}

/**
 * Registers a raw struggle key-down (CONTROLS §4): same-key repeats without an intervening
 * opposite key don't count, preventing simple mashing/macro exploitation of a single key.
 * @param {'left'|'right'} key
 */
export function registerStruggleInput(struggle, key) {
  if (!struggle.active) return;
  if (struggle.lastKey === key) return;
  struggle.lastKey = key;
  struggle.correctCount++;
}

/** @returns {'success'|'failure'|null} null while still in progress */
export function updateStruggle(struggle, dt, successThreshold) {
  if (!struggle.active) return null;
  if (struggle.correctCount >= successThreshold) {
    struggle.active = false;
    return 'success';
  }
  struggle.timeRemaining -= dt;
  if (struggle.timeRemaining <= 0) {
    struggle.active = false;
    return 'failure';
  }
  return null;
}

/**
 * Resolves what happens after a struggle result. First failure grants one automatic retry
 * (caller should call startStruggle again); any other outcome releases the player.
 * @returns {{ released: true, penalty: boolean, retry?: false }|{ released: false, retry: true }}
 */
export function resolveStruggleOutcome(struggle, result) {
  if (result === 'success') return { released: true, penalty: false };
  if (!struggle.retryUsed) {
    struggle.retryUsed = true;
    return { released: false, retry: true };
  }
  return { released: true, penalty: true };
}

/** Fixed safe re-entry rooms per LEVEL_DESIGN §7's M4 addition, with world positions for distance selection. */
export const SAFE_ROOMS = [
  { roomId: 'entrance-hall', position: { x: 0, y: 0, z: -9 } },
  { roomId: 'guard-room', position: { x: 7.5, y: 0, z: 0 } },
  { roomId: 'library', position: { x: 0, y: 3.3, z: 0 } },
  { roomId: 'stepwell', position: { x: 0, y: -3.3, z: 0 } }
];

/** Nearest safe room to the capture position, excluding whichever room the capture happened in. */
export function selectRespawnRoom(capturePosition, captureRoomId, safeRooms = SAFE_ROOMS) {
  const candidates = safeRooms.filter(r => r.roomId !== captureRoomId);
  const pool = candidates.length > 0 ? candidates : safeRooms;
  let best = pool[0];
  let bestDist = Infinity;
  for (const room of pool) {
    const d = Math.hypot(
      room.position.x - capturePosition.x,
      room.position.y - capturePosition.y,
      room.position.z - capturePosition.z
    );
    if (d < bestDist) {
      bestDist = d;
      best = room;
    }
  }
  return best;
}
