import { KEY_E } from 'playcanvas';
import { selectInteractable } from './interaction-math.js';
import { emit } from '../core/events.js';

const INTERACT_RANGE = 1.8; // meters, GAME_MECHANICS §1

/**
 * Contextual interaction raycast + prompt stub (GAME_MECHANICS §1): each frame, finds the
 * nearest 'interactable'-tagged entity in the camera's crosshair within range and with clear
 * line of sight, and emits events for the (not-yet-built) UI prompt and future
 * inventory/puzzle/read handlers to subscribe to — see ARCHITECTURE §3's event-bus convention.
 * No interactables are populated in the scene until M3 (GAME_MECHANICS §2, LEVEL_DESIGN §5-6);
 * this module is the mechanism, tested independently in interaction-math.test.js.
 */
export function createInteraction(app, playerEntity, cameraEntity, geometry) {
  let currentTargetId = null;

  function update() {
    const wallColliders = geometry.wallColliders;
    const candidates = app.root.findByTag('interactable').map(e => ({
      id: e.name,
      position: e.getPosition(),
      radius: e.interactRadius ?? 0.4
    }));

    const origin = cameraEntity.getPosition();
    const forward = cameraEntity.forward;
    const targetId = selectInteractable(origin, forward, INTERACT_RANGE, candidates, wallColliders);

    if (targetId !== currentTargetId) {
      currentTargetId = targetId;
      emit('interaction:target-changed', { targetId });
    }

    if (app.keyboard.wasPressed(KEY_E) && currentTargetId) {
      emit('interaction:trigger', { targetId: currentTargetId });
    }
  }

  return { update, getCurrentTargetId: () => currentTargetId };
}
