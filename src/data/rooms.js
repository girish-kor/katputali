/**
 * RoomDefinition[] — gameplay metadata for every room, per DATA_MODEL §6.
 * Mirrors the room list in LEVEL_DESIGN §3 exactly. Not geometry — see level-geometry.js.
 * @typedef {{ id: string, name: string, floor: 'basement'|'ground'|'first'|'roof', isHighNazar: boolean, surface: 'stone'|'wood'|'water' }} RoomDefinition
 */

/**
 * `surface` (AUDIO §2's wood/stone/water footstep sets, TASKS §M6) has no per-room spec in
 * LEVEL_DESIGN, so it's resolved here per CODING_RULES §6: ground/basement floors are the
 * haveli's sandstone construction (M5's shared stone material, level.js) -> 'stone'; the
 * stepwell is the one room built around standing water (§3's "water-level puzzle") -> 'water';
 * the first floor's private rooms are period-typical wood-floored haveli chambers -> 'wood'.
 */
export const ROOMS = [
  { id: 'entrance-hall', name: 'Entrance Hall / Deodhi', floor: 'ground', isHighNazar: false, surface: 'stone' },
  { id: 'courtyard', name: 'Central Courtyard (Aangan)', floor: 'ground', isHighNazar: true, surface: 'stone' },
  { id: 'kitchen', name: 'Kitchen', floor: 'ground', isHighNazar: false, surface: 'stone' },
  { id: 'smithy', name: 'Smithy Nook', floor: 'ground', isHighNazar: false, surface: 'stone' },
  { id: 'guard-room', name: 'Guard Room', floor: 'ground', isHighNazar: false, surface: 'stone' },

  { id: 'stepwell', name: 'Stepwell (Baori)', floor: 'basement', isHighNazar: false, surface: 'water' },
  { id: 'cellar', name: 'Storage Cellar', floor: 'basement', isHighNazar: false, surface: 'stone' },

  { id: 'meeras-bedroom', name: "Meera's Old Bedroom", floor: 'first', isHighNazar: false, surface: 'wood' },
  { id: 'sohni-bais-room', name: "Sohni Bai's Locked Room", floor: 'first', isHighNazar: true, surface: 'wood' },
  { id: 'library', name: 'Library', floor: 'first', isHighNazar: false, surface: 'wood' },
  { id: 'family-shrine', name: 'Family Shrine', floor: 'first', isHighNazar: false, surface: 'wood' },

  { id: 'open-chhat', name: 'Open Chhat', floor: 'roof', isHighNazar: false, surface: 'stone' },
  { id: 'zipline-chhatri', name: 'Zipline Chhatri', floor: 'roof', isHighNazar: false, surface: 'stone' }
];
