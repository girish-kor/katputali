import {
  Application, Color, Entity, Keyboard, Mouse,
  FILLMODE_FILL_WINDOW, RESOLUTION_AUTO
} from 'playcanvas';
import { buildLevel } from './level.js';
import { createPlayer } from '../entities/player.js';

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

app.on('update', dt => player.update(dt));

app.start();
