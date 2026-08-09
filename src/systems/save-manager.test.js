import { describe, it, expect } from 'vitest';
import {
  loadSettings, saveSettings, loadProgress, saveProgress,
  recordNoteFound, recordEndingSeen,
  DEFAULT_SETTINGS, DEFAULT_PROGRESS
} from './save-manager.js';

function createMockStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key)
  };
}

describe('settings: round-trip through localStorage', () => {
  it('saves and loads back an equivalent settings object', () => {
    const storage = createMockStorage();
    const settings = {
      audio: { master: 0.5, music: 0.3, sfx: 0.9 },
      controls: {
        mouseSensitivity: 1.5, invertY: true,
        keybinds: { ...DEFAULT_SETTINGS.controls.keybinds, interact: 'KeyF' },
        gamepadBinds: { ...DEFAULT_SETTINGS.controls.gamepadBinds, interact: 2 }
      },
      accessibility: { captions: false, colorblindSafeHUD: true, cameraShakeIntensity: 0.2 }
    };
    saveSettings(settings, storage);
    expect(loadSettings(storage)).toEqual(settings);
  });
});

describe('settings: malformed/missing data falls back to safe defaults (SECURITY §2)', () => {
  it('returns defaults when nothing has been saved yet', () => {
    const storage = createMockStorage();
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults when the stored value is not valid JSON', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:settings:v1', 'not json{{{');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back per-field for out-of-range or wrong-typed values, keeping the rest', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:settings:v1', JSON.stringify({
      audio: { master: 5, music: 'loud', sfx: 0.4 }, // master out of range, music wrong type
      controls: { mouseSensitivity: -1 }
    }));
    const loaded = loadSettings(storage);
    expect(loaded.audio.master).toBe(DEFAULT_SETTINGS.audio.master);
    expect(loaded.audio.music).toBe(DEFAULT_SETTINGS.audio.music);
    expect(loaded.audio.sfx).toBe(0.4);
    expect(loaded.controls.mouseSensitivity).toBe(DEFAULT_SETTINGS.controls.mouseSensitivity);
  });

  it('default-fills missing/invalid gamepad binds per action while keeping valid ones', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:settings:v1', JSON.stringify({
      controls: { gamepadBinds: { interact: 6, crouch: 'not-a-number', pause: 40 } }
    }));
    const loaded = loadSettings(storage);
    expect(loaded.controls.gamepadBinds.interact).toBe(6);
    expect(loaded.controls.gamepadBinds.crouch).toBe(DEFAULT_SETTINGS.controls.gamepadBinds.crouch);
    expect(loaded.controls.gamepadBinds.pause).toBe(DEFAULT_SETTINGS.controls.gamepadBinds.pause); // 40 out of range
    expect(loaded.controls.gamepadBinds.sprint).toBe(DEFAULT_SETTINGS.controls.gamepadBinds.sprint);
  });

  it('tolerates a stored value that is a JSON array instead of an object', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:settings:v1', JSON.stringify([1, 2, 3]));
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('tolerates a stored value that is a bare JSON number', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:settings:v1', '42');
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('progress: round-trip and safe defaults', () => {
  it('round-trips notesFoundEver and endingsSeen', () => {
    const storage = createMockStorage();
    const progress = { notesFoundEver: ['note_library'], endingsSeen: ['gate'] };
    saveProgress(progress, storage);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('falls back to empty arrays for missing/malformed progress', () => {
    const storage = createMockStorage();
    storage.setItem('katputali:progress:v1', JSON.stringify({ notesFoundEver: 'not-an-array' }));
    expect(loadProgress(storage)).toEqual(DEFAULT_PROGRESS);
  });
});

describe('recordNoteFound / recordEndingSeen: merge without duplicating', () => {
  it('adds a new note without touching existing entries', () => {
    const storage = createMockStorage();
    saveProgress({ notesFoundEver: ['note_library'], endingsSeen: [] }, storage);
    const updated = recordNoteFound('note_family_shrine', storage);
    expect(updated.notesFoundEver).toEqual(['note_library', 'note_family_shrine']);
  });

  it('does not add the same note twice', () => {
    const storage = createMockStorage();
    recordNoteFound('note_library', storage);
    const updated = recordNoteFound('note_library', storage);
    expect(updated.notesFoundEver).toEqual(['note_library']);
  });

  it('records a new ending without duplicating', () => {
    const storage = createMockStorage();
    recordEndingSeen('gate', storage);
    const updated = recordEndingSeen('gate', storage);
    expect(updated.endingsSeen).toEqual(['gate']);
  });
});
