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
