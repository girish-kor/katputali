/**
 * Pure formatting/lookup logic for the HUD (UI_UX §2), kept separate from the DOM-manipulation
 * glue in hud.js so it's directly unit-testable per CODING_RULES §10 without a DOM environment.
 */

const PRAHAR_NAMES = ['', 'First Prahar', 'Second Prahar', 'Third Prahar', 'Fourth Prahar'];

/** "Third Prahar — 2:07" from a Prahar state's current/secondsRemaining. */
export function formatPraharClock(current, secondsRemaining) {
  const clamped = Math.max(0, secondsRemaining);
  const minutes = Math.floor(clamped / 60);
  const seconds = Math.floor(clamped % 60);
  const label = PRAHAR_NAMES[current] ?? `Prahar ${current}`;
  return `${label} — ${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** 0..1 fill fraction for the Nazar meter bar. */
export function nazarFraction(value, max) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

/** Per-pip fill state array (length 3) for the capture pips, per GAME_MECHANICS §4. */
export function capturePipsState(captureCount) {
  return [0, 1, 2].map(i => i < captureCount);
}

const VERB_BY_TYPE = {
  pickup: 'Pick up',
  station: 'Use',
  readable: 'Read',
  hidingSpot: 'Hide'
};

/** Contextual interact-prompt verb, per GAME_MECHANICS §1's interact types. */
export function interactVerb(type, isHiding) {
  if (type === 'hidingSpot') return isHiding ? 'Come out' : 'Hide';
  return VERB_BY_TYPE[type] ?? 'Interact';
}

const ENDING_TITLES = {
  gate: 'The Gate (Deodhi)',
  baori: 'The Stepwell (Baori)',
  rooftop: 'The Rooftop (Chhat)',
  bound: 'Bound'
};

/** End-screen ending title, per STORY §5. */
export function endingTitle(endingId) {
  return ENDING_TITLES[endingId] ?? endingId;
}
