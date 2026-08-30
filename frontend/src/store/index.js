/**
 * Simple state management store.
 *
 * Currently wraps localStorage. Replace with Zustand/Redux
 * when the app grows complex enough to need it.
 */

const STORE_PREFIX = 'technova_';

export function getStore(key) {
  try {
    const item = localStorage.getItem(`${STORE_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setStore(key, value) {
  localStorage.setItem(`${STORE_PREFIX}${key}`, JSON.stringify(value));
}

export function removeStore(key) {
  localStorage.removeItem(`${STORE_PREFIX}${key}`);
}

export function clearStore() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

export default { getStore, setStore, removeStore, clearStore };
