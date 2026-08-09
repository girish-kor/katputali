/**
 * RoomDefinition[] — gameplay metadata for every room, per DATA_MODEL §6.
 * Mirrors the room list in LEVEL_DESIGN §3 exactly. Not geometry — see level-geometry.js.
 * @typedef {{ id: string, name: string, floor: 'basement'|'ground'|'first'|'roof', isHighNazar: boolean }} RoomDefinition
 */

/** @type {RoomDefinition[]} */
export const ROOMS = [
  { id: 'entrance-hall', name: 'Entrance Hall / Deodhi', floor: 'ground', isHighNazar: false },
  { id: 'courtyard', name: 'Central Courtyard (Aangan)', floor: 'ground', isHighNazar: true },
  { id: 'kitchen', name: 'Kitchen', floor: 'ground', isHighNazar: false },
  { id: 'smithy', name: 'Smithy Nook', floor: 'ground', isHighNazar: false },
  { id: 'guard-room', name: 'Guard Room', floor: 'ground', isHighNazar: false },

  { id: 'stepwell', name: 'Stepwell (Baori)', floor: 'basement', isHighNazar: false },
  { id: 'cellar', name: 'Storage Cellar', floor: 'basement', isHighNazar: false },

  { id: 'meeras-bedroom', name: "Meera's Old Bedroom", floor: 'first', isHighNazar: false },
  { id: 'sohni-bais-room', name: "Sohni Bai's Locked Room", floor: 'first', isHighNazar: true },
  { id: 'library', name: 'Library', floor: 'first', isHighNazar: false },
  { id: 'family-shrine', name: 'Family Shrine', floor: 'first', isHighNazar: false },

  { id: 'open-chhat', name: 'Open Chhat', floor: 'roof', isHighNazar: false },
  { id: 'zipline-chhatri', name: 'Zipline Chhatri', floor: 'roof', isHighNazar: false }
];
