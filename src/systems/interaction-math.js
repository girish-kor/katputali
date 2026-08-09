/**
 * Pure targeting logic for the interaction system (GAME_MECHANICS §1): a forward raycast from
 * the camera, range-limited, that respects line of sight — a wall between the camera and a
 * candidate blocks it, exactly like a real raycast would, rather than a separate LOS check.
 * Kept PlayCanvas-free so it's directly unit-testable per CODING_RULES §10.
 */

/** Ray-vs-AABB slab test. Returns the entry distance t (>=0) or Infinity if there's no hit. */
export function rayIntersectAABB(origin, dir, box) {
  let tMin = 0;
  let tMax = Infinity;

  for (const axis of ['x', 'y', 'z']) {
    const o = origin[axis];
    const d = dir[axis];
    const min = box.min[axis];
    const max = box.max[axis];

    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return Infinity;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }

  return tMin;
}

/** Ray-vs-sphere test (candidates are treated as small spheres for M1's stub). */
export function rayIntersectSphere(origin, dir, center, radius) {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;
  const oz = origin.z - center.z;
  const b = ox * dir.x + oy * dir.y + oz * dir.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : Infinity;
}

/**
 * Finds the nearest interactable candidate hit by a forward ray from origin, within maxRange,
 * that isn't occluded by a closer wall.
 * @param {{x,y,z}} origin
 * @param {{x,y,z}} dir - normalized
 * @param {number} maxRange
 * @param {{id:string, position:{x,y,z}, radius:number}[]} candidates
 * @param {{min:{x,y,z},max:{x,y,z}}[]} wallColliders
 * @returns {string|null} the id of the selected candidate, or null
 */
export function selectInteractable(origin, dir, maxRange, candidates, wallColliders) {
  let nearestWallT = Infinity;
  for (const wall of wallColliders) {
    const t = rayIntersectAABB(origin, dir, wall);
    if (t < nearestWallT) nearestWallT = t;
  }

  let best = null;
  let bestT = Infinity;
  for (const candidate of candidates) {
    const t = rayIntersectSphere(origin, dir, candidate.position, candidate.radius);
    if (t > maxRange || t >= nearestWallT) continue;
    if (t < bestT) {
      bestT = t;
      best = candidate.id;
    }
  }
  return best;
}
