import { loadSettings, saveSettings } from '../systems/save-manager.js';
import { applyRebind, applyGamepadRebind, formatKeyCode, formatGamepadButton } from '../systems/rebind-format.js';
import { emit } from '../core/events.js';

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

const REBINDABLE_ACTIONS = [
  { action: 'moveForward', label: 'Move Forward', gamepad: false },
  { action: 'moveBackward', label: 'Move Backward', gamepad: false },
  { action: 'moveLeft', label: 'Move Left', gamepad: false },
  { action: 'moveRight', label: 'Move Right', gamepad: false },
  { action: 'sprint', label: 'Sprint', gamepad: true },
  { action: 'crouch', label: 'Crouch', gamepad: true },
  { action: 'interact', label: 'Interact', gamepad: true },
  { action: 'inventory', label: 'Inventory', gamepad: true },
  { action: 'drop', label: 'Drop Item', gamepad: true },
  { action: 'pause', label: 'Pause', gamepad: true },
  { action: 'struggleLeft', label: 'Struggle — Left', gamepad: true },
  { action: 'struggleRight', label: 'Struggle — Right', gamepad: true }
];

const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

/**
 * Settings screen (UI_UX §4): Audio sliders, Controls (sensitivity/invert-Y/full rebinding per
 * CONTROLS §3), Accessibility (captions/colorblind-safe HUD/camera-shake per UI_UX §6), and a
 * read-only Difficulty display when opened mid-run. Every change persists immediately via
 * save-manager.js and broadcasts `settings:changed` so live systems (audio-manager, player-
 * controller, hud) pick it up without needing a restart — DATA_MODEL §3.
 */
export function createSettingsScreen() {
  const root = el('div', 'hud-fullscreen hud-screen hud-settings hud-hidden', document.body);
  el('h1', 'hud-screen-title', root, 'Settings');

  const body = el('div', 'hud-settings-body', root);
  let settings = loadSettings();
  let currentDifficultyGetter = () => null;
  let listeningCleanup = null;

  function persist() {
    saveSettings(settings);
    emit('settings:changed', settings);
  }

  // --- Audio ---
  const audioSection = el('div', 'hud-settings-section', body);
  el('h2', 'hud-settings-heading', audioSection, 'Audio');
  const sliderRows = {};
  for (const [key, label] of [['master', 'Master'], ['music', 'Music'], ['sfx', 'SFX']]) {
    const row = el('div', 'hud-settings-row', audioSection);
    el('label', 'hud-settings-label', row, label);
    const slider = el('input', 'hud-slider', row);
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    slider.value = String(settings.audio[key]);
    slider.addEventListener('input', () => {
      settings.audio[key] = Number(slider.value);
      persist();
    });
    sliderRows[key] = slider;
  }

  // --- Controls ---
  const controlsSection = el('div', 'hud-settings-section', body);
  el('h2', 'hud-settings-heading', controlsSection, 'Controls');

  const sensitivityRow = el('div', 'hud-settings-row', controlsSection);
  el('label', 'hud-settings-label', sensitivityRow, 'Mouse Sensitivity');
  const sensitivitySlider = el('input', 'hud-slider', sensitivityRow);
  sensitivitySlider.type = 'range';
  sensitivitySlider.min = '0.2';
  sensitivitySlider.max = '3';
  sensitivitySlider.step = '0.05';
  sensitivitySlider.value = String(settings.controls.mouseSensitivity);
  sensitivitySlider.addEventListener('input', () => {
    settings.controls.mouseSensitivity = Number(sensitivitySlider.value);
    persist();
  });

  const invertRow = el('div', 'hud-settings-row', controlsSection);
  const invertLabel = el('label', 'hud-settings-label', invertRow, 'Invert Look Y');
  const invertCheckbox = el('input', 'hud-checkbox', invertRow);
  invertCheckbox.type = 'checkbox';
  invertCheckbox.checked = settings.controls.invertY;
  invertLabel.prepend(invertCheckbox);
  invertCheckbox.addEventListener('change', () => {
    settings.controls.invertY = invertCheckbox.checked;
    persist();
  });

  const conflictNotice = el('div', 'hud-settings-conflict hud-hidden', controlsSection);

  const rebindTable = el('div', 'hud-rebind-table', controlsSection);
  const rebindButtons = {};
  for (const { action, label, gamepad } of REBINDABLE_ACTIONS) {
    const row = el('div', 'hud-rebind-row', rebindTable);
    el('span', 'hud-rebind-label', row, label);
    const keyBtn = el('button', 'hud-button hud-rebind-button', row, formatKeyCode(settings.controls.keybinds[action]));
    keyBtn.addEventListener('click', () => listenForKey(action, keyBtn));
    let padBtn = null;
    if (gamepad) {
      padBtn = el('button', 'hud-button hud-rebind-button', row, formatGamepadButton(settings.controls.gamepadBinds[action]));
      padBtn.addEventListener('click', () => listenForGamepadButton(action, padBtn));
    }
    rebindButtons[action] = { keyBtn, padBtn };
  }

  function showConflict(action) {
    conflictNotice.textContent = `That input is already bound to "${action}" — pick another.`;
    conflictNotice.classList.remove('hud-hidden');
    setTimeout(() => conflictNotice.classList.add('hud-hidden'), 2500);
  }

  function stopListening() {
    if (listeningCleanup) {
      listeningCleanup();
      listeningCleanup = null;
    }
  }

  function listenForKey(action, button) {
    stopListening();
    const originalLabel = button.textContent;
    button.textContent = 'Press any key…';
    button.classList.add('hud-rebind-listening');

    function onKeyDown(e) {
      e.preventDefault();
      cleanup();
      const { keybinds, conflict } = applyRebind(settings.controls.keybinds, action, e.code);
      if (conflict) {
        button.textContent = originalLabel;
        showConflict(conflict);
        return;
      }
      settings.controls.keybinds = keybinds;
      persist();
      button.textContent = formatKeyCode(e.code);
    }
    function cleanup() {
      window.removeEventListener('keydown', onKeyDown, true);
      button.classList.remove('hud-rebind-listening');
      listeningCleanup = null;
    }
    window.addEventListener('keydown', onKeyDown, true);
    listeningCleanup = cleanup;
  }

  function listenForGamepadButton(action, button) {
    stopListening();
    const originalLabel = button.textContent;
    button.textContent = 'Press a button…';
    button.classList.add('hud-rebind-listening');

    let rafId = null;
    function poll() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const pad of pads) {
        if (!pad || !pad.connected) continue;
        const pressedIndex = pad.buttons.findIndex(b => b.pressed);
        if (pressedIndex !== -1) {
          cleanup();
          const { gamepadBinds, conflict } = applyGamepadRebind(settings.controls.gamepadBinds, action, pressedIndex);
          if (conflict) {
            button.textContent = originalLabel;
            showConflict(conflict);
            return;
          }
          settings.controls.gamepadBinds = gamepadBinds;
          persist();
          button.textContent = formatGamepadButton(pressedIndex);
          return;
        }
      }
      rafId = requestAnimationFrame(poll);
    }
    function cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      button.classList.remove('hud-rebind-listening');
      listeningCleanup = null;
    }
    rafId = requestAnimationFrame(poll);
    listeningCleanup = cleanup;
  }

  // --- Accessibility ---
  const accessibilitySection = el('div', 'hud-settings-section', body);
  el('h2', 'hud-settings-heading', accessibilitySection, 'Accessibility');

  const captionsRow = el('div', 'hud-settings-row', accessibilitySection);
  const captionsLabel = el('label', 'hud-settings-label', captionsRow, 'Captions');
  const captionsCheckbox = el('input', 'hud-checkbox', captionsRow);
  captionsCheckbox.type = 'checkbox';
  captionsCheckbox.checked = settings.accessibility.captions;
  captionsLabel.prepend(captionsCheckbox);
  captionsCheckbox.addEventListener('change', () => {
    settings.accessibility.captions = captionsCheckbox.checked;
    persist();
  });

  const colorblindRow = el('div', 'hud-settings-row', accessibilitySection);
  const colorblindLabel = el('label', 'hud-settings-label', colorblindRow, 'Colorblind-Safe HUD');
  const colorblindCheckbox = el('input', 'hud-checkbox', colorblindRow);
  colorblindCheckbox.type = 'checkbox';
  colorblindCheckbox.checked = settings.accessibility.colorblindSafeHUD;
  colorblindLabel.prepend(colorblindCheckbox);
  colorblindCheckbox.addEventListener('change', () => {
    settings.accessibility.colorblindSafeHUD = colorblindCheckbox.checked;
    persist();
  });

  const shakeRow = el('div', 'hud-settings-row', accessibilitySection);
  el('label', 'hud-settings-label', shakeRow, 'Camera Shake');
  const shakeSlider = el('input', 'hud-slider', shakeRow);
  shakeSlider.type = 'range';
  shakeSlider.min = '0';
  shakeSlider.max = '1';
  shakeSlider.step = '0.05';
  shakeSlider.value = String(settings.accessibility.cameraShakeIntensity);
  shakeSlider.addEventListener('input', () => {
    settings.accessibility.cameraShakeIntensity = Number(shakeSlider.value);
    persist();
  });

  // --- Difficulty (read-only, UI_UX §4) ---
  const difficultySection = el('div', 'hud-settings-section hud-hidden', body);
  el('h2', 'hud-settings-heading', difficultySection, 'Difficulty');
  const difficultyValue = el('div', 'hud-settings-readonly', difficultySection, '');

  const backBtn = el('button', 'hud-button hud-button-secondary hud-settings-back', root, 'Back');
  let closeHandler = () => {};
  backBtn.addEventListener('click', () => {
    stopListening();
    closeHandler();
  });

  function refreshFromStorage() {
    settings = loadSettings();
    sliderRows.master.value = String(settings.audio.master);
    sliderRows.music.value = String(settings.audio.music);
    sliderRows.sfx.value = String(settings.audio.sfx);
    sensitivitySlider.value = String(settings.controls.mouseSensitivity);
    invertCheckbox.checked = settings.controls.invertY;
    captionsCheckbox.checked = settings.accessibility.captions;
    colorblindCheckbox.checked = settings.accessibility.colorblindSafeHUD;
    shakeSlider.value = String(settings.accessibility.cameraShakeIntensity);
    for (const { action, gamepad } of REBINDABLE_ACTIONS) {
      rebindButtons[action].keyBtn.textContent = formatKeyCode(settings.controls.keybinds[action]);
      if (gamepad) rebindButtons[action].padBtn.textContent = formatGamepadButton(settings.controls.gamepadBinds[action]);
    }
  }

  return {
    root,
    /** `getCurrentDifficulty` returns the active run's difficulty id, or null pre-game (hides the row). */
    open(onClose, getCurrentDifficulty = () => null) {
      refreshFromStorage();
      closeHandler = onClose;
      currentDifficultyGetter = getCurrentDifficulty;
      const difficultyId = currentDifficultyGetter();
      if (difficultyId) {
        difficultySection.classList.remove('hud-hidden');
        difficultyValue.textContent = DIFFICULTY_LABELS[difficultyId] ?? difficultyId;
      } else {
        difficultySection.classList.add('hud-hidden');
      }
      root.classList.remove('hud-hidden');
    },
    close() {
      stopListening();
      root.classList.add('hud-hidden');
    }
  };
}
