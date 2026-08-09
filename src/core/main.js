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
import { createAudioManager } from '../systems/audio-manager.js';
import { createInputMap } from '../systems/input-map.js';
import { loadSettings } from '../systems/save-manager.js';
import { createHud } from '../ui/hud.js';
import { createTitleScreen } from '../ui/title-screen.js';
import { createDifficultySelectScreen } from '../ui/difficulty-select-screen.js';
import { createSettingsScreen } from '../ui/settings-screen.js';
import { createPauseScreen } from '../ui/pause-screen.js';
import { INTERACTABLES } from '../data/interactables.js';
import { ITEMS_BY_ID } from '../data/items.js';
import { NOISE_TRAP_RADIUS } from '../data/difficulty-presets.js';
import { findCurrentRoom } from '../data/level-geometry.js';
import { emit } from '../core/events.js';

const canvas = document.getElementById('app-canvas');

const app = new Application(canvas, {
  keyboard: new Keyboard(window),
  mouse: new Mouse(canvas)
});

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

window.addEventListener('resize', () => app.resizeCanvas());

// Lighting pass (M5, per ASSETS §1/§4): the haveli is explored at night, and cold moonlight vs.
// warm diya/torch light is the game's primary mood tool — replaces the earlier warm daytime
// placeholder (a bright directional "sun" read as midday, wrong mood for a night-set horror game).
// Kept to a small, mostly non-shadow-casting light count per PERFORMANCE §4's "baked/static
// lighting preferred over multiple real-time dynamic lights" guidance.
app.scene.ambientLight = new Color(0.09, 0.1, 0.19); // indigo shadow (#232A4D), dim

const moonlight = new Entity('moonlight');
moonlight.addComponent('light', {
  type: 'directional',
  color: new Color(0.486, 0.576, 0.78), // moonlight blue rim (#7C93C7)
  intensity: 0.85,
  castShadows: false // re-measured against PERFORMANCE §2's draw-call budget: see level.js/main.js note
});
moonlight.setEulerAngles(55, 30, 0);
app.root.addChild(moonlight);

// Diya/torch warm point light at the courtyard (LEVEL_DESIGN §3 room 2) — the hub every route
// passes through, so it's the one place a warm contrast light reliably pays off for every player.
const courtyardDiya = new Entity('diya-courtyard');
courtyardDiya.addComponent('light', {
  type: 'omni',
  color: new Color(0.831, 0.686, 0.216), // gold accent (#D4AF37)
  intensity: 1.1,
  range: 9,
  castShadows: false
});
courtyardDiya.setPosition(0, 1.4, 0);
app.root.addChild(courtyardDiya);

// Entrance Hall (room 1) — the run's start point and the Gate route's end point, so it's lit at
// both the first and (for that route) the last moment of a run.
const entranceDiya = new Entity('diya-entrance-hall');
entranceDiya.addComponent('light', {
  type: 'omni',
  color: new Color(0.831, 0.686, 0.216),
  intensity: 0.9,
  range: 7,
  castShadows: false
});
entranceDiya.setPosition(0, 1.4, -9);
app.root.addChild(entranceDiya);

const { geometry } = buildLevel(app);

// Shared keyboard/gamepad input, driven by settings.controls (CONTROLS §3's full-rebinding
// requirement) — created once, before any screen, since both the Settings screen's gamepad
// rebind-capture and gameplay itself read live gamepad state independently.
const inputMap = createInputMap({ getSettings: loadSettings });

// --- Screen flow (UI_UX §1) ---------------------------------------------------------------
// The level/lighting render immediately behind the Title screen (atmospheric, no separate
// loading asset to wait on); gameplay entities (player/Putli/run manager/HUD/audio) are only
// built once Difficulty Select confirms a run, per UI_UX §1's Title -> New Game -> Difficulty
// Select -> (brief loading) -> In-Game flow. Esc -> Pause freezes the gameplay tick entirely
// (CONTROLS §1: "mid-run pausing does freeze AI/timer").

let gameplay = null; // set by startGame(); null before the first run and never re-created (Quit to Title reloads)
let paused = false;
let currentDifficulty = null;

const titleScreen = createTitleScreen({
  onNewGame: () => { titleScreen.hide(); difficultyScreen.show(); },
  onSettings: () => settingsScreen.open(() => { settingsScreen.close(); titleScreen.show(); })
});

const difficultyScreen = createDifficultySelectScreen({
  onSelect: (difficultyId) => { difficultyScreen.hide(); startGame(difficultyId); },
  onBack: () => { difficultyScreen.hide(); titleScreen.show(); }
});

const settingsScreen = createSettingsScreen();

const pauseScreen = createPauseScreen({
  onResume: () => resumeGame(),
  onSettings: () => {
    pauseScreen.hide();
    settingsScreen.open(() => {
      settingsScreen.close();
      pauseScreen.show();
    }, () => currentDifficulty);
  },
  onQuitToTitle: () => window.location.reload() // simplest reliable full reset of PlayCanvas/game state
});

function resumeGame() {
  paused = false;
  pauseScreen.hide();
  if (!Mouse.isPointerLocked()) app.mouse.enablePointerLock();
}

function pauseGame() {
  paused = true;
  pauseScreen.show();
  if (Mouse.isPointerLocked()) document.exitPointerLock();
}

function startGame(difficultyId) {
  currentDifficulty = difficultyId;

  const player = createPlayer(app, geometry, { x: 0, y: 0, z: -8, yaw: 180 }, inputMap);

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
    inputMap,
    world: interactableHandler.world,
    difficulty: difficultyId,
    captureFlow
  });

  const hud = createHud({ player, runManager, world: interactableHandler.world, difficultyId });
  const audioManager = createAudioManager({
    app,
    putliRoot: putli.root,
    getPlayerRoomId: () => findCurrentRoom(player.controller.state.position)?.id ?? null
  });

  gameplay = { player, putli, interactableHandler, noiseTraps, runManager, hud, audioManager };
}

// A Retry from the End Screen (UI_UX §5) reloads the page and stashes the run's difficulty here
// so play resumes immediately instead of re-showing Title/Difficulty Select.
const retryDifficulty = sessionStorage.getItem('katputali:retry-difficulty');
if (retryDifficulty) {
  sessionStorage.removeItem('katputali:retry-difficulty');
  startGame(retryDifficulty);
} else {
  titleScreen.show();
}

app.on('update', dt => {
  inputMap.update();

  if (gameplay && !gameplay.runManager.state.ended && inputMap.wasPressed('pause')) {
    if (paused) resumeGame();
    else pauseGame();
  }

  if (!gameplay || paused) return;

  gameplay.player.update(dt);
  gameplay.putli.update(dt);
  gameplay.runManager.update(dt);

  if (inputMap.wasPressed('drop')) {
    const dropped = gameplay.interactableHandler.world.inventory.dropMostRecentNonKeyItem(ITEMS_BY_ID);
    if (dropped) emit('inventory:changed', { slots: gameplay.interactableHandler.world.inventory.getSlots() });
  }

  const triggered = gameplay.noiseTraps.update(gameplay.player.controller.state.position);
  for (const trap of triggered) {
    emit('noise:emitted', { position: trap.position, radius: NOISE_TRAP_RADIUS });
  }

  gameplay.audioManager.update(dt, gameplay.player.controller.state);
  gameplay.hud.update();
});

app.start();
