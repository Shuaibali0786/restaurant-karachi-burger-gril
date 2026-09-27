"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Flame, LogOut, MapPin, ReceiptText, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";

const links = [
  { href: "/admin", label: "Orders", Icon: ReceiptText },
  { href: "/admin/menu", label: "Menu", Icon: UtensilsCrossed },
  { href: "/admin/areas", label: "Areas", Icon: MapPin },
];

/**
 * Shell for every `/admin/*` page except the login screen: a charcoal top bar with navigation and
 * sign-out, and the session check that sends a non-admin back to login. `proxy.ts` already redirects
 * a request with no cookie at all; this catches an expired token or a customer account, since the
 * API — not the cookie's mere presence — is the real source of truth.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSession((state) => state.user);
  const load = useSession((state) => state.load);
  const logout = useSession((state) => state.logout);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (user !== undefined && (user === null || user.role !== "admin")) {
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, pathname]);

  if (user === undefined || user === null || user.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50">
        <div className="size-10 animate-spin rounded-full border-4 border-ember-500 border-t-transparent" aria-label="Checking your session" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="sticky top-0 z-30 bg-charcoal-950 text-cream-50">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-display text-lg font-black">
            <Flame aria-hidden="true" className="size-5 text-flame-400" />
            <span className="hidden sm:inline">Karachi Burger &amp; Grill</span>
            <span className="text-flame-400">Admin</span>
          </Link>
          <nav aria-label="Admin sections" className="flex items-center gap-1 overflow-x-auto">
            {links.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold whitespace-nowrap transition",
                    active ? "bg-ember-500 text-charcoal-950" : "text-sand-300 hover:bg-charcoal-800 hover:text-cream-50",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => {
              void logout().then(() => router.replace("/admin/login"));
            }}
            className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-sand-300 transition hover:bg-charcoal-800 hover:text-cream-50"
          >
            <LogOut aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
