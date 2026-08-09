/**
 * Inventory system (GAME_MECHANICS §2): 5 slots, pickup/drop/combine. Notes are excluded — they
 * use the separate "Read" interact type (GAME_MECHANICS §1) and never occupy a slot at all.
 * Pure logic, no PlayCanvas dependency — testable per CODING_RULES §10.
 */

export const MAX_SLOTS = 5;

export function createInventory(maxSlots = MAX_SLOTS) {
  /** @type {string[]} */
  const slots = [];

  function hasSpace() {
    return slots.length < maxSlots;
  }

  /** @returns {boolean} whether the item was added (fails silently if full, per GAME_MECHANICS §2's "no fail-state" spirit — callers show the "can't carry more" feedback) */
  function addItem(itemId) {
    if (!hasSpace()) return false;
    slots.push(itemId);
    return true;
  }

  function removeItem(itemId) {
    const index = slots.indexOf(itemId);
    if (index === -1) return false;
    slots.splice(index, 1);
    return true;
  }

  function hasItem(itemId) {
    return slots.includes(itemId);
  }

  function hasAll(itemIds) {
    return itemIds.every(hasItem);
  }

  function removeAll(itemIds) {
    for (const id of itemIds) removeItem(id);
  }

  function getSlots() {
    return [...slots];
  }

  /**
   * On capture (GAME_MECHANICS §4): drops one random non-key item as a cost. Key items are
   * never dropped, so a capture can never soft-lock route progress.
   * @param {Map<string,{category:string}>} itemsById
   * @param {() => number} random
   * @returns {string|null} the dropped item id, or null if nothing droppable was carried
   */
  function dropRandomNonKeyItem(itemsById, random = Math.random) {
    const droppable = slots.filter(id => itemsById.get(id)?.category !== 'key');
    if (droppable.length === 0) return null;
    const picked = droppable[Math.floor(random() * droppable.length)];
    removeItem(picked);
    return picked;
  }

  return { addItem, removeItem, hasItem, hasAll, removeAll, hasSpace, getSlots, dropRandomNonKeyItem };
}
