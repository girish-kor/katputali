import { KEY_V } from 'playcanvas';
import { on, emit } from '../core/events.js';
import {
  createCaptureState, beginCapture,
  createStruggleState, startStruggle, registerStruggleInput, updateStruggle, resolveStruggleOutcome,
  selectRespawnRoom
} from './capture-struggle.js';
import { createNazarState, updateNazar, enterTaintedRoom, mitigateWithWard } from './nazar-meter.js';
import { createPraharState, updatePrahar, applyPraharPenalty } from './prahar-timer.js';
import { recordEndingSeen } from './save-manager.js';
import { findCurrentRoom } from '../data/level-geometry.js';
import { ROOMS } from '../data/rooms.js';
import { ITEMS_BY_ID } from '../data/items.js';
import { DIFFICULTY_PRESETS, DEFAULT_DIFFICULTY, CAPTURE_TIMING, NAZAR_TIMING } from '../data/difficulty-presets.js';

const ROOMS_BY_ID = new Map(ROOMS.map(r => [r.id, r]));

/**
 * Orchestrates capture-struggle, the Nazar meter, the Prahar timer, and ending detection — the
 * one module allowed to know about all of them at once (per ARCHITECTURE §3's event-bus
 * convention, same role interactable-handler.js plays for M3's puzzle systems). Ties the
 * previously-independent M4 systems into the actual play loop: 'putli:capture' from ai-putli,
 * 'route:completed' from M3's puzzle-stations, raw struggle-key input, and per-frame Nazar/Prahar
 * ticking.
 */
export function createRunManager({
  player, putli, keyboard, inputMap = { isDown: () => false, wasPressed: () => false },
  world, difficulty = DEFAULT_DIFFICULTY, storage,
  captureFlow = { invulnerableSecondsRemaining: 0 }
}) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const capture = createCaptureState();
  const struggle = createStruggleState();
  const nazar = createNazarState();
  const prahar = createPraharState(preset.praharSeconds);

  const state = {
    ended: false,
    ending: null,
    capturePosition: null,
    captureRoomId: null
  };

  function isPlayerInvulnerable() {
    return captureFlow.invulnerableSecondsRemaining > 0;
  }

  function triggerEnding(endingId) {
    if (state.ended) return;
    state.ended = true;
    state.ending = endingId;
    player.controller.state.frozen = true;
    recordEndingSeen(endingId, storage);
    emit('game:ended', {
      ending: endingId,
      captures: capture.captureCount,
      notesRead: [...world.notesReadThisRun],
      prahar: prahar.current
    });
  }

  function beginStruggle() {
    startStruggle(struggle, CAPTURE_TIMING.struggleWindowSeconds);
    emit('struggle:started', { attempt: struggle.retryUsed ? 2 : 1 });
  }

  function releasePlayer(withPenalty) {
    if (withPenalty) applyPraharPenalty(prahar, CAPTURE_TIMING.struggleFailurePraharPenaltySeconds);
    world.inventory.dropRandomNonKeyItem(ITEMS_BY_ID, Math.random); // GAME_MECHANICS §4 — drops one non-key item

    const respawnRoom = selectRespawnRoom(state.capturePosition, state.captureRoomId);
    player.controller.state.position.x = respawnRoom.position.x;
    player.controller.state.position.y = respawnRoom.position.y;
    player.controller.state.position.z = respawnRoom.position.z;
    player.controller.state.frozen = false;

    putli.ai.forceState('patrol'); // AI_SYSTEM §2 — Capture always returns to Patrol, never Chase
    captureFlow.invulnerableSecondsRemaining = CAPTURE_TIMING.respawnInvulnerabilitySeconds;

    emit('capture:resolved', { roomId: respawnRoom.roomId, penalty: withPenalty });
  }

  on('putli:capture', ({ position }) => {
    if (state.ended) return;
    state.capturePosition = { ...position };
    state.captureRoomId = findCurrentRoom(position)?.id ?? null;
    player.controller.state.frozen = true;

    const result = beginCapture(capture);
    if (result.outcome === 'fatal') {
      triggerEnding('bound');
      return;
    }
    beginStruggle();
  });

  on('route:completed', ({ route }) => triggerEnding(route));

  function updateStruggleInput() {
    if (!struggle.active) return;
    if (inputMap.wasPressed('struggleLeft')) registerStruggleInput(struggle, 'left');
    if (inputMap.wasPressed('struggleRight')) registerStruggleInput(struggle, 'right');
  }

  function updateWardShortcut() {
    if (!keyboard.wasPressed(KEY_V)) return;
    const wardId = world.inventory.getSlots().find(id => id.startsWith('ward_'));
    if (!wardId) return;
    if (mitigateWithWard(nazar, NAZAR_TIMING)) {
      world.inventory.removeItem(wardId);
      emit('nazar:mitigated', { value: nazar.value });
    }
  }

  function update(dt) {
    if (state.ended) return;

    if (captureFlow.invulnerableSecondsRemaining > 0) {
      captureFlow.invulnerableSecondsRemaining = Math.max(0, captureFlow.invulnerableSecondsRemaining - dt);
    }

    updateStruggleInput();
    const result = updateStruggle(struggle, dt, CAPTURE_TIMING.struggleSuccessThreshold);
    if (result) {
      const outcome = resolveStruggleOutcome(struggle, result);
      if (outcome.retry) beginStruggle();
      else releasePlayer(outcome.penalty);
    }

    if (!struggle.active && !player.controller.state.frozen) {
      const currentRoom = findCurrentRoom(player.controller.state.position);
      if (currentRoom && ROOMS_BY_ID.get(currentRoom.id)?.isHighNazar) {
        enterTaintedRoom(nazar, currentRoom.id, NAZAR_TIMING);
      }
      updateWardShortcut();
    }
    const wasHallucinating = nazar.hallucinating;
    updateNazar(nazar, dt, NAZAR_TIMING);
    // Edge-triggered, not level-triggered — UI_UX §6/AUDIO §5 require this be captioned, so
    // hud.js needs a one-shot "it just started" signal, not a per-frame "is hallucinating" poll.
    if (!wasHallucinating && nazar.hallucinating) {
      emit('nazar:hallucination-started', {});
    }

    const praharResult = updatePrahar(prahar, dt, preset.praharSeconds);
    if (praharResult === 'loss') triggerEnding('bound');
  }

  return { update, capture, struggle, nazar, prahar, state, isPlayerInvulnerable };
}
