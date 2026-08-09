import { describe, it, expect } from 'vitest';
import { checkHearing, checkSight } from './putli-sensors.js';

describe('checkHearing', () => {
  const putli = { x: 0, y: 0, z: 0 };

  it('hears a noise within both the emission radius and hearing radius', () => {
    expect(checkHearing(putli, { x: 3, y: 0, z: 0 }, 4, 8)).toBe(true);
  });

  it('does not hear a noise beyond the emission radius even if within hearing radius', () => {
    expect(checkHearing(putli, { x: 5, y: 0, z: 0 }, 4, 8)).toBe(false);
  });

  it('does not hear a loud noise beyond its own hearing radius (difficulty-scoped)', () => {
    expect(checkHearing(putli, { x: 7, y: 0, z: 0 }, 8, 6)).toBe(false);
  });

  it('a sprinting player is heard farther away than a crouching one, same hearing radius', () => {
    const crouchRadius = 1.5;
    const sprintRadius = 8;
    const hearingRadius = 10;
    const source = { x: 3, y: 0, z: 0 };
    expect(checkHearing(putli, source, crouchRadius, hearingRadius)).toBe(false);
    expect(checkHearing(putli, source, sprintRadius, hearingRadius)).toBe(true);
  });
});

describe('checkSight', () => {
  const putli = { x: 0, y: 0, z: 0 };

  it('sees a target directly ahead (forward yaw 0 faces -Z) within range', () => {
    expect(checkSight(putli, 0, { x: 0, y: 0, z: -5 }, 10, 70, [])).toBe(true);
  });

  it('does not see a target beyond sight range', () => {
    expect(checkSight(putli, 0, { x: 0, y: 0, z: -15 }, 10, 70, [])).toBe(false);
  });

  it('does not see a target outside the sight cone angle', () => {
    // Directly to the side (+X) at yaw 0 (forward -Z) is 90 degrees off — outside a 70 deg cone.
    expect(checkSight(putli, 0, { x: 5, y: 0, z: 0 }, 10, 70, [])).toBe(false);
  });

  it('sees a target inside a wide cone that would be missed by a narrow one', () => {
    const target = { x: 3, y: 0, z: -3 }; // 45 degrees off dead-ahead
    expect(checkSight(putli, 0, target, 10, 60, [])).toBe(false);
    expect(checkSight(putli, 0, target, 10, 100, [])).toBe(true);
  });

  it('never detects through a wall, even at close range (no aimbot detection, AI_SYSTEM §7)', () => {
    const wall = [{ min: { x: -2, y: -1, z: -2 }, max: { x: 2, y: 3, z: -1.9 } }];
    expect(checkSight(putli, 0, { x: 0, y: 0, z: -3 }, 10, 70, wall)).toBe(false);
  });

  it('turning putli to face the target brings it into view', () => {
    const target = { x: 5, y: 0, z: 0 }; // due +X
    expect(checkSight(putli, 0, target, 10, 70, [])).toBe(false);
    expect(checkSight(putli, -90, target, 10, 70, [])).toBe(true);
  });
});
