import { describe, it, expect } from 'vitest';
import { createShakeState, startContinuousShake, startPulseShake, stopShake, updateShake } from './camera-shake.js';

describe('camera-shake: idle state', () => {
  it('produces no offset with no shake active', () => {
    const state = createShakeState();
    expect(updateShake(state, 0.1)).toEqual({ x: 0, y: 0 });
  });

  it('produces no offset when magnitude is 0 (cameraShakeIntensity all the way down)', () => {
    const state = createShakeState();
    startContinuousShake(state, 0);
    expect(updateShake(state, 0.1)).toEqual({ x: 0, y: 0 });
  });
});

describe('camera-shake: continuous mode (Chase)', () => {
  it('produces a non-zero offset while active, scaled by magnitude', () => {
    const state = createShakeState();
    startContinuousShake(state, 1);
    const offset = updateShake(state, 0.05);
    expect(offset.x !== 0 || offset.y !== 0).toBe(true);
    expect(Math.abs(offset.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(1);
  });

  it('scales linearly with magnitude', () => {
    const small = createShakeState();
    const large = createShakeState();
    startContinuousShake(small, 0.5);
    startContinuousShake(large, 2);
    const offsetSmall = updateShake(small, 0.2);
    const offsetLarge = updateShake(large, 0.2);
    expect(offsetLarge.x).toBeCloseTo(offsetSmall.x * 4, 5);
  });

  it('keeps going indefinitely until stopShake is called', () => {
    const state = createShakeState();
    startContinuousShake(state, 1);
    for (let i = 0; i < 50; i++) updateShake(state, 0.1);
    expect(state.mode).toBe('continuous');
    stopShake(state);
    expect(updateShake(state, 0.1)).toEqual({ x: 0, y: 0 });
  });
});

describe('camera-shake: pulse mode (Capture)', () => {
  it('decays to zero and turns itself off after durationSec', () => {
    const state = createShakeState();
    startPulseShake(state, 0.5, 4);
    const early = updateShake(state, 0.01);
    expect(Math.abs(early.x) + Math.abs(early.y)).toBeGreaterThan(0);

    const late = updateShake(state, 1); // overshoots the 0.5s duration
    expect(late).toEqual({ x: 0, y: 0 });
    expect(state.mode).toBeNull();
  });

  it('never exceeds the linearly-decaying envelope bound at any sampled point', () => {
    const durationSec = 1;
    const magnitude = 4;
    const state = createShakeState();
    startPulseShake(state, durationSec, magnitude);
    let elapsed = 0;
    const step = 0.05;
    while (elapsed < durationSec) {
      elapsed += step;
      const { x, y } = updateShake(state, step);
      const decay = Math.max(0, 1 - elapsed / durationSec);
      const bound = magnitude * decay * Math.SQRT2 + 1e-9;
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(bound);
    }
  });
});
