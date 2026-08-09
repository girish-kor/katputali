/**
 * The 3 escape-route puzzle chains, per LEVEL_DESIGN §5. Pure logic operating on an inventory
 * (inventory.js) and a routeProgress state object (DATA_MODEL §1's RunState.routeProgress
 * shape) — no PlayCanvas dependency, testable per CODING_RULES §10. PlayCanvas-facing dispatch
 * lives in interactable-handler.js.
 */

export const GATE_FRAGMENTS = ['key_fragment_kitchen', 'key_fragment_guard_room', 'key_fragment_library'];
export const BAORI_PARTS = ['pulley_part_cellar', 'pulley_part_stepwell', 'pulley_part_courtyard'];
export const ROOFTOP_ITEMS = ['rope', 'hook', 'counterweight'];

export function createRouteProgress() {
  return {
    gate: { fragments: [false, false, false], assembled: false },
    baori: { parts: [false, false, false], repaired: false, torchLit: false },
    rooftop: { rope: false, hook: false, counterweight: false, rigged: false }
  };
}

/** Informational per-item pickup tracking (DATA_MODEL §1) — not load-bearing for completion checks. */
export function recordItemPickup(itemId, routeProgress) {
  const gateIndex = GATE_FRAGMENTS.indexOf(itemId);
  if (gateIndex !== -1) routeProgress.gate.fragments[gateIndex] = true;

  const baoriIndex = BAORI_PARTS.indexOf(itemId);
  if (baoriIndex !== -1) routeProgress.baori.parts[baoriIndex] = true;

  if (itemId === 'rope') routeProgress.rooftop.rope = true;
  if (itemId === 'hook') routeProgress.rooftop.hook = true;
  if (itemId === 'counterweight') routeProgress.rooftop.counterweight = true;
}

// --- Gate route ---

export function interactSmithyWorkbench(inventory, routeProgress) {
  if (!inventory.hasAll(GATE_FRAGMENTS)) return { success: false, reason: 'missing-fragments' };
  inventory.removeAll(GATE_FRAGMENTS);
  routeProgress.gate.assembled = true;
  return { success: true };
}

export function interactFrontGate(routeProgress) {
  if (!routeProgress.gate.assembled) return { success: false, reason: 'not-assembled' };
  return { success: true, route: 'gate' };
}

// --- Baori route ---

export function interactStepwellPulley(inventory, routeProgress) {
  if (!inventory.hasAll(BAORI_PARTS)) return { success: false, reason: 'missing-parts' };
  inventory.removeAll(BAORI_PARTS);
  routeProgress.baori.repaired = true;
  return { success: true };
}

export function interactWallSconce(inventory, routeProgress) {
  if (!inventory.hasItem('oil_torch')) return { success: false, reason: 'no-torch' };
  inventory.removeItem('oil_torch');
  routeProgress.baori.torchLit = true;
  return { success: true };
}

export function interactTunnelGrate(routeProgress) {
  if (!routeProgress.baori.repaired || !routeProgress.baori.torchLit) return { success: false, reason: 'not-ready' };
  return { success: true, route: 'baori' };
}

// --- Rooftop route ---
// LEVEL_DESIGN §5's (b) rig and (c) launch are both "at Chhatri" (Room 13) — modeled as one
// station with two interact phases rather than a separate rig-then-launch location.

export function interactZiplineChhatri(inventory, routeProgress) {
  if (!routeProgress.rooftop.rigged) {
    if (!inventory.hasAll(ROOFTOP_ITEMS)) return { success: false, reason: 'missing-items' };
    inventory.removeAll(ROOFTOP_ITEMS);
    routeProgress.rooftop.rigged = true;
    return { success: true, rigged: true };
  }
  return { success: true, route: 'rooftop' };
}

// --- Access & side puzzle ---

export function interactSohniBaisRoomDoor(inventory, doorState) {
  if (doorState.unlocked) return { success: true };
  if (!inventory.hasItem('sohni_room_key')) return { success: false, reason: 'locked' };
  doorState.unlocked = true;
  return { success: true };
}

/**
 * Library's fresco diya-pattern puzzle (LEVEL_DESIGN §5). M3 grey-box simplification: solves
 * immediately on interact rather than requiring the real 5-diya ordered sequence (a later
 * puzzle-feel polish item) — see LEVEL_DESIGN §5's simplification note. Solving reveals the
 * room's key fragment and counterweight as ordinary pickups (see interactable-handler.js's
 * requiresFrescoSolved gate) rather than granting them directly, so they behave like every
 * other pickup in the room.
 */
export function interactFrescoStation(frescoState) {
  if (frescoState.solved) return { success: false, reason: 'already-solved' };
  frescoState.solved = true;
  return { success: true };
}
