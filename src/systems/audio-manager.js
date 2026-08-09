import { Asset, Entity } from 'playcanvas';
import { on } from '../core/events.js';
import { loadSettings } from './save-manager.js';
import { AUDIO_TIMING } from '../data/difficulty-presets.js';
import {
  UI_SOUND_URLS, PUTLI_CREAK_LOOP_URL, PUTLI_BELL_URLS, PUTLI_CAPTURE_STING_URL, FOOTSTEP_URLS
} from '../data/audio-clips.js';

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function loadAsset(app, name, url) {
  const asset = new Asset(name, 'audio', { url });
  app.assets.add(asset);
  return asset;
}

const PUTLI_TELL_STATES = ['patrol', 'investigate', 'chase', 'search'];

const CREAK_PITCH_BY_STATE = {
  patrol: AUDIO_TIMING.putliCreakPitchPatrol,
  chase: AUDIO_TIMING.putliCreakPitchChase,
  search: AUDIO_TIMING.putliCreakPitchSearch
};

const BELL_INTERVAL_BY_STATE = {
  patrol: AUDIO_TIMING.putliBellIntervalPatrolSec,
  chase: AUDIO_TIMING.putliBellIntervalChaseSec,
  search: AUDIO_TIMING.putliBellIntervalSearchSec
};

/**
 * Wires up sourced audio (ASSETS §5) per AUDIO §2–3: Putli's positional state tells (attached to
 * its own entity so PlayCanvas's distance/pan attenuation does the work), player footsteps and
 * UI/interact confirm-error tones (both 2D, non-positional), driven by the same event-bus hooks
 * the rest of the systems already use (ARCHITECTURE §3/§5). Known gap, recorded rather than
 * silently shipped: Chase's drone layer and Capture's dedicated string-snap sting have no
 * sourced/original audio yet (see DATA_MODEL §1b, TASKS §M6) — Capture uses an honest
 * approximation (a sourced impact hit) instead of the described composite cue.
 */
export function createAudioManager({ app, putliRoot }) {
  const settings = loadSettings();
  const sfxVolume = settings.audio.master * settings.audio.sfx;

  // 2D UI/interact sounds — no positional attenuation, always at full player-facing volume.
  const uiEntity = new Entity('audio-ui');
  uiEntity.addComponent('sound', { positional: false, volume: sfxVolume });
  app.root.addChild(uiEntity);
  for (const [name, url] of Object.entries(UI_SOUND_URLS)) {
    uiEntity.sound.addSlot(name, { asset: loadAsset(app, `ui-${name}`, url), overlap: true });
  }

  // 2D player footsteps — surface-typed footsteps need per-room floor-material data that
  // doesn't exist yet (see TASKS §M6); every room currently renders the same sandstone floor
  // (level.js's M5 art pass), so "stone" is the one surface set wired in for now.
  const footstepEntity = new Entity('audio-footsteps');
  footstepEntity.addComponent('sound', { positional: false, volume: sfxVolume * 0.6 });
  app.root.addChild(footstepEntity);
  const footstepSlotNames = FOOTSTEP_URLS.stone.map((url, i) => {
    const name = `stone${i}`;
    footstepEntity.sound.addSlot(name, { asset: loadAsset(app, `footstep-${name}`, url), overlap: true });
    return name;
  });

  // 3D Putli tells — attached to Putli's own entity so distance/pan is automatic (AUDIO §3/§4).
  putliRoot.addComponent('sound', { positional: true, volume: sfxVolume });
  putliRoot.sound.addSlot('creak', {
    asset: loadAsset(app, 'putli-creak', PUTLI_CREAK_LOOP_URL),
    loop: true,
    autoPlay: false
  });
  const bellSlotNames = PUTLI_BELL_URLS.map((url, i) => {
    const name = `bell${i}`;
    putliRoot.sound.addSlot(name, { asset: loadAsset(app, `putli-${name}`, url), overlap: true });
    return name;
  });
  putliRoot.sound.addSlot('captureSting', {
    asset: loadAsset(app, 'putli-capture-sting', PUTLI_CAPTURE_STING_URL),
    volume: 1.5,
    overlap: true
  });

  const putliTell = { activeState: null, bellIntervalSec: 0, bellTimer: 0 };

  function applyPutliState(state) {
    putliRoot.sound.stop('creak');
    putliTell.activeState = null;

    if (state === 'investigate') {
      // "creak pauses, single sharper bell note" — AUDIO §2, no loop, just one hit.
      putliRoot.sound.play(pickRandom(bellSlotNames));
      return;
    }

    if (!PUTLI_TELL_STATES.includes(state)) return; // idle/capture: no standalone tell

    putliRoot.sound.slots.creak.pitch = CREAK_PITCH_BY_STATE[state];
    putliRoot.sound.play('creak');
    putliTell.activeState = state;
    putliTell.bellIntervalSec = BELL_INTERVAL_BY_STATE[state];
    putliTell.bellTimer = 0;
  }

  on('putli:state-changed', ({ to }) => applyPutliState(to));
  on('putli:capture', () => {
    putliRoot.sound.stop('creak');
    putliTell.activeState = null;
    putliRoot.sound.play('captureSting');
  });

  on('interaction:feedback', ({ success }) => {
    uiEntity.sound.play(success ? 'confirm' : 'error');
  });
  on('note:read', () => uiEntity.sound.play('bookOpen'));
  on('hiding:changed', () => uiEntity.sound.play('cloth'));

  const footsteps = { lastX: null, lastZ: null, accumSec: 0 };

  /** Call once per frame with the player controller's live state (position/isCrouching/isSprinting/frozen/hiding). */
  function update(dt, playerState) {
    if (putliTell.activeState) {
      putliTell.bellTimer += dt;
      if (putliTell.bellTimer >= putliTell.bellIntervalSec) {
        putliTell.bellTimer = 0;
        putliRoot.sound.play(pickRandom(bellSlotNames));
      }
    }

    if (footsteps.lastX === null) {
      footsteps.lastX = playerState.position.x;
      footsteps.lastZ = playerState.position.z;
      return;
    }
    const dx = playerState.position.x - footsteps.lastX;
    const dz = playerState.position.z - footsteps.lastZ;
    footsteps.lastX = playerState.position.x;
    footsteps.lastZ = playerState.position.z;

    if (playerState.frozen || playerState.hiding.isHiding || Math.hypot(dx, dz) < 0.001) {
      footsteps.accumSec = 0;
      return;
    }

    const interval = playerState.isCrouching
      ? AUDIO_TIMING.footstepIntervalCrouchSec
      : playerState.isSprinting
        ? AUDIO_TIMING.footstepIntervalSprintSec
        : AUDIO_TIMING.footstepIntervalWalkSec;

    footsteps.accumSec += dt;
    if (footsteps.accumSec >= interval) {
      footsteps.accumSec = 0;
      footstepEntity.sound.play(pickRandom(footstepSlotNames));
    }
  }

  return { update };
}
