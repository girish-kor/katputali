import { describe, it, expect } from 'vitest';
import { rayIntersectAABB, rayIntersectSphere, selectInteractable } from './interaction-math.js';

describe('rayIntersectAABB', () => {
  const box = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } };

  it('hits a box straight ahead', () => {
    const t = rayIntersectAABB({ x: 0, y: 0, z: -5 }, { x: 0, y: 0, z: 1 }, box);
    expect(t).toBeCloseTo(4, 5);
  });

  it('misses a box that is not in the ray path', () => {
    const t = rayIntersectAABB({ x: 5, y: 5, z: -5 }, { x: 0, y: 0, z: 1 }, box);
    expect(t).toBe(Infinity);
  });

  it('misses a box that is behind the ray origin', () => {
    const t = rayIntersectAABB({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: 1 }, box);
    expect(t).toBe(Infinity);
  });
});

describe('rayIntersectSphere', () => {
  it('hits a sphere straight ahead', () => {
    const t = rayIntersectSphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: -5 }, 0.5);
    expect(t).toBeCloseTo(4.5, 5);
  });

  it('misses a sphere off to the side', () => {
    const t = rayIntersectSphere({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 5, y: 0, z: -5 }, 0.5);
    expect(t).toBe(Infinity);
  });
});

describe('selectInteractable', () => {
  const origin = { x: 0, y: 0, z: 0 };
  const forward = { x: 0, y: 0, z: -1 };

  it('selects a candidate within range directly ahead', () => {
    const candidates = [{ id: 'note', position: { x: 0, y: 0, z: -1.5 }, radius: 0.3 }];
    expect(selectInteractable(origin, forward, 1.8, candidates, [])).toBe('note');
  });

  it('returns null when the candidate is beyond the 1.8m interact range', () => {
    const candidates = [{ id: 'note', position: { x: 0, y: 0, z: -3 }, radius: 0.3 }];
    expect(selectInteractable(origin, forward, 1.8, candidates, [])).toBeNull();
  });

  it('returns null when a wall occludes the candidate (no interact-through-walls)', () => {
    const candidates = [{ id: 'note', position: { x: 0, y: 0, z: -1.5 }, radius: 0.3 }];
    const wall = [{ min: { x: -2, y: -2, z: -1 }, max: { x: 2, y: 2, z: -0.9 } }];
    expect(selectInteractable(origin, forward, 1.8, candidates, wall)).toBeNull();
  });

  it('selects the nearer of two candidates in view', () => {
    const candidates = [
      { id: 'far', position: { x: 0, y: 0, z: -1.7 }, radius: 0.2 },
      { id: 'near', position: { x: 0, y: 0, z: -1.0 }, radius: 0.2 }
    ];
    expect(selectInteractable(origin, forward, 1.8, candidates, [])).toBe('near');
  });

  it('ignores a candidate not in the crosshair direction', () => {
    const candidates = [{ id: 'off-to-side', position: { x: 5, y: 0, z: 0 }, radius: 0.3 }];
    expect(selectInteractable(origin, forward, 1.8, candidates, [])).toBeNull();
  });
});
