/**
 * Lightweight pub/sub event bus shared across systems, per ARCHITECTURE §3/§5 and
 * CODING_RULES §4 — cross-system communication goes through here, not direct imports
 * between unrelated systems.
 */

const listeners = new Map();

/** @param {string} eventName @param {(payload:any)=>void} handler */
export function on(eventName, handler) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(handler);
  return () => off(eventName, handler);
}

/** @param {string} eventName @param {(payload:any)=>void} handler */
export function off(eventName, handler) {
  listeners.get(eventName)?.delete(handler);
}

/** @param {string} eventName @param {any} [payload] */
export function emit(eventName, payload) {
  const handlers = listeners.get(eventName);
  if (!handlers) return;
  for (const handler of handlers) handler(payload);
}
