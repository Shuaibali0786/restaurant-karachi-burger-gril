import Image from "next/image";
import type { ReactNode } from "react";
import { Bike, Heart, RotateCcw } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const perks = [
  { Icon: RotateCcw, text: "Reorder your usuals in one tap" },
  { Icon: Bike, text: "Save addresses for faster checkout" },
  { Icon: Heart, text: "Keep your favourites on every device" },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  image: string;
  children: ReactNode;
}

/** Split layout: form card on cream, fire-themed panel with a food photo. */
export function AuthLayout({ title, subtitle, image, children }: AuthLayoutProps) {
  return (
    <div className="bg-cream-50">
      <div className="container-page grid items-stretch gap-8 py-10 sm:py-14 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md lg:py-6">
          <h1 className="font-display text-5xl font-black text-ink-900">{title}</h1>
          <p className="mt-2 mb-6 text-ink-600">{subtitle}</p>
          {children}
        </div>

        <aside className="relative isolate hidden overflow-hidden rounded-card bg-charcoal-950 p-10 text-cream-50 lg:flex lg:flex-col lg:justify-end">
          <Image src={image} alt="" fill sizes="45vw" className="-z-20 object-cover opacity-55" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-transparent" />
          <Logo />
          <p className="font-script mt-4 text-3xl text-flame-400">Karachi ka asli zaiqa</p>
          <p className="mt-6 text-sm font-bold tracking-widest text-sand-300 uppercase">Coming with accounts</p>
          <ul className="mt-3 space-y-3">
            {perks.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 font-semibold">
                <span className="flex size-9 items-center justify-center rounded-full bg-ember-500/20 text-flame-400">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
