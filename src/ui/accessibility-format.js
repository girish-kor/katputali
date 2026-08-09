/**
 * Pure color-accessibility math for the HUD's colorblind-safe accent option (UI_UX §6: "verified
 * against Deuteranopia/Protanopia/Tritanopia simulation before ship", TESTING §5). WCAG contrast
 * plus a lightweight linear-RGB colorblindness-simulation approximation (the widely-used
 * simplified Brettel/Coblis-style matrices) — not a physically exact simulation, but enough to
 * catch "these two HUD colors collapse together under CVD" regressions automatically instead of
 * only via a one-off manual check. No DOM dependency, testable per CODING_RULES §10.
 */

/** #RRGGBB hex string, in the same palette style as ASSETS §4's reference. */
export function hexToRgb01(h) {
  const value = h.startsWith('#') ? h.slice(1) : h;
  const n = parseInt(value, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** WCAG relative luminance (sRGB -> linear -> weighted sum). */
export function relativeLuminance([r, g, b]) {
  const linear = [r, g, b].map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** WCAG contrast ratio, 1:1 (no contrast) to 21:1 (black on white). */
export function contrastRatio(rgbA, rgbB) {
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const CVD_MATRICES = {
  protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
  tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]]
};

export const CVD_TYPES = Object.keys(CVD_MATRICES);

/** Approximates how [r,g,b] would appear to someone with the given color-vision deficiency. */
export function simulateCVD([r, g, b], type) {
  const m = CVD_MATRICES[type];
  if (!m) throw new Error(`Unknown CVD type: ${type}`);
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b
  ];
}

/** Euclidean distance between two RGB triples — a cheap proxy for "are these visually distinct." */
export function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

// The two HUD colors that must stay visually distinct in every palette: the Nazar meter/capture
// pips' "active/filled" tone vs. the Nazar meter's "hallucinating" tone (public/style.css). Both
// sets are brightened variants of ASSETS §4's vermillion/moonlight-blue/gold accents specifically
// tuned for this contrast/CVD-distinguishability requirement (a UI accent doesn't have to be the
// exact same literal hex as the material/prop palette entry it's derived from) — the original
// vermillion (#B33A2E) only cleared a 2.36:1 contrast against this background, below WCAG 1.4.11's
// 3:1 non-text minimum; found by this module's own test, fixed here rather than left in place.
export const HUD_BACKGROUND = hexToRgb01('#232A4D');
export const HUD_PALETTES = {
  normal: { active: hexToRgb01('#E0574A'), hallucinating: hexToRgb01('#93A9E0') },
  colorblindSafe: { active: hexToRgb01('#F0B429'), hallucinating: hexToRgb01('#4A6FD8') }
};
