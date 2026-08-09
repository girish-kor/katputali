import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KEY_V } from 'playcanvas';
import { createRunManager } from './run-state.js';
import { createInventory } from './inventory.js';
import { CAPTURE_TIMING, NAZAR_TIMING, DIFFICULTY_PRESETS } from '../data/difficulty-presets.js';
import * as events from '../core/events.js';

function makeKeyboard() {
  const pressedThisFrame = new Set();
  return {
    press(key) { pressedThisFrame.add(key); },
    wasPressed(key) {
      const was = pressedThisFrame.has(key);
      pressedThisFrame.delete(key); // edge-triggered, like the real PlayCanvas keyboard
      return was;
    }
  };
}

/** Mirrors input-map.js's isDown/wasPressed contract, action-keyed instead of raw key codes. */
function makeInputMap() {
  const pressedThisFrame = new Set();
  return {
    press(action) { pressedThisFrame.add(action); },
    isDown() { return false; },
    wasPressed(action) {
      const was = pressedThisFrame.has(action);
      pressedThisFrame.delete(action);
      return was;
    }
  };
}

function makeWorld() {
  return { inventory: createInventory(), notesReadThisRun: new Set() };
}

function makePlayer(position = { x: 0, y: 0, z: 0 }) {
  return { controller: { state: { position: { ...position }, frozen: false } } };
}

function makePutli() {
  return { ai: { forceState: vi.fn() } };
}

function makeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value)
  };
}

describe('capture -> struggle -> success releases with no penalty', () => {
  it('freezes the player on capture, then unfreezes and forces Patrol on success', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('putli:capture', { position: { x: 1, y: 0, z: 1 } });
    expect(player.controller.state.frozen).toBe(true);
    expect(run.struggle.active).toBe(true);

    for (let i = 0; i < CAPTURE_TIMING.struggleSuccessThreshold; i++) {
      inputMap.press(i % 2 === 0 ? 'struggleLeft' : 'struggleRight');
      run.update(0.1);
    }

    expect(player.controller.state.frozen).toBe(false);
    expect(putli.ai.forceState).toHaveBeenCalledWith('patrol');
    expect(run.state.ended).toBe(false);
  });
});

describe('capture -> struggle -> fail once -> automatic retry -> fail again -> release with penalty', () => {
  it('grants exactly one retry, then releases with a Prahar penalty', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('putli:capture', { position: { x: 1, y: 0, z: 1 } });
    const praharBefore = run.prahar.secondsRemaining;

    // First window times out with no input at all.
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1);
    expect(run.struggle.active).toBe(true); // retry auto-started
    expect(player.controller.state.frozen).toBe(true); // still captured

    // Second window also times out.
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1);

    expect(player.controller.state.frozen).toBe(false);
    expect(run.prahar.secondsRemaining).toBeLessThan(praharBefore - CAPTURE_TIMING.struggleFailurePraharPenaltySeconds + 1);
  });
});

describe('3rd capture is immediately fatal — no struggle chance', () => {
  it('ends the run as "bound" without ever activating a struggle', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    let endedPayload = null;
    events.on('game:ended', (p) => { endedPayload = p; });

    events.emit('putli:capture', { position: { x: 0, y: 0, z: 0 } });
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1); // fail 1
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1); // fail 2, released

    events.emit('putli:capture', { position: { x: 0, y: 0, z: 0 } });
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1); // fail 1
    run.update(CAPTURE_TIMING.struggleWindowSeconds + 0.1); // fail 2, released (2 total captures)

    events.emit('putli:capture', { position: { x: 0, y: 0, z: 0 } }); // 3rd capture
    expect(run.struggle.active).toBe(false);
    expect(run.state.ended).toBe(true);
    expect(run.state.ending).toBe('bound');
    expect(endedPayload.ending).toBe('bound');
  });
});

describe('route:completed triggers the matching ending', () => {
  it.each(['gate', 'baori', 'rooftop'])('ends the run as "%s"', (route) => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('route:completed', { route });
    expect(run.state.ended).toBe(true);
    expect(run.state.ending).toBe(route);
    expect(player.controller.state.frozen).toBe(true);
  });

  it('the first ending wins — a second event after the run has ended is ignored', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('route:completed', { route: 'gate' });
    events.emit('route:completed', { route: 'baori' });
    expect(run.state.ending).toBe('gate');
  });
});

describe('Prahar-5 loss triggers the Bound ending', () => {
  it('ends the run as "bound" when the timer runs out', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, difficulty: 'normal', storage: makeStorage() });

    run.prahar.current = 4;
    run.prahar.secondsRemaining = 0.5;
    run.update(1);

    expect(run.state.ended).toBe(true);
    expect(run.state.ending).toBe('bound');
  });
});

describe('Nazar: tainted-room entry and the M4 ward-mitigation shortcut', () => {
  it('bumps Nazar on first entry to a high-Nazar room', () => {
    const player = makePlayer({ x: 0, y: 0, z: 0 }); // courtyard, isHighNazar
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    run.update(0.01);
    expect(run.nazar.value).toBeCloseTo(NAZAR_TIMING.taintedRoomIncrement, 1);
  });

  it('pressing V consumes a carried ward item and mitigates', () => {
    const player = makePlayer({ x: 100, y: 0, z: 100 }); // outside any room, no tainted bump
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    world.inventory.addItem('ward_neem_guard_room');
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });
    run.nazar.value = 50;

    keyboard.press(KEY_V);
    run.update(0.01);

    expect(run.nazar.value).toBeLessThan(50);
    expect(world.inventory.hasItem('ward_neem_guard_room')).toBe(false);
  });

  it('does nothing when V is pressed with no ward item carried', () => {
    const player = makePlayer({ x: 100, y: 0, z: 100 });
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });
    run.nazar.value = 50;

    keyboard.press(KEY_V);
    run.update(0.01);

    expect(run.nazar.value).toBeGreaterThanOrEqual(50);
  });
});

describe('isPlayerInvulnerable: post-respawn grace window', () => {
  it('is true immediately after a release, then counts down to false', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('putli:capture', { position: { x: 1, y: 0, z: 1 } });
    for (let i = 0; i < CAPTURE_TIMING.struggleSuccessThreshold; i++) {
      inputMap.press(i % 2 === 0 ? 'struggleLeft' : 'struggleRight');
      run.update(0.1);
    }

    expect(run.isPlayerInvulnerable()).toBe(true);
    run.update(CAPTURE_TIMING.respawnInvulnerabilitySeconds + 0.1);
    expect(run.isPlayerInvulnerable()).toBe(false);
  });

  it('defaults to false before any capture has happened', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });
    expect(run.isPlayerInvulnerable()).toBe(false);
  });
});

describe('never drops a key item on capture release (regression: dropRandomNonKeyItem must see the real item registry)', () => {
  it('keeps a key-category item after a successful struggle release', () => {
    const player = makePlayer();
    const putli = makePutli();
    const keyboard = makeKeyboard();
    const inputMap = makeInputMap();
    const world = makeWorld();
    world.inventory.addItem('key_fragment_kitchen');
    const run = createRunManager({ player, putli, keyboard, inputMap, world, storage: makeStorage() });

    events.emit('putli:capture', { position: { x: 1, y: 0, z: 1 } });
    for (let i = 0; i < CAPTURE_TIMING.struggleSuccessThreshold; i++) {
      inputMap.press(i % 2 === 0 ? 'struggleLeft' : 'struggleRight');
      run.update(0.1);
    }

    expect(world.inventory.hasItem('key_fragment_kitchen')).toBe(true);
  });
});
