"use client";

import Link from "next/link";
import { useId } from "react";
import { ArrowRight, UserRound, X } from "lucide-react";
import type { NavLink } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useModalDialog } from "@/hooks/useModalDialog";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  isActive: (href: string) => boolean;
  hours: string;
}

export function MobileMenu({ id, open, onClose, links, isActive, hours }: MobileMenuProps) {
  const { ref, close, onBackdropClick } = useModalDialog(open, onClose);
  const titleId = useId();

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-charcoal-950 p-0 text-cream-50 backdrop:bg-charcoal-950/70 backdrop:backdrop-blur-sm open:animate-slide-in-right"
    >
      <div className="flex h-full flex-col px-5 pt-4 pb-6">
        <h2 id={titleId} className="sr-only">
          Main menu
        </h2>
        <div className="flex items-center justify-between">
          <Logo onClick={close} />
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-full bg-charcoal-800 hover:bg-charcoal-700"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-8 flex-1">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "font-display flex min-h-12 items-center justify-between rounded-xl px-3 text-3xl font-extrabold transition hover:bg-charcoal-800",
                    isActive(link.href) ? "text-flame-400" : "text-cream-50",
                  )}
                >
                  {link.label}
                  <ArrowRight aria-hidden="true" className="size-5 text-ember-500" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <ButtonLink href="/menu" size="lg" onClick={close} className="w-full">
            Order Now
          </ButtonLink>
          <ButtonLink
            href="/login"
            variant="secondary"
            size="lg"
            onClick={close}
            icon={<UserRound aria-hidden="true" className="size-5" />}
            className="w-full text-cream-50"
          >
            Log in
          </ButtonLink>
          <p className="pt-2 text-center text-sm text-sand-300">{hours}</p>
        </div>
      </div>
    </dialog>
  );
}
