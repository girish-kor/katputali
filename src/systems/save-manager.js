/**
 * localStorage persistence (DATA_MODEL §2-3, ARCHITECTURE §7): the only module that touches
 * localStorage directly. Reads are validated/defaulted defensively (SECURITY §2) so malformed
 * or tampered storage data can't crash the game, only at worst reset to defaults.
 */

export const SETTINGS_KEY = 'katputali:settings:v1';
export const PROGRESS_KEY = 'katputali:progress:v1';

export const DEFAULT_SETTINGS = {
  audio: { master: 1.0, music: 0.8, sfx: 1.0 },
  controls: {
    mouseSensitivity: 1.0,
    invertY: false,
    keybinds: {
      moveForward: 'KeyW', moveBackward: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD',
      sprint: 'ShiftLeft', crouch: 'ControlLeft', interact: 'KeyE', inventory: 'Tab',
      drop: 'KeyG', pause: 'Escape', struggleLeft: 'KeyA', struggleRight: 'KeyD'
    },
    gamepadBinds: {}
  },
  accessibility: { captions: true, colorblindSafeHUD: false, cameraShakeIntensity: 1.0 }
};

export const DEFAULT_PROGRESS = { notesFoundEver: [], endingsSeen: [] };

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function isFiniteNumberInRange(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function validateSettings(raw) {
  const result = clonePlain(DEFAULT_SETTINGS);
  if (!raw || typeof raw !== 'object') return result;

  if (raw.audio && typeof raw.audio === 'object') {
    for (const key of ['master', 'music', 'sfx']) {
      if (isFiniteNumberInRange(raw.audio[key], 0, 1)) result.audio[key] = raw.audio[key];
    }
  }

  if (raw.controls && typeof raw.controls === 'object') {
    if (isFiniteNumberInRange(raw.controls.mouseSensitivity, 0, 10)) {
      result.controls.mouseSensitivity = raw.controls.mouseSensitivity;
    }
    if (typeof raw.controls.invertY === 'boolean') {
      result.controls.invertY = raw.controls.invertY;
    }
    if (raw.controls.keybinds && typeof raw.controls.keybinds === 'object') {
      for (const [action, defaultCode] of Object.entries(DEFAULT_SETTINGS.controls.keybinds)) {
        const value = raw.controls.keybinds[action];
        result.controls.keybinds[action] = typeof value === 'string' && value.length > 0 ? value : defaultCode;
      }
    }
    if (raw.controls.gamepadBinds && typeof raw.controls.gamepadBinds === 'object') {
      result.controls.gamepadBinds = clonePlain(raw.controls.gamepadBinds);
    }
  }

  if (raw.accessibility && typeof raw.accessibility === 'object') {
    if (typeof raw.accessibility.captions === 'boolean') result.accessibility.captions = raw.accessibility.captions;
    if (typeof raw.accessibility.colorblindSafeHUD === 'boolean') result.accessibility.colorblindSafeHUD = raw.accessibility.colorblindSafeHUD;
    if (isFiniteNumberInRange(raw.accessibility.cameraShakeIntensity, 0, 1)) {
      result.accessibility.cameraShakeIntensity = raw.accessibility.cameraShakeIntensity;
    }
  }

  return result;
}

function validateProgress(raw) {
  const result = clonePlain(DEFAULT_PROGRESS);
  if (!raw || typeof raw !== 'object') return result;
  if (Array.isArray(raw.notesFoundEver)) {
    result.notesFoundEver = raw.notesFoundEver.filter(id => typeof id === 'string');
  }
  if (Array.isArray(raw.endingsSeen)) {
    result.endingsSeen = raw.endingsSeen.filter(id => typeof id === 'string');
  }
  return result;
}

function readJSON(storage, key) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // malformed JSON — treat exactly like missing data
  }
}

export function loadSettings(storage = window.localStorage) {
  return validateSettings(readJSON(storage, SETTINGS_KEY));
}

export function saveSettings(settings, storage = window.localStorage) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(validateSettings(settings)));
}

export function loadProgress(storage = window.localStorage) {
  return validateProgress(readJSON(storage, PROGRESS_KEY));
}

export function saveProgress(progress, storage = window.localStorage) {
  storage.setItem(PROGRESS_KEY, JSON.stringify(validateProgress(progress)));
}

/** Merges a newly-found note/ending into the persisted completionist log and saves it. */
export function recordNoteFound(noteId, storage = window.localStorage) {
  const progress = loadProgress(storage);
  if (!progress.notesFoundEver.includes(noteId)) progress.notesFoundEver.push(noteId);
  saveProgress(progress, storage);
  return progress;
}

export function recordEndingSeen(endingId, storage = window.localStorage) {
  const progress = loadProgress(storage);
  if (!progress.endingsSeen.includes(endingId)) progress.endingsSeen.push(endingId);
  saveProgress(progress, storage);
  return progress;
}
