/**
 * InteractableDefinition[] per DATA_MODEL §6, placed per LEVEL_DESIGN §3, §5-6. Positions are
 * world-space (matching level-geometry.js), chosen clear of walls/doors/staircase footprints.
 * @typedef {{ id: string, roomId: string, type: 'pickup'|'station'|'hidingSpot'|'noiseTrap'|'readable', itemId: string|null, position: {x:number,y:number,z:number} }} InteractableDefinition
 */

import { HIDING_SPOTS } from './hiding-spots.js';

/** @type {InteractableDefinition[]} */
export const PICKUPS = [
  { id: 'pickup_key_fragment_kitchen', roomId: 'kitchen', type: 'pickup', itemId: 'key_fragment_kitchen', position: { x: 16, y: 0, z: 0.5 } },
  { id: 'pickup_key_fragment_guard_room', roomId: 'guard-room', type: 'pickup', itemId: 'key_fragment_guard_room', position: { x: 8.5, y: 0, z: -1 } },
  // key_fragment_library is gated behind the fresco puzzle — see requiresFrescoSolved below.
  { id: 'pickup_key_fragment_library', roomId: 'library', type: 'pickup', itemId: 'key_fragment_library', position: { x: -1.5, y: 3.3, z: 1.5 }, requiresFrescoSolved: true },

  { id: 'pickup_pulley_part_cellar', roomId: 'cellar', type: 'pickup', itemId: 'pulley_part_cellar', position: { x: 9, y: -3.3, z: 1.5 } },
  { id: 'pickup_pulley_part_stepwell', roomId: 'stepwell', type: 'pickup', itemId: 'pulley_part_stepwell', position: { x: -2, y: -3.3, z: 4 } },
  { id: 'pickup_pulley_part_courtyard', roomId: 'courtyard', type: 'pickup', itemId: 'pulley_part_courtyard', position: { x: 2, y: 0, z: -4 } },
  { id: 'pickup_oil_torch', roomId: 'cellar', type: 'pickup', itemId: 'oil_torch', position: { x: 10.5, y: -3.3, z: -1.5 } },

  { id: 'pickup_rope', roomId: 'meeras-bedroom', type: 'pickup', itemId: 'rope', position: { x: 5.5, y: 3.3, z: -1.5 } },
  { id: 'pickup_hook', roomId: 'guard-room', type: 'pickup', itemId: 'hook', position: { x: 6.5, y: 0, z: 1.2 } },
  // counterweight is also gated behind the fresco puzzle (LEVEL_DESIGN §5's "alt. of the fresco puzzle reward").
  { id: 'pickup_counterweight', roomId: 'library', type: 'pickup', itemId: 'counterweight', position: { x: 1.5, y: 3.3, z: 1.5 }, requiresFrescoSolved: true },

  { id: 'pickup_sohni_room_key', roomId: 'family-shrine', type: 'pickup', itemId: 'sohni_room_key', position: { x: -1, y: 3.3, z: 6.5 } },

  { id: 'pickup_ward_neem_guard_room', roomId: 'guard-room', type: 'pickup', itemId: 'ward_neem_guard_room', position: { x: 8.5, y: 0, z: -1.5 } },
  { id: 'pickup_ward_neem_family_shrine', roomId: 'family-shrine', type: 'pickup', itemId: 'ward_neem_family_shrine', position: { x: 1, y: 3.3, z: 6.5 } },
  { id: 'pickup_ward_kalava_sohni_bais_room', roomId: 'sohni-bais-room', type: 'pickup', itemId: 'ward_kalava_sohni_bais_room', position: { x: -5.5, y: 3.3, z: -1 } }
];

/** @type {InteractableDefinition[]} */
export const READABLES = [
  { id: 'note_meeras_bedroom', roomId: 'meeras-bedroom', type: 'readable', itemId: 'note_meeras_bedroom', position: { x: 5.5, y: 3.3, z: 2 } },
  { id: 'note_sohni_1', roomId: 'sohni-bais-room', type: 'readable', itemId: 'note_sohni_1', position: { x: -6.5, y: 3.3, z: 1 } },
  { id: 'note_sohni_2', roomId: 'sohni-bais-room', type: 'readable', itemId: 'note_sohni_2', position: { x: -6.5, y: 3.3, z: -1 } },
  { id: 'note_sohni_3', roomId: 'sohni-bais-room', type: 'readable', itemId: 'note_sohni_3', position: { x: -4.5, y: 3.3, z: 0 } },
  { id: 'note_library', roomId: 'library', type: 'readable', itemId: 'note_library', position: { x: 0, y: 3.3, z: -2.5 } },
  { id: 'note_family_shrine', roomId: 'family-shrine', type: 'readable', itemId: 'note_family_shrine', position: { x: -1, y: 3.3, z: 7 } }
];

/** Stations: use-in-place/combine interactables driving puzzle-stations.js. */
export const STATIONS = [
  { id: 'smithy-workbench', roomId: 'smithy', type: 'station', itemId: null, label: 'Smithy Workbench', position: { x: 11.5, y: 0, z: 0 } },
  { id: 'front-gate', roomId: 'entrance-hall', type: 'station', itemId: null, label: 'Front Gate', position: { x: 0, y: 0, z: -12 } },
  { id: 'stepwell-pulley', roomId: 'stepwell', type: 'station', itemId: null, label: 'Stepwell Pulley', position: { x: 4, y: -3.3, z: 4 } },
  { id: 'wall-sconce', roomId: 'stepwell', type: 'station', itemId: null, label: 'Wall Sconce', position: { x: -4, y: -3.3, z: -4 } },
  { id: 'tunnel-grate', roomId: 'stepwell', type: 'station', itemId: null, label: 'Tunnel Grate', position: { x: 0, y: -3.3, z: -4.5 } },
  { id: 'zipline-chhatri', roomId: 'zipline-chhatri', type: 'station', itemId: null, label: 'Zipline Rig', position: { x: 6.5, y: 6.6, z: 0 } },
  { id: 'sohni-bais-room-door', roomId: 'sohni-bais-room', type: 'station', itemId: null, label: "Sohni Bai's Door", position: { x: -3.5, y: 3.3, z: 0 } },
  { id: 'fresco-station', roomId: 'library', type: 'station', itemId: null, label: 'Fresco Wall', position: { x: 0, y: 3.3, z: 3 } }
];

/** @type {InteractableDefinition[]} */
export const NOISE_TRAPS = [
  { id: 'trap_kitchen_floorboard', roomId: 'kitchen', type: 'noiseTrap', itemId: null, position: { x: 15, y: 0, z: -0.5 } },
  { id: 'trap_open_chhat_water_tank', roomId: 'open-chhat', type: 'noiseTrap', itemId: null, position: { x: -2, y: 6.6, z: -2 } }
];

/** Hiding spots, reusing hiding-spots.js positions — kept as one source of truth for placement. */
export const HIDING_SPOT_INTERACTABLES = HIDING_SPOTS.map(spot => ({
  id: `hiding_${spot.id}`,
  roomId: spot.roomId,
  type: 'hidingSpot',
  itemId: null,
  position: spot.position,
  spotId: spot.id
}));

export const INTERACTABLES = [
  ...PICKUPS,
  ...READABLES,
  ...STATIONS,
  ...NOISE_TRAPS,
  ...HIDING_SPOT_INTERACTABLES
];
