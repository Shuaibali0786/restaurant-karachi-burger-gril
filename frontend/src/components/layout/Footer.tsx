import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import type { NavLink, SiteInfo } from "@/lib/types";
import { Logo } from "@/components/layout/Logo";
import { SocialIcons } from "@/components/layout/SocialIcons";

function LinkColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="font-display mb-4 text-lg font-extrabold text-cream-50">{title}</h2>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="inline-flex min-h-11 items-center text-sand-300 transition hover:text-flame-400 sm:min-h-9">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ site }: { site: SiteInfo }) {
  const contacts = [
    { Icon: MapPin, text: site.address },
    { Icon: Clock, text: site.hours },
    { Icon: Phone, text: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
    { Icon: Mail, text: site.email, href: `mailto:${site.email}` },
  ];

  return (
    <footer className="bg-charcoal-950 text-sand-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-4">
          <Logo />
          <p className="font-script mt-4 text-2xl text-flame-400">{site.tagline}</p>
          <p className="mt-2 max-w-sm leading-relaxed">{site.story}</p>
          <div className="mt-5">
            <SocialIcons links={site.socials} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <LinkColumn title="Quick links" links={site.footer.quickLinks} />
        </div>
        <div className="lg:col-span-2">
          <LinkColumn title="Support" links={site.footer.support} />
        </div>

        <div className="lg:col-span-4">
          <h2 className="font-display mb-4 text-lg font-extrabold text-cream-50">Contact us</h2>
          <ul className="space-y-3">
            {contacts.map(({ Icon, text, href }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ember-500" />
                {href ? (
                  <a href={href} className="transition hover:text-flame-400">
                    {text}
                  </a>
                ) : (
                  <span>{text}</span>
                )}
              </li>
            ))}
          </ul>

          {/* Static in Phase 1; NewsletterForm with validation replaces it in Phase 7 (T090). */}
          <div className="mt-6 rounded-card border border-charcoal-700 bg-charcoal-900 p-4">
            <p className="font-bold text-cream-50">Get deals first</p>
            <p className="mb-3 text-sm">Weekly offers and new items. No spam.</p>
            <div className="flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-charcoal-600 bg-charcoal-950 px-4 text-sm text-cream-50 placeholder:text-sand-300/70 focus:border-ember-500 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Subscribe"
                className="flex min-h-11 items-center gap-2 rounded-full bg-ember-500 px-4 text-sm font-bold text-charcoal-950 transition hover:bg-flame-400"
              >
                <Send aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-charcoal-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-sm sm:flex-row">
          <p>© 2026 {site.name}. All rights reserved.</p>
          <p className="font-script text-lg text-flame-400">Karachi ka asli zaiqa ♥</p>
        </div>
      </div>
    </footer>
  );
}
