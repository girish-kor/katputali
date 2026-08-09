/**
 * Pure caption-text logic for UI_UX §6's accessibility requirement — every state-defining audio
 * cue (Putli's tells, capture, Nazar hallucination) must also be representable as text for
 * players who can't rely on audio, per AUDIO §5. Kept separate from hud.js's DOM glue so it's
 * directly unit-testable per CODING_RULES §10, mirroring hud-format.js's split.
 */

const PUTLI_STATE_CAPTIONS = {
  patrol: 'Putli is patrolling nearby.',
  investigate: 'Putli heard something...',
  chase: 'Putli is chasing you!',
  search: 'Putli is searching for you.'
};

/** Caption text for a Putli FSM state transition, or null for states with no audio tell (Idle/Capture — Capture has its own dedicated caption). */
export function putliStateCaption(state) {
  return PUTLI_STATE_CAPTIONS[state] ?? null;
}

export const CAPTURE_CAPTION = 'You were captured!';
export const NAZAR_HALLUCINATION_CAPTION = 'The Nazar takes hold — reality wavers.';
