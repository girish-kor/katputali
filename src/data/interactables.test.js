import { describe, it, expect } from 'vitest';
import { INTERACTABLES, PICKUPS, READABLES, STATIONS } from './interactables.js';
import { ITEMS, ITEMS_BY_ID } from './items.js';
import { ROOM_LAYOUT, getRoomBounds } from './level-geometry.js';

const roomsById = new Map(ROOM_LAYOUT.map(r => [r.id, r]));

describe('interactables: referential integrity', () => {
  it('every interactable references a real room', () => {
    for (const it of INTERACTABLES) {
      expect(roomsById.has(it.roomId), `${it.id} -> ${it.roomId}`).toBe(true);
    }
  });

  it('every pickup/readable itemId references a real item', () => {
    for (const it of [...PICKUPS, ...READABLES]) {
      expect(ITEMS_BY_ID.has(it.itemId), `${it.id} -> ${it.itemId}`).toBe(true);
    }
  });

  it('every interactable position falls within its room\'s footprint', () => {
    for (const it of INTERACTABLES) {
      const room = roomsById.get(it.roomId);
      const bounds = getRoomBounds(room);
      expect(it.position.x, it.id).toBeGreaterThanOrEqual(bounds.minX);
      expect(it.position.x, it.id).toBeLessThanOrEqual(bounds.maxX);
      expect(it.position.z, it.id).toBeGreaterThanOrEqual(bounds.minZ);
      expect(it.position.z, it.id).toBeLessThanOrEqual(bounds.maxZ);
    }
  });

  it('every non-null interactable id is unique', () => {
    const ids = INTERACTABLES.map(it => it.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('interactables: every item is reachable', () => {
  it('every key and ward item has exactly one pickup interactable', () => {
    const pickupItemIds = new Set(PICKUPS.map(p => p.itemId));
    for (const item of ITEMS.filter(i => i.category === 'key' || i.category === 'ward')) {
      expect(pickupItemIds.has(item.id), item.id).toBe(true);
    }
  });

  it('every lore note has exactly one readable interactable', () => {
    const readableItemIds = new Set(READABLES.map(r => r.itemId));
    for (const item of ITEMS.filter(i => i.category === 'lore')) {
      expect(readableItemIds.has(item.id), item.id).toBe(true);
    }
  });

  it('every station referenced by an item\'s combinesWith actually exists', () => {
    const stationIds = new Set(STATIONS.map(s => s.id));
    for (const item of ITEMS.filter(i => i.combinesWith)) {
      expect(stationIds.has(item.combinesWith), `${item.id} -> ${item.combinesWith}`).toBe(true);
    }
  });
});

describe('interactables: escape-route counts match LEVEL_DESIGN §5-6', () => {
  it('has exactly 3 gate fragments, 3 pulley parts, 1 torch, 3 rooftop items', () => {
    expect(ITEMS.filter(i => i.route === 'gate')).toHaveLength(3);
    expect(ITEMS.filter(i => i.route === 'baori')).toHaveLength(4); // 3 parts + torch
    expect(ITEMS.filter(i => i.route === 'rooftop')).toHaveLength(3);
  });

  it('has exactly 6 lore notes and 3 ward items', () => {
    expect(ITEMS.filter(i => i.category === 'lore')).toHaveLength(6);
    expect(ITEMS.filter(i => i.category === 'ward')).toHaveLength(3);
  });

  it('has exactly 7 hiding spots and 2 noise traps', () => {
    expect(INTERACTABLES.filter(it => it.type === 'hidingSpot')).toHaveLength(7);
    expect(INTERACTABLES.filter(it => it.type === 'noiseTrap')).toHaveLength(2);
  });
});
