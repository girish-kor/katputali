/**
 * Pure movement/collision math for the kinematic player controller (PHYSICS §2): manual
 * position integration with swept-circle-vs-AABB resolution against static level geometry,
 * no physics-engine forces (PHYSICS §1 rules out Ammo.js/rigidbody). Kept PlayCanvas-free so
 * it's directly unit-testable per CODING_RULES §10.
 */

/**
 * Resolves horizontal (XZ) penetration of a circle against an axis-aligned box by pushing the
 * circle out along the shallowest overlap axis. Returns a {x,z} push vector (zero-length if no
 * overlap or if the circle's Y range doesn't intersect the box's Y range).
 */
export function resolveCirclePenetration(circle, radius, footY, headY, box) {
  if (headY <= box.min.y || footY >= box.max.y) return { x: 0, z: 0 };

  const closestX = Math.max(box.min.x, Math.min(circle.x, box.max.x));
  const closestZ = Math.max(box.min.z, Math.min(circle.z, box.max.z));
  const dx = circle.x - closestX;
  const dz = circle.z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) return { x: 0, z: 0 };

  if (distSq > 1e-9) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    return { x: (dx / dist) * overlap, z: (dz / dist) * overlap };
  }

  // Circle center is inside the box (rare — e.g. spawned inside geometry): push out the
  // shallowest side.
  const penLeft = circle.x - box.min.x;
  const penRight = box.max.x - circle.x;
  const penFront = circle.z - box.min.z;
  const penBack = box.max.z - circle.z;
  const minPen = Math.min(penLeft, penRight, penFront, penBack);
  if (minPen === penLeft) return { x: -(penLeft + radius), z: 0 };
  if (minPen === penRight) return { x: penRight + radius, z: 0 };
  if (minPen === penFront) return { x: 0, z: -(penFront + radius) };
  return { x: 0, z: penBack + radius };
}

/**
 * Resolves player position against a list of wall AABBs over several passes (corners need more
 * than one pass since resolving one wall can reintroduce overlap with another).
 */
export function resolveWalls(position, radius, footY, headY, walls, passes = 3) {
  let x = position.x;
  let z = position.z;
  for (let pass = 0; pass < passes; pass++) {
    for (const wall of walls) {
      const push = resolveCirclePenetration({ x, z }, radius, footY, headY, wall);
      x += push.x;
      z += push.z;
    }
  }
  return { x, z };
}

/**
 * Converts local WASD-style input (forward = W-S, right = D-A) into a world-space XZ direction
 * relative to camera yaw (degrees). Forward at yaw 0 is -Z, matching PlayCanvas's default
 * camera facing. Returns a unit vector (or zero if there's no input).
 */
export function computeWorldMoveDirection(moveForward, moveRight, yawDeg) {
  const len = Math.hypot(moveForward, moveRight);
  if (len < 1e-9) return { x: 0, z: 0 };
  const nf = moveForward / len;
  const nr = moveRight / len;
  const yawRad = (yawDeg * Math.PI) / 180;
  const sin = Math.sin(yawRad);
  const cos = Math.cos(yawRad);
  return {
    x: nr * cos - nf * sin,
    z: -nr * sin - nf * cos
  };
}

/**
 * Steers a 2D position toward a target at a fixed speed, capped so it never overshoots.
 * Shared kinematic-movement helper — used by both player-controller.js and ai-putli.js.
 */
export function stepToward(current, target, speed, dt) {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-6) return { x: current.x, z: current.z, arrived: true };
  const step = Math.min(dist, speed * dt);
  const t = step / dist;
  return { x: current.x + dx * t, z: current.z + dz * t, arrived: step >= dist };
}

/**
 * Finds the highest walkable surface at (x,z) that the player can reach from currentFootY —
 * i.e. its top is at most stepHeight above currentFootY (so it can be climbed as a step-up
 * without dedicated ramp logic; PHYSICS §2), or any height at or below currentFootY (so descending
 * stairs/slopes doesn't require jumping). Surfaces overlapping in XZ across different floors
 * (see level-geometry.js) are correctly disambiguated by this reachability rule alone.
 */
export function findGroundHeight(x, z, currentFootY, stepHeight, roomFloors, stairSteps) {
  let best = null;

  for (const { bounds } of roomFloors) {
    if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue;
    const topY = bounds.floorY;
    if (topY <= currentFootY + stepHeight && (best === null || topY > best)) best = topY;
  }

  for (const step of stairSteps) {
    if (x < step.min.x || x > step.max.x || z < step.min.z || z > step.max.z) continue;
    const topY = step.max.y;
    if (topY <= currentFootY + stepHeight && (best === null || topY > best)) best = topY;
  }

  return best;
}
