import { describe, it, expect } from 'vitest';
import { resolveSprintActive, updateStamina } from './player-stamina.js';

const config = {
  staminaMax: 100,
  staminaDrainPerSec: 20,
  staminaRegenPerSec: 12.5,
  staminaMinToSprint: 5
};

describe('resolveSprintActive', () => {
  it('does not start sprinting when stamina is below the minimum', () => {
    expect(resolveSprintActive(true, false, 3, config)).toBe(false);
  });

  it('starts sprinting when stamina is at or above the minimum', () => {
    expect(resolveSprintActive(true, false, 5, config)).toBe(true);
  });

  it('continues sprinting below the minimum once already sprinting', () => {
    expect(resolveSprintActive(true, true, 1, config)).toBe(true);
  });

  it('stops sprinting the instant stamina hits zero, even mid-sprint', () => {
    expect(resolveSprintActive(true, true, 0, config)).toBe(false);
  });

  it('stops sprinting immediately when the key is released', () => {
    expect(resolveSprintActive(false, true, 50, config)).toBe(false);
  });
});

describe('updateStamina', () => {
  it('drains while sprinting and moving', () => {
    expect(updateStamina(100, true, true, 1, config)).toBeCloseTo(80, 5);
  });

  it('does not drain while sprint is held but the player is not moving', () => {
    expect(updateStamina(100, true, false, 1, config)).toBe(100);
  });

  it('regenerates while not sprinting', () => {
    expect(updateStamina(50, false, true, 1, config)).toBeCloseTo(62.5, 5);
  });

  it('clamps to [0, staminaMax]', () => {
    expect(updateStamina(5, true, true, 1, config)).toBe(0);
    expect(updateStamina(95, false, false, 1, config)).toBe(100);
  });
});
