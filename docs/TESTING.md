# TESTING — KATPUTALI

Test plan for a solo-dev project. Prioritizes cheap, high-signal checks (unit tests for logic, structured manual QA for feel) over heavyweight process — matches [[CODING_RULES]] and [[PRD]] §7 constraints.

## 1. Testing Philosophy

- **Logic is unit-tested; feel is playtested.** State machines, timers, and puzzle logic are deterministic and cheap to unit test (§2). Stealth "fairness," scares, and pacing can only be validated by playing (§4).
- **No paid QA services or device labs** — see [[PRD]] §7. Manual QA is done by the solo dev plus a small pool of informal playtesters (friends/community), consistent with a zero-cost solo project.
- **Bugs tracked in GitHub Issues** (free) — no separate paid bug tracker.

## 2. Unit Testing (Vitest — see [[TECH_STACK]] §3)

Covered modules (pure-logic, no rendering dependency, per [[ARCHITECTURE]] §3's module boundaries):

| Module | Example test cases |
|---|---|
| `ai-putli` FSM | Correct transitions Patrol→Investigate on heard-noise event; Chase→Search on sustained loss-of-detection; Search→Capture proximity check; no illegal transitions (e.g. Idle→Capture) |
| `inventory` | Slot limit enforcement (max 5); combine-success/failure logic; drop restrictions on key items (see [[GAME_MECHANICS]] §2) |
| `capture-struggle` | QTE alternating-input validation (rejects same-key repeats, per [[CONTROLS]] §4); success/failure threshold logic; 3rd-capture-is-fatal branch |
| `nazar-meter` | Fill rate over time; mitigation reduces correctly and consumes the ward item; at-max penalty triggers exactly once until reset |
| `prahar-timer` | Countdown accuracy; penalty application on failed struggle; Prahar-5 loss trigger fires exactly once |
| `save-manager` | Settings round-trip through `localStorage`; malformed/missing data falls back to safe defaults (see [[SECURITY]] §2) |

Target: every Must-Have system in [[FEATURES]] §1 that contains non-trivial branching logic has at least one unit test covering its core transition/edge cases before that milestone is considered done (see [[TASKS]]).

## 3. Build & Dependency Checks

- `npm audit` run before every release build (see [[SECURITY]] §3).
- Production build (`vite build`) verified to boot cleanly with no console errors in each target browser before every release — see [[DEPLOYMENT]] §1.
- Automated in CI where practical (see [[DEPLOYMENT]] §3) — unit tests + build step run on every push via GitHub Actions.

## 4. Manual Playtesting Protocol

Run at minimum once per major milestone from M3 onward (see [[TASKS]]), using a short structured checklist:

1. **Cold-start comprehension:** a first-time player (no prior explanation) understands the goal and controls within 2 minutes — validates [[PRD]] §4.
2. **Route completability:** each of the 3 escape routes is completable start-to-finish with no soft-locks, on each difficulty preset.
3. **Fairness check:** testers who are captured can articulate *why* (heard/ignored an audio cue, walked into sight cone) rather than feeling ambushed — validates [[AI_SYSTEM]] §7's fairness contract.
4. **Pacing check:** median completion time for a first full route falls within the 20–35 minute session target (see [[GAMEPLAY]] §1, [[SCENARIO]] intro) — adjust Prahar timer/room distances in [[DATA_MODEL]] §4 if consistently over/under.
5. **Hiding-spot balance check:** hiding spots meaningfully reduce risk without being either useless or a guaranteed safe room (see [[GAME_MECHANICS]] §3, [[AI_SYSTEM]] §4) — tune `hidingDiscoveryChance` if testers report either extreme.
6. **No unintended jump-scare fatigue:** testers aren't so startled or fatigued by repeated scares that they disengage — tone-check against [[GDD]] §2 pillar 2 and [[STORY]] §6.

Findings are logged as GitHub Issues, prioritized against the [[FEATURES]] MoSCoW list (a Should/Could item is never fixed at the cost of blocking a Must item's stability).

## 5. Accessibility Testing

- Verify every audio cue in [[AUDIO]] §2 has a working caption when the captions setting is on (see [[UI_UX]] §6) — manual checklist, one pass per cue.
- Verify HUD legibility under Deuteranopia/Protanopia/Tritanopia simulation (free browser dev-tool vision simulators) with the colorblind-safe toggle on and off.
- Verify full rebinding works for both keyboard and gamepad with no unreachable actions (see [[CONTROLS]] §3).

### 5.1 Automated coverage (M6 pass)

The three checks above are now backed by regression tests so they can't silently drift, rather than relying purely on a one-off manual pass:

- **Caption coverage** — `ui/captions-format.test.js` asserts every state in `audio-manager.js`'s `PUTLI_TELL_STATES` (the states that actually get a Putli audio tell) resolves to a non-null caption, so a state gaining a new tell without a caption fails CI.
- **Colorblind/contrast simulation** — `ui/accessibility-format.js`/`.test.js` compute real WCAG 1.4.11 contrast ratios for both the normal and colorblind-safe HUD accent pairs against the panel background (both must clear 3:1), plus a lightweight linear-RGB approximation of protanopia/deuteranopia/tritanopia (the commonly-used simplified Brettel/Coblis-style matrices) verifying the colorblind-safe pair is never *less* distinguishable than the normal pair under any of the three, and stays above an absolute minimum distinguishable distance. This is an approximation, not a substitute for a real device/browser vision-simulator screenshot check — that manual pass is still worth doing before a tagged release (§7), but the automated version catches an accidental bad color choice immediately instead of only at the next manual pass. Running this test suite for the first time is what caught two real bugs, fixed in the same change: the shipped vermillion HUD accent (`#B33A2E`) only cleared a 2.36:1 contrast against its background (below the 3:1 minimum), and an earlier colorblind-safe gold/blue pairing was *less* distinguishable than the normal palette under simulated tritanopia specifically (a yellow-vs-blue pair is close to the exact axis tritanopia impairs).
- **Rebind reachability** — `systems/rebind-format.test.js` asserts the default keyboard and gamepad binding maps have no unintended conflicts (the one intentional exception — Struggle QTE reusing the Move keys, since the two are never active at once — is named explicitly rather than silently excluded) and that every action can be rebound to a free input.

A genuine manual pass (actual browser vision-simulator extension, real keyboard+gamepad hardware in hand) is still the authoritative check before a tagged release — see §7 — the automated tests above exist to catch regressions between manual passes, not replace the final one.

## 6. Performance Testing

See [[PERFORMANCE]] §5 for the authoritative profiling plan — repeated at the end of each milestone from M1 onward, using PlayCanvas's built-in profiler plus a manual device sweep before release.

## 7. Regression Checklist (pre-release gate)

Before any tagged release (see [[DEPLOYMENT]] §4): all unit tests pass, `npm audit` clean of high/critical, all 4 endings reachable and correctly reported on the End Screen, all 3 difficulty presets playable, settings persist correctly across a browser refresh, no console errors in target browsers, performance targets met per [[PERFORMANCE]] §1.

## 8. Out of Scope

No automated end-to-end/visual-regression testing framework (disproportionate setup cost for a solo, short game — manual playtesting per §4 covers this more cheaply), no load/stress testing (no server, see [[SECURITY]] §8), no paid cross-browser testing service (BrowserStack etc.) — target browser list in [[PRD]] §6 is verified manually on locally available machines/VMs.
