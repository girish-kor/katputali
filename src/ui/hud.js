import { INTERACTABLES } from '../data/interactables.js';
import { ITEMS_BY_ID } from '../data/items.js';
import { CAPTURE_TIMING } from '../data/difficulty-presets.js';
import { on } from '../core/events.js';
import {
  formatPraharClock, nazarFraction, capturePipsState, interactVerb, endingTitle
} from './hud-format.js';

const INTERACTABLES_BY_ID = new Map(INTERACTABLES.map(def => [def.id, def]));

function el(tag, className, parent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
}

/**
 * Builds the in-game HUD as a DOM overlay (ARCHITECTURE §3's lightweight-DOM-overlay option)
 * per UI_UX §2's layout table. Grey-box styling — icons/miniature-painting-frame texture are
 * M5 Art Pass work; this ships the structure, layout, and live data binding now since none of
 * that depends on final art.
 */
export function createHud({ player, runManager, world }) {
  const root = el('div', 'hud', document.body);

  const prahar = el('div', 'hud-corner hud-top-right hud-prahar', root);
  const captures = el('div', 'hud-corner hud-top-right hud-captures', root);
  const capturePipEls = [0, 1, 2].map(() => el('span', 'hud-pip', captures));

  const nazar = el('div', 'hud-corner hud-top-left hud-nazar', root);
  const nazarTrack = el('div', 'hud-meter-track', nazar);
  const nazarFill = el('div', 'hud-meter-fill', nazarTrack);

  const inventory = el('div', 'hud-inventory', root);
  const slotEls = [0, 1, 2, 3, 4].map(() => el('div', 'hud-slot', inventory));

  const interactPrompt = el('div', 'hud-center hud-interact-prompt hud-hidden', root);

  const struggle = el('div', 'hud-center hud-struggle hud-hidden', root);
  const struggleText = el('div', 'hud-struggle-text', struggle);
  const struggleBar = el('div', 'hud-meter-track hud-struggle-track', struggle);
  const struggleFill = el('div', 'hud-meter-fill', struggleBar);

  const endScreen = el('div', 'hud-fullscreen hud-hidden', root);
  const endTitle = el('h1', 'hud-end-title', endScreen);
  const endStats = el('div', 'hud-end-stats', endScreen);

  on('game:ended', (payload) => {
    endTitle.textContent = endingTitle(payload.ending);
    endStats.textContent =
      `Prahar reached: ${payload.prahar}  •  Captures: ${payload.captures}/3  •  Notes read: ${payload.notesRead.length}/6`;
    endScreen.classList.remove('hud-hidden');
  });

  function update() {
    prahar.textContent = formatPraharClock(runManager.prahar.current, runManager.prahar.secondsRemaining);

    const pips = capturePipsState(runManager.capture.captureCount);
    pips.forEach((filled, i) => capturePipEls[i].classList.toggle('hud-pip-filled', filled));

    nazarFill.style.width = `${nazarFraction(runManager.nazar.value, 100) * 100}%`;
    nazar.classList.toggle('hud-nazar-hallucinating', runManager.nazar.hallucinating);

    const slots = world.inventory.getSlots();
    slotEls.forEach((slotEl, i) => {
      const itemId = slots[i];
      slotEl.textContent = itemId ? (ITEMS_BY_ID.get(itemId)?.displayName ?? itemId) : '';
      slotEl.classList.toggle('hud-slot-filled', Boolean(itemId));
    });

    const targetId = player.interaction.getCurrentTargetId();
    if (targetId) {
      const def = INTERACTABLES_BY_ID.get(targetId);
      const label = def?.label ?? (def?.itemId ? ITEMS_BY_ID.get(def.itemId)?.displayName : null) ?? targetId;
      interactPrompt.textContent = `[E] ${interactVerb(def?.type, player.controller.state.hiding.isHiding)} — ${label}`;
      interactPrompt.classList.remove('hud-hidden');
    } else {
      interactPrompt.classList.add('hud-hidden');
    }

    if (runManager.struggle.active) {
      struggleText.textContent = 'Struggling free — alternate [A] [D]!';
      const fraction = runManager.struggle.correctCount / CAPTURE_TIMING.struggleSuccessThreshold;
      struggleFill.style.width = `${Math.min(1, fraction) * 100}%`;
      struggle.classList.remove('hud-hidden');
    } else {
      struggle.classList.add('hud-hidden');
    }
  }

  return { root, update };
}
