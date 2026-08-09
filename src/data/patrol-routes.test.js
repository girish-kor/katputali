import { describe, it, expect } from 'vitest';
import { PATROL_ROUTES, PATROL_WEIGHTS, pickNextPatrolRoute } from './patrol-routes.js';
import { ROOM_LAYOUT } from './level-geometry.js';

describe('PATROL_ROUTES', () => {
  const roomIds = new Set(ROOM_LAYOUT.map(r => r.id));

  it('references only real room ids', () => {
    for (const route of Object.values(PATROL_ROUTES)) {
      for (const roomId of route) {
        expect(roomIds.has(roomId), roomId).toBe(true);
      }
    }
  });

  it('every route starts and ends at the courtyard hub', () => {
    for (const route of Object.values(PATROL_ROUTES)) {
      expect(route[0]).toBe('courtyard');
      expect(route[route.length - 1]).toBe('courtyard');
    }
  });
});

describe('pickNextPatrolRoute', () => {
  it('picks deterministically from an injected random source', () => {
    const ids = Object.keys(PATROL_WEIGHTS);
    expect(pickNextPatrolRoute(() => 0)).toBe(ids[0]);
    expect(pickNextPatrolRoute(() => 0.999)).toBe(ids[ids.length - 1]);
  });

  it('always returns a valid route id', () => {
    for (let i = 0; i < 20; i++) {
      const id = pickNextPatrolRoute(Math.random);
      expect(Object.keys(PATROL_ROUTES)).toContain(id);
    }
  });
});
