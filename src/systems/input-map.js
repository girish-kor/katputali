/**
 * Unified keyboard+gamepad input, driven entirely by settings.controls (save-manager.js) rather
 * than hardcoded engine key constants — this is what makes CONTROLS §3's "all keyboard/mouse and
 * gamepad bindings are rebindable from the Settings screen" true at runtime: rebinding just
 * writes a new code/button-index into settings, and every system reading through here picks it
 * up on its next `update()` with no other code changes.
 *
 * Keyboard state is tracked via raw `KeyboardEvent.code` strings (matching the string values
 * DEFAULT_SETTINGS.controls.keybinds already stores, e.g. 'KeyW'/'ShiftLeft') rather than
 * PlayCanvas's numeric KEY_* constants, since a code string is what a rebind UI captures from a
 * live keydown and what's persisted to localStorage (DATA_MODEL §3). Gamepad state uses the
 * browser's standard Gamepad API directly (`navigator.getGamepads`) — CONTROLS §2 targets a
 * single connected controller, so only `getGamepads()[0..n]`'s first connected pad is read.
 */

const DIGITAL_ACTIONS = [
  'moveForward', 'moveBackward', 'moveLeft', 'moveRight',
  'sprint', 'crouch', 'interact', 'inventory', 'drop', 'pause',
  'struggleLeft', 'struggleRight'
];

const STICK_DEADZONE = 0.2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInputMap({ getSettings }) {
  const heldKeyCodes = new Set();

  function onKeyDown(e) { heldKeyCodes.add(e.code); }
  function onKeyUp(e) { heldKeyCodes.delete(e.code); }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let currentDown = new Set();
  let previousDown = new Set();
  let activePad = null;

  function findActivePad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (pad && pad.connected) return pad;
    }
    return null;
  }

  function update() {
    previousDown = currentDown;
    currentDown = new Set();
    activePad = findActivePad();

    const settings = getSettings();
    for (const action of DIGITAL_ACTIONS) {
      const code = settings.controls.keybinds[action];
      if (code && heldKeyCodes.has(code)) {
        currentDown.add(action);
        continue;
      }
      if (activePad) {
        const buttonIndex = settings.controls.gamepadBinds[action];
        if (buttonIndex != null && activePad.buttons[buttonIndex]?.pressed) {
          currentDown.add(action);
        }
      }
    }
  }

  function isDown(action) {
    return currentDown.has(action);
  }

  /** Edge-triggered: true only on the frame the action transitioned from up to down. */
  function wasPressed(action) {
    return currentDown.has(action) && !previousDown.has(action);
  }

  /** Combined keyboard-digital + gamepad-left-stick-analog move axis, each in [-1, 1]. */
  function getMoveAxis() {
    let forward = (isDown('moveForward') ? 1 : 0) - (isDown('moveBackward') ? 1 : 0);
    let right = (isDown('moveRight') ? 1 : 0) - (isDown('moveLeft') ? 1 : 0);
    if (activePad) {
      const stickX = activePad.axes[0] ?? 0;
      const stickY = activePad.axes[1] ?? 0; // stick "up" reports as negative Y
      if (Math.abs(stickX) > STICK_DEADZONE) right = clamp(right + stickX, -1, 1);
      if (Math.abs(stickY) > STICK_DEADZONE) forward = clamp(forward - stickY, -1, 1);
    }
    return { forward, right };
  }

  /** Gamepad right-stick look delta for this frame (already dt-scaled), or {dx:0,dy:0} with no pad/movement. */
  function getGamepadLookDelta(dt, turnSpeedDegPerSec) {
    if (!activePad) return { dx: 0, dy: 0 };
    const stickX = activePad.axes[2] ?? 0;
    const stickY = activePad.axes[3] ?? 0;
    const dx = Math.abs(stickX) > STICK_DEADZONE ? stickX * turnSpeedDegPerSec * dt : 0;
    const dy = Math.abs(stickY) > STICK_DEADZONE ? stickY * turnSpeedDegPerSec * dt : 0;
    return { dx, dy };
  }

  function hasActivePad() {
    return activePad !== null;
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  return { update, isDown, wasPressed, getMoveAxis, getGamepadLookDelta, hasActivePad, destroy };
}
