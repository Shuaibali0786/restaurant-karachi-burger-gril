import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * localStorage that never throws: private mode, blocked site data or quota
 * errors fall back to in-memory storage for the session (spec edge case).
 */
const memory = new Map<string, string>();

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

export const persistStorage = createJSONStorage(() => safeLocalStorage);
