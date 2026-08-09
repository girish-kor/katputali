# STORY — KATPUTALI

Narrative and lore bible. This is the single source of truth for names, dates, and plot facts — every other document must stay consistent with this one.

## 1. Premise

**Meera Kanwar**, a 24-year-old woman from Jaipur, returns to her ancestral haveli in the fictional Shekhawati town of **Kathgarh, Rajasthan** after her grandmother **Sohni Bai's** death, to collect a few keepsakes before the family sells the property. She arrives at dusk. By the time she realizes the haveli's outer gate has been barred from outside (a "precaution" the caretaker swears he didn't set), night has fallen — and she is not alone.

The game is one night: Meera must explore **Haveli Kesar Mahal**, avoid the thing that hunts its halls, and escape before sunrise.

## 2. The Legend of Bhairo Nath and Putli

Two hundred years ago, a traveling *kathputli* (string-puppet) troupe led by a puppeteer named **Bhairo Nath** performed in Kathgarh during the Kesar Mahal family's wedding season. Bhairo Nath was extraordinary — his marionettes moved with no visible hesitation, as if alive. Villagers whispered he had gone beyond craft into **kala-dhaaga tantra** ("black-thread sorcery"), a forbidden practice said to bind a living soul into a puppet's joints to make it move forever without strings.

When a local child went missing during the troupe's stay and was never found, suspicion fell on Bhairo Nath. A mob cornered him in the haveli's inner courtyard on the night of Amavasya (new moon) and killed him where his puppet stage stood. As he died, he is said to have wound his life-thread around his finest marionette — a dancer carved in his own image, which the troupe called **Putli** ("doll" / "puppet").

The haveli was never fully cleansed. Every generation since, the family has lost someone to a night inside it. The family's response was not to tear it down (the haveli is the source of their name and land claim) but to seal it, ward it, and never stay past dark. Sohni Bai, Meera's grandmother, was the last to remember why.

## 3. Who / What Putli Is

Putli is not Bhairo Nath's ghost — it is the puppet, animated by his bound spirit, still performing the role of a puppeteer who never lets his cast leave the stage. It patrols the haveli the way a puppeteer paces backstage: methodical, listening, testing the strings of a show only it can hear (represented by the ambient *ghungroo* / string-creak audio cues — see [[AUDIO]]). It does not speak. It does not run in a straight line so much as *jerk* toward sound, limbs slightly too long, head slightly too still. See [[CHARACTERS]] for full character and animation design, and [[AI_SYSTEM]] for how this behavior is implemented as a state machine.

Putli's goal, mechanically, is to catch Meera and drag her to the **puppet stage** in the central courtyard, where — after a third capture — she is bound into the troupe herself. Folklore logic: the haveli always needs a new puppet by dawn, or the old ones (Bhairo Nath's original victims, never seen but referenced in notes and stage-prop silhouettes) stay bound another year.

## 4. Environmental Storytelling

The player never receives an expository cutscene dump. Lore is delivered through:
- **Diary pages** (Sohni Bai's, found in her room and the library) — 6 short entries, read as inventory items, revealing the legend piece by piece.
- **Wedding-era photographs and a torn troupe poster** (library, courtyard) naming Bhairo Nath and showing Putli's original marionette design.
- **A child's shoe and a marked wall tally** (basement stepwell / *baori*) — the missing-child detail, never fully explained.
- **Ward objects** already placed around the haveli (neem leaf bundles, red *kalava* thread, a broken *bhomiya* (guardian spirit) stone at the gate) — showing the family tried and only partly succeeded.

Total lore text is intentionally short (roughly 1,500–2,000 words across all notes) — enough for atmosphere, not enough to bloat scope. See [[FEATURES]] for the MoSCoW cut line on additional lore content.

## 5. Endings

There are four possible endings, tied directly to the three escape routes and the loss condition (see [[GAME_MECHANICS]] and [[SCENARIO]]):

| Ending | Trigger | Tone |
|---|---|---|
| **The Gate (Deodhi)** | Escape via front gate route | Bittersweet — Meera escapes but the gate is shown re-barring itself behind her |
| **The Stepwell (Baori)** | Escape via basement tunnel route | Uneasy relief — she surfaces in the village well at dawn, watched by unseen eyes |
| **The Rooftop (Chhat)** | Escape via zipline route | Triumphant but costly — she loses the ward thread on the way, implying the curse noticed her |
| **Bound (Bad Ending)** | Captured a third time, or Prahar timer reaches dawn while still inside | Meera is carried to the stage; final shot is a new, small marionette added to the shelf, carved in her likeness |

No ending is marked "true" — this is a short standalone horror game, not a franchise setup. All three escape endings are equally valid completions.

## 6. Tone & Themes

Folk-horror dread rather than jump-scare spam (occasional startles are fine, constant ones are not — see [[AUDIO]] and [[UI_UX]] for pacing rules). Themes: inherited guilt, the cost of forbidden craft/mastery, houses that remember. Rajasthani setting is treated with research and respect — see [[ASSETS]] for the sourcing/attribution policy on cultural and architectural references.
