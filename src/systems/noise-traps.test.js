import { describe, it, expect } from 'vitest';
import { createNoiseTrapTracker } from './noise-traps.js';

const traps = [{ id: 'kitchen-tile', position: { x: 15.5, y: 0, z: 1 }, radius: 0.8 }];

describe('createNoiseTrapTracker', () => {
  it('fires the instant the player enters the trap zone', () => {
    const tracker = createNoiseTrapTracker(traps);
    expect(tracker.update({ x: 100, y: 0, z: 100 })).toEqual([]);
    expect(tracker.update({ x: 15.5, y: 0, z: 1 })).toEqual(traps);
  });

  it('does not re-fire every frame while standing inside the zone', () => {
    const tracker = createNoiseTrapTracker(traps);
    tracker.update({ x: 15.5, y: 0, z: 1 });
    expect(tracker.update({ x: 15.6, y: 0, z: 1 })).toEqual([]);
    expect(tracker.update({ x: 15.5, y: 0, z: 1.1 })).toEqual([]);
  });

  it('fires again after leaving and re-entering the zone', () => {
    const tracker = createNoiseTrapTracker(traps);
    tracker.update({ x: 15.5, y: 0, z: 1 });
    tracker.update({ x: 100, y: 0, z: 100 }); // leave
    expect(tracker.update({ x: 15.5, y: 0, z: 1 })).toEqual(traps);
  });
});
