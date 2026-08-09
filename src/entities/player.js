import { Entity } from 'playcanvas';
import { createPlayerController } from '../systems/player-controller.js';
import { createInteraction } from '../systems/interaction.js';

/**
 * Creates the player entity (root + first-person camera child) and wires up the
 * player-controller and interaction systems onto it, per ARCHITECTURE §2's
 * entity-setup-helper convention.
 */
export function createPlayer(app, geometry, spawn, inputMap) {
  const root = new Entity('player');
  app.root.addChild(root);

  const camera = new Entity('player-camera');
  camera.addComponent('camera', { fov: 70, nearClip: 0.05, farClip: 200 });
  camera.addComponent('audiolistener'); // required for positional audio distance/pan (AUDIO §3)
  root.addChild(camera);

  const controller = createPlayerController(app, root, camera, geometry, spawn, inputMap);
  const interaction = createInteraction(app, root, camera, geometry, inputMap);

  function update(dt) {
    controller.update(dt);
    interaction.update(dt);
  }

  return { root, camera, controller, interaction, update };
}
