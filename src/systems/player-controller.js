import {
  KEY_W, KEY_A, KEY_S, KEY_D, KEY_SHIFT, KEY_CONTROL, Mouse
} from 'playcanvas';
import { PLAYER_MOVEMENT } from '../data/difficulty-presets.js';
import { resolveWalls, findGroundHeight, computeWorldMoveDirection } from './player-movement-math.js';
import { resolveSprintActive, updateStamina } from './player-stamina.js';
import { createHidingState, clampPeekYaw } from './hiding.js';
import { emit } from '../core/events.js';

/**
 * Kinematic first-person player controller (PHYSICS §2, CONTROLS §1): WASD move relative to
 * camera yaw, mouse look via pointer lock, hold-Shift sprint gated by stamina, toggle-Ctrl
 * crouch, small step-up over thresholds/stairs. Collision is hand-rolled circle-vs-AABB against
 * the level's wall colliders (see player-movement-math.js) — no Ammo.js/rigidbody (PHYSICS §1).
 */
export function createPlayerController(app, entity, cameraEntity, geometry, spawn) {
  const state = {
    position: { x: spawn.x, y: spawn.y, z: spawn.z },
    yaw: spawn.yaw ?? 0,
    pitch: 0,
    currentHeight: PLAYER_MOVEMENT.standHeight,
    isCrouching: false,
    isSprinting: false,
    verticalVelocity: 0,
    stamina: PLAYER_MOVEMENT.staminaMax,
    hiding: createHidingState()
  };

  const canvas = app.graphicsDevice.canvas;
  canvas.addEventListener('click', () => {
    if (!Mouse.isPointerLocked()) {
      app.mouse.enablePointerLock();
    }
  });

  app.mouse.on('mousemove', (e) => {
    if (!Mouse.isPointerLocked()) return;
    const desiredYaw = state.yaw - e.dx * PLAYER_MOVEMENT.mouseSensitivity;
    state.yaw = state.hiding.isHiding
      ? clampPeekYaw(state.hiding.enterYaw, desiredYaw, PLAYER_MOVEMENT.peekMaxYawDeg)
      : desiredYaw;
    state.pitch -= e.dy * PLAYER_MOVEMENT.mouseSensitivity;
    state.pitch = Math.max(-PLAYER_MOVEMENT.maxPitchDeg, Math.min(PLAYER_MOVEMENT.maxPitchDeg, state.pitch));
  });

  function update(dt) {
    if (state.hiding.isHiding) {
      entity.setPosition(state.position.x, state.position.y, state.position.z);
      entity.setEulerAngles(0, state.yaw, 0);
      cameraEntity.setLocalPosition(0, state.currentHeight - 0.15, 0);
      cameraEntity.setLocalEulerAngles(state.pitch, 0, 0);
      emit('player:state-changed', { isSprinting: false, isCrouching: state.isCrouching, stamina: state.stamina });
      return;
    }

    const keyboard = app.keyboard;
    const moveForward = (keyboard.isPressed(KEY_W) ? 1 : 0) - (keyboard.isPressed(KEY_S) ? 1 : 0);
    const moveRight = (keyboard.isPressed(KEY_D) ? 1 : 0) - (keyboard.isPressed(KEY_A) ? 1 : 0);
    const isMoving = moveForward !== 0 || moveRight !== 0;

    if (keyboard.wasPressed(KEY_CONTROL)) {
      state.isCrouching = !state.isCrouching;
    }

    const wantsSprint = keyboard.isPressed(KEY_SHIFT) && !state.isCrouching;
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
    cameraEntity.setLocalEulerAngles(state.pitch, 0, 0);

    emit('player:state-changed', {
      isSprinting: state.isSprinting,
      isCrouching: state.isCrouching,
      stamina: state.stamina
    });
  }

  return { state, update };
}
