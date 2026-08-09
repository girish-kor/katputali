function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

/**
 * Title screen (UI_UX §1's flow: Title -> New Game -> Difficulty Select, Title -> Settings).
 * A Credits entry is deliberately not built here — TASKS §M7 owns "finalize Credits screen with
 * complete attribution list"; adding a dead-end button ahead of that content would be worse than
 * omitting it. DOM overlay following hud.js's `.hud-fullscreen`/`hud-hidden` idiom.
 */
export function createTitleScreen({ onNewGame, onSettings }) {
  const root = el('div', 'hud-fullscreen hud-screen hud-hidden', document.body);
  el('h1', 'hud-screen-title', root, 'KATPUTALI');
  el('p', 'hud-screen-subtitle', root, 'A haveli, a puppet, four Prahars until dawn.');

  const menu = el('div', 'hud-screen-menu', root);
  const newGameBtn = el('button', 'hud-button hud-button-primary', menu, 'New Game');
  const settingsBtn = el('button', 'hud-button', menu, 'Settings');

  newGameBtn.addEventListener('click', () => onNewGame());
  settingsBtn.addEventListener('click', () => onSettings());

  return {
    root,
    show() { root.classList.remove('hud-hidden'); },
    hide() { root.classList.add('hud-hidden'); }
  };
}
