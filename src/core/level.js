import { Asset, Entity, Color, StandardMaterial, Vec2 } from 'playcanvas';
import { buildLevelGeometry } from '../data/level-geometry.js';
import { SANDSTONE_TEXTURE_URLS } from '../data/textures.js';

// Palette hex reference from ASSETS §4 (environment/lighting authoring reference). Used as
// diffuse-color multipliers on the shared sandstone texture map (white = texture at full
// brightness) and as flat tints on untextured surfaces (doors).
const PALETTE = {
  white: new Color(1, 1, 1),
  // 60% white / 40% indigo-shadow (#232A4D) blend — cools and darkens the shared sandstone
  // texture for floors without crushing it to near-black the way a pure indigo multiply would.
  floorShadowTint: new Color(0.655, 0.666, 0.721),
  deepOchre: new Color(0.541, 0.353, 0.169) // #8A5A2B — flat door tint
};

function makeMaterial(r, g, b) {
  const material = new StandardMaterial();
  material.diffuse = new Color(r, g, b);
  material.update();
  return material;
}

const SANDSTONE_MAP_NAMES = ['diffuse', 'normal', 'gloss', 'ao'];
const SANDSTONE_URL_BY_MAP_NAME = {
  diffuse: SANDSTONE_TEXTURE_URLS.diffuse,
  normal: SANDSTONE_TEXTURE_URLS.normal,
  gloss: SANDSTONE_TEXTURE_URLS.roughness,
  ao: SANDSTONE_TEXTURE_URLS.ao
};

/**
 * Kicks off loading the sourced sandstone texture set (ASSETS §5) once — returns the 4 texture
 * Assets so multiple materials (walls, floor) can share the same underlying Texture resources
 * instead of each re-downloading/duplicating them in VRAM (PERFORMANCE §2's texture-memory budget).
 */
function loadSandstoneTextureSet(app) {
  const assets = {};
  for (const name of SANDSTONE_MAP_NAMES) {
    const asset = new Asset(`sandstone-${name}`, 'texture', { url: SANDSTONE_URL_BY_MAP_NAME[name] });
    app.assets.add(asset);
    app.assets.load(asset);
    assets[name] = asset;
  }
  return assets;
}

/**
 * Builds a flat-shaded placeholder material that upgrades in place to a full PBR material as each
 * shared sandstone texture Asset becomes ready — entities already holding a reference to this
 * material object pick up the swap automatically via material.update(), so no scene rebuild or
 * load-screen gate is needed (none exists yet; that's M6 UI_UX §1 work). `tint` is a diffuse-color
 * multiplier applied on top of the shared texture (white = full brightness, darker = shadowed).
 */
function makeStoneMaterial(sandstoneAssets, tint, tilesPerMeter) {
  const material = makeMaterial(tint.r, tint.g, tint.b);

  for (const name of SANDSTONE_MAP_NAMES) {
    const asset = sandstoneAssets[name];
    const applyMap = () => {
      material[`${name}Map`] = asset.resource;
      material[`${name}MapTiling`] = new Vec2(tilesPerMeter, tilesPerMeter);
      if (name === 'gloss') material.glossInvert = true; // map is a roughness map, not gloss
      material.update();
    };
    if (asset.resource) applyMap();
    else asset.ready(applyMap);
  }

  return material;
}

function addBox(parent, aabb, material, tag, batchGroupId) {
  const { min, max } = aabb;
  const width = max.x - min.x;
  const height = max.y - min.y;
  const depth = max.z - min.z;

  const entity = new Entity();
  entity.addComponent('render', { type: 'box' });
  entity.render.material = material;
  if (batchGroupId !== undefined) entity.render.batchGroupId = batchGroupId;
  entity.setLocalScale(width, height, depth);
  entity.setPosition((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
  entity.tags.add(tag);
  parent.addChild(entity);
  return entity;
}

// Whole-haveli AABB comfortably covers every room/staircase (see LEVEL_DESIGN §3's coordinate
// range) — static batch groups merge same-material, never-moving geometry into far fewer draw
// calls, needed to hit PERFORMANCE §2's <=150 draw call budget (measured at 173 separate boxes
// pre-batching). Doors are excluded — open/closed state toggles entity.enabled per-door, which
// static batching can't represent per-instance, so they stay unbatched (only 9 of them, cheap).
const LEVEL_AABB_SIZE = 100;

/**
 * Builds the grey-box haveli scene from level-geometry.js data (ARCHITECTURE §6: whole level
 * loads as one scene, no streaming). Returns the level root entity plus the raw geometry
 * (wallColliders/stairSteps/roomFloors/doors) that player-controller.js uses for its own
 * hand-rolled collision resolution (see PHYSICS §1 — no Ammo.js/rigidbody physics).
 */
export function buildLevel(app) {
  const root = new Entity('level');
  app.root.addChild(root);

  // Shared sandstone PBR set (ASSETS §5) — one texture asset reused across walls/floor/stairs
  // keeps texture memory and draw-call cost down per PERFORMANCE §2's atlasing/batching guidance.
  // Tiling is tuned per surface so the ~1m-per-block source photo reads at a believable scale.
  const sandstoneAssets = loadSandstoneTextureSet(app);
  const wallMaterial = makeStoneMaterial(sandstoneAssets, PALETTE.white, 0.5);
  const floorMaterial = makeStoneMaterial(sandstoneAssets, PALETTE.floorShadowTint, 0.35);
  const stairMaterial = floorMaterial;
  const doorMaterial = makeMaterial(PALETTE.deepOchre.r, PALETTE.deepOchre.g, PALETTE.deepOchre.b);

  const wallBatchGroup = app.batcher?.addGroup('level-walls', false, LEVEL_AABB_SIZE);
  const floorBatchGroup = app.batcher?.addGroup('level-floor-stairs', false, LEVEL_AABB_SIZE);

  const geometry = buildLevelGeometry();

  for (const { floorBox, walls } of geometry.rooms) {
    addBox(root, floorBox, floorMaterial, 'static-level', floorBatchGroup?.id);
    for (const wall of walls) {
      addBox(root, wall, wallMaterial, 'static-level', wallBatchGroup?.id);
    }
  }

  for (const { steps, landingBox } of geometry.staircases) {
    for (const step of steps) addBox(root, step, stairMaterial, 'static-level', floorBatchGroup?.id);
    addBox(root, landingBox, stairMaterial, 'static-level', floorBatchGroup?.id);
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
