/**
 * Grey-box geometry data for the haveli, per LEVEL_DESIGN §3 (scale table) and §4 (connectivity).
 * Pure data + generator functions — no PlayCanvas dependency, so this is directly unit-testable.
 * Coordinates are meters; Y is up. Floors stack vertically at FLOOR_Y; rooms on different floors
 * may share XZ footprint (real buildings do) since only same-floor rooms must not overlap.
 */

export const SIZE_CLASSES = {
  S: 2,
  M: 3.5,
  L: 5.5
};

export const FLOOR_Y = {
  basement: -3.3,
  ground: 0,
  first: 3.3,
  roof: 6.6
};

export const WALL_THICKNESS = 0.3;
export const WALL_HEIGHT = 3.0;
export const FLOOR_SLAB_THICKNESS = 0.3;
export const DOOR_WIDTH = 1.3;
export const DOOR_HEIGHT = 2.2;

/** @typedef {{ north: boolean, south: boolean, east: boolean, west: boolean }} DoorSides */
/** @typedef {{ id: string, floor: keyof typeof FLOOR_Y, sizeClass: keyof typeof SIZE_CLASSES, center: {x:number,z:number}, doors: DoorSides }} RoomLayout */

/** @type {RoomLayout[]} */
export const ROOM_LAYOUT = [
  { id: 'entrance-hall', floor: 'ground', sizeClass: 'M', center: { x: 0, z: -9 }, doors: { north: true, south: false, east: false, west: false } },
  { id: 'courtyard', floor: 'ground', sizeClass: 'L', center: { x: 0, z: 0 }, doors: { north: false, south: true, east: true, west: false } },
  { id: 'guard-room', floor: 'ground', sizeClass: 'S', center: { x: 7.5, z: 0 }, doors: { north: false, south: false, east: true, west: true } },
  { id: 'smithy', floor: 'ground', sizeClass: 'S', center: { x: 11.5, z: 0 }, doors: { north: false, south: false, east: true, west: true } },
  { id: 'kitchen', floor: 'ground', sizeClass: 'S', center: { x: 15.5, z: 0 }, doors: { north: false, south: false, east: false, west: true } },

  { id: 'stepwell', floor: 'basement', sizeClass: 'L', center: { x: 0, z: 0 }, doors: { north: false, south: false, east: true, west: false } },
  { id: 'cellar', floor: 'basement', sizeClass: 'M', center: { x: 9, z: 0 }, doors: { north: false, south: false, east: false, west: true } },

  { id: 'library', floor: 'first', sizeClass: 'M', center: { x: 0, z: 0 }, doors: { north: true, south: false, east: true, west: true } },
  { id: 'sohni-bais-room', floor: 'first', sizeClass: 'S', center: { x: -5.5, z: 0 }, doors: { north: false, south: false, east: true, west: false } },
  { id: 'meeras-bedroom', floor: 'first', sizeClass: 'S', center: { x: 5.5, z: 0 }, doors: { north: false, south: false, east: false, west: true } },
  { id: 'family-shrine', floor: 'first', sizeClass: 'S', center: { x: 0, z: 5.5 }, doors: { north: false, south: true, east: false, west: false } },

  { id: 'open-chhat', floor: 'roof', sizeClass: 'M', center: { x: 0, z: 0 }, doors: { north: false, south: false, east: true, west: false } },
  { id: 'zipline-chhatri', floor: 'roof', sizeClass: 'S', center: { x: 5.5, z: 0 }, doors: { north: false, south: false, east: false, west: true } }
];

/**
 * Freestanding staircases connecting floors (not confined to either room's footprint).
 * Each is an L-shaped flight: base -> (dir1, half the rise) -> landing -> (dir2, remaining rise) -> top.
 * Step rise (0.165m) stays under PLAYER_MOVEMENT.stepHeight (0.2m, see DATA_MODEL §4) so the
 * player controller's step-up climbs every step without dedicated ramp/stair collision code.
 */
export const STAIRCASES = [
  { id: 'basement-stairs', fromFloor: 'ground', toFloor: 'basement', baseRoomId: 'courtyard', topRoomId: 'stepwell', base: { x: -3, z: -3 }, dir1: { x: 1, z: 0 }, dir2: { x: 0, z: 1 } },
  { id: 'main-staircase', fromFloor: 'ground', toFloor: 'first', baseRoomId: 'courtyard', topRoomId: 'library', base: { x: 3, z: 3 }, dir1: { x: -1, z: 0 }, dir2: { x: 0, z: -1 } },
  { id: 'stairwell', fromFloor: 'first', toFloor: 'roof', baseRoomId: 'library', topRoomId: 'open-chhat', base: { x: -2.5, z: -2.5 }, dir1: { x: 1, z: 0 }, dir2: { x: 0, z: 1 } }
];

/**
 * Every wall-door connection, one entry per pair (not per room) — mirrors LEVEL_DESIGN §4's
 * connectivity graph plus the First Floor/Rooftop intra-group doors this implementation adds
 * (see LEVEL_DESIGN §3's grey-box scale note). Each becomes one DOOR collision-category
 * entity (PHYSICS §3), distinct from static wall/floor geometry, defaulting to open so the
 * grey-box level is traversable for the M1 playtest; closed/locked state is wired by later
 * milestones (e.g. Sohni Bai's room requiring a key, per LEVEL_DESIGN §5).
 */
export const DOOR_PAIRS = [
  { id: 'door_courtyard_entrance-hall', roomA: 'courtyard', sideA: 'south', roomB: 'entrance-hall' },
  { id: 'door_courtyard_guard-room', roomA: 'courtyard', sideA: 'east', roomB: 'guard-room' },
  { id: 'door_guard-room_smithy', roomA: 'guard-room', sideA: 'east', roomB: 'smithy' },
  { id: 'door_smithy_kitchen', roomA: 'smithy', sideA: 'east', roomB: 'kitchen' },
  { id: 'door_stepwell_cellar', roomA: 'stepwell', sideA: 'east', roomB: 'cellar' },
  { id: 'door_library_sohni-bais-room', roomA: 'library', sideA: 'west', roomB: 'sohni-bais-room' },
  { id: 'door_library_meeras-bedroom', roomA: 'library', sideA: 'east', roomB: 'meeras-bedroom' },
  { id: 'door_library_family-shrine', roomA: 'library', sideA: 'north', roomB: 'family-shrine' },
  { id: 'door_open-chhat_zipline-chhatri', roomA: 'open-chhat', sideA: 'east', roomB: 'zipline-chhatri' }
];

export const STAIR_STEPS_PER_FLIGHT = 10;
export const STAIR_STEP_RUN = 0.3;
export const STAIR_STEP_WIDTH = 1.0;

function box(minX, minY, minZ, maxX, maxY, maxZ) {
  return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } };
}

/** World-space AABB bounds for a room's footprint (does not include wall thickness). */
export function getRoomBounds(room) {
  const h = SIZE_CLASSES[room.sizeClass];
  const floorY = FLOOR_Y[room.floor];
  return {
    minX: room.center.x - h,
    maxX: room.center.x + h,
    minZ: room.center.z - h,
    maxZ: room.center.z + h,
    floorY
  };
}

/**
 * Finds which room a world position is currently "in" — the room whose XZ footprint contains
 * the point, disambiguating overlapping floors (see level-geometry's module doc) by picking the
 * one whose floorY is closest to the position's Y. Returns null if outside every room (e.g.
 * mid-staircase). Used by nazar-meter's tainted-room trigger and capture-struggle's respawn logic.
 */
export function findCurrentRoom(position, roomLayout = ROOM_LAYOUT) {
  let best = null;
  let bestYDist = Infinity;
  for (const room of roomLayout) {
    const bounds = getRoomBounds(room);
    if (position.x < bounds.minX || position.x > bounds.maxX) continue;
    if (position.z < bounds.minZ || position.z > bounds.maxZ) continue;
    const yDist = Math.abs(position.y - bounds.floorY);
    if (yDist < bestYDist) {
      bestYDist = yDist;
      best = room;
    }
  }
  return best;
}

/** Floor slab + wall segments (with door gaps/headers) for one room. */
export function buildRoomGeometry(room) {
  const h = SIZE_CLASSES[room.sizeClass];
  const { x: cx, z: cz } = room.center;
  const floorY = FLOOR_Y[room.floor];
  const t = WALL_THICKNESS;
  const wh = WALL_HEIGHT;
  const dw = DOOR_WIDTH;
  const dh = DOOR_HEIGHT;

  const floorBox = box(cx - h, floorY - FLOOR_SLAB_THICKNESS, cz - h, cx + h, floorY, cz + h);

  const walls = [];

  // North/south walls run along X, centered on z = cz +/- h.
  const addNSWall = (z, hasDoor) => {
    const zMin = z - t / 2;
    const zMax = z + t / 2;
    if (!hasDoor) {
      walls.push(box(cx - h, floorY, zMin, cx + h, floorY + wh, zMax));
      return;
    }
    walls.push(box(cx - h, floorY, zMin, cx - dw / 2, floorY + wh, zMax));
    walls.push(box(cx + dw / 2, floorY, zMin, cx + h, floorY + wh, zMax));
    walls.push(box(cx - dw / 2, floorY + dh, zMin, cx + dw / 2, floorY + wh, zMax));
  };

  // East/west walls run along Z, centered on x = cx +/- h.
  const addEWWall = (x, hasDoor) => {
    const xMin = x - t / 2;
    const xMax = x + t / 2;
    if (!hasDoor) {
      walls.push(box(xMin, floorY, cz - h, xMax, floorY + wh, cz + h));
      return;
    }
    walls.push(box(xMin, floorY, cz - h, xMax, floorY + wh, cz - dw / 2));
    walls.push(box(xMin, floorY, cz + dw / 2, xMax, floorY + wh, cz + h));
    walls.push(box(xMin, floorY + dh, cz - dw / 2, xMax, floorY + wh, cz + dw / 2));
  };

  addNSWall(cz + h, room.doors.north);
  addNSWall(cz - h, room.doors.south);
  addEWWall(cx + h, room.doors.east);
  addEWWall(cx - h, room.doors.west);

  return { room, floorBox, walls };
}

/** One AABB per door pair, sized to the door opening, at the shared wall boundary. Defaults open. */
export function buildDoors() {
  const byId = new Map(ROOM_LAYOUT.map(r => [r.id, r]));
  return DOOR_PAIRS.map(pair => {
    const roomA = byId.get(pair.roomA);
    const boundsA = getRoomBounds(roomA);
    const floorY = boundsA.floorY;
    const dw = DOOR_WIDTH;
    const dh = DOOR_HEIGHT;
    const t = WALL_THICKNESS;
    let doorBox;
    if (pair.sideA === 'east') {
      const x = boundsA.maxX;
      doorBox = box(x - t / 2, floorY, roomA.center.z - dw / 2, x + t / 2, floorY + dh, roomA.center.z + dw / 2);
    } else if (pair.sideA === 'west') {
      const x = boundsA.minX;
      doorBox = box(x - t / 2, floorY, roomA.center.z - dw / 2, x + t / 2, floorY + dh, roomA.center.z + dw / 2);
    } else if (pair.sideA === 'north') {
      const z = boundsA.maxZ;
      doorBox = box(roomA.center.x - dw / 2, floorY, z - t / 2, roomA.center.x + dw / 2, floorY + dh, z + t / 2);
    } else {
      const z = boundsA.minZ;
      doorBox = box(roomA.center.x - dw / 2, floorY, z - t / 2, roomA.center.x + dw / 2, floorY + dh, z + t / 2);
    }
    return { id: pair.id, roomA: pair.roomA, roomB: pair.roomB, bounds: doorBox, defaultOpen: true };
  });
}

function normalize2D(v) {
  const len = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / len, z: v.z / len };
}

/**
 * Generates one L-shaped flight of steps for a staircase: two straight runs of
 * STAIR_STEPS_PER_FLIGHT steps each, joined by a flat landing, rising/descending
 * from FLOOR_Y[fromFloor] to FLOOR_Y[toFloor].
 */
export function buildStaircaseGeometry(stair) {
  const startY = FLOOR_Y[stair.fromFloor];
  const endY = FLOOR_Y[stair.toFloor];
  const totalRise = endY - startY;
  const flightRise = totalRise / 2;
  const stepRise = flightRise / STAIR_STEPS_PER_FLIGHT;
  const halfW = STAIR_STEP_WIDTH / 2;
  const dir1 = normalize2D(stair.dir1);
  const dir2 = normalize2D(stair.dir2);
  const perp1 = { x: -dir1.z, z: dir1.x };
  const perp2 = { x: -dir2.z, z: dir2.x };

  const steps = [];

  const addFlight = (base, dir, perp, startStepY) => {
    let x = base.x;
    let z = base.z;
    let y = startStepY;
    for (let i = 0; i < STAIR_STEPS_PER_FLIGHT; i++) {
      const nx = x + dir.x * STAIR_STEP_RUN;
      const nz = z + dir.z * STAIR_STEP_RUN;
      const ny = y + stepRise;
      const topY = Math.max(y, ny);
      const bottomY = topY - 0.2;
      steps.push(box(
        Math.min(x, nx) - halfW * Math.abs(perp.x), bottomY, Math.min(z, nz) - halfW * Math.abs(perp.z),
        Math.max(x, nx) + halfW * Math.abs(perp.x), topY, Math.max(z, nz) + halfW * Math.abs(perp.z)
      ));
      x = nx; z = nz; y = ny;
    }
    return { x, z, y };
  };

  const landing = addFlight(stair.base, dir1, perp1, startY);
  const top = addFlight(landing, dir2, perp2, landing.y);

  const landingBox = box(
    landing.x - 0.65, landing.y - 0.2, landing.z - 0.65,
    landing.x + 0.65, landing.y, landing.z + 0.65
  );

  return { stair, steps, landingBox, landingPosition: landing, topPosition: top };
}

/** Aggregates every room + staircase into render geometry and a flat collider list. */
export function buildLevelGeometry() {
  const rooms = ROOM_LAYOUT.map(buildRoomGeometry);
  const staircases = STAIRCASES.map(buildStaircaseGeometry);
  const doors = buildDoors();

  /** @type {{min:{x,y,z},max:{x,y,z}}[]} */
  const wallColliders = rooms.flatMap(r => r.walls);

  /** Walkable surfaces for ground-height lookup: room floors (as bounds+Y) + stair steps (as AABB). */
  const roomFloors = ROOM_LAYOUT.map(room => ({ id: room.id, bounds: getRoomBounds(room) }));
  const stairSteps = staircases.flatMap(s => [...s.steps, s.landingBox]);

  return { rooms, staircases, wallColliders, roomFloors, stairSteps, doors };
}
