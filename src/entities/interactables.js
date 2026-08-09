import { Entity, Color, StandardMaterial } from 'playcanvas';
import { INTERACTABLES } from '../data/interactables.js';

const TYPE_COLOR = {
  pickup: [0.75, 0.65, 0.15],
  readable: [0.2, 0.55, 0.2],
  station: [0.15, 0.35, 0.7],
  noiseTrap: [0.6, 0.2, 0.1],
  hidingSpot: [0.45, 0.15, 0.55]
};

// ASSETS §4's palette hex reference, converted to 0-1 RGB — puzzle-prop shapes below are tinted
// from this set rather than arbitrary colors so they read as part of the same art direction.
function hex(h) {
  return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
}
const SANDSTONE = hex(0xC9A66B);
const DEEP_OCHRE = hex(0x8A5A2B);
const VERMILLION = hex(0xB33A2E);
const GOLD = hex(0xD4AF37);
const MOONLIGHT_BLUE = hex(0x7C93C7);
const INDIGO_SHADOW = hex(0x232A4D);
const IRON_GREY = [0.28, 0.29, 0.32];
const NEEM_GREEN = [0.29, 0.42, 0.22];
const PARCHMENT = [0.86, 0.81, 0.68];

function makeMaterial(rgb) {
  const material = new StandardMaterial();
  material.diffuse = new Color(...rgb);
  material.update();
  return material;
}

const materialCache = new Map();
function materialFor(type) {
  if (!materialCache.has(type)) materialCache.set(type, makeMaterial(TYPE_COLOR[type] ?? [0.5, 0.5, 0.5]));
  return materialCache.get(type);
}

const shapeMaterialCache = new Map();
function shapeMaterial(rgb) {
  const key = rgb.join(',');
  if (!shapeMaterialCache.has(key)) shapeMaterialCache.set(key, makeMaterial(rgb));
  return shapeMaterialCache.get(key);
}

/**
 * Recursively builds a small primitive-composite prop (box/cylinder/cone/sphere/capsule — the
 * PlayCanvas render-component primitive set) under `parent`. Distinct silhouettes per item type
 * stand in for full modeled puzzle props (TASKS §M5's "author/texture puzzle props" — bounded to
 * shape-differentiated procedural geometry rather than kitbashing tonally-mismatched modern/
 * fantasy Kenney kit assets onto a Rajasthani-haveli prop list they have no real match for).
 */
function buildPropMesh(parent, spec) {
  const entity = new Entity();
  entity.addComponent('render', { type: spec.type });
  entity.render.material = shapeMaterial(spec.color);
  const [sx, sy, sz] = spec.scale;
  entity.setLocalScale(sx, sy, sz);
  if (spec.offset) entity.setLocalPosition(...spec.offset);
  if (spec.rotation) entity.setLocalEulerAngles(...spec.rotation);
  parent.addChild(entity);
  for (const child of spec.children ?? []) buildPropMesh(entity, child);
  return entity;
}

/** Per-item pickup shape specs (LEVEL_DESIGN §5-6's puzzle props / ward items). */
const ITEM_SHAPE_BY_ID = {
  key_fragment_kitchen: { type: 'box', scale: [0.12, 0.35, 0.05], color: GOLD, rotation: [0, 0, 25] },
  key_fragment_guard_room: { type: 'box', scale: [0.12, 0.35, 0.05], color: GOLD, rotation: [0, 0, -20] },
  key_fragment_library: { type: 'box', scale: [0.12, 0.35, 0.05], color: GOLD, rotation: [0, 0, 45] },

  pulley_part_cellar: { type: 'cylinder', scale: [0.32, 0.08, 0.32], color: DEEP_OCHRE, rotation: [90, 0, 0] },
  pulley_part_stepwell: { type: 'cylinder', scale: [0.32, 0.08, 0.32], color: DEEP_OCHRE, rotation: [90, 0, 0] },
  pulley_part_courtyard: { type: 'cylinder', scale: [0.32, 0.08, 0.32], color: DEEP_OCHRE, rotation: [90, 0, 0] },

  oil_torch: {
    type: 'cylinder', scale: [0.08, 0.4, 0.08], color: DEEP_OCHRE,
    children: [{ type: 'cone', scale: [0.14, 0.18, 0.14], color: VERMILLION, offset: [0, 0.28, 0] }]
  },

  rope: { type: 'capsule', scale: [0.16, 0.3, 0.16], color: SANDSTONE, rotation: [0, 0, 90] },
  hook: {
    type: 'box', scale: [0.06, 0.28, 0.06], color: IRON_GREY,
    children: [{ type: 'box', scale: [0.9, 0.9, 0.9], color: IRON_GREY, offset: [0.1, -0.12, 0], rotation: [0, 0, 55] }]
  },
  counterweight: { type: 'sphere', scale: [0.3, 0.3, 0.3], color: IRON_GREY },

  sohni_room_key: {
    type: 'cylinder', scale: [0.05, 0.32, 0.05], color: GOLD,
    children: [{ type: 'box', scale: [1.6, 0.25, 0.6], color: GOLD, offset: [0, -0.4, 0] }]
  },

  ward_neem_guard_room: { type: 'sphere', scale: [0.18, 0.18, 0.18], color: NEEM_GREEN },
  ward_neem_family_shrine: { type: 'sphere', scale: [0.18, 0.18, 0.18], color: NEEM_GREEN },
  ward_kalava_sohni_bais_room: { type: 'cylinder', scale: [0.06, 0.28, 0.06], color: VERMILLION }
};

const DEFAULT_READABLE_SHAPE = { type: 'box', scale: [0.28, 0.03, 0.36], color: PARCHMENT };

/** Per-station shape specs (LEVEL_DESIGN §5's puzzle stations) — larger, fixed set-dressing geometry. */
const STATION_SHAPE_BY_ID = {
  'smithy-workbench': { type: 'box', scale: [1.4, 0.5, 0.7], color: DEEP_OCHRE },
  'front-gate': { type: 'box', scale: [1.6, 2.2, 0.2], color: DEEP_OCHRE },
  'stepwell-pulley': { type: 'cylinder', scale: [0.6, 0.15, 0.6], color: MOONLIGHT_BLUE, rotation: [90, 0, 0] },
  'wall-sconce': {
    type: 'cylinder', scale: [0.1, 0.35, 0.1], color: IRON_GREY,
    children: [{ type: 'cone', scale: [0.22, 0.22, 0.22], color: VERMILLION, offset: [0, 0.28, 0] }]
  },
  'tunnel-grate': { type: 'box', scale: [1.1, 0.08, 1.4], color: IRON_GREY },
  'zipline-chhatri': { type: 'cylinder', scale: [0.12, 1.6, 0.12], color: GOLD },
  'sohni-bais-room-door': { type: 'box', scale: [0.9, 2.1, 0.15], color: DEEP_OCHRE },
  'fresco-station': { type: 'box', scale: [1.6, 1.2, 0.12], color: INDIGO_SHADOW }
};

function shapeSpecFor(def) {
  if (def.type === 'pickup') return ITEM_SHAPE_BY_ID[def.itemId] ?? null;
  if (def.type === 'readable') return DEFAULT_READABLE_SHAPE;
  if (def.type === 'station') return STATION_SHAPE_BY_ID[def.id] ?? null;
  return null; // hidingSpot/noiseTrap keep their plain marker — see below
}

/**
 * Instantiates a per-interactable entity, tagged 'interactable' so the M1 interaction system
 * (interaction.js) picks it up generically via findByTag — no changes needed there. Entity name
 * matches the interactable id, matching what interaction.js reads for candidate.id. Pickups/
 * readables/stations get a shape-differentiated procedural prop (see shapeSpecFor above);
 * hiding spots and noise traps keep the plain grey-box marker (noise traps are deliberately
 * near-invisible in the final game per LEVEL_DESIGN's "subtle texture difference").
 */
export function createInteractableEntities(app) {
  const root = new Entity('interactables');
  app.root.addChild(root);

  const entities = new Map();
  for (const def of INTERACTABLES) {
    const entity = new Entity(def.id);
    const shapeSpec = shapeSpecFor(def);

    if (shapeSpec) {
      entity.addComponent('render', { type: shapeSpec.type });
      entity.render.material = shapeMaterial(shapeSpec.color);
      entity.setLocalScale(...shapeSpec.scale);
      if (shapeSpec.rotation) entity.setLocalEulerAngles(...shapeSpec.rotation);
      for (const child of shapeSpec.children ?? []) buildPropMesh(entity, child);
    } else {
      entity.addComponent('render', { type: def.type === 'noiseTrap' ? 'box' : 'sphere' });
      entity.render.material = materialFor(def.type);
      const scale = def.type === 'noiseTrap' ? 0.15 : 0.3;
      entity.setLocalScale(scale, scale, scale);
    }

    entity.setPosition(def.position.x, def.position.y, def.position.z);
    entity.tags.add('interactable');
    entity.interactRadius = 0.5;
    root.addChild(entity);
    entities.set(def.id, entity);
  }

  return { root, entities };
}
