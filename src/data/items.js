/**
 * ItemDefinition[] per DATA_MODEL §5, mirroring LEVEL_DESIGN §5-6 exactly (that doc is the
 * design source of truth). `combinesWith` names the station id (see interactables.js) an item
 * is used at, or another ItemId for a direct pairwise combine.
 * @typedef {{ id: string, category: 'key'|'ward'|'lore', displayName: string, route: 'gate'|'baori'|'rooftop'|null, combinesWith: string|null }} ItemDefinition
 */

/** @type {ItemDefinition[]} */
export const ITEMS = [
  // Gate route
  { id: 'key_fragment_kitchen', category: 'key', displayName: 'Key Fragment', route: 'gate', combinesWith: 'smithy-workbench' },
  { id: 'key_fragment_guard_room', category: 'key', displayName: 'Key Fragment', route: 'gate', combinesWith: 'smithy-workbench' },
  { id: 'key_fragment_library', category: 'key', displayName: 'Key Fragment', route: 'gate', combinesWith: 'smithy-workbench' },

  // Baori route
  { id: 'pulley_part_cellar', category: 'key', displayName: 'Pulley Part', route: 'baori', combinesWith: 'stepwell-pulley' },
  { id: 'pulley_part_stepwell', category: 'key', displayName: 'Pulley Part', route: 'baori', combinesWith: 'stepwell-pulley' },
  { id: 'pulley_part_courtyard', category: 'key', displayName: 'Pulley Part', route: 'baori', combinesWith: 'stepwell-pulley' },
  { id: 'oil_torch', category: 'key', displayName: 'Oil Torch', route: 'baori', combinesWith: 'wall-sconce' },

  // Rooftop route
  { id: 'rope', category: 'key', displayName: 'Rope', route: 'rooftop', combinesWith: 'zipline-chhatri' },
  { id: 'hook', category: 'key', displayName: 'Hook', route: 'rooftop', combinesWith: 'zipline-chhatri' },
  { id: 'counterweight', category: 'key', displayName: 'Counterweight', route: 'rooftop', combinesWith: 'zipline-chhatri' },

  // Access (not route-scoped — see LEVEL_DESIGN §6's room-key note)
  { id: 'sohni_room_key', category: 'key', displayName: "Sohni Bai's Room Key", route: null, combinesWith: 'sohni-bais-room-door' },

  // Ward items (consumed against the Nazar meter — GAME_MECHANICS §5, wired in M4)
  { id: 'ward_neem_guard_room', category: 'ward', displayName: 'Neem Bundle', route: null, combinesWith: null },
  { id: 'ward_neem_family_shrine', category: 'ward', displayName: 'Neem Bundle', route: null, combinesWith: null },
  { id: 'ward_kalava_sohni_bais_room', category: 'ward', displayName: 'Kalava Thread', route: null, combinesWith: null },

  // Lore notes (read then removed from inventory into the permanent read log — GAME_MECHANICS §2)
  { id: 'note_meeras_bedroom', category: 'lore', displayName: "Meera's Diary — a page", route: null, combinesWith: null },
  { id: 'note_sohni_1', category: 'lore', displayName: "Sohni Bai's Diary — page 1", route: null, combinesWith: null },
  { id: 'note_sohni_2', category: 'lore', displayName: "Sohni Bai's Diary — page 2", route: null, combinesWith: null },
  { id: 'note_sohni_3', category: 'lore', displayName: "Sohni Bai's Diary — page 3", route: null, combinesWith: null },
  { id: 'note_library', category: 'lore', displayName: 'A Troupe Ledger Page', route: null, combinesWith: null },
  { id: 'note_family_shrine', category: 'lore', displayName: 'A Prayer Note', route: null, combinesWith: null }
];

export const ITEMS_BY_ID = new Map(ITEMS.map(item => [item.id, item]));
