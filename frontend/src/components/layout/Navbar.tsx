"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { Heart, LogOut, Menu, Search, ShieldCheck, UserRound } from "lucide-react";
import type { NavLink } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/hooks/useScrolled";
import { useSession } from "@/stores/session";
import { ButtonLink } from "@/components/ui/Button";
import { CartButton } from "@/components/cart/CartButton";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchDialog } from "@/components/layout/SearchDialog";

interface NavbarProps {
  links: NavLink[];
  hours: string;
}

const iconButton =
  "relative flex size-11 items-center justify-center rounded-full text-cream-50 transition hover:bg-charcoal-800 hover:text-flame-400";

export function Navbar({ links, hours }: NavbarProps) {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuId = useId();
  // The one place the session is loaded for the customer site (the server cookie is the truth).
  const user = useSession((state) => state.user);
  const loadSession = useSession((state) => state.load);
  const logout = useSession((state) => state.logout);
  useEffect(() => {
    void loadSession().catch(() => undefined);
  }, [loadSession]);

  const isHome = pathname === "/";
  const solid = scrolled || !isHome;

  const isActive = useCallback(
    (href: string) => {
      return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow] duration-300",
        solid ? "bg-charcoal-950/95 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="container-page flex h-(--nav-h) items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-11 items-center px-3 text-sm font-bold transition hover:text-flame-400",
                      "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-ember-500 after:transition-transform",
                      active ? "text-flame-400 after:scale-x-100" : "text-cream-50 after:scale-x-0 hover:after:scale-x-100",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden min-h-11 items-center gap-2 rounded-full border border-charcoal-600 bg-charcoal-900/60 pr-6 pl-4 text-sm text-sand-300 transition hover:border-ember-500 xl:flex"
          >
            <Search aria-hidden="true" className="size-4" />
            Search food…
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search the menu" className={cn(iconButton, "xl:hidden")}>
            <Search aria-hidden="true" className="size-5" />
          </button>

          <Link href="/favourites" aria-label="Favourites" className={cn(iconButton, "hidden sm:flex")}>
            <Heart aria-hidden="true" className="size-5" />
          </Link>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" aria-label="Admin" className={cn(iconButton, "hidden sm:flex")}>
                  <ShieldCheck aria-hidden="true" className="size-5" />
                </Link>
              )}
              <Link href="/account/orders" aria-label="My orders" className={cn(iconButton, "hidden sm:flex")}>
                <UserRound aria-hidden="true" className="size-5" />
              </Link>
              <button type="button" onClick={() => void logout()} aria-label="Log out" className={cn(iconButton, "hidden sm:flex")}>
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </>
          ) : (
            <Link href="/login" aria-label="Log in" className={cn(iconButton, "hidden sm:flex")}>
              <UserRound aria-hidden="true" className="size-5" />
            </Link>
          )}

          <CartButton />

          {/* Wrapper controls visibility: the button's own inline-flex would override `hidden`. */}
          <div className="ml-1 hidden md:block">
            <ButtonLink href="/menu">Order Now</ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className={cn(iconButton, "lg:hidden")}
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      <MobileMenu id={menuId} open={menuOpen} onClose={closeMenu} links={links} isActive={isActive} hours={hours} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
