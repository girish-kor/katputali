import { describe, it, expect } from 'vitest';
import { createInventory } from './inventory.js';
import {
  createRouteProgress, recordItemPickup,
  interactSmithyWorkbench, interactFrontGate,
  interactStepwellPulley, interactWallSconce, interactTunnelGrate,
  interactZiplineChhatri,
  interactSohniBaisRoomDoor, interactFrescoStation,
  GATE_FRAGMENTS, BAORI_PARTS, ROOFTOP_ITEMS
} from './puzzle-stations.js';

describe('Gate route', () => {
  it('rejects assembling with missing fragments and consumes nothing', () => {
    const inv = createInventory();
    inv.addItem('key_fragment_kitchen');
    const progress = createRouteProgress();
    const result = interactSmithyWorkbench(inv, progress);
    expect(result.success).toBe(false);
    expect(inv.getSlots()).toEqual(['key_fragment_kitchen']);
    expect(progress.gate.assembled).toBe(false);
  });

  it('assembles and consumes all 3 fragments when carried', () => {
    const inv = createInventory();
    GATE_FRAGMENTS.forEach(id => inv.addItem(id));
    const progress = createRouteProgress();
    const result = interactSmithyWorkbench(inv, progress);
    expect(result.success).toBe(true);
    expect(inv.getSlots()).toHaveLength(0);
    expect(progress.gate.assembled).toBe(true);
  });

  it('the gate cannot be opened before assembly, and opens (route completion) after', () => {
    const progress = createRouteProgress();
    expect(interactFrontGate(progress).success).toBe(false);
    progress.gate.assembled = true;
    const result = interactFrontGate(progress);
    expect(result.success).toBe(true);
    expect(result.route).toBe('gate');
  });
});

describe('Baori route', () => {
  it('requires all 3 pulley parts to repair, then torch to light, then both to open the grate', () => {
    const inv = createInventory();
    const progress = createRouteProgress();

    expect(interactStepwellPulley(inv, progress).success).toBe(false);
    BAORI_PARTS.forEach(id => inv.addItem(id));
    expect(interactStepwellPulley(inv, progress).success).toBe(true);
    expect(progress.baori.repaired).toBe(true);
    expect(inv.hasAll(BAORI_PARTS)).toBe(false);

    expect(interactTunnelGrate(progress).success).toBe(false); // repaired, but torch not lit yet

    expect(interactWallSconce(inv, progress).success).toBe(false); // no torch carried
    inv.addItem('oil_torch');
    expect(interactWallSconce(inv, progress).success).toBe(true);
    expect(progress.baori.torchLit).toBe(true);

    const result = interactTunnelGrate(progress);
    expect(result.success).toBe(true);
    expect(result.route).toBe('baori');
  });

  it('order-independence: lighting the torch before repairing the pulley still completes the chain', () => {
    const inv = createInventory();
    const progress = createRouteProgress();
    inv.addItem('oil_torch');
    expect(interactWallSconce(inv, progress).success).toBe(true);
    BAORI_PARTS.forEach(id => inv.addItem(id));
    expect(interactStepwellPulley(inv, progress).success).toBe(true);
    expect(interactTunnelGrate(progress).success).toBe(true);
  });
});

describe('Rooftop route', () => {
  it('rigs on the first successful interact, then launches (route completion) on the next', () => {
    const inv = createInventory();
    const progress = createRouteProgress();

    expect(interactZiplineChhatri(inv, progress).success).toBe(false); // missing items

    ROOFTOP_ITEMS.forEach(id => inv.addItem(id));
    const rigResult = interactZiplineChhatri(inv, progress);
    expect(rigResult.success).toBe(true);
    expect(rigResult.rigged).toBe(true);
    expect(inv.getSlots()).toHaveLength(0);

    const launchResult = interactZiplineChhatri(inv, progress);
    expect(launchResult.success).toBe(true);
    expect(launchResult.route).toBe('rooftop');
  });
});

describe('route independence (GAME_MECHANICS §2 — no chain shares items or blocks another)', () => {
  it('partial progress on one route never touches another route\'s state', () => {
    const inv = createInventory();
    const progress = createRouteProgress();
    inv.addItem('key_fragment_kitchen');
    inv.addItem('key_fragment_guard_room');
    recordItemPickup('key_fragment_kitchen', progress);
    recordItemPickup('key_fragment_guard_room', progress);
    expect(progress.baori.parts).toEqual([false, false, false]);
    expect(progress.rooftop.rope).toBe(false);
  });
});

describe('recordItemPickup (informational routeProgress tracking)', () => {
  it('flips the correct index for each gate fragment and baori part', () => {
    const progress = createRouteProgress();
    recordItemPickup('key_fragment_guard_room', progress);
    expect(progress.gate.fragments).toEqual([false, true, false]);
    recordItemPickup('pulley_part_courtyard', progress);
    expect(progress.baori.parts).toEqual([false, false, true]);
  });

  it('flips the named rooftop flags', () => {
    const progress = createRouteProgress();
    recordItemPickup('rope', progress);
    recordItemPickup('hook', progress);
    expect(progress.rooftop).toMatchObject({ rope: true, hook: true, counterweight: false });
  });
});

describe("Sohni Bai's room door", () => {
  it('stays locked without the key and unlocks (and stays unlocked) once carried', () => {
    const inv = createInventory();
    const door = { unlocked: false };
    expect(interactSohniBaisRoomDoor(inv, door).success).toBe(false);
    inv.addItem('sohni_room_key');
    expect(interactSohniBaisRoomDoor(inv, door).success).toBe(true);
    expect(door.unlocked).toBe(true);
    inv.removeItem('sohni_room_key');
    expect(interactSohniBaisRoomDoor(inv, door).success).toBe(true); // already unlocked, key not re-required
  });
});

describe('fresco station (M3 grey-box simplification)', () => {
  it('solves once and rejects being solved a second time', () => {
    const fresco = { solved: false };
    expect(interactFrescoStation(fresco).success).toBe(true);
    expect(fresco.solved).toBe(true);
    expect(interactFrescoStation(fresco).success).toBe(false);
  });
});
