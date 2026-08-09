import { Mouse } from 'playcanvas';
import { PLAYER_MOVEMENT } from '../data/difficulty-presets.js';
import { resolveWalls, findGroundHeight, computeWorldMoveDirection } from './player-movement-math.js';
import { resolveSprintActive, updateStamina } from './player-stamina.js';
import { createHidingState, clampPeekYaw } from './hiding.js';
import { loadSettings } from './save-manager.js';
import { createShakeState, startContinuousShake, startPulseShake, stopShake, updateShake } from './camera-shake.js';
import { on, emit } from '../core/events.js';

const GAMEPAD_LOOK_DEG_PER_SEC = 120;
const CHASE_SHAKE_MAGNITUDE_DEG = 0.5;
const CAPTURE_SHAKE_MAGNITUDE_DEG = 3.5;
const CAPTURE_SHAKE_DURATION_SEC = 0.6;

/**
 * Kinematic first-person player controller (PHYSICS §2, CONTROLS §1): WASD/gamepad-stick move
 * relative to camera yaw, mouse/gamepad look, hold-Shift/L3 sprint gated by stamina, toggle-Ctrl/B
 * crouch, small step-up over thresholds/stairs. Collision is hand-rolled circle-vs-AABB against
 * the level's wall colliders (see player-movement-math.js) — no Ammo.js/rigidbody (PHYSICS §1).
 * Reads bindings/sensitivity through `inputMap` (input-map.js) rather than hardcoded engine key
 * constants, per CONTROLS §3's full-rebinding requirement.
 */
export function createPlayerController(app, entity, cameraEntity, geometry, spawn, inputMap) {
  const state = {
    position: { x: spawn.x, y: spawn.y, z: spawn.z },
    yaw: spawn.yaw ?? 0,
    pitch: 0,
    currentHeight: PLAYER_MOVEMENT.standHeight,
    isCrouching: false,
    isSprinting: false,
    verticalVelocity: 0,
    stamina: PLAYER_MOVEMENT.staminaMax,
    hiding: createHidingState(),
    frozen: false // capture cutscene/struggle (GAME_MECHANICS §4) — movement/look disabled, transform untouched
  };

  let settings = loadSettings();
  const lookScale = { sensitivity: settings.controls.mouseSensitivity, invertY: settings.controls.invertY };
  let shakeIntensity = settings.accessibility.cameraShakeIntensity;
  on('settings:changed', (next) => {
    settings = next;
    lookScale.sensitivity = settings.controls.mouseSensitivity;
    lookScale.invertY = settings.controls.invertY;
    shakeIntensity = settings.accessibility.cameraShakeIntensity;
  });

  // Camera shake (UI_UX §6: adjustable, reducible for motion sensitivity — never the *only*
  // danger cue, hud.js's always-on vignette covers that at shakeIntensity 0).
  const shakeState = createShakeState();
  on('putli:state-changed', ({ from, to }) => {
    if (to === 'chase') startContinuousShake(shakeState, CHASE_SHAKE_MAGNITUDE_DEG * shakeIntensity);
    else if (from === 'chase') stopShake(shakeState);
  });
  on('putli:capture', () => startPulseShake(shakeState, CAPTURE_SHAKE_DURATION_SEC, CAPTURE_SHAKE_MAGNITUDE_DEG * shakeIntensity));

  /** `yawDeltaDeg`/`pitchDeltaDeg` are already in final on-screen degrees (no further scaling). */
  function applyLookDeltaDeg(yawDeltaDeg, pitchDeltaDeg) {
    const desiredYaw = state.yaw - yawDeltaDeg;
    state.yaw = state.hiding.isHiding
      ? clampPeekYaw(state.hiding.enterYaw, desiredYaw, PLAYER_MOVEMENT.peekMaxYawDeg)
      : desiredYaw;
    const pitchDelta = pitchDeltaDeg * (lookScale.invertY ? 1 : -1);
    state.pitch = Math.max(-PLAYER_MOVEMENT.maxPitchDeg, Math.min(PLAYER_MOVEMENT.maxPitchDeg, state.pitch + pitchDelta));
  }

  const canvas = app.graphicsDevice.canvas;
  canvas.addEventListener('click', () => {
    if (!Mouse.isPointerLocked()) {
      app.mouse.enablePointerLock();
    }
  });

  app.mouse.on('mousemove', (e) => {
    if (!Mouse.isPointerLocked() || state.frozen) return;
    applyLookDeltaDeg(
      e.dx * PLAYER_MOVEMENT.mouseSensitivity * lookScale.sensitivity,
      e.dy * PLAYER_MOVEMENT.mouseSensitivity * lookScale.sensitivity
    );
  });

  function update(dt) {
    if (state.frozen) return; // capture cutscene/struggle — no movement, no transform sync needed

    if (inputMap?.hasActivePad()) {
      // Gamepad look uses the right stick, integrated per-frame (mouse look is event-driven above).
      const { dx, dy } = inputMap.getGamepadLookDelta(dt, GAMEPAD_LOOK_DEG_PER_SEC);
      if (dx || dy) applyLookDeltaDeg(dx, dy);
    }

    const shake = updateShake(shakeState, dt);

    if (state.hiding.isHiding) {
      entity.setPosition(state.position.x, state.position.y, state.position.z);
      entity.setEulerAngles(0, state.yaw, 0);
      cameraEntity.setLocalPosition(0, state.currentHeight - 0.15, 0);
      cameraEntity.setLocalEulerAngles(state.pitch + shake.y, shake.x, 0);
      emit('player:state-changed', { isSprinting: false, isCrouching: state.isCrouching, stamina: state.stamina });
      return;
    }

    const { forward: moveForward, right: moveRight } = inputMap.getMoveAxis();
    const isMoving = Math.abs(moveForward) > 0.001 || Math.abs(moveRight) > 0.001;

    if (inputMap.wasPressed('crouch')) {
      state.isCrouching = !state.isCrouching;
    }

    const wantsSprint = inputMap.isDown('sprint') && !state.isCrouching;
    state.isSprinting = resolveSprintActive(wantsSprint, state.isSprinting, state.stamina, PLAYER_MOVEMENT);
    state.stamina = updateStamina(state.stamina, state.isSprinting, isMoving, dt, PLAYER_MOVEMENT);

    const speed = state.isCrouching
      ? PLAYER_MOVEMENT.crouchSpeed
      : state.isSprinting
        ? PLAYER_MOVEMENT.sprintSpeed
        : PLAYER_MOVEMENT.walkSpeed;

    if (isMoving) {
      const dir = computeWorldMoveDirection(moveForward, moveRight, state.yaw);
      state.position.x += dir.x * speed * dt;
      state.position.z += dir.z * speed * dt;
    }

    const targetHeight = state.isCrouching ? PLAYER_MOVEMENT.crouchHeight : PLAYER_MOVEMENT.standHeight;
    const heightLerp = Math.min(1, dt / PLAYER_MOVEMENT.crouchTransitionSec);
    state.currentHeight += (targetHeight - state.currentHeight) * heightLerp;

    const resolvedXZ = resolveWalls(
      state.position,
      PLAYER_MOVEMENT.capsuleRadius,
      state.position.y,
      state.position.y + state.currentHeight,
      geometry.wallColliders
    );
    state.position.x = resolvedXZ.x;
    state.position.z = resolvedXZ.z;

    const reachableGround = findGroundHeight(
      state.position.x, state.position.z, state.position.y,
      PLAYER_MOVEMENT.stepHeight, geometry.roomFloors, geometry.stairSteps
    );
    if (reachableGround !== null) {
      state.position.y = reachableGround;
      state.verticalVelocity = 0;
    } else {
      state.verticalVelocity -= PLAYER_MOVEMENT.gravity * dt;
      const fallingY = state.position.y + state.verticalVelocity * dt;
      const landing = findGroundHeight(state.position.x, state.position.z, fallingY, 0, geometry.roomFloors, geometry.stairSteps);
      if (landing !== null) {
        state.position.y = landing;
        state.verticalVelocity = 0;
      } else {
        state.position.y = fallingY;
      }
    }

    entity.setPosition(state.position.x, state.position.y, state.position.z);
    entity.setEulerAngles(0, state.yaw, 0);
    cameraEntity.setLocalPosition(0, state.currentHeight - 0.15, 0);
    cameraEntity.setLocalEulerAngles(state.pitch + shake.y, shake.x, 0);

    emit('player:state-changed', {
      isSprinting: state.isSprinting,
      isCrouching: state.isCrouching,
      stamina: state.stamina
    });
  }

  return { state, update };
}
