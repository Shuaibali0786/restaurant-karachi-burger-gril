import { connection } from "next/server";
import { ApiError } from "@/lib/api-error";

const BUILDING = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * Call this with an error caught while a page loads its data. If the API could not be reached while
 * Next.js is **building** the site (for example the free Render backend is asleep during a Vercel
 * build), the page is not baked with an error and the build does not fail: it is rendered on each
 * request instead, when the API is up. At request time this does nothing, so the normal error handling
 * (and the last good cached page during a background refresh) is unchanged.
 */
export async function renderOnDemandIfUnreachable(error: unknown): Promise<void> {
  if (BUILDING() && error instanceof ApiError && (error.code === "NETWORK" || error.code === "INTERNAL")) {
    await connection(); // opts this page out of static generation; never returns while building
  }
}

/** Runs a page's data load; see renderOnDemandIfUnreachable. */
export async function loadForPage<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    await renderOnDemandIfUnreachable(error);
    throw error;
  }
}
