import { DIFFICULTY_PRESETS } from '../data/difficulty-presets.js';

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
const DIFFICULTY_BLURBS = {
  easy: 'Longer Prahars, a less perceptive Putli. For learning the haveli.',
  normal: 'The intended experience.',
  hard: 'Shorter Prahars, sharper senses, an unforgiving Search state.'
};

/**
 * Difficulty Select (UI_UX §1: New Game -> Difficulty Select -> (loading) -> In-Game). Difficulty
 * is only choosable here, never mid-run (UI_UX §4's Settings-screen read-only rule) — reads the
 * preset id list straight from DIFFICULTY_PRESETS (difficulty-presets.js) rather than a separate
 * hardcoded list, so a new preset added there appears here automatically.
 */
export function createDifficultySelectScreen({ onSelect, onBack }) {
  const root = el('div', 'hud-fullscreen hud-screen hud-hidden', document.body);
  el('h1', 'hud-screen-title', root, 'Choose Your Difficulty');

  const menu = el('div', 'hud-screen-menu', root);
  for (const id of Object.keys(DIFFICULTY_PRESETS)) {
    const button = el('button', 'hud-button hud-difficulty-button', menu);
    el('span', 'hud-difficulty-name', button, DIFFICULTY_LABELS[id] ?? id);
    el('span', 'hud-difficulty-blurb', button, DIFFICULTY_BLURBS[id] ?? '');
    button.addEventListener('click', () => onSelect(id));
  }

  const backBtn = el('button', 'hud-button hud-button-secondary', root, 'Back');
  backBtn.addEventListener('click', () => onBack());

  return {
    root,
    show() { root.classList.remove('hud-hidden'); },
    hide() { root.classList.add('hud-hidden'); }
  };
}
