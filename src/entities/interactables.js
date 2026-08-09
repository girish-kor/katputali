import { Entity, Color, StandardMaterial } from 'playcanvas';
import { INTERACTABLES } from '../data/interactables.js';

const TYPE_COLOR = {
  pickup: [0.75, 0.65, 0.15],
  readable: [0.2, 0.55, 0.2],
  station: [0.15, 0.35, 0.7],
  noiseTrap: [0.6, 0.2, 0.1],
  hidingSpot: [0.45, 0.15, 0.55]
};

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

/**
 * Instantiates a small grey-box marker per interactable, tagged 'interactable' so the M1
 * interaction system (interaction.js) picks it up generically via findByTag — no changes needed
 * there. Entity name matches the interactable id, matching what interaction.js reads for
 * candidate.id. Noise traps are visually near-invisible in the final game (LEVEL_DESIGN's
 * "subtle texture difference") but get a faint marker here for grey-box testing.
 */
export function createInteractableEntities(app) {
  const root = new Entity('interactables');
  app.root.addChild(root);

  const entities = new Map();
  for (const def of INTERACTABLES) {
    const entity = new Entity(def.id);
    entity.addComponent('render', { type: def.type === 'noiseTrap' ? 'box' : 'sphere' });
    entity.render.material = materialFor(def.type);
    const scale = def.type === 'noiseTrap' ? 0.15 : 0.3;
    entity.setLocalScale(scale, scale, scale);
    entity.setPosition(def.position.x, def.position.y, def.position.z);
    entity.tags.add('interactable');
    entity.interactRadius = 0.5;
    root.addChild(entity);
    entities.set(def.id, entity);
  }

  return { root, entities };
}
