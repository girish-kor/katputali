/**
 * Camera shake curve math (UI_UX §6: "Adjustable camera shake / effect intensity... reducible
 * for motion sensitivity"). Deterministic sinusoidal oscillation rather than Math.random-driven
 * noise, so it's reproducible and directly unit-testable per CODING_RULES §10 — no PlayCanvas
 * dependency; player-controller.js applies the returned {x, y} as small additive camera-local
 * euler-angle offsets.
 */

export function createShakeState() {
  return { mode: null, elapsedSec: 0, durationSec: 0, magnitude: 0 };
}

/** Continuous low shake for as long as it's active (Chase state) — call stopShake to end it. */
export function startContinuousShake(state, magnitude) {
  state.mode = 'continuous';
  state.magnitude = magnitude;
  state.elapsedSec = 0;
}

/** A single decaying shake pulse (Capture) that turns itself off after `durationSec`. */
export function startPulseShake(state, durationSec, magnitude) {
  state.mode = 'pulse';
  state.durationSec = durationSec;
  state.magnitude = magnitude;
  state.elapsedSec = 0;
}

export function stopShake(state) {
  state.mode = null;
}

/** Advances the shake clock and returns this frame's {x, y} degree offsets. */
export function updateShake(state, dt) {
  if (!state.mode || state.magnitude <= 0) return { x: 0, y: 0 };
  state.elapsedSec += dt;

  if (state.mode === 'pulse') {
    if (state.elapsedSec >= state.durationSec) {
      state.mode = null;
      return { x: 0, y: 0 };
    }
    const decay = 1 - state.elapsedSec / state.durationSec;
    return {
      x: Math.sin(state.elapsedSec * 41) * state.magnitude * decay,
      y: Math.cos(state.elapsedSec * 33) * state.magnitude * decay
    };
  }

  return {
    x: Math.sin(state.elapsedSec * 17) * state.magnitude,
    y: Math.cos(state.elapsedSec * 13) * state.magnitude
  };
}
