import { describe, it, expect } from 'vitest';
import {
  generateStringSnapSamples, generateChaseDroneSamples, generateBreathingSamples,
  generateAmbienceSamples, generateStingerSamples, generateWaterSplashSamples, makeRandom
} from './audio-synth.js';

const SAMPLE_RATE = 44100;

function isFiniteBuffer(samples) {
  return samples.every(v => Number.isFinite(v));
}

function peakAbs(samples) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  return peak;
}

describe('makeRandom: deterministic PRNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = makeRandom(42);
    const b = makeRandom(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('stays within [0, 1)', () => {
    const random = makeRandom(7);
    for (let i = 0; i < 200; i++) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateStringSnapSamples: Capture sting layer', () => {
  it('produces a finite, non-silent, bounded buffer', () => {
    const samples = generateStringSnapSamples(SAMPLE_RATE);
    expect(samples.length).toBeGreaterThan(0);
    expect(isFiniteBuffer(samples)).toBe(true);
    expect(peakAbs(samples)).toBeGreaterThan(0);
    expect(peakAbs(samples)).toBeLessThanOrEqual(2); // generous headroom check, not a hard clip guarantee
  });

  it('decays toward silence by the end (percussive, not sustained)', () => {
    const samples = generateStringSnapSamples(SAMPLE_RATE);
    const earlyRms = rms(samples.slice(0, 200));
    const lateRms = rms(samples.slice(-200));
    expect(lateRms).toBeLessThan(earlyRms);
  });
});

describe('generateChaseDroneSamples: Chase state layer', () => {
  it('loops back near-silent at both ends (swell shape, loop-friendly)', () => {
    const samples = generateChaseDroneSamples(SAMPLE_RATE);
    expect(isFiniteBuffer(samples)).toBe(true);
    expect(Math.abs(samples[0])).toBeLessThan(0.05);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.05);
  });

  it('is loudest around the middle of the loop (the swell peak)', () => {
    const samples = generateChaseDroneSamples(SAMPLE_RATE);
    const mid = Math.floor(samples.length / 2);
    const midRms = rms(samples.slice(mid - 500, mid + 500));
    const startRms = rms(samples.slice(0, 1000));
    expect(midRms).toBeGreaterThan(startRms);
  });
});

describe('generateBreathingSamples: sprint/hiding layer', () => {
  it('produces a longer, calmer loop at low intensity and a shorter, louder one when winded', () => {
    const calm = generateBreathingSamples(SAMPLE_RATE, { intensity: 0.4 });
    const winded = generateBreathingSamples(SAMPLE_RATE, { intensity: 1.5 });
    expect(calm.length).toBeGreaterThan(winded.length);
    expect(peakAbs(winded)).toBeGreaterThan(peakAbs(calm));
  });

  it('never produces NaN/Infinity regardless of intensity', () => {
    for (const intensity of [0, 0.5, 1, 2, 10]) {
      expect(isFiniteBuffer(generateBreathingSamples(SAMPLE_RATE, { intensity }))).toBe(true);
    }
  });
});

describe('generateAmbienceSamples: per-floor bed (AUDIO §2 geography-by-ear)', () => {
  it('produces a distinct buffer per floor (not the same clip relabeled)', () => {
    const ground = generateAmbienceSamples(SAMPLE_RATE, 'ground');
    const basement = generateAmbienceSamples(SAMPLE_RATE, 'basement');
    const roof = generateAmbienceSamples(SAMPLE_RATE, 'roof');
    expect(ground).not.toEqual(basement);
    expect(basement).not.toEqual(roof);
    expect(ground).not.toEqual(roof);
  });

  it('falls back to the ground bed for an unknown floor key rather than throwing', () => {
    expect(() => generateAmbienceSamples(SAMPLE_RATE, 'nonexistent-floor')).not.toThrow();
  });

  it('the roof bed (wind) is louder on average than the quieter first-floor interior bed', () => {
    const roof = generateAmbienceSamples(SAMPLE_RATE, 'roof');
    const first = generateAmbienceSamples(SAMPLE_RATE, 'first');
    expect(rms(roof)).toBeGreaterThan(rms(first));
  });
});

describe('generateStingerSamples: tension-beat music stingers', () => {
  it('produces a different contour for each mood', () => {
    const awaken = generateStingerSamples(SAMPLE_RATE, 'awaken');
    const triumph = generateStingerSamples(SAMPLE_RATE, 'triumph');
    const doom = generateStingerSamples(SAMPLE_RATE, 'doom');
    expect(awaken).not.toEqual(triumph);
    expect(triumph).not.toEqual(doom);
  });

  it('is finite and bounded for every defined mood', () => {
    for (const mood of ['awaken', 'triumph', 'doom']) {
      const samples = generateStingerSamples(SAMPLE_RATE, mood);
      expect(isFiniteBuffer(samples)).toBe(true);
      expect(peakAbs(samples)).toBeLessThanOrEqual(2);
    }
  });
});

describe('generateWaterSplashSamples: water-surface footstep', () => {
  it('is a short, finite, decaying transient', () => {
    const samples = generateWaterSplashSamples(SAMPLE_RATE);
    expect(isFiniteBuffer(samples)).toBe(true);
    expect(samples.length).toBeLessThan(SAMPLE_RATE); // well under a second
    const earlyRms = rms(samples.slice(0, 200));
    const lateRms = rms(samples.slice(-200));
    expect(lateRms).toBeLessThan(earlyRms);
  });
});

function rms(samples) {
  let sum = 0;
  for (const v of samples) sum += v * v;
  return Math.sqrt(sum / samples.length);
}
