import { createFSM } from '../core/fsm.js';
import { resolveWalls, findGroundHeight, stepToward } from './player-movement-math.js';
import { checkHearing, checkSight } from './putli-sensors.js';
import { buildNavigationGraph, findPath, findNearestNode, pathToWaypoints, roomNodeId } from '../data/navigation-graph.js';
import { PATROL_ROUTES, pickNextPatrolRoute } from '../data/patrol-routes.js';
import { nearestHidingSpots } from '../data/hiding-spots.js';
import { AI_TIMING } from '../data/difficulty-presets.js';
import { on, emit } from '../core/events.js';

const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1.9;
const ARRIVE_EPSILON = 0.15;

function distance3D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function distanceXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Expands a room-id patrol loop into a full world-position waypoint list via the nav graph. */
function buildRoomSequenceWaypoints(ctx, roomIds) {
  const waypoints = [];
  for (let i = 0; i < roomIds.length - 1; i++) {
    const path = findPath(ctx.graph, roomNodeId(roomIds[i]), roomNodeId(roomIds[i + 1]));
    if (!path) continue;
    const segment = pathToWaypoints(ctx.graph, path);
    waypoints.push(...(i === 0 ? segment : segment.slice(1)));
  }
  return waypoints;
}

/**
 * Moves ctx.position toward the next unconsumed waypoint in ctx.waypoints, resolving
 * walls/ground. Arrival is judged on horizontal (XZ) distance only — Y is handled entirely by
 * ground-height snapping (see moveToward) and naturally sits slightly above a stair waypoint's
 * exact floor-Y the moment Putli steps onto the first tread, so an XYZ arrival check could never
 * be satisfied there and would stall the patrol forever.
 */
function followWaypoints(ctx, dt, speed) {
  if (!ctx.waypoints || ctx.waypointIndex >= ctx.waypoints.length) return true;
  const target = ctx.waypoints[ctx.waypointIndex];
  moveToward(ctx, dt, speed, target);
  if (distanceXZ(ctx.position, target) <= ARRIVE_EPSILON) {
    ctx.waypointIndex++;
  }
  return ctx.waypointIndex >= ctx.waypoints.length;
}

/** Single kinematic step toward an arbitrary world point, sharing the player's collision/ground logic. */
function moveToward(ctx, dt, speed, target) {
  // Facing direction is computed from the pre-move offset — if Putli is already standing on
  // the target (e.g. its first patrol waypoint at spawn), dx/dz are exactly zero and
  // atan2(-0,-0) resolves to -180deg in JS, snapping Putli to face backward for no reason.
  // Keep the previous yaw instead of chasing a degenerate direction.
  const preDx = target.x - ctx.position.x;
  const preDz = target.z - ctx.position.z;
  const preDist = Math.hypot(preDx, preDz);

  const stepped = stepToward(ctx.position, target, speed, dt);
  const resolved = resolveWalls(
    { x: stepped.x, z: stepped.z }, CAPSULE_RADIUS,
    ctx.position.y, ctx.position.y + CAPSULE_HEIGHT, ctx.geometry.wallColliders
  );
  ctx.position.x = resolved.x;
  ctx.position.z = resolved.z;
  const ground = findGroundHeight(ctx.position.x, ctx.position.z, ctx.position.y, ctx.stepHeight, ctx.geometry.roomFloors, ctx.geometry.stairSteps);
  if (ground !== null) ctx.position.y = ground;
  if (preDist > 1e-4) {
    ctx.yaw = (Math.atan2(-preDx, -preDz) * 180) / Math.PI;
  }
}

function sensorTick(ctx, dt) {
  ctx.sensorAccumMs += dt * 1000;
  if (ctx.sensorAccumMs < AI_TIMING.sensorTickIntervalMs) return { checked: false };
  ctx.sensorAccumMs = 0;

  const playerPos = ctx.getPlayerPosition();
  // Post-capture respawn grace window (GAME_MECHANICS §4) — no detection at all, prevents a
  // "spawn camped" instant re-capture right after being released.
  if (ctx.isPlayerInvulnerable()) return { checked: true, heard: false, seen: false, playerPos };

  const preset = ctx.getDifficultyPreset();
  const heard = checkHearing(ctx.position, playerPos, ctx.getPlayerNoiseRadius(), preset.hearingRadius);
  // A hidden player is untargetable by sight but still audible if noisy (GAME_MECHANICS §3).
  const seen = !ctx.isPlayerHiding() &&
    checkSight(ctx.position, ctx.yaw, playerPos, preset.sightRange, preset.sightAngleDeg, ctx.geometry.wallColliders);
  return { checked: true, heard, seen, playerPos };
}

function withinCaptureRadius(ctx) {
  return distance3D(ctx.position, ctx.getPlayerPosition()) <= AI_TIMING.captureRadius;
}

const states = {
  idle: {
    enter(ctx) { ctx.graceTimer = 0; },
    update(ctx, dt) {
      ctx.graceTimer += dt;
      if (ctx.graceTimer >= AI_TIMING.activationGraceSeconds) return 'patrol';
    }
  },

  patrol: {
    enter(ctx) {
      ctx.currentLoop = pickNextPatrolRoute(ctx.random);
      ctx.waypoints = buildRoomSequenceWaypoints(ctx, PATROL_ROUTES[ctx.currentLoop]);
      ctx.waypointIndex = 0;
    },
    update(ctx, dt) {
      const preset = ctx.getDifficultyPreset();
      const done = followWaypoints(ctx, dt, preset.patrolSpeed);
      if (done) {
        ctx.currentLoop = pickNextPatrolRoute(ctx.random);
        ctx.waypoints = buildRoomSequenceWaypoints(ctx, PATROL_ROUTES[ctx.currentLoop]);
        ctx.waypointIndex = 0;
      }

      const sensors = sensorTick(ctx, dt);
      if (sensors.checked && sensors.seen) {
        ctx.lastKnownPlayerPos = { ...sensors.playerPos };
        return 'chase';
      }
      if (sensors.checked && sensors.heard) {
        ctx.lastKnownPlayerPos = { ...sensors.playerPos };
        return 'investigate';
      }
    }
  },

  investigate: {
    enter(ctx) {
      ctx.investigateTimer = 0;
      ctx.lastKnownPlayerPos ??= { ...ctx.getPlayerPosition() };
      const fromNode = findNearestNode(ctx.graph, ctx.position);
      const toNode = findNearestNode(ctx.graph, ctx.lastKnownPlayerPos);
      const path = findPath(ctx.graph, fromNode, toNode);
      ctx.waypoints = path ? pathToWaypoints(ctx.graph, path) : [ctx.lastKnownPlayerPos];
      ctx.waypointIndex = 0;
    },
    update(ctx, dt) {
      const preset = ctx.getDifficultyPreset();
      followWaypoints(ctx, dt, preset.patrolSpeed);
      ctx.investigateTimer += dt;

      const sensors = sensorTick(ctx, dt);
      if (sensors.checked && sensors.seen) {
        ctx.lastKnownPlayerPos = { ...sensors.playerPos };
        return 'chase';
      }
      if (ctx.investigateTimer >= AI_TIMING.investigateTimeoutSec) return 'patrol';
    }
  },

  chase: {
    enter(ctx) {
      ctx.chaseLostTimer = 0;
      // Chase is normally only entered with lastKnownPlayerPos already set by whichever state
      // spotted the player; fall back to the live position as a defensive safety net.
      ctx.lastKnownPlayerPos ??= { ...ctx.getPlayerPosition() };
    },
    update(ctx, dt) {
      const preset = ctx.getDifficultyPreset();
      const playerPos = ctx.getPlayerPosition();
      moveToward(ctx, dt, preset.chaseSpeed, playerPos);

      if (withinCaptureRadius(ctx)) return 'capture';

      const sensors = sensorTick(ctx, dt);
      if (sensors.checked) {
        if (sensors.seen || sensors.heard) {
          ctx.chaseLostTimer = 0;
          if (sensors.seen) ctx.lastKnownPlayerPos = { ...sensors.playerPos };
        } else {
          ctx.chaseLostTimer += AI_TIMING.sensorTickIntervalMs / 1000;
        }
      }
      if (ctx.chaseLostTimer >= AI_TIMING.chaseToSearchTimeoutSec) return 'search';
    }
  },

  search: {
    enter(ctx) {
      ctx.searchTimer = 0;
      ctx.spotsChecked = false;
      ctx.lastKnownPlayerPos ??= { ...ctx.getPlayerPosition() };
      const fromNode = findNearestNode(ctx.graph, ctx.position);
      const toNode = findNearestNode(ctx.graph, ctx.lastKnownPlayerPos);
      const path = findPath(ctx.graph, fromNode, toNode);
      ctx.waypoints = path ? pathToWaypoints(ctx.graph, path) : [ctx.lastKnownPlayerPos];
      ctx.waypointIndex = 0;
    },
    update(ctx, dt) {
      const preset = ctx.getDifficultyPreset();
      const arrived = followWaypoints(ctx, dt, preset.patrolSpeed);
      ctx.searchTimer += dt;

      if (withinCaptureRadius(ctx)) return 'capture';

      if (arrived && !ctx.spotsChecked) {
        ctx.spotsChecked = true;
        const spots = nearestHidingSpots(ctx.lastKnownPlayerPos, AI_TIMING.hidingSpotCheckCount);
        for (const spot of spots) {
          if (ctx.isPlayerHidingAt(spot.id) && ctx.random() < preset.hidingDiscoveryChance) {
            return 'capture';
          }
        }
      }

      if (ctx.searchTimer >= preset.searchPersistenceSec) return 'patrol';
    }
  },

  capture: {
    enter(ctx) {
      ctx.captureTimer = 0;
      ctx.currentLoop = null;
      emit('putli:capture', { position: { ...ctx.position } });
    },
    update(ctx, dt) {
      ctx.captureTimer += dt;
      if (ctx.captureTimer >= AI_TIMING.captureSequenceSeconds) return 'patrol';
    }
  }
};

/**
 * Creates Putli's FSM instance (AI_SYSTEM §2). `deps` supplies the world-facing hooks:
 * getPlayerPosition, getPlayerNoiseRadius, getDifficultyPreset, isPlayerHiding (global
 * untargetable-by-sight check), isPlayerHidingAt (per-spot check for the Search-state discovery
 * roll), and isPlayerInvulnerable (post-respawn grace window, GAME_MECHANICS §4 — suppresses
 * both sensors entirely) — all default false until wired to their real systems. Also geometry
 * (from level.js), spawn position, and an optional `random` source for deterministic tests.
 */
export function createPutli(deps) {
  const graph = buildNavigationGraph();
  const ctx = {
    position: { ...deps.spawn },
    yaw: 0,
    geometry: deps.geometry,
    graph,
    stepHeight: deps.stepHeight ?? 0.2,
    random: deps.random ?? Math.random,
    getPlayerPosition: deps.getPlayerPosition,
    getPlayerNoiseRadius: deps.getPlayerNoiseRadius,
    getDifficultyPreset: deps.getDifficultyPreset,
    isPlayerHiding: deps.isPlayerHiding ?? (() => false),
    isPlayerInvulnerable: deps.isPlayerInvulnerable ?? (() => false),
    isPlayerHidingAt: deps.isPlayerHidingAt ?? (() => false),
    sensorAccumMs: 0,
    currentLoop: null,
    waypoints: [],
    waypointIndex: 0,
    lastKnownPlayerPos: null
  };

  const fsm = createFSM(states, deps.initialState ?? 'idle', ctx);

  let lastState = fsm.state;
  function update(dt) {
    fsm.update(dt);
    if (fsm.state !== lastState) {
      emit('putli:state-changed', { from: lastState, to: fsm.state });
      lastState = fsm.state;
    }
  }

  // Discrete noise events (noise-trap tiles, GAME_MECHANICS §3) bypass the throttled continuous
  // hearing check and go straight to Investigate if within range — a burst that loud shouldn't
  // wait for the next sensor tick, and it always overrides Patrol's own ongoing sensor read.
  const unsubscribeNoise = on('noise:emitted', ({ position, radius }) => {
    if (fsm.state !== 'patrol' && fsm.state !== 'investigate') return;
    const heard = checkHearing(ctx.position, position, radius, ctx.getDifficultyPreset().hearingRadius);
    if (!heard) return;
    ctx.lastKnownPlayerPos = { ...position };
    fsm.transition('investigate');
    lastState = fsm.state;
  });

  return {
    ctx,
    update,
    get state() { return fsm.state; },
    forceState(name) { fsm.transition(name); lastState = fsm.state; },
    destroy() { unsubscribeNoise(); }
  };
}
