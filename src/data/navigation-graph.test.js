import { describe, it, expect } from 'vitest';
import { buildNavigationGraph, findPath, findNearestNode, pathToWaypoints, roomNodeId } from './navigation-graph.js';
import { ROOM_LAYOUT } from './level-geometry.js';

describe('buildNavigationGraph', () => {
  const graph = buildNavigationGraph();

  it('has a node for every room', () => {
    for (const room of ROOM_LAYOUT) {
      expect(graph.nodes.has(roomNodeId(room.id))).toBe(true);
    }
  });

  it('gives every room at least one edge (no isolated rooms)', () => {
    for (const room of ROOM_LAYOUT) {
      const edges = graph.edges.get(roomNodeId(room.id));
      expect(edges.length).toBeGreaterThan(0);
    }
  });

  it('connects every room to every other room (fully traversable level)', () => {
    for (const from of ROOM_LAYOUT) {
      for (const to of ROOM_LAYOUT) {
        const path = findPath(graph, roomNodeId(from.id), roomNodeId(to.id));
        expect(path, `${from.id} -> ${to.id}`).not.toBeNull();
      }
    }
  });

  it('routes from the entrance hall to the rooftop zipline across all 4 floors', () => {
    const path = findPath(graph, roomNodeId('entrance-hall'), roomNodeId('zipline-chhatri'));
    expect(path).not.toBeNull();
    const floorsVisited = new Set(path.map(id => graph.nodes.get(id).roomId).filter(Boolean)
      .map(roomId => ROOM_LAYOUT.find(r => r.id === roomId)?.floor).filter(Boolean));
    expect(floorsVisited.has('ground')).toBe(true);
    expect(floorsVisited.has('first')).toBe(true);
    expect(floorsVisited.has('roof')).toBe(true);
  });
});

describe('findPath (Dijkstra correctness on a small synthetic graph)', () => {
  const nodes = new Map([
    ['a', { id: 'a', position: { x: 0, y: 0, z: 0 } }],
    ['b', { id: 'b', position: { x: 1, y: 0, z: 0 } }],
    ['c', { id: 'c', position: { x: 2, y: 0, z: 0 } }],
    ['d', { id: 'd', position: { x: 0, y: 0, z: 5 } }] // isolated
  ]);
  const edges = new Map([
    ['a', [{ to: 'b', weight: 1 }, { to: 'c', weight: 10 }]],
    ['b', [{ to: 'a', weight: 1 }, { to: 'c', weight: 1 }]],
    ['c', [{ to: 'a', weight: 10 }, { to: 'b', weight: 1 }]],
    ['d', []]
  ]);
  const graph = { nodes, edges };

  it('finds the shortest path, preferring lower total weight over fewer hops', () => {
    expect(findPath(graph, 'a', 'c')).toEqual(['a', 'b', 'c']);
  });

  it('returns a single-element path when start equals target', () => {
    expect(findPath(graph, 'a', 'a')).toEqual(['a']);
  });

  it('returns null for an unreachable node', () => {
    expect(findPath(graph, 'a', 'd')).toBeNull();
  });

  it('returns null for a node id that does not exist', () => {
    expect(findPath(graph, 'a', 'nonexistent')).toBeNull();
  });
});

describe('findNearestNode', () => {
  const graph = buildNavigationGraph();

  it('finds the courtyard room node as nearest to a point at its center', () => {
    const nearest = findNearestNode(graph, { x: 0, y: 0, z: 0 });
    expect(nearest).toBe(roomNodeId('courtyard'));
  });
});

describe('pathToWaypoints', () => {
  it('converts a node-id path into world positions in order', () => {
    const graph = buildNavigationGraph();
    const path = findPath(graph, roomNodeId('kitchen'), roomNodeId('smithy'));
    const waypoints = pathToWaypoints(graph, path);
    expect(waypoints).toHaveLength(path.length);
    expect(waypoints[0]).toHaveProperty('x');
    expect(waypoints[0]).toHaveProperty('z');
  });
});
