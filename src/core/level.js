import { Entity, Color, StandardMaterial } from 'playcanvas';
import { buildLevelGeometry } from '../data/level-geometry.js';

function makeMaterial(r, g, b) {
  const material = new StandardMaterial();
  material.diffuse = new Color(r, g, b);
  material.update();
  return material;
}

function addBox(parent, aabb, material, tag) {
  const { min, max } = aabb;
  const width = max.x - min.x;
  const height = max.y - min.y;
  const depth = max.z - min.z;

  const entity = new Entity();
  entity.addComponent('render', { type: 'box' });
  entity.render.material = material;
  entity.setLocalScale(width, height, depth);
  entity.setPosition((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
  entity.tags.add(tag);
  parent.addChild(entity);
  return entity;
}

/**
 * Builds the grey-box haveli scene from level-geometry.js data (ARCHITECTURE §6: whole level
 * loads as one scene, no streaming). Returns the level root entity plus the raw geometry
 * (wallColliders/stairSteps/roomFloors/doors) that player-controller.js uses for its own
 * hand-rolled collision resolution (see PHYSICS §1 — no Ammo.js/rigidbody physics).
 */
export function buildLevel(app) {
  const root = new Entity('level');
  app.root.addChild(root);

  const wallMaterial = makeMaterial(0.55, 0.5, 0.42);
  const floorMaterial = makeMaterial(0.35, 0.32, 0.28);
  const stairMaterial = makeMaterial(0.45, 0.4, 0.34);
  const doorMaterial = makeMaterial(0.4, 0.25, 0.15);

  const geometry = buildLevelGeometry();

  for (const { floorBox, walls } of geometry.rooms) {
    addBox(root, floorBox, floorMaterial, 'static-level');
    for (const wall of walls) {
      addBox(root, wall, wallMaterial, 'static-level');
    }
  }

  for (const { steps, landingBox } of geometry.staircases) {
    for (const step of steps) addBox(root, step, stairMaterial, 'static-level');
    addBox(root, landingBox, stairMaterial, 'static-level');
  }

  const doorEntities = geometry.doors.map(door => {
    const entity = addBox(root, door.bounds, doorMaterial, 'door');
    entity.enabled = !door.defaultOpen;
    entity.name = door.id;
    return { id: door.id, entity, open: door.defaultOpen };
  });

  return { root, geometry, doorEntities };
}

/** Toggles a door's visibility/collision on or off (closed = solid, open = passable). */
export function setDoorOpen(doorEntities, doorId, open) {
  const door = doorEntities.find(d => d.id === doorId);
  if (!door) return;
  door.open = open;
  door.entity.enabled = !open;
}
