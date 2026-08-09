/**
 * Pure rebinding logic (CONTROLS §3): conflict detection and apply-if-clear semantics for both
 * keyboard/mouse codes and gamepad button indices. No DOM/PlayCanvas dependency — the Settings
 * screen's rebind UI (src/ui/settings-screen.js) is a thin caller, testable per CODING_RULES §10.
 * "Conflicts... are flagged and blocked at rebind time, not discovered at runtime" (CONTROLS §3) —
 * `applyRebind`/`applyGamepadRebind` refuse to write a binding that collides with another action.
 */

/** Finds which other action (if any) already owns `code` in `keybinds`. Excludes `action` itself. */
export function findKeybindConflict(action, code, keybinds) {
  for (const [otherAction, otherCode] of Object.entries(keybinds)) {
    if (otherAction !== action && otherCode === code) return otherAction;
  }
  return null;
}

/**
 * Returns `{ keybinds, conflict }`. On conflict, `keybinds` is the input map unchanged and
 * `conflict` names the colliding action; on success, `keybinds` is a new map with the rebind
 * applied and `conflict` is null.
 */
export function applyRebind(keybinds, action, code) {
  const conflict = findKeybindConflict(action, code, keybinds);
  if (conflict) return { keybinds, conflict };
  return { keybinds: { ...keybinds, [action]: code }, conflict: null };
}

/** Same as findKeybindConflict, for the numeric gamepad-button-index binding map. */
export function findGamepadBindConflict(action, buttonIndex, gamepadBinds) {
  for (const [otherAction, otherIndex] of Object.entries(gamepadBinds)) {
    if (otherAction !== action && otherIndex === buttonIndex) return otherAction;
  }
  return null;
}

/** Gamepad-bind counterpart to applyRebind. */
export function applyGamepadRebind(gamepadBinds, action, buttonIndex) {
  const conflict = findGamepadBindConflict(action, buttonIndex, gamepadBinds);
  if (conflict) return { gamepadBinds, conflict };
  return { gamepadBinds: { ...gamepadBinds, [action]: buttonIndex }, conflict: null };
}

/** Human-readable label for a KeyboardEvent.code string, for the rebind UI's button text. */
export function formatKeyCode(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const SPECIAL = {
    ShiftLeft: 'L Shift', ShiftRight: 'R Shift',
    ControlLeft: 'L Ctrl', ControlRight: 'R Ctrl',
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Space: 'Space', Escape: 'Esc', Tab: 'Tab'
  };
  return SPECIAL[code] ?? code;
}

const GAMEPAD_BUTTON_LABELS = {
  0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
  8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3', 12: 'D-Up', 13: 'D-Down', 14: 'D-Left', 15: 'D-Right'
};

/** Human-readable label for a standard-mapping gamepad button index. */
export function formatGamepadButton(index) {
  return GAMEPAD_BUTTON_LABELS[index] ?? `Btn ${index}`;
}
