import { describe, it, expect, vi } from 'vitest';
import { createFSM } from './fsm.js';

describe('createFSM', () => {
  it('calls enter on the initial state', () => {
    const enterA = vi.fn();
    const fsm = createFSM({ a: { enter: enterA }, b: {} }, 'a', {});
    expect(fsm.state).toBe('a');
    expect(enterA).toHaveBeenCalledTimes(1);
  });

  it('throws on an unknown initial state', () => {
    expect(() => createFSM({ a: {} }, 'z', {})).toThrow();
  });

  it('transitions explicitly via transition(), calling exit then enter', () => {
    const order = [];
    const fsm = createFSM({
      a: { exit: () => order.push('exit-a') },
      b: { enter: () => order.push('enter-b') }
    }, 'a', {});
    fsm.transition('b');
    expect(fsm.state).toBe('b');
    expect(order).toEqual(['exit-a', 'enter-b']);
  });

  it('transitions when update() returns a different state name', () => {
    const fsm = createFSM({
      a: { update: () => 'b' },
      b: {}
    }, 'a', {});
    fsm.update(0.016);
    expect(fsm.state).toBe('b');
  });

  it('does nothing when update() returns the current state or undefined', () => {
    const enterA = vi.fn();
    const fsm = createFSM({ a: { enter: enterA, update: () => 'a' } }, 'a', {});
    fsm.update(0.016);
    fsm.update(0.016);
    expect(fsm.state).toBe('a');
    expect(enterA).toHaveBeenCalledTimes(1); // no re-entry on a no-op "transition"
  });

  it('rejects transitioning to an unknown state', () => {
    const fsm = createFSM({ a: {} }, 'a', {});
    expect(() => fsm.transition('nonexistent')).toThrow();
  });

  it('passes the shared context object into every handler', () => {
    const ctx = { count: 0 };
    const fsm = createFSM({
      a: { update: (c) => { c.count++; return 'a'; } }
    }, 'a', ctx);
    fsm.update(0.016);
    fsm.update(0.016);
    expect(ctx.count).toBe(2);
  });
});
