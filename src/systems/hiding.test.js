import { describe, it, expect } from 'vitest';
import { createHidingState, enterHiding, exitHiding, toggleHiding, clampPeekYaw } from './hiding.js';

const spot = { id: 'guard-room-almirah' };

describe('enter/exit hiding', () => {
  it('enters hiding at the given spot, recording the entry yaw', () => {
    const state = createHidingState();
    enterHiding(state, spot, 30);
    expect(state.isHiding).toBe(true);
    expect(state.spotId).toBe('guard-room-almirah');
    expect(state.enterYaw).toBe(30);
  });

  it('exits hiding, clearing the spot', () => {
    const state = createHidingState();
    enterHiding(state, spot, 30);
    exitHiding(state);
    expect(state.isHiding).toBe(false);
    expect(state.spotId).toBeNull();
  });
});

describe('toggleHiding (single interact button, GAME_MECHANICS §3/CONTROLS §1)', () => {
  it('enters on first interact, exits on second', () => {
    const state = createHidingState();
    expect(toggleHiding(state, spot, 0)).toEqual({ entered: true });
    expect(state.isHiding).toBe(true);
    expect(toggleHiding(state, spot, 0)).toEqual({ entered: false });
    expect(state.isHiding).toBe(false);
  });
});

describe('clampPeekYaw', () => {
  it('passes through a desired yaw within the peek range unchanged', () => {
    expect(clampPeekYaw(0, 20, 45)).toBeCloseTo(20, 5);
  });

  it('clamps a desired yaw beyond the peek range to the max offset', () => {
    expect(clampPeekYaw(0, 90, 45)).toBeCloseTo(45, 5);
    expect(clampPeekYaw(0, -90, 45)).toBeCloseTo(-45, 5);
  });

  it('handles wraparound near +/-180 degrees correctly', () => {
    expect(clampPeekYaw(170, 190, 45)).toBeCloseTo(190, 5); // 20deg off, within range
    expect(clampPeekYaw(170, -170, 45)).toBeCloseTo(190, 5); // -170 is 20deg past 180 from 170
  });

  it('is a no-op when maxPeekDeg is 0 (locked dead ahead)', () => {
    expect(clampPeekYaw(50, 100, 0)).toBeCloseTo(50, 5);
  });
});
