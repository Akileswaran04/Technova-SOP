/**
 * Reusable hook for localStorage persistence.
 * 
 * IMPORTANT: This is the single source of truth for all local data storage.
 * To swap for real API calls later, replace the getter/setter logic here
 * while keeping the same interface (value, setValue).
 * 
 * No real hashing is done — passwords are stored in plaintext.
 * TODO: Replace with real auth (bcrypt + JWT) before production.
 */
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  // Lazy initialization — only reads from localStorage once on mount
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync to localStorage whenever value changes
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Helper to generate a unique ID (good enough for localStorage demo).
 * TODO: Use UUIDs or server-generated IDs in production.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
