import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPutli } from './ai-putli.js';
import { buildLevelGeometry } from '../data/level-geometry.js';
import { buildNavigationGraph, findPath, pathToWaypoints, roomNodeId } from '../data/navigation-graph.js';
import { PATROL_ROUTES } from '../data/patrol-routes.js';
import { DIFFICULTY_PRESETS, AI_TIMING } from '../data/difficulty-presets.js';
import * as events from '../core/events.js';

const geometry = buildLevelGeometry();
const preset = DIFFICULTY_PRESETS.normal;
const TICK = AI_TIMING.sensorTickIntervalMs / 1000 + 0.001; // guarantees a sensor check fires

function makeDeps(overrides = {}) {
  let playerPos = { x: 100, y: 0, z: 100 }; // far away, undetectable by default
  return {
    geometry,
    spawn: { x: 0, y: 0, z: 0 }, // courtyard center
    getPlayerPosition: () => playerPos,
    setPlayerPosition: (p) => { playerPos = p; },
    getPlayerNoiseRadius: () => 0,
    getDifficultyPreset: () => preset,
    isPlayerHidingAt: () => false,
    random: Math.random,
    ...overrides
  };
}

describe('ai-putli FSM transitions', () => {
  it('starts Idle and stays Idle until the activation grace period elapses', () => {
    const putli = createPutli(makeDeps());
    expect(putli.state).toBe('idle');
    putli.update(AI_TIMING.activationGraceSeconds - 1);
    expect(putli.state).toBe('idle');
    putli.update(2);
    expect(putli.state).toBe('patrol');
  });

  it('Idle never jumps directly to any state other than Patrol', () => {
    const putli = createPutli(makeDeps());
    for (let i = 0; i < 5; i++) {
      putli.update(1);
      expect(['idle', 'patrol']).toContain(putli.state);
    }
  });

  it('Patrol -> Investigate on a heard-but-unseen noise event', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 20 });
    const putli = createPutli(deps);
    putli.forceState('patrol');
    deps.setPlayerPosition({ x: 3, y: 0, z: 0 }); // close, but sight will still be checked first
    putli.update(TICK);
    expect(putli.state).toBe('investigate');
  });

  it('Patrol -> Chase when the sight sensor spots the player', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 0 });
    const putli = createPutli(deps);
    putli.forceState('patrol');
    putli.ctx.yaw = 0; // face -Z
    deps.setPlayerPosition({ x: 0, y: 0, z: -3 }); // dead ahead, within range/cone
    putli.update(TICK);
    expect(putli.state).toBe('chase');
  });

  it('a hidden player is untargetable by sight, even standing dead ahead in range (GAME_MECHANICS §3)', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 0, isPlayerHiding: () => true });
    const putli = createPutli(deps);
    putli.forceState('patrol');
    putli.ctx.yaw = 0;
    deps.setPlayerPosition({ x: 0, y: 0, z: -3 });
    putli.update(TICK);
    expect(putli.state).toBe('patrol');
  });

  it('an invulnerable (just-respawned) player is undetectable by both sensors (GAME_MECHANICS §4)', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 20, isPlayerInvulnerable: () => true });
    const putli = createPutli(deps);
    putli.forceState('patrol');
    putli.ctx.yaw = 0;
    deps.setPlayerPosition({ x: 0, y: 0, z: -1 }); // dead ahead, point-blank, loud
    putli.update(TICK);
    expect(putli.state).toBe('patrol');
  });

  it('Chase -> Capture when it closes to capture radius', () => {
    const deps = makeDeps();
    const putli = createPutli(deps);
    putli.forceState('chase');
    deps.setPlayerPosition({ x: putli.ctx.position.x, y: 0, z: putli.ctx.position.z });
    putli.update(0.016);
    expect(putli.state).toBe('capture');
  });

  it('Chase -> Search after sustained loss of both sight and sound', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 0 });
    const putli = createPutli(deps);
    putli.forceState('chase');
    deps.setPlayerPosition({ x: 100, y: 0, z: 100 }); // undetectable and far from capture radius
    const ticksNeeded = Math.ceil(AI_TIMING.chaseToSearchTimeoutSec / TICK) + 1;
    for (let i = 0; i < ticksNeeded; i++) putli.update(TICK);
    expect(putli.state).toBe('search');
  });

  it('Chase never transitions to Search while still detecting the player', () => {
    const deps = makeDeps({ getPlayerNoiseRadius: () => 20 });
    const putli = createPutli(deps);
    putli.forceState('chase');
    deps.setPlayerPosition({ x: 5, y: 0, z: 0 }); // within the normal preset's 8m hearingRadius, but past captureRadius
    for (let i = 0; i < 30; i++) putli.update(TICK);
    expect(putli.state).not.toBe('search');
  });

  it('Search -> Capture via hiding-spot discovery when the roll succeeds', () => {
    const deps = makeDeps({
      isPlayerHidingAt: () => true,
      random: () => 0 // always "succeeds" against any positive discoveryChance
    });
    const putli = createPutli(deps);
    putli.forceState('search');
    putli.ctx.lastKnownPlayerPos = { x: 4, y: 0, z: 4 }; // a real hiding-spot location
    deps.setPlayerPosition({ x: 100, y: 0, z: 100 }); // not directly caught by proximity
    for (let i = 0; i < 400; i++) {
      putli.update(0.05);
      if (putli.state === 'capture') break;
    }
    expect(putli.state).toBe('capture');
  });

  it('Search -> Patrol on timeout when nothing is found', () => {
    const deps = makeDeps({ isPlayerHidingAt: () => false });
    const putli = createPutli(deps);
    putli.forceState('search');
    putli.ctx.lastKnownPlayerPos = { x: 4, y: 0, z: 4 };
    deps.setPlayerPosition({ x: 100, y: 0, z: 100 });
    const searchTimeout = preset.searchPersistenceSec;
    for (let i = 0; i < Math.ceil(searchTimeout / 0.05) + 5; i++) putli.update(0.05);
    expect(putli.state).toBe('patrol');
  });

  it('Capture always returns to Patrol after the fixed sequence, never straight to Chase', () => {
    const putli = createPutli(makeDeps());
    putli.forceState('capture');
    putli.update(AI_TIMING.captureSequenceSeconds + 0.1);
    expect(putli.state).toBe('patrol');
  });

  describe('regression: every named patrol route completes a full lap without stalling', () => {
    // Ground-height snapping puts Putli's Y slightly above a stair waypoint's exact floor-Y the
    // instant it steps onto the first tread. A naive XYZ arrival check can never be satisfied
    // there, permanently stalling the patrol loop at every staircase (found via live browser
    // testing, not caught by the original single-transition unit tests — this exercises the
    // full route each loop actually walks, not just one hop).
    for (const [routeId, roomIds] of Object.entries(PATROL_ROUTES)) {
      it(`"${routeId}"`, () => {
        const putli = createPutli(makeDeps());
        putli.forceState('patrol');
        putli.ctx.currentLoop = routeId;
        const graph = buildNavigationGraph();
        const waypoints = [];
        for (let i = 0; i < roomIds.length - 1; i++) {
          const path = findPath(graph, roomNodeId(roomIds[i]), roomNodeId(roomIds[i + 1]));
          const segment = pathToWaypoints(graph, path);
          waypoints.push(...(i === 0 ? segment : segment.slice(1)));
        }
        putli.ctx.waypoints = waypoints;
        putli.ctx.waypointIndex = 0;

        // Patrol re-rolls a fresh route (resetting waypointIndex to 0) the instant it finishes
        // this one, so completion is detected as the index resetting backward after having
        // reached the final waypoint, not by index bookkeeping alone.
        const maxTicks = 3000;
        let ticks = 0;
        let maxIndexSeen = 0;
        let completed = false;
        while (ticks < maxTicks && !completed) {
          putli.update(0.05);
          ticks++;
          if (putli.ctx.waypointIndex > maxIndexSeen) maxIndexSeen = putli.ctx.waypointIndex;
          if (putli.ctx.waypointIndex < maxIndexSeen && maxIndexSeen >= waypoints.length - 1) {
            completed = true;
          }
        }
        expect(completed, `stalled at waypoint ${maxIndexSeen}/${waypoints.length}`).toBe(true);
      });
    }
  });

  it('a noise-trap burst (noise:emitted) sends Patrol straight to Investigate within range', () => {
    const putli = createPutli(makeDeps());
    putli.forceState('patrol');
    // Within the normal preset's 8m hearingRadius of spawn (0,0,0) — see checkHearing's
    // min(noiseRadius, hearingRadius) rule.
    events.emit('noise:emitted', { position: { x: 5, y: 0, z: 0 }, radius: 10 });
    expect(putli.state).toBe('investigate');
    putli.destroy();
  });

  it('ignores a noise burst outside both its radius and the hearing radius', () => {
    const putli = createPutli(makeDeps());
    putli.forceState('patrol');
    events.emit('noise:emitted', { position: { x: 500, y: 0, z: 500 }, radius: 10 });
    expect(putli.state).toBe('patrol');
    putli.destroy();
  });

  it('a destroyed Putli instance no longer reacts to noise events', () => {
    const putli = createPutli(makeDeps());
    putli.forceState('patrol');
    putli.destroy();
    events.emit('noise:emitted', { position: { x: 0, y: 0, z: 0 }, radius: 10 });
    expect(putli.state).toBe('patrol');
  });

  it('emits putli:state-changed on every transition', () => {
    const events_ = [];
    const unsubscribe = events.on('putli:state-changed', (e) => events_.push(e));
    const putli = createPutli(makeDeps());
    putli.forceState('capture');
    putli.update(AI_TIMING.captureSequenceSeconds + 0.1);
    unsubscribe();
    expect(events_.some(e => e.to === 'patrol')).toBe(true);
  });
});
