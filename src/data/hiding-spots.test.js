import { describe, it, expect } from 'vitest';
import { HIDING_SPOTS, nearestHidingSpots } from './hiding-spots.js';

describe('HIDING_SPOTS', () => {
  it('has exactly 7 spots per LEVEL_DESIGN §7', () => {
    expect(HIDING_SPOTS).toHaveLength(7);
  });
});

describe('nearestHidingSpots', () => {
  it('returns the closest spot first', () => {
    const [nearest] = nearestHidingSpots({ x: 4.1, y: 0, z: 4.1 }, 1);
    expect(nearest.id).toBe('courtyard-pillar-ne');
  });

  it('returns exactly the requested count, ordered by distance', () => {
    const spots = nearestHidingSpots({ x: 0, y: 0, z: 0 }, 2);
    expect(spots).toHaveLength(2);
    const d0 = Math.hypot(spots[0].position.x, spots[0].position.z);
    const d1 = Math.hypot(spots[1].position.x, spots[1].position.z);
    expect(d0).toBeLessThanOrEqual(d1);
  });
});
