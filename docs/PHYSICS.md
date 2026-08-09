# PHYSICS — KATPUTALI

Collision, movement, and physical interaction approach. Scope-controlled deliberately: this is a stealth-exploration game, not a physics sandbox.

## 1. Physics Engine Choice

PlayCanvas supports two physics backends: the built-in lightweight collision system (`pc.CollisionComponent` + `pc.RigidBodyComponent` with a simplified solver) and a full Ammo.js (Bullet-based) integration. **Decision: use PlayCanvas's built-in collision/trigger system without Ammo.js.** Rationale:
- The game needs kinematic character movement, trigger volumes, and simple static collision — not realistic rigid-body dynamics, ragdolls, or complex constraint solving.
- Skipping Ammo.js avoids a large (~1–2MB) WebAssembly dependency, directly helping the load-time budget in [[PERFORMANCE]] §3.
- Matches [[TECH_STACK]] §1's "minimal dependencies" principle and [[CODING_RULES]]'s scope discipline.

If a future feature genuinely requires rigid-body dynamics, that's a [[FEATURES]]-level scope decision, not a default.

## 2. Player Movement

- **Player collider:** upright capsule, standing height ~1.75m / crouch height ~1.0m, radius ~0.3m.
- **Movement method:** kinematic — velocity computed from input each frame, applied via manual position integration with collision resolution against the static level mesh (swept capsule vs. static triggers/colliders), not physics-engine forces. This keeps movement response snappy and fully deterministic-feeling, important for a stealth game where the player must trust their own positioning near sightlines (see [[GAME_MECHANICS]] §3).
- **Step-up:** small fixed step height (e.g. 0.2m) to clear door thresholds/stepwell lips without needing jump input — no jump action exists in v1 (see [[CONTROLS]], [[FEATURES]]).
- **Gravity:** simple constant downward acceleration applied to the kinematic controller for stairs/slopes and to prevent floating; no free-fall/fall-damage system needed (no verticality drops in level design, see [[LEVEL_DESIGN]]).

## 3. Collision Categories

| Category | Behavior |
|---|---|
| Static level geometry (walls, floors, furniture) | Solid, blocks movement and full sight/sound occlusion |
| *Jaali* lattice screens | Solid to movement, but flagged as **partial-occlusion** for the AI sight sensor (reduced detection probability rather than a hard block/pass) — see [[AI_SYSTEM]] §3. Implemented as a distinct trigger-tagged collider layer checked in the sight raycast logic, separate from full-block geometry. |
| Doors (closed) | Solid, full sound/sight occlusion; open state removes collision and occlusion flag |
| Interactable props | Trigger volume for interact-range detection (see [[GAME_MECHANICS]] §1), no physical collision needed on most small props |
| Hiding spot volumes | Trigger volume, no physical collision |
| Noise-trap floor tiles | Trigger volume, fires a noise event on player overlap (see [[GAME_MECHANICS]] §3, [[LEVEL_DESIGN]]) |
| Putli agent | Capsule collider matching its navmesh agent radius (see [[AI_SYSTEM]] §8); does not physically push the player — capture is handled by proximity/state logic, not a collision knockback, to avoid janky physics-driven capture feel |

## 4. Stamina (Sprint) as a Soft Physical Constraint

Sprint is gated by a stamina value (drains while sprinting, regenerates while walking/crouching/idle) rather than being a pure input toggle — implemented as plain gameplay-layer state, not a physics system, but documented here since it directly constrains the movement system above. Exact values are data-driven (see [[DATA_MODEL]] §4).

## 5. Interactable Object Physics

Picked-up items are removed from the world (no held-item physics, no throwing) — they become inventory data immediately on pickup (see [[GAME_MECHANICS]] §2). Puzzle-station interactions (pulley, gate, zipline rig) are animation-driven (triggered keyframe/tween sequences on interact), not physically simulated mechanisms. This keeps every puzzle outcome deterministic and QA-testable (see [[TESTING]]).

## 6. Performance Considerations

- Collision checks for the player run every frame (required for responsive movement); AI sensor checks run at a reduced tick rate (see [[AI_SYSTEM]] §3, [[PERFORMANCE]] §4).
- Static level colliders are baked once at load; no runtime collider generation.
- Collider count kept low by using simplified proxy shapes (boxes/capsules) for furniture rather than per-triangle mesh colliders, except where a mesh collider is needed for the stepwell/stair geometry — see [[PERFORMANCE]] §2 for the resulting budget.

## 7. Out of Scope

No ragdoll physics, no destructible/breakable objects, no vehicle physics, no cloth/rope simulation (the visual "rope" puzzle items are static/animated meshes, not simulated), no third-party physics middleware, no multiplayer-relevant physics determinism/networking concerns (single-player, see [[ARCHITECTURE]]).
