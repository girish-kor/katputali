/**
 * Three overlapping named patrol loops, per AI_SYSTEM §5 — sequences of room ids (not raw
 * waypoints; ai-putli.js expands each consecutive pair into a full graph path via
 * navigation-graph.js, since adjacent rooms in a loop aren't always in the same straight line).
 * Courtyard legs appear in every loop and are weighted higher when re-rolling (see PATROL_WEIGHTS)
 * since it's the hub, keeping average time-to-encounter roughly even across floors.
 */

export const PATROL_ROUTES = {
  'courtyard-ground': ['courtyard', 'entrance-hall', 'courtyard', 'guard-room', 'smithy', 'kitchen', 'smithy', 'guard-room', 'courtyard'],
  'courtyard-upstairs': ['courtyard', 'library', 'meeras-bedroom', 'library', 'sohni-bais-room', 'library', 'family-shrine', 'library', 'courtyard'],
  'courtyard-basement': ['courtyard', 'stepwell', 'cellar', 'stepwell', 'courtyard']
};

/** Re-roll weights when a loop completes — Courtyard-anchored loops all get equal, higher weight. */
export const PATROL_WEIGHTS = {
  'courtyard-ground': 1,
  'courtyard-upstairs': 1,
  'courtyard-basement': 1
};

/** Weighted-random pick of the next patrol loop to run, per AI_SYSTEM §5. */
export function pickNextPatrolRoute(random = Math.random) {
  const entries = Object.entries(PATROL_WEIGHTS);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return id;
  }
  return entries[entries.length - 1][0];
}
