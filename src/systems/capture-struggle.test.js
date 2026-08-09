import { describe, it, expect } from 'vitest';
import {
  createCaptureState, beginCapture,
  createStruggleState, startStruggle, registerStruggleInput, updateStruggle, resolveStruggleOutcome,
  selectRespawnRoom, SAFE_ROOMS
} from './capture-struggle.js';

describe('beginCapture: 3rd-capture-is-fatal branch', () => {
  it('grants a struggle chance on the 1st and 2nd captures', () => {
    const state = createCaptureState();
    expect(beginCapture(state)).toEqual({ outcome: 'struggle' });
    expect(beginCapture(state)).toEqual({ outcome: 'struggle' });
  });

  it('is immediately fatal on the 3rd capture, no struggle chance', () => {
    const state = createCaptureState();
    beginCapture(state);
    beginCapture(state);
    expect(beginCapture(state)).toEqual({ outcome: 'fatal' });
  });
});

describe('struggle QTE: alternating-input validation (CONTROLS §4)', () => {
  it('counts alternating left/right presses', () => {
    const struggle = createStruggleState();
    startStruggle(struggle, 5);
    registerStruggleInput(struggle, 'left');
    registerStruggleInput(struggle, 'right');
    registerStruggleInput(struggle, 'left');
    expect(struggle.correctCount).toBe(3);
  });

  it('rejects same-key repeats without an intervening opposite key (anti-mash)', () => {
    const struggle = createStruggleState();
    startStruggle(struggle, 5);
    registerStruggleInput(struggle, 'left');
    registerStruggleInput(struggle, 'left');
    registerStruggleInput(struggle, 'left');
    expect(struggle.correctCount).toBe(1);
  });

  it('ignores input while inactive', () => {
    const struggle = createStruggleState();
    registerStruggleInput(struggle, 'left');
    expect(struggle.correctCount).toBe(0);
  });
});

describe('struggle success/failure threshold logic', () => {
  it('succeeds the instant the threshold is reached', () => {
    const struggle = createStruggleState();
    startStruggle(struggle, 5);
    for (const key of ['left', 'right', 'left']) registerStruggleInput(struggle, key);
    expect(updateStruggle(struggle, 0.1, 3)).toBe('success');
  });

  it('fails when the window runs out before reaching the threshold', () => {
    const struggle = createStruggleState();
    startStruggle(struggle, 1);
    registerStruggleInput(struggle, 'left');
    expect(updateStruggle(struggle, 1.1, 6)).toBe('failure');
  });

  it('returns null while still in progress', () => {
    const struggle = createStruggleState();
    startStruggle(struggle, 5);
    expect(updateStruggle(struggle, 0.1, 6)).toBeNull();
  });
});

describe('resolveStruggleOutcome: retry-once-then-release, never an instant unrecoverable loss', () => {
  it('releases with no penalty on success', () => {
    const struggle = createStruggleState();
    expect(resolveStruggleOutcome(struggle, 'success')).toEqual({ released: true, penalty: false });
  });

  it('grants exactly one automatic retry on first failure', () => {
    const struggle = createStruggleState();
    expect(resolveStruggleOutcome(struggle, 'failure')).toEqual({ released: false, retry: true });
    expect(struggle.retryUsed).toBe(true);
  });

  it('releases with a Prahar penalty on the second failure — never blocks forever', () => {
    const struggle = createStruggleState();
    resolveStruggleOutcome(struggle, 'failure'); // uses the retry
    expect(resolveStruggleOutcome(struggle, 'failure')).toEqual({ released: true, penalty: true });
  });
});

describe('selectRespawnRoom: never the capture room, nearest of the fixed set', () => {
  it('never returns the room the player was captured in', () => {
    const capturePos = { x: 7.5, y: 0, z: 0 }; // exactly guard-room's position
    const room = selectRespawnRoom(capturePos, 'guard-room');
    expect(room.roomId).not.toBe('guard-room');
  });

  it('picks the nearest remaining candidate', () => {
    const capturePos = { x: 6.5, y: 0, z: 0 }; // close to guard-room, guard-room excluded
    const room = selectRespawnRoom(capturePos, 'guard-room');
    // Next closest after excluding guard-room should be entrance-hall or library, not stepwell
    // (stepwell is on a different floor, y=-3.3 — much farther in this metric).
    expect(room.roomId).not.toBe('stepwell');
  });

  it('falls back to the full set if the capture room somehow is not in the safe list', () => {
    const room = selectRespawnRoom({ x: 0, y: 0, z: 0 }, 'courtyard');
    expect(SAFE_ROOMS.map(r => r.roomId)).toContain(room.roomId);
  });
});
