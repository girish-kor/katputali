/**
 * URLs for sourced audio clips actually wired into the game (see ASSETS §5 for license
 * tracking) — a deliberate subset of the downloaded Kenney packs, not every file in them.
 * Vite resolves these imports to hashed, build-copied URLs, same pattern as data/textures.js.
 */
import confirmUrl from '../../assets/audio/kenney-interface-sounds/Audio/confirmation_001.ogg?url';
import errorUrl from '../../assets/audio/kenney-interface-sounds/Audio/error_001.ogg?url';

import bookOpenUrl from '../../assets/audio/kenney-rpg-audio/Audio/bookOpen.ogg?url';
import bookCloseUrl from '../../assets/audio/kenney-rpg-audio/Audio/bookClose.ogg?url';
import clothUrl from '../../assets/audio/kenney-rpg-audio/Audio/cloth1.ogg?url';
import creak1Url from '../../assets/audio/kenney-rpg-audio/Audio/creak1.ogg?url';
import creak2Url from '../../assets/audio/kenney-rpg-audio/Audio/creak2.ogg?url';
import creak3Url from '../../assets/audio/kenney-rpg-audio/Audio/creak3.ogg?url';

import footstepWood0Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_wood_000.ogg?url';
import footstepWood1Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_wood_001.ogg?url';
import footstepWood2Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_wood_002.ogg?url';
import footstepStone0Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_concrete_000.ogg?url';
import footstepStone1Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_concrete_001.ogg?url';
import footstepStone2Url from '../../assets/audio/kenney-impact-sounds/Audio/footstep_concrete_002.ogg?url';
import bellHeavy0Url from '../../assets/audio/kenney-impact-sounds/Audio/impactBell_heavy_000.ogg?url';
import bellHeavy1Url from '../../assets/audio/kenney-impact-sounds/Audio/impactBell_heavy_001.ogg?url';

export const UI_SOUND_URLS = {
  confirm: confirmUrl,
  error: errorUrl,
  bookOpen: bookOpenUrl,
  bookClose: bookCloseUrl,
  cloth: clothUrl
};

/**
 * A single looping creak clip whose PlayCanvas sound-slot `pitch` is varied per Putli state
 * (see DATA_MODEL §1b) rather than authoring a separate stem per state — solo-dev-scale
 * substitute for a full state-specific creak mix.
 */
export const PUTLI_CREAK_LOOP_URL = creak1Url;
export const PUTLI_CREAK_VARIANT_URLS = [creak1Url, creak2Url, creak3Url];

/** Ghungroo (ankle bell) tell — one-shot, fired on a per-state interval, not looped. */
export const PUTLI_BELL_URLS = [bellHeavy0Url, bellHeavy1Url];

/**
 * No sourced/original "string-snap" sting exists yet for Capture (AUDIO §2) — this is an
 * honest approximation using the same bell hit at higher volume, not the described composite
 * cue. Recorded as a known gap in TASKS §M6 and DATA_MODEL §1b, not silently substituted.
 */
export const PUTLI_CAPTURE_STING_URL = bellHeavy1Url;

export const FOOTSTEP_URLS = {
  wood: [footstepWood0Url, footstepWood1Url, footstepWood2Url],
  // No dedicated stone-quarried recording was sourced; the closest available Kenney clip
  // (concrete) stands in — see TASKS §M6.
  stone: [footstepStone0Url, footstepStone1Url, footstepStone2Url]
};
