/**
 * Noise-trap floor tiles (GAME_MECHANICS §3): fire a fixed loud noise burst on entering the
 * tile's zone, regardless of movement state. Edge-triggered (fires once per entry, not every
 * frame while standing on it). Pure logic, no PlayCanvas dependency — testable per
 * CODING_RULES §10.
 */

export function createNoiseTrapTracker(traps) {
  const insideIds = new Set();

  /** @returns {typeof traps} traps newly entered this call */
  function update(playerPos) {
    const triggered = [];
    for (const trap of traps) {
      const dx = playerPos.x - trap.position.x;
      const dz = playerPos.z - trap.position.z;
      const inside = Math.hypot(dx, dz) <= trap.radius;
      if (inside && !insideIds.has(trap.id)) {
        triggered.push(trap);
      }
      if (inside) insideIds.add(trap.id);
      else insideIds.delete(trap.id);
    }
    return triggered;
  }

  return { update };
}
