/**
 * Fixed hiding-spot positions per LEVEL_DESIGN §7's grey-box coordinates. M2 only needs these
 * for Putli's Search-state proximity check (AI_SYSTEM §4); full enter/exit/peek interaction is
 * M3 (GAME_MECHANICS §3).
 */

/** @typedef {{ id: string, roomId: string, position: {x:number,y:number,z:number}, radius: number }} HidingSpot */

/** @type {HidingSpot[]} */
export const HIDING_SPOTS = [
  { id: 'courtyard-pillar-ne', roomId: 'courtyard', position: { x: 4, y: 0, z: 4 }, radius: 0.5 },
  { id: 'courtyard-pillar-nw', roomId: 'courtyard', position: { x: -4, y: 0, z: 4 }, radius: 0.5 },
  { id: 'courtyard-pillar-se', roomId: 'courtyard', position: { x: 4, y: 0, z: -4 }, radius: 0.5 },
  { id: 'courtyard-pillar-sw', roomId: 'courtyard', position: { x: -4, y: 0, z: -4 }, radius: 0.5 },
  { id: 'guard-room-almirah', roomId: 'guard-room', position: { x: 8.5, y: 0, z: 1 }, radius: 0.5 },
  { id: 'family-shrine-jaali', roomId: 'family-shrine', position: { x: 1, y: 3.3, z: 6.5 }, radius: 0.5 },
  { id: 'stepwell-alcove', roomId: 'stepwell', position: { x: 4, y: -3.3, z: -4 }, radius: 0.5 }
];

/** Nearest N hiding spots to a world position (Search state evaluates the 1-2 nearest, AI_SYSTEM §4). */
export function nearestHidingSpots(position, count) {
  return [...HIDING_SPOTS]
    .sort((a, b) => distanceSq(a.position, position) - distanceSq(b.position, position))
    .slice(0, count);
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}
