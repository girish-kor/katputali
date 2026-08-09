import {
  Application, Color, Entity, Keyboard, Mouse,
  FILLMODE_FILL_WINDOW, RESOLUTION_AUTO
} from 'playcanvas';
import { buildLevel } from './level.js';
import { createPlayer } from '../entities/player.js';
import { createPutliEntity } from '../entities/putli.js';
import { createInteractableEntities } from '../entities/interactables.js';
import { createInteractableHandler } from '../systems/interactable-handler.js';
import { createNoiseTrapTracker } from '../systems/noise-traps.js';
import { createRunManager } from '../systems/run-state.js';
import { INTERACTABLES } from '../data/interactables.js';
import { NOISE_TRAP_RADIUS, DEFAULT_DIFFICULTY } from '../data/difficulty-presets.js';
import { emit } from '../core/events.js';

const canvas = document.getElementById('app-canvas');

const app = new Application(canvas, {
  keyboard: new Keyboard(window),
  mouse: new Mouse(canvas)
});

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

window.addEventListener('resize', () => app.resizeCanvas());

app.scene.ambientLight = new Color(0.35, 0.32, 0.3);

const sun = new Entity('sun');
sun.addComponent('light', { type: 'directional', color: new Color(1, 0.95, 0.85), intensity: 1.2 });
sun.setEulerAngles(55, 30, 0);
app.root.addChild(sun);

const { geometry } = buildLevel(app);

const player = createPlayer(app, geometry, { x: 0, y: 0, z: -8, yaw: 180 });

// Shared with run-state.js, which owns writing to it on respawn (GAME_MECHANICS §4's
// post-capture grace window) — created before Putli since ai-putli reads it every sensor tick.
const captureFlow = { invulnerableSecondsRemaining: 0 };
const putli = createPutliEntity(app, geometry, player, { x: 0, y: 0, z: 0 }, captureFlow);

const { entities: interactableEntities } = createInteractableEntities(app);
const interactableHandler = createInteractableHandler(() => player.controller.state, interactableEntities);

const noiseTraps = createNoiseTrapTracker(
  INTERACTABLES.filter(it => it.type === 'noiseTrap').map(it => ({ id: it.id, position: it.position, radius: 1 }))
);

const runManager = createRunManager({
  player,
  putli,
  keyboard: app.keyboard,
  world: interactableHandler.world,
  difficulty: DEFAULT_DIFFICULTY,
  captureFlow
});

app.on('update', dt => {
  player.update(dt);
  putli.update(dt);
  runManager.update(dt);

  const triggered = noiseTraps.update(player.controller.state.position);
  for (const trap of triggered) {
    emit('noise:emitted', { position: trap.position, radius: NOISE_TRAP_RADIUS });
  }
});

app.start();
