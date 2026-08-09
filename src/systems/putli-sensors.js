/**
 * Pure hearing/sight sensor checks for Putli (AI_SYSTEM §3). Kept PlayCanvas-free so they're
 * directly unit-testable per CODING_RULES §10. Evaluated on a throttled tick by ai-putli.js,
 * not every frame (AI_SYSTEM §3, PERFORMANCE §4).
 */

import { rayIntersectAABB } from './interaction-math.js';

/**
 * A noise event (player movement state, a dropped item, a noise-trap tile) is heard if it's
 * within both its own emission radius and Putli's own hearing sensitivity — whichever is
 * smaller is the binding constraint (GAME_MECHANICS §3, DATA_MODEL §4).
 */
export function checkHearing(putliPos, noiseSourcePos, noiseRadius, hearingRadius) {
  const dist = Math.hypot(putliPos.x - noiseSourcePos.x, putliPos.y - noiseSourcePos.y, putliPos.z - noiseSourcePos.z);
  return dist <= Math.min(noiseRadius, hearingRadius);
}

/**
 * Forward-cone sight check with full wall occlusion (AI_SYSTEM §3, §7 — no detection through
 * geometry even at close range). jaali partial-occlusion is a distinct, separately-tagged
 * collider layer per PHYSICS §3, not modeled in M2's grey-box (no jaali screens placed yet).
 */
export function checkSight(putliPos, putliForwardDeg, targetPos, sightRange, sightAngleDeg, wallColliders) {
  const dx = targetPos.x - putliPos.x;
  const dz = targetPos.z - putliPos.z;
  const dist = Math.hypot(dx, dz, targetPos.y - putliPos.y);
  if (dist > sightRange || dist < 1e-6) return false;

  const toTargetDeg = (Math.atan2(-dx, -dz) * 180) / Math.PI;
  let angleDiff = Math.abs(toTargetDeg - putliForwardDeg) % 360;
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  if (angleDiff > sightAngleDeg / 2) return false;

  const dir = { x: dx / dist, y: (targetPos.y - putliPos.y) / dist, z: dz / dist };
  for (const wall of wallColliders) {
    const t = rayIntersectAABB(putliPos, dir, wall);
    if (t < dist) return false;
  }
  return true;
}
