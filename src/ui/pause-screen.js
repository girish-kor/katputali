function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

/**
 * Pause Menu (UI_UX §1: Esc during In-Game -> Resume / Settings / Quit to Title). CONTROLS §1:
 * "mid-run pausing does freeze AI/timer" — the freeze itself is main.js's job (it gates the
 * gameplay tick), this module is purely the menu.
 */
export function createPauseScreen({ onResume, onSettings, onQuitToTitle }) {
  const root = el('div', 'hud-fullscreen hud-screen hud-hidden', document.body);
  el('h1', 'hud-screen-title', root, 'Paused');

  const menu = el('div', 'hud-screen-menu', root);
  const resumeBtn = el('button', 'hud-button hud-button-primary', menu, 'Resume');
  const settingsBtn = el('button', 'hud-button', menu, 'Settings');
  const quitBtn = el('button', 'hud-button hud-button-secondary', menu, 'Quit to Title');

  resumeBtn.addEventListener('click', () => onResume());
  settingsBtn.addEventListener('click', () => onSettings());
  quitBtn.addEventListener('click', () => onQuitToTitle());

  return {
    root,
    show() { root.classList.remove('hud-hidden'); },
    hide() { root.classList.add('hud-hidden'); }
  };
}
