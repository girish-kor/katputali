import { Asset, Entity, Sound } from 'playcanvas';
import { on } from '../core/events.js';
import { loadSettings } from './save-manager.js';
import { AUDIO_TIMING } from '../data/difficulty-presets.js';
import { findCurrentRoom } from '../data/level-geometry.js';
import { ROOMS } from '../data/rooms.js';
import {
  UI_SOUND_URLS, PUTLI_CREAK_LOOP_URL, PUTLI_BELL_URLS, PUTLI_CAPTURE_STING_URL, FOOTSTEP_URLS
} from '../data/audio-clips.js';
import {
  generateStringSnapSamples, generateChaseDroneSamples, generateBreathingSamples,
  generateAmbienceSamples, generateStingerSamples, generateWaterSplashSamples, toAudioBuffer
} from './audio-synth.js';

const ROOMS_BY_ID = new Map(ROOMS.map(r => [r.id, r]));
const SYNTH_SAMPLE_RATE = 44100;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function loadAsset(app, name, url) {
  const asset = new Asset(name, 'audio', { url });
  app.assets.add(asset);
  return asset;
}

/**
 * Wraps procedurally-generated samples (audio-synth.js) as a pc.Asset whose resource is already
 * resolved, so SoundSlot treats it exactly like a network-loaded clip (see sound/slot.js's
 * `if (!asset.resource) {...load...} else fire('load')` — no url/fetch involved, just PlayCanvas's
 * Sound wrapper around a synthesized AudioBuffer). Kept synchronous: sample generation here is
 * pure JS math (audio-synth.js), and AudioBuffer allocation via createBuffer doesn't need the
 * context to be running/unlocked, so no async wait is needed before addSlot can use it.
 */
function synthAsset(app, audioContext, name, samples) {
  const asset = new Asset(name, 'audio', {});
  asset.resource = new Sound(toAudioBuffer(audioContext, samples, SYNTH_SAMPLE_RATE));
  app.assets.add(asset);
  return asset;
}

function getSharedAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return new Ctor();
}

// Exported so ui/captions-format.test.js can assert AUDIO §5's "every state-defining audio cue
// has a corresponding caption" requirement against the actual set of states that have a tell,
// instead of the two lists silently drifting apart.
export const PUTLI_TELL_STATES = ['patrol', 'investigate', 'chase', 'search'];

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

const ENDING_STINGER_MOOD = { gate: 'triumph', baori: 'triumph', rooftop: 'triumph', bound: 'doom' };

/**
 * Wires up sourced audio (ASSETS §5) per AUDIO §2–3: Putli's positional state tells (attached to
 * its own entity so PlayCanvas's distance/pan attenuation does the work), player footsteps and
 * UI/interact confirm-error tones (both 2D, non-positional), driven by the same event-bus hooks
 * the rest of the systems already use (ARCHITECTURE §3/§5). The gaps the previous session
 * recorded as blocked on Freesound/LMMS access (breathing, per-floor ambience, music stingers,
 * Chase's drone swell, Capture's string-snap, the water footstep set) are now filled with
 * procedurally-synthesized audio (audio-synth.js) layered alongside the sourced Kenney material —
 * still played entirely through pc.Sound/SoundComponent per AUDIO §3, no third-party audio lib.
 */
export function createAudioManager({ app, putliRoot, getPlayerRoomId }) {
  const audioContext = getSharedAudioContext();
  let settings = loadSettings();
  let sfxVolume = settings.audio.master * settings.audio.sfx;
  let musicVolume = settings.audio.master * settings.audio.music;

  // 2D UI/interact sounds — no positional attenuation, always at full player-facing volume.
  const uiEntity = new Entity('audio-ui');
  uiEntity.addComponent('sound', { positional: false, volume: sfxVolume });
  app.root.addChild(uiEntity);
  for (const [name, url] of Object.entries(UI_SOUND_URLS)) {
    uiEntity.sound.addSlot(name, { asset: loadAsset(app, `ui-${name}`, url), overlap: true });
  }

  // 2D player footsteps — surface-typed per AUDIO §2 (wood/stone sourced from Kenney; water has
  // no sourced clip, ASSETS §5, so it's synthesized) crossed with the current room's floor
  // material (rooms.js's `surface` field) and movement state.
  const footstepEntity = new Entity('audio-footsteps');
  footstepEntity.addComponent('sound', { positional: false, volume: sfxVolume * 0.6 });
  app.root.addChild(footstepEntity);
  const footstepSlotNamesBySurface = { wood: [], stone: [], water: [] };
  for (const surface of ['wood', 'stone']) {
    footstepSlotNamesBySurface[surface] = FOOTSTEP_URLS[surface].map((url, i) => {
      const name = `${surface}${i}`;
      footstepEntity.sound.addSlot(name, { asset: loadAsset(app, `footstep-${name}`, url), overlap: true });
      return name;
    });
  }
  footstepSlotNamesBySurface.water = [0, 1, 2].map(i => {
    const name = `water${i}`;
    footstepEntity.sound.addSlot(name, {
      asset: synthAsset(app, audioContext, `footstep-${name}`, generateWaterSplashSamples(SYNTH_SAMPLE_RATE, 100 + i)),
      overlap: true
    });
    return name;
  });

  // 2D player breathing (AUDIO §2: sprint effort + a tense held-breath loop while hiding).
  const breathingEntity = new Entity('audio-breathing');
  breathingEntity.addComponent('sound', { positional: false, volume: sfxVolume * 0.5 });
  app.root.addChild(breathingEntity);
  breathingEntity.sound.addSlot('sprintEffort', {
    asset: synthAsset(app, audioContext, 'breathing-sprint', generateBreathingSamples(SYNTH_SAMPLE_RATE, { intensity: 1.3, seed: 21 })),
    loop: true,
    autoPlay: false
  });
  breathingEntity.sound.addSlot('holdBreath', {
    asset: synthAsset(app, audioContext, 'breathing-hide', generateBreathingSamples(SYNTH_SAMPLE_RATE, { intensity: 0.4, seed: 22 })),
    loop: true,
    autoPlay: false,
    volume: 0.6
  });
  let breathingSlot = null;

  // 2D environmental ambience — one looping bed per floor (AUDIO §2's per-floor/room base layer),
  // swapped as the player crosses floors so the mix itself signals "which floor am I on."
  const ambienceEntity = new Entity('audio-ambience');
  ambienceEntity.addComponent('sound', { positional: false, volume: sfxVolume * 0.35 });
  app.root.addChild(ambienceEntity);
  const AMBIENCE_FLOORS = ['ground', 'basement', 'first', 'roof'];
  for (const floor of AMBIENCE_FLOORS) {
    ambienceEntity.sound.addSlot(`ambience-${floor}`, {
      asset: synthAsset(app, audioContext, `ambience-${floor}`, generateAmbienceSamples(SYNTH_SAMPLE_RATE, floor, 30 + AMBIENCE_FLOORS.indexOf(floor))),
      loop: true,
      autoPlay: false
    });
  }
  let currentAmbienceFloor = null;
  let chaseDucking = false;

  // 2D music — sparse tension-beat stingers only (AUDIO §2: "no music during core
  // exploration/stealth loop by default" — never looped, never a continuous bed).
  const musicEntity = new Entity('audio-music');
  musicEntity.addComponent('sound', { positional: false, volume: musicVolume });
  app.root.addChild(musicEntity);
  for (const mood of ['awaken', 'triumph', 'doom']) {
    musicEntity.sound.addSlot(mood, {
      asset: synthAsset(app, audioContext, `stinger-${mood}`, generateStingerSamples(SYNTH_SAMPLE_RATE, mood, 40 + ['awaken', 'triumph', 'doom'].indexOf(mood))),
      overlap: true
    });
  }
  let firstCuePlayed = false;

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
  // Chase's "low string-tension drone that swells" (AUDIO §2) — synthesized, layered under the
  // sourced creak/bell rather than replacing them.
  putliRoot.sound.addSlot('chaseDrone', {
    asset: synthAsset(app, audioContext, 'putli-chase-drone', generateChaseDroneSamples(SYNTH_SAMPLE_RATE)),
    loop: true,
    autoPlay: false
  });
  // Capture's "string-snap sound" (AUDIO §2) — synthesized, layered with the sourced bell hit
  // (captureSting) that was previously standing in for the whole composite cue alone.
  putliRoot.sound.addSlot('stringSnap', {
    asset: synthAsset(app, audioContext, 'putli-string-snap', generateStringSnapSamples(SYNTH_SAMPLE_RATE)),
    volume: 1.2,
    overlap: true
  });

  const putliTell = { activeState: null, bellIntervalSec: 0, bellTimer: 0 };

  function applyPutliState(state) {
    putliRoot.sound.stop('creak');
    putliRoot.sound.stop('chaseDrone');
    putliTell.activeState = null;

    if (!firstCuePlayed && state !== 'idle') {
      firstCuePlayed = true;
      musicEntity.sound.play('awaken');
    }

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

    if (state === 'chase') {
      putliRoot.sound.play('chaseDrone');
    }

    // Simple mix-bus ducking of ambience during Chase (AUDIO §4) — restored the moment Chase ends.
    const shouldDuck = state === 'chase';
    if (shouldDuck !== chaseDucking) {
      chaseDucking = shouldDuck;
      ambienceEntity.sound.volume = sfxVolume * (chaseDucking ? 0.12 : 0.35);
    }
  }

  on('putli:state-changed', ({ to }) => applyPutliState(to));
  on('putli:capture', () => {
    putliRoot.sound.stop('creak');
    putliRoot.sound.stop('chaseDrone');
    putliTell.activeState = null;
    chaseDucking = false;
    ambienceEntity.sound.volume = sfxVolume * 0.35;
    putliRoot.sound.play('captureSting');
    putliRoot.sound.play('stringSnap');
  });

  on('game:ended', ({ ending }) => {
    musicEntity.sound.play(ENDING_STINGER_MOOD[ending] ?? 'triumph');
  });

  on('interaction:feedback', ({ success }) => {
    uiEntity.sound.play(success ? 'confirm' : 'error');
  });
  on('note:read', () => uiEntity.sound.play('bookOpen'));
  on('hiding:changed', () => uiEntity.sound.play('cloth'));

  on('settings:changed', (next) => {
    settings = next;
    sfxVolume = settings.audio.master * settings.audio.sfx;
    musicVolume = settings.audio.master * settings.audio.music;
    uiEntity.sound.volume = sfxVolume;
    footstepEntity.sound.volume = sfxVolume * 0.6;
    breathingEntity.sound.volume = sfxVolume * 0.5;
    ambienceEntity.sound.volume = sfxVolume * (chaseDucking ? 0.12 : 0.35);
    musicEntity.sound.volume = musicVolume;
    putliRoot.sound.volume = sfxVolume;
  });

  const footsteps = { lastX: null, lastZ: null, accumSec: 0 };

  function updateAmbience() {
    const roomId = getPlayerRoomId?.();
    const floor = (roomId && ROOMS_BY_ID.get(roomId)?.floor) ?? currentAmbienceFloor ?? 'ground';
    if (floor === currentAmbienceFloor) return;
    if (currentAmbienceFloor) ambienceEntity.sound.stop(`ambience-${currentAmbienceFloor}`);
    currentAmbienceFloor = floor;
    ambienceEntity.sound.play(`ambience-${floor}`);
  }

  function updateBreathing(playerState) {
    const wantsSlot = playerState.hiding.isHiding
      ? 'holdBreath'
      : (playerState.isSprinting ? 'sprintEffort' : null);
    if (wantsSlot === breathingSlot) return;
    if (breathingSlot) breathingEntity.sound.stop(breathingSlot);
    breathingSlot = wantsSlot;
    if (breathingSlot) breathingEntity.sound.play(breathingSlot);
  }

  /** Call once per frame with the player controller's live state (position/isCrouching/isSprinting/frozen/hiding). */
  function update(dt, playerState) {
    updateAmbience();
    updateBreathing(playerState);

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
      const roomId = getPlayerRoomId?.();
      const surface = (roomId && ROOMS_BY_ID.get(roomId)?.surface) ?? 'stone';
      footstepEntity.sound.play(pickRandom(footstepSlotNamesBySurface[surface]));
    }
  }

  return { update };
}
