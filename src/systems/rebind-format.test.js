import { describe, it, expect } from 'vitest';
import {
  findKeybindConflict, applyRebind, findGamepadBindConflict, applyGamepadRebind,
  formatKeyCode, formatGamepadButton
} from './rebind-format.js';
import { DEFAULT_SETTINGS } from './save-manager.js';

describe('findKeybindConflict', () => {
  it('finds the other action already bound to a code', () => {
    const conflict = findKeybindConflict('sprint', 'KeyW', DEFAULT_SETTINGS.controls.keybinds);
    expect(conflict).toBe('moveForward');
  });

  it('returns null when the code is unbound', () => {
    expect(findKeybindConflict('sprint', 'KeyZ', DEFAULT_SETTINGS.controls.keybinds)).toBeNull();
  });

  it('ignores the action rebinding to its own current code', () => {
    expect(findKeybindConflict('moveForward', 'KeyW', DEFAULT_SETTINGS.controls.keybinds)).toBeNull();
  });
});

describe('applyRebind', () => {
  it('applies the rebind when the code is free', () => {
    const { keybinds, conflict } = applyRebind(DEFAULT_SETTINGS.controls.keybinds, 'interact', 'KeyF');
    expect(conflict).toBeNull();
    expect(keybinds.interact).toBe('KeyF');
  });

  it('does not mutate the input map', () => {
    const original = { ...DEFAULT_SETTINGS.controls.keybinds };
    applyRebind(DEFAULT_SETTINGS.controls.keybinds, 'interact', 'KeyF');
    expect(DEFAULT_SETTINGS.controls.keybinds).toEqual(original);
  });

  it('blocks and reports the conflict instead of applying', () => {
    const { keybinds, conflict } = applyRebind(DEFAULT_SETTINGS.controls.keybinds, 'sprint', 'KeyW');
    expect(conflict).toBe('moveForward');
    expect(keybinds).toBe(DEFAULT_SETTINGS.controls.keybinds); // unchanged reference
  });
});

describe('gamepad rebind conflict detection', () => {
  it('mirrors keybind conflict semantics for numeric button indices', () => {
    const binds = { interact: 0, crouch: 1 };
    expect(findGamepadBindConflict('drop', 0, binds)).toBe('interact');
    expect(findGamepadBindConflict('interact', 0, binds)).toBeNull(); // rebinding to itself
    expect(findGamepadBindConflict('drop', 5, binds)).toBeNull();
  });

  it('applyGamepadRebind blocks conflicts and applies clean rebinds', () => {
    const binds = { interact: 0, crouch: 1 };
    const blocked = applyGamepadRebind(binds, 'drop', 0);
    expect(blocked.conflict).toBe('interact');
    expect(blocked.gamepadBinds).toBe(binds);

    const applied = applyGamepadRebind(binds, 'drop', 2);
    expect(applied.conflict).toBeNull();
    expect(applied.gamepadBinds).toEqual({ interact: 0, crouch: 1, drop: 2 });
  });
});

describe('formatKeyCode', () => {
  it('strips the Key/Digit prefix', () => {
    expect(formatKeyCode('KeyW')).toBe('W');
    expect(formatKeyCode('Digit3')).toBe('3');
  });

  it('special-cases modifier and arrow keys', () => {
    expect(formatKeyCode('ShiftLeft')).toBe('L Shift');
    expect(formatKeyCode('ArrowUp')).toBe('↑');
  });

  it('falls back to the raw code for anything unmapped', () => {
    expect(formatKeyCode('F5')).toBe('F5');
  });

  it('handles empty input without throwing', () => {
    expect(formatKeyCode('')).toBe('—');
    expect(formatKeyCode(null)).toBe('—');
  });
});

// moveLeft/moveRight intentionally share KeyA/KeyD with struggleLeft/struggleRight (CONTROLS §1:
// struggle QTE reuses the movement keys) — the two sets are never live at once, since struggle
// only runs while the player is frozen (player-controller.js's `state.frozen` gate disables
// movement entirely during it). Every other action must still be conflict-free by default.
const INTENTIONAL_DEFAULT_OVERLAPS = new Set(['moveLeft:struggleLeft', 'moveRight:struggleRight']);

function isIntentionalOverlap(actionA, actionB) {
  return INTENTIONAL_DEFAULT_OVERLAPS.has(`${actionA}:${actionB}`) || INTENTIONAL_DEFAULT_OVERLAPS.has(`${actionB}:${actionA}`);
}

describe('TESTING §5 accessibility pass: default bindings are fully reachable, no unintended conflicts', () => {
  it('no two actions share the same default keyboard code, except the documented move/struggle overlap', () => {
    for (const [action, code] of Object.entries(DEFAULT_SETTINGS.controls.keybinds)) {
      const conflict = findKeybindConflict(action, code, DEFAULT_SETTINGS.controls.keybinds);
      if (conflict) expect(isIntentionalOverlap(action, conflict)).toBe(true);
    }
  });

  it('no two actions share the same default gamepad button', () => {
    for (const [action, index] of Object.entries(DEFAULT_SETTINGS.controls.gamepadBinds)) {
      expect(findGamepadBindConflict(action, index, DEFAULT_SETTINGS.controls.gamepadBinds)).toBeNull();
    }
  });

  it('every CONTROLS §1 keyboard action is bindable to a different free code', () => {
    for (const action of Object.keys(DEFAULT_SETTINGS.controls.keybinds)) {
      const { conflict } = applyRebind(DEFAULT_SETTINGS.controls.keybinds, action, 'F13'); // an unused code
      expect(conflict).toBeNull();
    }
  });

  it('every CONTROLS §2 gamepad action is bindable to a different free button', () => {
    for (const action of Object.keys(DEFAULT_SETTINGS.controls.gamepadBinds)) {
      const { conflict } = applyGamepadRebind(DEFAULT_SETTINGS.controls.gamepadBinds, action, 15); // an unused index
      expect(conflict).toBeNull();
    }
  });
});

describe('formatGamepadButton', () => {
  it('labels standard Xbox-layout indices per CONTROLS §2', () => {
    expect(formatGamepadButton(0)).toBe('A');
    expect(formatGamepadButton(9)).toBe('Start');
    expect(formatGamepadButton(10)).toBe('L3');
  });

  it('falls back to a generic label for unmapped indices', () => {
    expect(formatGamepadButton(99)).toBe('Btn 99');
  });
});
