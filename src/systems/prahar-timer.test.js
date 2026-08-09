import { describe, it, expect } from 'vitest';
import { createPraharState, updatePrahar, applyPraharPenalty } from './prahar-timer.js';

describe('updatePrahar: countdown accuracy', () => {
  it('counts down by dt each call', () => {
    const state = createPraharState(180);
    updatePrahar(state, 30, 180);
    expect(state.secondsRemaining).toBeCloseTo(150, 5);
  });

  it('advances to the next Prahar when time runs out, carrying over the overshoot', () => {
    const state = createPraharState(180);
    state.secondsRemaining = 1;
    const result = updatePrahar(state, 3, 180); // overshoots by 2
    expect(result).toBe('advanced');
    expect(state.current).toBe(2);
    expect(state.secondsRemaining).toBeCloseTo(178, 5);
  });
});

describe('applyPraharPenalty: failed struggle subtracts remaining time, not elapsed time', () => {
  it('reduces secondsRemaining by the fixed penalty', () => {
    const state = createPraharState(180);
    applyPraharPenalty(state, 30);
    expect(state.secondsRemaining).toBe(150);
  });

  it('a penalty that exceeds remaining time correctly triggers advance/loss on the next update', () => {
    const state = createPraharState(180);
    state.current = 4;
    state.secondsRemaining = 10;
    applyPraharPenalty(state, 30);
    expect(updatePrahar(state, 0.001, 180)).toBe('loss');
  });
});

describe('Prahar-5 loss trigger fires exactly once', () => {
  it('returns loss when Prahar 4 expires, and never again after', () => {
    const state = createPraharState(180);
    state.current = 4;
    state.secondsRemaining = 1;
    expect(updatePrahar(state, 2, 180)).toBe('loss');
    expect(state.lossTriggered).toBe(true);
    expect(updatePrahar(state, 100, 180)).toBeNull();
    expect(updatePrahar(state, 100, 180)).toBeNull();
  });

  it('clamps secondsRemaining to 0 on loss, never negative', () => {
    const state = createPraharState(180);
    state.current = 4;
    state.secondsRemaining = 1;
    updatePrahar(state, 50, 180);
    expect(state.secondsRemaining).toBe(0);
  });
});

describe('full run progression', () => {
  it('advances through all 4 Prahars before triggering loss', () => {
    const state = createPraharState(180);
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(updatePrahar(state, 180, 180));
    }
    expect(results).toEqual(['advanced', 'advanced', 'advanced', 'loss']);
    expect(state.current).toBe(4);
  });
});
