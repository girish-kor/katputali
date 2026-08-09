# ASSETS — KATPUTALI

Art direction, asset list, sourcing, and licensing policy. Every asset used in the shipped build must be tracked in the license table (§5) before merge — no exceptions, see [[SECURITY]] §4 and [[CODING_RULES]] §7.

## 1. Art Direction

- **Style:** Stylized low-poly 3D, flat/simple shading, baked or minimal dynamic lighting — chosen for solo-dev feasibility and browser performance (see [[PERFORMANCE]]), not as a purely aesthetic default.
- **Palette:** Drawn from Rajasthani miniature painting traditions — deep indigo and cold moonlight blue for shadow/ambient, ochre and sandstone tan for architecture, vermillion/red and gold as sparing accent (ward threads, diya flame, HUD highlights). Cold (moonlight) vs. warm (diya/torch) lighting contrast is the primary mood tool.
- **Architecture reference (real-world, non-copied):** Shekhawati-region havelis — *jharokha* overhanging balconies, carved sandstone *jaali* lattice screens, frescoed courtyard walls, *chhatri* domed roof pavilions, a stepped *baori* well. These are treated as researched architectural typology to reproduce faithfully in an original floor plan (see [[LEVEL_DESIGN]]), not traced from any single copyrighted photograph or building.
- **Cultural care policy:** Motifs (miniature painting palette, *kathputli* puppet costume design, ward objects like *kalava* thread and neem leaves) are used because they are directly relevant to the folklore this game is telling (see [[STORY]]), sourced from general public cultural/historical knowledge, not from any single artist's copyrighted design — no direct asset tracing from a living artist's work or a specific temple/heritage site's likeness.

## 2. Asset Sourcing Policy

Only sources offering CC0, public-domain, or explicitly free-for-commercial-use-with-attribution-honored content are used. Priority order:
1. **CC0 (no attribution required)** — preferred wherever available.
2. **CC-BY (attribution required)** — acceptable, attribution tracked in §5 and surfaced in the in-game Credits screen (see [[UI_UX]] §1).
3. **Free-license-with-terms (e.g. Mixamo's free-use license, Google Fonts OFL)** — acceptable, terms noted in §5.
4. Paid/store-bought assets: **not used**, per [[PRD]] §7 zero-budget constraint.

Custom-made assets (modeled/textured by the solo dev, or AI-assisted per [[CODING_RULES]] §6) are preferred for anything central to the game's identity (Putli's character model, key puzzle props, HUD icon set) to keep the game visually distinct rather than "kit-bashed."

## 3. Asset Categories & Sources

| Category | Approach | Candidate free/CC0 sources |
|---|---|---|
| Base environment kits (walls, floors, generic furniture) | Kitbash from CC0 low-poly kits, retextured to match palette | Kenney.nl (CC0), Quaternius (CC0) |
| HDRIs / sky / ambient lighting reference | Free HDRI for lighting reference/skybox base | Poly Haven (CC0) |
| Hero props (Putli model, key puzzle items, ward objects, diary props) | Custom-modeled in Blender (free/open-source) | Original work |
| Character rig/animation base | Free rigged humanoid base + retimed/retargeted animations for Meera's arms/hands and Putli's marionette gait | Mixamo (free license, requires account but no cost) |
| Textures | Custom-painted or CC0 PBR base textures adjusted to palette | Poly Haven (CC0), original painting in Krita/GIMP (free/open-source) |
| Fonts | OFL-licensed free fonts, one Devanagari-influenced display font for headers, one legible sans-serif for body text | Google Fonts (OFL) |
| Audio | See [[AUDIO]] §1 for full sourcing detail | Freesound.org (CC0/CC-BY), Zapsplat (free tier w/ attribution), original recording/synthesis |

## 4. Visual Reference Summary (for implementation)

- **Meera:** see [[CHARACTERS]] §1 for costume/silhouette spec.
- **Putli:** see [[CHARACTERS]] §2 for full model/costume/animation spec.
- **Environment palette hex reference (approximate, for texture/lighting authoring):** Indigo shadow `#232A4D`, moonlight blue rim `#7C93C7`, sandstone `#C9A66B`, deep ochre `#8A5A2B`, vermillion accent `#B33A2E`, gold accent `#D4AF37`.
- **HUD:** aged-paper/miniature-painting-frame styling per [[UI_UX]] §7, using the same palette and fonts.

## 5. License Tracking Table (living document — update on every new asset addition)

| Asset | Source | License | Attribution required? | Notes |
|---|---|---|---|---|
| Castle Kit (406 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/models/kenney-castle-kit/` — arches, columns, stone walls for haveli masonry, retexture for palette match |
| Fantasy Town Kit v2.0 (856 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/models/kenney-fantasy-town-kit/` — door/window frame shapes to reshape into *jharokha*/*jaali* proportions |
| Furniture Kit (1557 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/models/kenney-furniture-kit/` — base meshes for guard-room/library/bedroom set dressing |
| Low-poly prop pack | Quaternius | CC0 | No | Not yet downloaded — itch.io's "name your own price" purchase flow needs a manual browser session, couldn't be scripted; Kenney's kits above cover the immediate kitbash need |
| "Large Sandstone Blocks" PBR texture (diffuse/normal/roughness/AO, 1k) | Poly Haven | CC0 | No | `/assets/textures/polyhaven-large-sandstone-blocks/` — author: Rob Tuytel |
| "Courtyard Night" HDRI (1k) | Poly Haven | CC0 | No | `/assets/textures/polyhaven-hdri/courtyard_night_1k.hdr` — lighting reference only, not shipped in the build per §3's perf note |
| Humanoid animation rig/base | Mixamo | Free (Adobe Mixamo license) | No (per Mixamo terms) | Not yet downloaded — needs a logged-in Adobe account via browser, not scriptable; used for Meera hand/arm and Putli base animation retargeting when added |
| Rasa (body font, 4 weights) | Google Fonts | OFL | No (but credited anyway) | `/assets/fonts/rasa/` — see [[UI_UX]] §7 |
| Yatra One (display font) | Google Fonts | OFL | No (but credited anyway) | `/assets/fonts/yatra-one/` |
| Interface Sounds (99 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/audio/kenney-interface-sounds/` — UI confirm/error/click/drop tones for pickup/combine/read per [[AUDIO]] §2 Player Audio |
| RPG Audio (99 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/audio/kenney-rpg-audio/` — door open/close, book open/close/flip, `creak1-3.ogg` (raw wood-creak material for Putli's Patrol tell base layer, not the finished composite cue), generic footsteps |
| Impact Sounds (98 files) | Kenney.nl | CC0 | No (credited anyway) | `/assets/audio/kenney-impact-sounds/` — `footstep_wood`/`footstep_concrete` (stone stand-in) surface-typed footstep sets, `impactBell_heavy` (raw material for Putli's *ghungroo* tell), `impactWood_*` for interactables |
| Water-surface footsteps, breathing loops (sprint effort + held-breath), per-floor ambience beds, Chase's drone swell, Capture's string-snap, tension-beat music stingers | Original — procedural synthesis in code (`src/systems/audio-synth.js`) | N/A (own work) | N/A | Freesound (per-file CC0/CC-BY download) stayed blocked (needs a logged-in OAuth2 session, not automatable), so these gaps are filled with pure-JS sample synthesis instead — noise/oscillator/Karplus-Strong plucked-string generation rendered to an `AudioBuffer` and played through PlayCanvas's own `pc.Sound`/`SoundComponent` ([[AUDIO]] §3, no third-party audio lib added). This is "original simple synthesis" in the sense [[AUDIO]] §1 already scoped for these categories (it names LMMS/Audacity as example *tools*; the tool here is JS math instead) — not a sourced/attributed asset, so it has no attribution requirement, same as the Nazar-stinger/ambience rows this replaces. |
| Putli's full composite audio tell layering (sourced Kenney creak+bell + synthesized Chase drone/Capture string-snap) | Kenney (sourced) + original synthesis, layered | CC0 (Kenney parts) / N/A (synthesized parts) | No | `src/systems/audio-manager.js` plays the sourced creak/bell slots and the synthesized drone/string-snap slots together rather than one replacing the other |
| Putli character model & textures | Original | N/A (own work) | N/A | Not yet modeled |
| Environment retexturing & unique props | Original | N/A (own work) | N/A | Not yet modeled |
| Puzzle prop / ward item / lore note geometry (key fragments, pulley parts, oil torch, rope/hook/counterweight, *neem*/*kalava* ward items, diary notes, puzzle-station set dressing) | Original — procedural primitive-composite shapes (`src/entities/interactables.js`) | N/A (own work) | N/A | Deliberately not kitbashed from the Kenney Castle/Fantasy-Town/Furniture kits above — those are modern-residential or medieval-European in style (fridges, bathroom cabinets, siege engines) with no period-appropriate match for these small Rajasthani-haveli hand props, and forcing a mismatch would read worse than the shape/color-differentiated primitives shipped here, per §7's "avoid content that doesn't fit" spirit. Each item gets a distinct primitive silhouette (shard/wheel/torch/coil/hook/etc.) tinted from the ASSETS §4 palette rather than one uniform colored sphere per interactable type. |

All CC-BY entries must have their specific author/title recorded here at the time the asset is added (this table's rows are a template — the actual populated table with exact filenames/authors is maintained as the project's assets are added, and mirrored into the in-game Credits screen per [[UI_UX]] §1). No asset is merged into the build without a corresponding row.

## 6. Poly / Texture Budgets

See [[PERFORMANCE]] §2 for authoritative per-category triangle and texture-resolution budgets — this doc defines *what* assets exist and *where they come from*; PERFORMANCE.md defines *how heavy they're allowed to be*.

## 7. Out of Scope

No photogrammetry/scanned assets, no paid marketplace purchases, no AI-generated image assets used as final shipped textures/models if their training/licensing provenance is unclear (AI-assisted code is fine per [[CODING_RULES]] §6; AI-generated *visual art* of unclear license is avoided to keep §5's license table clean) — original or clearly-licensed CC0/CC-BY sources only.
