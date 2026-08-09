import { describe, it, expect } from 'vitest';
import { formatPraharClock, nazarFraction, capturePipsState, interactVerb, endingTitle } from './hud-format.js';

describe('formatPraharClock', () => {
  it('formats minutes:seconds with a zero-padded seconds field', () => {
    expect(formatPraharClock(3, 127)).toBe('Third Prahar — 2:07');
  });

  it('never shows negative time', () => {
    expect(formatPraharClock(4, -5)).toBe('Fourth Prahar — 0:00');
  });

  it('falls back to a generic label for an out-of-range Prahar number', () => {
    expect(formatPraharClock(5, 10)).toBe('Prahar 5 — 0:10');
  });
});

describe('nazarFraction', () => {
  it('computes the fill fraction', () => {
    expect(nazarFraction(25, 100)).toBeCloseTo(0.25, 5);
  });

  it('clamps to [0, 1]', () => {
    expect(nazarFraction(-10, 100)).toBe(0);
    expect(nazarFraction(150, 100)).toBe(1);
  });

  it('does not divide by zero', () => {
    expect(nazarFraction(50, 0)).toBe(0);
  });
});

describe('capturePipsState', () => {
  it('fills the first N pips', () => {
    expect(capturePipsState(0)).toEqual([false, false, false]);
    expect(capturePipsState(1)).toEqual([true, false, false]);
    expect(capturePipsState(3)).toEqual([true, true, true]);
  });
});

describe('interactVerb', () => {
  it('maps each interactable type to its GAME_MECHANICS §1 verb', () => {
    expect(interactVerb('pickup')).toBe('Pick up');
    expect(interactVerb('station')).toBe('Use');
    expect(interactVerb('readable')).toBe('Read');
  });

  it('hiding spots toggle their verb based on current hiding state', () => {
    expect(interactVerb('hidingSpot', false)).toBe('Hide');
    expect(interactVerb('hidingSpot', true)).toBe('Come out');
  });

  it('falls back to a generic verb for an unknown type', () => {
    expect(interactVerb('noiseTrap')).toBe('Interact');
  });
});

describe('endingTitle', () => {
  it('maps all 4 endings per STORY §5', () => {
    expect(endingTitle('gate')).toBe('The Gate (Deodhi)');
    expect(endingTitle('baori')).toBe('The Stepwell (Baori)');
    expect(endingTitle('rooftop')).toBe('The Rooftop (Chhat)');
    expect(endingTitle('bound')).toBe('Bound');
  });
});
