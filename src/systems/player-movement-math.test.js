import { describe, it, expect } from 'vitest';
import { resolveCirclePenetration, resolveWalls, findGroundHeight, computeWorldMoveDirection } from './player-movement-math.js';

describe('computeWorldMoveDirection', () => {
  it('returns zero for no input', () => {
    expect(computeWorldMoveDirection(0, 0, 0)).toEqual({ x: 0, z: 0 });
  });

  it('moves toward -Z (forward) at yaw 0 with only forward input', () => {
    const dir = computeWorldMoveDirection(1, 0, 0);
    expect(dir.x).toBeCloseTo(0, 5);
    expect(dir.z).toBeCloseTo(-1, 5);
  });

  it('produces a unit vector for pure forward, pure strafe, and diagonal input', () => {
    for (const [f, r] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const dir = computeWorldMoveDirection(f, r, 37);
      expect(Math.hypot(dir.x, dir.z)).toBeCloseTo(1, 5);
    }
  });

  it('rotates consistently with yaw (forward and right stay orthogonal)', () => {
    for (const yaw of [0, 45, 90, 180, 270]) {
      const fwd = computeWorldMoveDirection(1, 0, yaw);
      const right = computeWorldMoveDirection(0, 1, yaw);
      const dot = fwd.x * right.x + fwd.z * right.z;
      expect(dot).toBeCloseTo(0, 5);
    }
  });
});

describe('resolveCirclePenetration', () => {
  const wall = { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 3, z: 1 } };

  it('returns zero push when the circle is well clear of the box', () => {
    const push = resolveCirclePenetration({ x: 5, z: 5 }, 0.3, 0, 1.75, wall);
    expect(push).toEqual({ x: 0, z: 0 });
  });

  it('returns zero push when Y ranges do not overlap (below floor / above ceiling)', () => {
    const push = resolveCirclePenetration({ x: 0.9, z: 0 }, 0.3, 5, 6.75, wall);
    expect(push).toEqual({ x: 0, z: 0 });
  });

  it('pushes the circle out along the shallowest axis when overlapping a face', () => {
    // Circle center just outside the box on +x, overlapping by 0.1.
    const push = resolveCirclePenetration({ x: 1.2, z: 0 }, 0.3, 0, 1.75, wall);
    expect(push.x).toBeCloseTo(0.1, 5);
    expect(push.z).toBeCloseTo(0, 5);
  });

  it('pushes a circle stuck in a corner outward diagonally', () => {
    const push = resolveCirclePenetration({ x: 1.2, z: 1.2 }, 0.3, 0, 1.75, wall);
    expect(push.x).toBeGreaterThan(0);
    expect(push.z).toBeGreaterThan(0);
  });

  it('handles the degenerate case where the circle center is inside the box', () => {
    const push = resolveCirclePenetration({ x: 0, z: 0 }, 0.3, 0, 1.75, wall);
    // Should push toward the nearest face, ending up outside the box.
    const resultX = 0 + push.x;
    const resultZ = 0 + push.z;
    const outsideX = resultX <= wall.min.x - 0.3 + 1e-6 || resultX >= wall.max.x + 0.3 - 1e-6;
    const outsideZ = resultZ <= wall.min.z - 0.3 + 1e-6 || resultZ >= wall.max.z + 0.3 - 1e-6;
    expect(outsideX || outsideZ).toBe(true);
  });
});

describe('resolveWalls', () => {
  it('stops the player at a single wall instead of passing through', () => {
    const wall = { min: { x: 0, y: 0, z: -5 }, max: { x: 0.3, y: 3, z: 5 } };
    const resolved = resolveWalls({ x: -0.2, z: 0 }, 0.3, 0, 1.75, [wall]);
    expect(resolved.x).toBeLessThanOrEqual(0);
    expect(resolved.x).toBeCloseTo(-0.3, 5);
  });

  it('resolves a corner formed by two walls without leaving the player inside either', () => {
    const wallA = { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 3, z: 0 } };
    const wallB = { min: { x: -1, y: 0, z: 0 }, max: { x: 0, y: 3, z: 1 } };
    const resolved = resolveWalls({ x: 0.2, z: 0.2 }, 0.3, 0, 1.75, [wallA, wallB]);
    const stillInA = resolveCirclePenetration(resolved, 0.3, 0, 1.75, wallA);
    const stillInB = resolveCirclePenetration(resolved, 0.3, 0, 1.75, wallB);
    expect(Math.hypot(stillInA.x, stillInA.z)).toBeLessThan(0.05);
    expect(Math.hypot(stillInB.x, stillInB.z)).toBeLessThan(0.05);
  });
});

describe('findGroundHeight', () => {
  const roomFloors = [
    { id: 'ground-room', bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5, floorY: 0 } },
    { id: 'first-room', bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5, floorY: 3.3 } }
  ];

  it('finds the flat room floor beneath the player', () => {
    expect(findGroundHeight(0, 0, 0, 0.2, roomFloors, [])).toBe(0);
  });

  it('does not snap up to an overlapping higher floor out of step-up reach', () => {
    // Same XZ footprint on two floors (courtyard below library) — must stay on the lower one.
    expect(findGroundHeight(0, 0, 0, 0.2, roomFloors, [])).toBe(0);
    expect(findGroundHeight(0, 0, 0, 0.2, roomFloors, [])).not.toBe(3.3);
  });

  it('finds a stair step within step-up reach and climbs it incrementally', () => {
    const steps = [
      { min: { x: -1, y: 0, z: -1 }, max: { x: 1, y: 0.165, z: 1 } },
      { min: { x: -1, y: 0.165, z: -1 }, max: { x: 1, y: 0.33, z: 1 } }
    ];
    expect(findGroundHeight(0, 0, 0, 0.2, [], steps)).toBeCloseTo(0.165, 5);
    expect(findGroundHeight(0, 0, 0.165, 0.2, [], steps)).toBeCloseTo(0.33, 5);
  });

  it('returns null when standing over open space with no reachable surface', () => {
    expect(findGroundHeight(100, 100, 0, 0.2, roomFloors, [])).toBeNull();
  });

  it('prefers the highest reachable surface when a stair step and a floor both qualify', () => {
    const steps = [{ min: { x: -1, y: -0.1, z: -1 }, max: { x: 1, y: 0, z: 1 } }];
    expect(findGroundHeight(0, 0, 0, 0.2, roomFloors, steps)).toBe(0);
  });
});
