import { describe, it, expect } from 'vitest';
import { createInventory, MAX_SLOTS } from './inventory.js';

describe('inventory: slot limit enforcement', () => {
  it('holds up to MAX_SLOTS items', () => {
    const inv = createInventory();
    for (let i = 0; i < MAX_SLOTS; i++) {
      expect(inv.addItem(`item_${i}`)).toBe(true);
    }
    expect(inv.getSlots()).toHaveLength(MAX_SLOTS);
  });

  it('refuses to add beyond capacity without losing anything already carried', () => {
    const inv = createInventory();
    for (let i = 0; i < MAX_SLOTS; i++) inv.addItem(`item_${i}`);
    expect(inv.addItem('one_too_many')).toBe(false);
    expect(inv.getSlots()).toHaveLength(MAX_SLOTS);
    expect(inv.hasItem('one_too_many')).toBe(false);
  });

  it('hasSpace reflects current capacity', () => {
    const inv = createInventory(2);
    expect(inv.hasSpace()).toBe(true);
    inv.addItem('a');
    inv.addItem('b');
    expect(inv.hasSpace()).toBe(false);
  });
});

describe('inventory: pickup/drop', () => {
  it('removes an item by id', () => {
    const inv = createInventory();
    inv.addItem('rope');
    expect(inv.removeItem('rope')).toBe(true);
    expect(inv.hasItem('rope')).toBe(false);
  });

  it('removing an item not carried is a no-op that reports failure', () => {
    const inv = createInventory();
    expect(inv.removeItem('nonexistent')).toBe(false);
  });

  it('freed slot can be reused after a drop', () => {
    const inv = createInventory(1);
    inv.addItem('a');
    expect(inv.addItem('b')).toBe(false);
    inv.removeItem('a');
    expect(inv.addItem('b')).toBe(true);
  });
});

describe('inventory: combine-success/failure logic (hasAll/removeAll)', () => {
  it('hasAll is true only when every required item is carried', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    inv.addItem('key_fragment_guard_room');
    expect(inv.hasAll(['key_fragment_kitchen', 'key_fragment_guard_room'])).toBe(true);
    expect(inv.hasAll(['key_fragment_kitchen', 'key_fragment_guard_room', 'key_fragment_library'])).toBe(false);
  });

  it('removeAll consumes every listed item on a successful combine', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    inv.addItem('key_fragment_guard_room');
    inv.addItem('key_fragment_library');
    inv.removeAll(['key_fragment_kitchen', 'key_fragment_guard_room', 'key_fragment_library']);
    expect(inv.getSlots()).toHaveLength(0);
  });

  it('a failed combine (missing item) leaves inventory untouched — no wasted resources', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    const required = ['key_fragment_kitchen', 'key_fragment_guard_room', 'key_fragment_library'];
    if (inv.hasAll(required)) inv.removeAll(required); // the real call site's guarded pattern
    expect(inv.getSlots()).toEqual(['key_fragment_kitchen']);
  });
});

describe('inventory: drop restrictions on key items (GAME_MECHANICS §2/§4)', () => {
  const itemsById = new Map([
    ['key_fragment_kitchen', { category: 'key' }],
    ['ward_neem_guard_room', { category: 'ward' }],
    ['note_library', { category: 'lore' }]
  ]);

  it('never drops a key item, even when it is the only thing carried', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    const dropped = inv.dropRandomNonKeyItem(itemsById, () => 0);
    expect(dropped).toBeNull();
    expect(inv.hasItem('key_fragment_kitchen')).toBe(true);
  });

  it('drops a non-key item when one is carried alongside key items', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    inv.addItem('ward_neem_guard_room');
    const dropped = inv.dropRandomNonKeyItem(itemsById, () => 0);
    expect(dropped).toBe('ward_neem_guard_room');
    expect(inv.hasItem('key_fragment_kitchen')).toBe(true);
    expect(inv.hasItem('ward_neem_guard_room')).toBe(false);
  });

  it('returns null when nothing droppable is carried at all', () => {
    const inv = createInventory();
    const dropped = inv.dropRandomNonKeyItem(itemsById, () => 0);
    expect(dropped).toBeNull();
  });
});

describe('inventory: manual drop (dropMostRecentNonKeyItem, CONTROLS §1 "G")', () => {
  const itemsById = new Map([
    ['key_fragment_kitchen', { category: 'key' }],
    ['ward_neem_guard_room', { category: 'ward' }],
    ['note_library', { category: 'lore' }]
  ]);

  it('drops the most recently picked up non-key item', () => {
    const inv = createInventory();
    inv.addItem('ward_neem_guard_room');
    inv.addItem('note_library');
    expect(inv.dropMostRecentNonKeyItem(itemsById)).toBe('note_library');
    expect(inv.hasItem('note_library')).toBe(false);
    expect(inv.hasItem('ward_neem_guard_room')).toBe(true);
  });

  it('skips over a trailing key item to find the most recent droppable one', () => {
    const inv = createInventory();
    inv.addItem('ward_neem_guard_room');
    inv.addItem('key_fragment_kitchen');
    expect(inv.dropMostRecentNonKeyItem(itemsById)).toBe('ward_neem_guard_room');
    expect(inv.hasItem('key_fragment_kitchen')).toBe(true);
  });

  it('returns null when only key items are carried', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    expect(inv.dropMostRecentNonKeyItem(itemsById)).toBeNull();
    expect(inv.hasItem('key_fragment_kitchen')).toBe(true);
  });

  it('returns null when nothing is carried', () => {
    const inv = createInventory();
    expect(inv.dropMostRecentNonKeyItem(itemsById)).toBeNull();
  });
});
