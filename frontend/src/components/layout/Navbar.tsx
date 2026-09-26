"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useState } from "react";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import type { NavLink } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/hooks/useScrolled";
import { ButtonLink } from "@/components/ui/Button";
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

  const isHome = pathname === "/";
  const solid = scrolled || !isHome;
  // Phase 4 wires this to the cart store; the bubble only renders when > 0.
  const cartCount = 0;

  const isActive = useCallback(
    (href: string) => {
      const path = href.split("?")[0] ?? href;
      if (href.includes("?")) return false; // "Combos" is a filtered view of Menu
      return path === "/" ? pathname === "/" : pathname.startsWith(path);
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

          <Link href="/login" aria-label="Log in" className={cn(iconButton, "hidden sm:flex")}>
            <UserRound aria-hidden="true" className="size-5" />
          </Link>

          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart, empty"}
            className={iconButton}
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-ember-500 px-1 text-[0.7rem] leading-5 font-extrabold text-charcoal-950">
                {cartCount}
              </span>
            )}
          </Link>

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
