import { Entity, Color, StandardMaterial } from 'playcanvas';
import { createPutli } from '../systems/ai-putli.js';
import { DIFFICULTY_PRESETS, DEFAULT_DIFFICULTY, PLAYER_MOVEMENT } from '../data/difficulty-presets.js';

/**
 * Creates Putli's entity: a placeholder grey-box capsule (real model/rig is M5's Art Pass —
 * see CHARACTERS §2) driven each frame by the ai-putli FSM. Per ARCHITECTURE §2's
 * entity-setup-helper convention.
 */
export function createPutliEntity(app, geometry, player, spawn, captureFlow) {
  const root = new Entity('putli');
  root.addComponent('render', { type: 'capsule' });
  const material = new StandardMaterial();
  material.diffuse = new Color(0.5, 0.05, 0.05);
  material.update();
  root.render.material = material;
  root.setLocalScale(0.7, 1.9, 0.7);
  app.root.addChild(root);

  const ai = createPutli({
    geometry,
    spawn,
    stepHeight: PLAYER_MOVEMENT.stepHeight,
    getPlayerPosition: () => player.controller.state.position,
    getPlayerNoiseRadius: () => {
      const s = player.controller.state;
      if (s.isCrouching) return PLAYER_MOVEMENT.crouchNoiseRadius;
      if (s.isSprinting) return PLAYER_MOVEMENT.sprintNoiseRadius;
      return PLAYER_MOVEMENT.walkNoiseRadius;
    },
    getDifficultyPreset: () => DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY],
    isPlayerHiding: () => player.controller.state.hiding.isHiding,
    isPlayerHidingAt: (spotId) => player.controller.state.hiding.isHiding && player.controller.state.hiding.spotId === spotId,
    isPlayerInvulnerable: () => captureFlow.invulnerableSecondsRemaining > 0
  });

  function update(dt) {
    ai.update(dt);
    root.setPosition(ai.ctx.position.x, ai.ctx.position.y + 0.95, ai.ctx.position.z);
    root.setEulerAngles(0, ai.ctx.yaw, 0);
  }

  return { root, ai, update };
}
