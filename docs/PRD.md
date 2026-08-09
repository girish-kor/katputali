# Product Requirements Document — KATPUTALI

## 1. Summary

KATPUTALI is a free, standalone, single-player browser horror game: a short (20–35 minute) escape-survival experience set in a cursed Rajasthani haveli. Built solo, using only free/open-source tooling and legally usable assets, deployed at zero cost. This document defines *what must be true for v1 to ship*; design rationale lives in [[GDD]].

## 2. Goals

- Ship a **complete, polished, small** game rather than a large unfinished one.
- Prove a Granny-style capture/escape loop can be reskinned with an original, culturally specific setting without copying mechanics verbatim.
- Keep the entire pipeline — dev, build, hosting — at **$0 recurring cost**, achievable by **one person**, using an AI pair-programming workflow.
- Produce a playable browser build shareable via a single URL, no install, no account.

## 3. Non-Goals

- Not a franchise/live-service product. No planned season content, DLC, or monetization (see [[FEATURES]] §4 "Won't Have").
- Not mobile-first (desktop browser only for v1 — see [[CONTROLS]] §5).
- Not a horror-length feature game — deliberately short scope (see [[GDD]] §11).

## 4. Target Audience & Success Criteria

**Audience:** Players of short browser/indie horror games (Granny, itch.io horror jams, "no install" horror on YouTube/streaming). Secondary audience: players interested in South Asian folklore-horror, an underrepresented setting in the genre.

**Success criteria (v1 launch):**
| Criterion | Target |
|---|---|
| First-session comprehension | New player understands goal + controls within 2 minutes without a manual |
| Completion rate (internal playtest pool) | ≥70% of testers complete at least one escape route within 35 minutes |
| Performance | Runs at ≥45 fps average on a mid-range 2020-era laptop iGPU in Chrome/Firefox (see [[PERFORMANCE]]) |
| Load | Playable within 15s on a typical broadband connection (see [[PERFORMANCE]] §3) |
| Stability | Zero crash-to-white-screen bugs in final QA pass (see [[TESTING]]) |
| Cost | $0 recurring infrastructure cost at any traffic level achievable on the chosen free hosting tier (see [[DEPLOYMENT]]) |

## 5. Functional Requirements

Numbered for traceability; each maps to a design/tech doc.

1. Player can move, look, sprint, crouch, and interact in a first-person 3D environment. → [[CONTROLS]], [[PHYSICS]]
2. Player can pick up, carry (limited slots), combine, and use inventory items to solve puzzles. → [[GAME_MECHANICS]] §2
3. Exactly one enemy AI (Putli) patrols, investigates sound, chases on sight, searches, and captures the player, per a defined state machine. → [[AI_SYSTEM]]
4. Player can evade detection via crouch/noise discipline and by using defined hiding spots. → [[GAME_MECHANICS]] §3
5. Game tracks a capture count (max 2 non-fatal); a 3rd capture ends the run. → [[GAME_MECHANICS]] §4
6. Game tracks a real-time Prahar countdown; reaching Prahar 5 ends the run. → [[GAME_MECHANICS]] §6
7. Game tracks a Nazar (curse) meter mitigated by ward items; reaching max applies a temporary penalty, not a loss. → [[GAME_MECHANICS]] §5
8. Three independent, parallel-progressable escape routes exist, each completable to win. → [[LEVEL_DESIGN]] §5–6
9. Game presents a title screen, in-game HUD, pause/settings menu, and an end screen reporting run stats. → [[UI_UX]]
10. Settings (audio volume, difficulty, subtitle/caption toggle for audio cues, key rebinding) persist locally between sessions. → [[DATA_MODEL]] §3, [[UI_UX]] §4
11. Game runs entirely client-side with no required network calls after initial load. → [[ARCHITECTURE]], [[SECURITY]]

## 6. Non-Functional Requirements

- **Performance:** see [[PERFORMANCE]] targets (fps, draw calls, load time, memory).
- **Compatibility:** Latest two stable versions of Chrome, Firefox, Edge, Safari (desktop) with WebGL2 support.
- **Accessibility (baseline):** Rebindable controls, subtitles/captions for critical audio cues (Putli proximity, capture, ending narration text), colorblind-safe HUD accents, adjustable master/SFX/music volume. See [[UI_UX]] §6.
- **Licensing:** Every asset and dependency must be free/open-source or otherwise legally redistributable at zero cost; tracked in [[ASSETS]] §5 license table.
- **Security/privacy:** No PII collection, no third-party trackers, no accounts. See [[SECURITY]].
- **Maintainability:** Solo-dev-friendly codebase per [[CODING_RULES]] and [[ARCHITECTURE]].

## 7. Constraints

- **Team:** One solo developer, AI-pair-programming workflow (see [[CODING_RULES]] §6).
- **Budget:** $0. No paid engine tier, no paid asset store purchases, no paid hosting, no paid CI minutes beyond free tiers.
- **Engine:** PlayCanvas Engine, mandated (see [[TECH_STACK]] §1 for why, and constraints this implies).
- **Timeline:** Milestone-based, not date-locked — see [[TASKS]] for phased breakdown; solo-dev pace assumed.

## 8. Milestones (summary — full breakdown in [[TASKS]])

| Milestone | Deliverable |
|---|---|
| M0 | Project scaffold, engine boots, empty scene deploys to hosting |
| M1 | Grey-box level (all rooms, correct scale/collision), player movement complete |
| M2 | Putli AI state machine functional against grey-box level |
| M3 | Inventory, puzzles, all 3 escape routes completable end-to-end |
| M4 | Capture/struggle loop, Nazar meter, Prahar timer, win/lose flow complete |
| M5 | Art pass (models, textures, lighting) replaces grey-box |
| M6 | Audio pass, UI/UX polish, accessibility pass |
| M7 | Performance pass, QA pass, release build |

## 9. Risks

| Risk | Mitigation |
|---|---|
| Solo dev scope creep | Hard MoSCoW cut line in [[FEATURES]]; this PRD is the ceiling, not a floor |
| AI (Putli) feels unfair or too easy | Playtest-driven tuning pass, difficulty presets, see [[TESTING]] §4 |
| Free asset quality inconsistency | Curated source list + minimum quality bar in [[ASSETS]] §1–2 |
| Browser perf on low-end hardware | Perf budgets enforced from grey-box stage onward, see [[PERFORMANCE]] |
| Free hosting tier limits/downtime | Static-site-only footprint fits comfortably under all candidate free tiers; see [[DEPLOYMENT]] §2 for fallback hosts |

## 10. Out of Scope for v1 (see [[FEATURES]] for full list)

Multiplayer, mobile/touch input, localization beyond English, a second enemy type, procedural levels, save-mid-run, leaderboards/analytics, monetization of any kind.
