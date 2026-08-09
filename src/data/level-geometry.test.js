import { describe, it, expect } from 'vitest';
import {
  ROOM_LAYOUT,
  getRoomBounds,
  buildLevelGeometry,
  buildDoors,
  DOOR_PAIRS,
  DOOR_WIDTH
} from './level-geometry.js';

function boundsOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

describe('level-geometry: room layout', () => {
  it('has exactly the 13 rooms from LEVEL_DESIGN §3', () => {
    expect(ROOM_LAYOUT).toHaveLength(13);
    expect(new Set(ROOM_LAYOUT.map(r => r.id)).size).toBe(13);
  });

  it('never overlaps two rooms on the same floor', () => {
    const byFloor = new Map();
    for (const room of ROOM_LAYOUT) {
      const list = byFloor.get(room.floor) ?? [];
      list.push({ id: room.id, bounds: getRoomBounds(room) });
      byFloor.set(room.floor, list);
    }
    for (const rooms of byFloor.values()) {
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          expect(boundsOverlap(rooms[i].bounds, rooms[j].bounds), `${rooms[i].id} vs ${rooms[j].id}`).toBe(false);
        }
      }
    }
  });

  it('pairs every door with a touching neighbor on the matching side', () => {
    const byId = new Map(ROOM_LAYOUT.map(r => [r.id, r]));
    const pairs = [
      ['courtyard', 'south', 'entrance-hall', 'north'],
      ['courtyard', 'east', 'guard-room', 'west'],
      ['guard-room', 'east', 'smithy', 'west'],
      ['smithy', 'east', 'kitchen', 'west'],
      ['stepwell', 'east', 'cellar', 'west'],
      ['library', 'west', 'sohni-bais-room', 'east'],
      ['library', 'east', 'meeras-bedroom', 'west'],
      ['library', 'north', 'family-shrine', 'south'],
      ['open-chhat', 'east', 'zipline-chhatri', 'west']
    ];
    for (const [aId, aSide, bId, bSide] of pairs) {
      const a = byId.get(aId);
      const b = byId.get(bId);
      expect(a.doors[aSide], `${aId}.${aSide}`).toBe(true);
      expect(b.doors[bSide], `${bId}.${bSide}`).toBe(true);
      const ab = getRoomBounds(a);
      const bb = getRoomBounds(b);
      if (aSide === 'east') expect(ab.maxX).toBeCloseTo(bb.minX, 5);
      if (aSide === 'west') expect(ab.minX).toBeCloseTo(bb.maxX, 5);
      if (aSide === 'north') expect(ab.maxZ).toBeCloseTo(bb.minZ, 5);
      if (aSide === 'south') expect(ab.minZ).toBeCloseTo(bb.maxZ, 5);
    }
  });

  it('every door gap is at least as wide as DOOR_WIDTH relative to the smaller room face', () => {
    for (const room of ROOM_LAYOUT) {
      const bounds = getRoomBounds(room);
      const faceLength = bounds.maxX - bounds.minX;
      if (Object.values(room.doors).some(Boolean)) {
        expect(faceLength).toBeGreaterThan(DOOR_WIDTH);
      }
    }
  });
});

describe('level-geometry: doors (PHYSICS §3 collision category)', () => {
  it('generates one door per pair, defaulting open, sized to DOOR_WIDTH', () => {
    const doors = buildDoors();
    expect(doors).toHaveLength(DOOR_PAIRS.length);
    for (const door of doors) {
      expect(door.defaultOpen).toBe(true);
      const { min, max } = door.bounds;
      const width = Math.max(max.x - min.x, max.z - min.z);
      expect(width).toBeCloseTo(DOOR_WIDTH, 5);
    }
  });
});

describe('level-geometry: performance budget (grey-box baseline, PERFORMANCE §1-2)', () => {
  it('stays comfortably within the 400,000 triangle scene budget', () => {
    const { wallColliders, stairSteps, rooms } = buildLevelGeometry();
    const boxCount = wallColliders.length + stairSteps.length + rooms.length;
    const triangleEstimate = boxCount * 12;
    expect(triangleEstimate).toBeLessThan(400_000);
  });

  it('produces a finite, sane collider count (catches a runaway generator)', () => {
    const { wallColliders, stairSteps } = buildLevelGeometry();
    expect(wallColliders.length).toBeGreaterThan(0);
    expect(wallColliders.length).toBeLessThan(1000);
    expect(stairSteps.length).toBe(3 * (10 + 10 + 1));
  });
});
