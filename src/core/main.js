import { Application, Color, Entity, FILLMODE_FILL_WINDOW, RESOLUTION_AUTO } from 'playcanvas';

const canvas = document.getElementById('app-canvas');

const app = new Application(canvas);

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

window.addEventListener('resize', () => app.resizeCanvas());

const camera = new Entity('camera');
camera.addComponent('camera', {
  clearColor: new Color(0, 0, 0)
});
app.root.addChild(camera);
camera.setPosition(0, 0, 3);

app.start();
