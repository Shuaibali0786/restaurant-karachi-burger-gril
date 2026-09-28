"use client";

import { create } from "zustand";
import { getSession, logout as apiLogout } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

interface SessionState {
  /** undefined = not checked yet, null = signed out, SessionUser = signed in. */
  user: SessionUser | null | undefined;
  load: () => Promise<SessionUser | null>;
  setUser: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
}

/**
 * The signed-in customer or admin. Not persisted (the httpOnly session cookie is the source of
 * truth) — every tab asks the server via `load()` on mount.
 */
export const useSession = create<SessionState>((set) => ({
  user: undefined,
  load: async () => {
    // The backend sets a readable "kbg_auth" hint next to the httpOnly session cookie. Without it
    // there is nobody to look up, so guests make no request (and log no 401) on every page.
    if (typeof document !== "undefined" && !document.cookie.split("; ").includes("kbg_auth=1")) {
      set({ user: null });
      return null;
    }
    const user = await getSession();
    set({ user });
    return user;
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    await apiLogout();
    set({ user: null });
  },
}));
