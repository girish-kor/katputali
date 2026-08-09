import { on, emit } from '../core/events.js';
import { INTERACTABLES } from '../data/interactables.js';
import { HIDING_SPOTS } from '../data/hiding-spots.js';
import { createInventory } from './inventory.js';
import {
  createRouteProgress, recordItemPickup,
  interactSmithyWorkbench, interactFrontGate,
  interactStepwellPulley, interactWallSconce, interactTunnelGrate,
  interactZiplineChhatri,
  interactSohniBaisRoomDoor, interactFrescoStation
} from './puzzle-stations.js';
import { toggleHiding } from './hiding.js';

const INTERACTABLES_BY_ID = new Map(INTERACTABLES.map(def => [def.id, def]));
const HIDING_SPOTS_BY_ID = new Map(HIDING_SPOTS.map(s => [s.id, s]));

const STATION_HANDLERS = {
  'smithy-workbench': (world) => interactSmithyWorkbench(world.inventory, world.routeProgress),
  'front-gate': (world) => interactFrontGate(world.routeProgress),
  'stepwell-pulley': (world) => interactStepwellPulley(world.inventory, world.routeProgress),
  'wall-sconce': (world) => interactWallSconce(world.inventory, world.routeProgress),
  'tunnel-grate': (world) => interactTunnelGrate(world.routeProgress),
  'zipline-chhatri': (world) => interactZiplineChhatri(world.inventory, world.routeProgress),
  'sohni-bais-room-door': (world) => interactSohniBaisRoomDoor(world.inventory, world.doors.sohniBaisRoom),
  'fresco-station': (world) => interactFrescoStation(world.fresco)
};

/**
 * Central dispatch for interaction:trigger events (from interaction.js) to the pure-logic
 * systems (inventory.js, puzzle-stations.js, hiding.js). Per ARCHITECTURE §3, systems talk
 * through the event bus rather than importing each other directly — this module is the one
 * place that's allowed to know about all of them at once, since dispatch is its whole job.
 */
export function createInteractableHandler(getPlayerState, interactableEntities) {
  const world = {
    inventory: createInventory(),
    routeProgress: createRouteProgress(),
    notesReadThisRun: new Set(),
    doors: { sohniBaisRoom: { unlocked: false } },
    fresco: { solved: false }
  };
  const collectedPickups = new Set();

  function hideEntity(id) {
    const entity = interactableEntities?.get(id);
    if (!entity) return;
    entity.enabled = false;
    entity.tags.remove('interactable');
  }

  function handlePickup(def) {
    if (collectedPickups.has(def.id)) return;
    if (def.requiresFrescoSolved && !world.fresco.solved) return;
    if (!world.inventory.hasSpace()) {
      emit('interaction:feedback', { targetId: def.id, message: 'inventory-full' });
      return;
    }
    world.inventory.addItem(def.itemId);
    recordItemPickup(def.itemId, world.routeProgress);
    collectedPickups.add(def.id);
    hideEntity(def.id);
    emit('inventory:changed', { slots: world.inventory.getSlots() });
  }

  function handleReadable(def) {
    world.notesReadThisRun.add(def.itemId);
    emit('note:read', { itemId: def.itemId });
  }

  // Solving the fresco doesn't need any special-case handling here: the two gated pickups
  // (key_fragment_library, counterweight) are already tagged 'interactable' in the scene —
  // requiresFrescoSolved just blocks handlePickup from granting them until world.fresco.solved.
  function handleStation(def) {
    const handler = STATION_HANDLERS[def.id];
    if (!handler) return;
    const result = handler(world);
    emit('interaction:feedback', { targetId: def.id, ...result });
    if (result.success && result.route) {
      emit('route:completed', { route: result.route });
    }
  }

  function handleHidingSpot(def) {
    const spot = HIDING_SPOTS_BY_ID.get(def.spotId);
    const playerState = getPlayerState();
    const result = toggleHiding(playerState.hiding, spot, playerState.yaw);
    if (result.entered) {
      // Entering snaps the player into the spot, matching GAME_MECHANICS §3's "player becomes
      // untargetable by sight" — exiting leaves them where the spot placed them, same as a
      // normal doorway walk-out.
      playerState.position.x = spot.position.x;
      playerState.position.y = spot.position.y;
      playerState.position.z = spot.position.z;
    }
    emit('hiding:changed', { spotId: def.spotId, entered: result.entered });
  }

  const TYPE_HANDLERS = {
    pickup: handlePickup,
    readable: handleReadable,
    station: handleStation,
    hidingSpot: handleHidingSpot
  };

  on('interaction:trigger', ({ targetId }) => {
    const def = INTERACTABLES_BY_ID.get(targetId);
    if (!def) return;
    TYPE_HANDLERS[def.type]?.(def);
  });

  return { world };
}
