import { describe, it, expect } from 'vitest';
import {
  hexToRgb01, relativeLuminance, contrastRatio, simulateCVD, colorDistance,
  CVD_TYPES, HUD_BACKGROUND, HUD_PALETTES
} from './accessibility-format.js';

describe('hexToRgb01', () => {
  it('converts known hex values', () => {
    expect(hexToRgb01('#FFFFFF')).toEqual([1, 1, 1]);
    expect(hexToRgb01('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb01('D4AF37')).toEqual([212 / 255, 175 / 255, 55 / 255]); // works without leading '#' too
  });
});

describe('relativeLuminance / contrastRatio', () => {
  it('gives white/black the maximum 21:1 ratio', () => {
    expect(contrastRatio([1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 0);
  });

  it('gives identical colors a 1:1 ratio', () => {
    expect(contrastRatio(HUD_PALETTES.normal.active, HUD_PALETTES.normal.active)).toBeCloseTo(1, 5);
  });

  it('is symmetric regardless of argument order', () => {
    const a = HUD_PALETTES.normal.active;
    const b = HUD_BACKGROUND;
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe('HUD palettes: WCAG 1.4.11 non-text contrast against the HUD panel background', () => {
  const MIN_NON_TEXT_CONTRAST = 3.0;

  it.each(['normal', 'colorblindSafe'])('%s palette: both "active" and "hallucinating" clear the minimum', (paletteName) => {
    const palette = HUD_PALETTES[paletteName];
    expect(contrastRatio(palette.active, HUD_BACKGROUND)).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
    expect(contrastRatio(palette.hallucinating, HUD_BACKGROUND)).toBeGreaterThanOrEqual(MIN_NON_TEXT_CONTRAST);
  });
});

describe('colorblind-safe palette: active vs. hallucinating stay distinguishable under CVD simulation', () => {
  const MIN_DISTINGUISHABLE_DISTANCE = 0.15;

  it.each(CVD_TYPES)('%s: colorblind-safe palette is never less distinguishable than the normal palette', (cvdType) => {
    const normalDistance = colorDistance(
      simulateCVD(HUD_PALETTES.normal.active, cvdType),
      simulateCVD(HUD_PALETTES.normal.hallucinating, cvdType)
    );
    const safeDistance = colorDistance(
      simulateCVD(HUD_PALETTES.colorblindSafe.active, cvdType),
      simulateCVD(HUD_PALETTES.colorblindSafe.hallucinating, cvdType)
    );
    expect(safeDistance).toBeGreaterThanOrEqual(normalDistance - 1e-9);
  });

  it.each(CVD_TYPES)('%s: colorblind-safe palette stays above the minimum distinguishable distance', (cvdType) => {
    const safeDistance = colorDistance(
      simulateCVD(HUD_PALETTES.colorblindSafe.active, cvdType),
      simulateCVD(HUD_PALETTES.colorblindSafe.hallucinating, cvdType)
    );
    expect(safeDistance).toBeGreaterThanOrEqual(MIN_DISTINGUISHABLE_DISTANCE);
  });
});

describe('simulateCVD', () => {
  it('throws on an unknown CVD type rather than silently returning the wrong thing', () => {
    expect(() => simulateCVD([1, 0, 0], 'nonexistent')).toThrow();
  });
});
