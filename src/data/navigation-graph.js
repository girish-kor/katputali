/**
 * Hand-rolled waypoint graph for Putli's pathfinding — see AI_SYSTEM §8 and TECH_STACK §1 for
 * why this replaces a navmesh (the pinned playcanvas package ships no navmesh/Recast API).
 * Nodes: one per room center, one per door (linking the two rooms it joins), one pair per
 * staircase (base/top, linking to their owning rooms and to each other). Pure data + Dijkstra —
 * no PlayCanvas dependency, directly unit-testable per CODING_RULES §10.
 */

import { ROOM_LAYOUT, FLOOR_Y, STAIRCASES, buildDoors, buildStaircaseGeometry } from './level-geometry.js';

function distance3D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function roomNodeId(roomId) {
  return `room:${roomId}`;
}

/** Builds the full graph: { nodes: Map<id,{id,position,type,roomId}>, edges: Map<id,{to,weight}[]> } */
export function buildNavigationGraph() {
  const nodes = new Map();
  const edges = new Map();

  function addNode(id, position, type, roomId) {
    nodes.set(id, { id, position, type, roomId });
    if (!edges.has(id)) edges.set(id, []);
  }

  function addEdge(a, b) {
    const weight = distance3D(nodes.get(a).position, nodes.get(b).position);
    edges.get(a).push({ to: b, weight });
    edges.get(b).push({ to: a, weight });
  }

  for (const room of ROOM_LAYOUT) {
    addNode(roomNodeId(room.id), { x: room.center.x, y: FLOOR_Y[room.floor], z: room.center.z }, 'room', room.id);
  }

  for (const door of buildDoors()) {
    const { min, max } = door.bounds;
    const position = { x: (min.x + max.x) / 2, y: min.y, z: (min.z + max.z) / 2 };
    const id = `door:${door.id}`;
    addNode(id, position, 'door', null);
    addEdge(id, roomNodeId(door.roomA));
    addEdge(id, roomNodeId(door.roomB));
  }

  for (const stair of STAIRCASES) {
    const geometry = buildStaircaseGeometry(stair);
    const baseId = `stair:${stair.id}:base`;
    const landingId = `stair:${stair.id}:landing`;
    const topId = `stair:${stair.id}:top`;
    addNode(baseId, { x: stair.base.x, y: FLOOR_Y[stair.fromFloor], z: stair.base.z }, 'stair', stair.baseRoomId);
    addNode(landingId, { x: geometry.landingPosition.x, y: geometry.landingPosition.y, z: geometry.landingPosition.z }, 'stair', null);
    addNode(topId, { x: geometry.topPosition.x, y: geometry.topPosition.y, z: geometry.topPosition.z }, 'stair', stair.topRoomId);
    // Each flight is a straight line (base->landing, landing->top) — routing waypoints through
    // the landing keeps a straight-line mover on the actual tread footprint the whole way.
    // A direct base->top edge would cut across the L-shape's corner, missing both flights'
    // footprints in the middle and dropping the mover through to whatever floor is below.
    addEdge(baseId, landingId);
    addEdge(landingId, topId);
    addEdge(baseId, roomNodeId(stair.baseRoomId));
    addEdge(topId, roomNodeId(stair.topRoomId));
  }

  return { nodes, edges };
}

/** Finds the nearest graph node to a world position, optionally restricted to a floor's rooms. */
export function findNearestNode(graph, position) {
  let best = null;
  let bestDist = Infinity;
  for (const node of graph.nodes.values()) {
    const d = distance3D(node.position, position);
    if (d < bestDist) {
      bestDist = d;
      best = node.id;
    }
  }
  return best;
}

/** Dijkstra shortest path between two node ids. Returns an array of node ids, or null if unreachable. */
export function findPath(graph, fromId, toId) {
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return null;
  if (fromId === toId) return [fromId];

  const dist = new Map([[fromId, 0]]);
  const prev = new Map();
  const visited = new Set();
  const queue = new Set(graph.nodes.keys());

  while (queue.size > 0) {
    let current = null;
    let currentDist = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < currentDist) {
        currentDist = d;
        current = id;
      }
    }
    if (current === null || currentDist === Infinity) break;
    queue.delete(current);
    visited.add(current);
    if (current === toId) break;

    for (const { to, weight } of graph.edges.get(current) ?? []) {
      if (visited.has(to)) continue;
      const candidate = currentDist + weight;
      if (candidate < (dist.get(to) ?? Infinity)) {
        dist.set(to, candidate);
        prev.set(to, current);
      }
    }
  }

  if (!dist.has(toId)) return null;

  const path = [toId];
  let node = toId;
  while (node !== fromId) {
    node = prev.get(node);
    if (node === undefined) return null;
    path.push(node);
  }
  return path.reverse();
}

/** Converts a node-id path into world positions, for a mover to walk toward in sequence. */
export function pathToWaypoints(graph, path) {
  return path.map(id => graph.nodes.get(id).position);
}
