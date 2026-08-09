# SECURITY — KATPUTALI

Security posture for a fully static, client-side, single-player browser game. Scope is intentionally small — there is no backend, no user data collection, and no server attack surface (see [[ARCHITECTURE]] §1) — but the practices below are still enforced.

## 1. Threat Model Summary

Given the architecture, realistic risks are limited to: malicious third-party dependencies (supply chain), XSS via mishandled dynamic content, unsafe use of `localStorage`, and hosting/transport security (HTTPS). There is no authentication, no server, no database, and no PII to protect — most traditional web-app threat categories (SQLi, session hijacking, server-side RCE, etc.) do not apply.

## 2. Data & Privacy

- **No accounts, no login, no PII collected** — see [[PRD]] §6, [[DATA_MODEL]] §7.
- **No analytics or telemetry SDKs** of any kind are added — see [[TECH_STACK]] §7, [[FEATURES]] §4. If crash/error visibility is ever needed, it must be a deliberate, disclosed, opt-in addition — not silently bundled.
- **`localStorage` usage** is limited to non-sensitive settings and a completionist log (see [[DATA_MODEL]] §2–3) — no personal information is ever written to it. Reads are validated/defaulted defensively (see §5) so malformed or tampered local storage data can't crash the game, only at worst reset to defaults.
- **No cookies, no cross-site tracking.**

## 3. Supply Chain

- All npm dependencies are reviewed against [[TECH_STACK]] §7's minimalism rule before being added — fewer dependencies means a smaller supply-chain surface by construction.
- Run `npm audit` (free, built into npm) before each release build (see [[TESTING]] §3, [[DEPLOYMENT]] §1) and address any high/critical advisories before shipping.
- Dependencies are pinned via the committed lockfile (`package-lock.json`); upgrades are deliberate, reviewed changes, not automatic.
- No dependency is pulled from an untrusted/unofficial registry mirror — npm's default registry only.

## 4. Asset & License Integrity

Every third-party asset must be tracked in [[ASSETS]] §5 with a verified license before merge — this is a supply-chain/legal-risk control as much as a licensing one (unverified "free" assets can carry hidden restrictions or, rarely, malware in bundled files from untrusted sites). Only the sources listed in [[ASSETS]] §2–3 are used.

## 5. Client-Side Code Safety

- No use of `eval()`, `new Function()`, or dynamic script injection anywhere in the codebase (see [[CODING_RULES]]).
- No dynamic HTML injection from untrusted/uncontrolled strings — all in-game text (notes, HUD, credits) is authored content or comes from the fixed local data files in [[DATA_MODEL]] §5–6, never from an external or user-modifiable source, so classic XSS via content injection is not a realistic vector. If any dynamic DOM text rendering is used for the HUD overlay (see [[ARCHITECTURE]] §3), it uses safe text-node APIs (e.g. `textContent`), not `innerHTML`, as a defense-in-depth default.
- A Content-Security-Policy meta tag is set in `index.html` restricting script/style/connect sources to `'self'` (plus the specific font/CDN origin only if one is actually used — see [[TECH_STACK]] for whether fonts are bundled locally vs. loaded from Google Fonts' CDN; bundling locally is preferred specifically to allow a tighter CSP and to remove a runtime third-party dependency).

## 6. Transport & Hosting Security

- All hosting candidates in [[DEPLOYMENT]] §2 (GitHub Pages, Cloudflare Pages, itch.io) serve over HTTPS by default at no cost — no plain-HTTP deployment is used.
- No server-side code is deployed, so there is no server to patch/harden — the entire "attack surface" is the static file bundle plus the host's own platform security (delegated to the host, all of which are reputable free-tier providers).

## 7. Incident Response (lightweight, appropriate to scope)

Given no user data exists, there is no "data breach" scenario to plan for. The realistic incident is a compromised dependency or a bug allowing unexpected `localStorage` corruption/crash. Response: pull the affected release, roll back via the hosting platform's previous-deploy mechanism (see [[DEPLOYMENT]] §5), patch, redeploy. No user notification process is needed since no personal data is ever at risk.

## 8. Out of Scope

No WAF/rate-limiting (no server to protect), no auth/session security (no accounts), no encryption-at-rest requirements (no sensitive data stored), no penetration testing engagement (disproportionate to a static single-player game with no backend and no user data) — a periodic `npm audit` and manual code review per §3–5 is the right-sized control for this project.
