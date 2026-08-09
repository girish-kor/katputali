/**
 * Procedural audio synthesis (AUDIO §1's "original simple music composition/synthesis using
 * free tools" — here the "tool" is plain JS math instead of LMMS/Audacity, same original-work
 * status). Pure sample-generation functions with no AudioContext/PlayCanvas dependency, so
 * they're directly unit-testable per CODING_RULES §10; audio-manager.js wraps their output in
 * an AudioBuffer and hands it to pc.Sound (AUDIO §3 — playback still goes through PlayCanvas's
 * built-in sound system, no third-party audio library is added).
 *
 * Fills the gaps ASSETS §5 recorded as blocked on Freesound/LMMS access (breathing, ambience,
 * music stingers, Chase's drone swell, Capture's string-snap) without needing network access or
 * a GUI audio tool a headless session can't drive.
 */

/** Deterministic PRNG (mulberry32) so generated buffers are reproducible/testable. */
function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function silence(length) {
  return new Float32Array(length);
}

/** Linear envelope helper: value ramps 0->1 over `attack` fraction, 1->0 over the rest. */
function envelopeAt(fraction, attackFraction) {
  if (fraction < attackFraction) return fraction / attackFraction;
  return 1 - (fraction - attackFraction) / (1 - attackFraction);
}

/** One-pole low-pass filter applied in place — softens harsh white noise into a duller rumble/hiss. */
function lowPass(samples, cutoffFraction) {
  let prev = 0;
  const a = Math.max(0.001, Math.min(1, cutoffFraction));
  for (let i = 0; i < samples.length; i++) {
    prev += a * (samples[i] - prev);
    samples[i] = prev;
  }
  return samples;
}

/**
 * Sharp attack / exponential decay envelope with a bandpassed noise burst — the physical
 * signature of a snapped taut string/wire, distinct from any tonal instrument hit.
 */
export function generateStringSnapSamples(sampleRate, seed = 1) {
  const durationSec = 0.45;
  const length = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(length);
  const random = makeRandom(seed);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 18);
    const tone = Math.sin(2 * Math.PI * 620 * t) * 0.5 + Math.sin(2 * Math.PI * 1240 * t) * 0.3;
    const noise = (random() * 2 - 1) * 0.6;
    samples[i] = decay * (tone + noise);
  }
  lowPass(samples, 0.9);
  return samples;
}

/**
 * A low string-tension drone that swells in volume and pitch over its length — Chase's missing
 * layer (AUDIO §2). Looped by the caller; the swell shape means each loop reads as a fresh surge
 * of tension rather than a static hum.
 */
export function generateChaseDroneSamples(sampleRate) {
  const durationSec = 4;
  const length = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const fraction = i / length;
    const swell = Math.sin(Math.PI * fraction); // 0 -> 1 -> 0, one swell per loop
    const pitch = 55 + swell * 14; // low string register, rising under tension
    const fundamental = Math.sin(2 * Math.PI * pitch * t);
    const fifth = Math.sin(2 * Math.PI * pitch * 1.5 * t) * 0.4;
    samples[i] = (fundamental + fifth) * (0.15 + swell * 0.35);
  }
  return samples;
}

/** Sprint-effort / held-breath loop — filtered noise shaped into an in/out breathing envelope. */
export function generateBreathingSamples(sampleRate, { intensity = 1, seed = 2 } = {}) {
  const durationSec = 2.6 / Math.max(0.4, intensity); // faster cycle when winded
  const length = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(length);
  const random = makeRandom(seed);
  const noise = new Float32Array(length);
  for (let i = 0; i < length; i++) noise[i] = random() * 2 - 1;
  lowPass(noise, 0.25);
  for (let i = 0; i < length; i++) {
    const fraction = i / length;
    // Inhale (first 40%) rises faster than the exhale (remaining 60%) falls, per natural breath shape.
    const envelope = fraction < 0.4 ? fraction / 0.4 : 1 - (fraction - 0.4) / 0.6;
    samples[i] = noise[i] * envelope * envelope * (0.25 + 0.25 * intensity);
  }
  return samples;
}

const FLOOR_AMBIENCE_PARAMS = {
  // Courtyard/ground floor — night air, a distant fountain trickle (AUDIO §2).
  ground: { hum: 60, humGain: 0.03, noiseCutoff: 0.15, noiseGain: 0.05, trickle: true },
  // Stepwell/cellar — water drip/echo (AUDIO §2's "basement stepwell water drip/echo").
  basement: { hum: 45, humGain: 0.025, noiseCutoff: 0.08, noiseGain: 0.06, drip: true },
  // Upper floor — quieter interior room tone, no wind yet (that's the roof).
  first: { hum: 70, humGain: 0.02, noiseCutoff: 0.12, noiseGain: 0.035 },
  // Open chhat — wind through jaali (AUDIO §2).
  roof: { hum: 0, humGain: 0, noiseCutoff: 0.35, noiseGain: 0.09, wind: true }
};

/** Per-floor ambience bed (AUDIO §2's "a player can partially tell which floor they're on by ambience alone"). */
export function generateAmbienceSamples(sampleRate, floor, seed = 3) {
  const params = FLOOR_AMBIENCE_PARAMS[floor] ?? FLOOR_AMBIENCE_PARAMS.ground;
  const durationSec = 8;
  const length = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(length);
  const random = makeRandom(seed);
  const noise = new Float32Array(length);
  for (let i = 0; i < length; i++) noise[i] = random() * 2 - 1;
  lowPass(noise, params.noiseCutoff);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = noise[i] * params.noiseGain;
    if (params.humGain > 0) {
      sample += Math.sin(2 * Math.PI * params.hum * t) * params.humGain;
    }
    if (params.wind) {
      const gust = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.07 * t);
      sample *= gust;
    }
    samples[i] = sample;
  }

  // Sparse periodic events layered on top of the continuous bed.
  if (params.trickle) layerPeriodicClicks(samples, sampleRate, 1.3, 0.05, seed + 1);
  if (params.drip) layerPeriodicClicks(samples, sampleRate, 2.1, 0.07, seed + 2);

  return samples;
}

/** Adds short decaying "tick" transients at a roughly-regular interval — water drips/trickle droplets. */
function layerPeriodicClicks(samples, sampleRate, intervalSec, amplitude, seed) {
  const random = makeRandom(seed);
  const clickLength = Math.floor(sampleRate * 0.08);
  let cursor = Math.floor(intervalSec * sampleRate * random());
  while (cursor + clickLength < samples.length) {
    for (let i = 0; i < clickLength; i++) {
      const decay = Math.exp(-i / (clickLength * 0.3));
      samples[cursor + i] += (random() * 2 - 1) * amplitude * decay;
    }
    cursor += Math.floor(intervalSec * sampleRate * (0.7 + random() * 0.6));
  }
}

const STINGER_TONE_SETS = {
  // "first Putli cue" (AUDIO §2's music-at-tension-beats list) — an uneasy rising phrase.
  awaken: [220, 261.6, 293.7],
  // A route's completing puzzle step / a winning ending — a resolving, hopeful phrase.
  triumph: [293.7, 349.2, 440],
  // The Bound ending — a falling, unresolved phrase.
  doom: [293.7, 233.1, 174.6]
};

/**
 * Sparse folk-instrument-inspired plucked tones (AUDIO §2's "implied sarangi/dholak-style tones
 * via... simple original synthesis") using Karplus-Strong string physical modelling — three
 * short plucks in sequence, used only at the tension beats AUDIO §2 scopes music to.
 */
export function generateStingerSamples(sampleRate, mood = 'awaken', seed = 4) {
  const notes = STINGER_TONE_SETS[mood] ?? STINGER_TONE_SETS.awaken;
  const noteDurationSec = 0.55;
  const noteLength = Math.floor(sampleRate * noteDurationSec);
  const totalLength = noteLength * notes.length;
  const samples = new Float32Array(totalLength);
  const random = makeRandom(seed);

  notes.forEach((freq, noteIndex) => {
    const pluck = karplusStrongPluck(sampleRate, freq, noteLength, random);
    const offset = noteIndex * Math.floor(noteLength * 0.85); // slight overlap between notes
    for (let i = 0; i < pluck.length && offset + i < totalLength; i++) {
      samples[offset + i] += pluck[i] * 0.5;
    }
  });

  return samples;
}

/** Karplus-Strong plucked-string synthesis: a noise burst fed through a decaying delay line at the note's period. */
function karplusStrongPluck(sampleRate, frequency, length, random) {
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const ringBuffer = new Float32Array(period);
  for (let i = 0; i < period; i++) ringBuffer[i] = random() * 2 - 1;

  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const current = ringBuffer[i % period];
    const next = ringBuffer[(i + 1) % period];
    const averaged = (current + next) * 0.5 * 0.996; // damping factor -> decay
    ringBuffer[i % period] = averaged;
    out[i] = current;
  }
  return out;
}

/**
 * Water-surface footstep (AUDIO §2's wood/stone/water footstep sets) — no sourced clip exists
 * for it (ASSETS §5's Freesound-blocked gap), so it's synthesized: a short noise splash plus a
 * high "plink" droplet tone, distinct in timbre from the sourced Kenney wood/stone thuds.
 */
export function generateWaterSplashSamples(sampleRate, seed = 5) {
  const durationSec = 0.3;
  const length = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(length);
  const random = makeRandom(seed);
  const noise = new Float32Array(length);
  for (let i = 0; i < length; i++) noise[i] = random() * 2 - 1;
  lowPass(noise, 0.4);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 14);
    const plink = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 40) * 0.4;
    samples[i] = noise[i] * decay * 0.6 + plink;
  }
  return samples;
}

/** Turns a Float32Array into a real AudioBuffer via the given AudioContext (or OfflineAudioContext). */
export function toAudioBuffer(audioContext, samples, sampleRate) {
  const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
  if (buffer.copyToChannel) {
    buffer.copyToChannel(samples, 0);
  } else {
    buffer.getChannelData(0).set(samples);
  }
  return buffer;
}

export { silence, envelopeAt, lowPass, makeRandom };
