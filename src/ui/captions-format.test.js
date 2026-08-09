import { describe, it, expect } from 'vitest';
import { putliStateCaption, CAPTURE_CAPTION, NAZAR_HALLUCINATION_CAPTION } from './captions-format.js';

describe('putliStateCaption', () => {
  it('returns caption text for each state with an audio tell', () => {
    expect(putliStateCaption('patrol')).toBe('Putli is patrolling nearby.');
    expect(putliStateCaption('investigate')).toBe('Putli heard something...');
    expect(putliStateCaption('chase')).toBe('Putli is chasing you!');
    expect(putliStateCaption('search')).toBe('Putli is searching for you.');
  });

  it('returns null for states with no standalone audio tell', () => {
    expect(putliStateCaption('idle')).toBeNull();
    expect(putliStateCaption('capture')).toBeNull();
  });

  it('returns null for an unknown state rather than throwing', () => {
    expect(putliStateCaption('not-a-real-state')).toBeNull();
  });
});

describe('capture/hallucination captions', () => {
  it('are non-empty fixed strings', () => {
    expect(CAPTURE_CAPTION.length).toBeGreaterThan(0);
    expect(NAZAR_HALLUCINATION_CAPTION.length).toBeGreaterThan(0);
  });
});
