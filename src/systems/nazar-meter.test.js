import { describe, it, expect } from 'vitest';
import { createNazarState, updateNazar, enterTaintedRoom, mitigateWithWard } from './nazar-meter.js';

const config = { fillPerSecond: 10, taintedRoomIncrement: 15, wardMitigation: 30, max: 100, hallucinationSeconds: 8, baselineAfterPenalty: 40 };

describe('updateNazar: fill rate over time', () => {
  it('rises at fillPerSecond while not hallucinating', () => {
    const state = createNazarState();
    updateNazar(state, 2, config);
    expect(state.value).toBeCloseTo(20, 5);
  });

  it('clamps at max and triggers hallucination exactly once until reset', () => {
    const state = createNazarState();
    updateNazar(state, 20, config); // way past max
    expect(state.value).toBe(config.max);
    expect(state.hallucinating).toBe(true);
    const hallucinatingAt = state.hallucinating;
    updateNazar(state, 0.001, config); // should not re-trigger, already hallucinating
    expect(state.hallucinating).toBe(hallucinatingAt);
  });
});

describe('mitigateWithWard: consumes the ward item and reduces correctly', () => {
  it('reduces the meter by a fixed amount', () => {
    const state = createNazarState();
    state.value = 50;
    expect(mitigateWithWard(state, config)).toBe(true);
    expect(state.value).toBe(20);
  });

  it('never goes below 0', () => {
    const state = createNazarState();
    state.value = 10;
    mitigateWithWard(state, config);
    expect(state.value).toBe(0);
  });

  it('reports failure (no ward consumed) when already at 0', () => {
    const state = createNazarState();
    expect(mitigateWithWard(state, config)).toBe(false);
  });
});

describe('at-max penalty: triggers exactly once until reset', () => {
  it('counts down the hallucination and resets to the lowered baseline, not 0', () => {
    const state = createNazarState();
    state.value = 100;
    state.hallucinating = true;
    state.hallucinationSecondsRemaining = 1;
    updateNazar(state, 1.5, config);
    expect(state.hallucinating).toBe(false);
    expect(state.value).toBe(config.baselineAfterPenalty);
  });

  it('can recur: filling back up to max after the baseline reset triggers it again', () => {
    const state = createNazarState();
    state.value = 100;
    state.hallucinating = true;
    state.hallucinationSecondsRemaining = 0.1;
    updateNazar(state, 0.2, config); // ends hallucination, resets to baseline (40)
    expect(state.hallucinating).toBe(false);
    updateNazar(state, 10, config); // fills back to max (40 + 10*10=140, clamped to 100)
    expect(state.hallucinating).toBe(true);
  });
});

describe('enterTaintedRoom: fixed bump on first visit only', () => {
  it('adds the increment on first entry', () => {
    const state = createNazarState();
    enterTaintedRoom(state, 'courtyard', config);
    expect(state.value).toBe(15);
  });

  it('does not re-trigger on a second visit to the same room this run', () => {
    const state = createNazarState();
    enterTaintedRoom(state, 'courtyard', config);
    enterTaintedRoom(state, 'courtyard', config);
    expect(state.value).toBe(15);
  });

  it('triggers independently for a different tainted room', () => {
    const state = createNazarState();
    enterTaintedRoom(state, 'courtyard', config);
    enterTaintedRoom(state, 'sohni-bais-room', config);
    expect(state.value).toBe(30);
  });

  it('clamps at max', () => {
    const state = createNazarState();
    state.value = 95;
    enterTaintedRoom(state, 'courtyard', config);
    expect(state.value).toBe(100);
  });
});
