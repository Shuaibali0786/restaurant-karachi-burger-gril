import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  title: string;
  /** Heading id, for aria-labelledby on the parent section. */
  id?: string;
  eyebrow?: string;
  as?: "h1" | "h2" | "h3";
  /** `dark` for charcoal bands, `light` for cream bands. */
  tone?: "light" | "dark";
  link?: { label: string; href: string };
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  title,
  id,
  eyebrow,
  as: Heading = "h2",
  tone = "light",
  link,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap gap-4",
        align === "center" ? "flex-col items-center text-center" : "items-end justify-between",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p
            className={cn(
              "font-script text-xl sm:text-2xl",
              tone === "dark" ? "text-flame-400" : "text-ember-700",
            )}
          >
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={cn(
            "font-display text-4xl leading-none font-extrabold sm:text-5xl",
            tone === "dark" ? "text-cream-50" : "text-ink-900",
          )}
        >
          {title}
        </Heading>
      </div>
      {link && (
        <Link
          href={link.href}
          className={cn(
            "group inline-flex min-h-11 items-center gap-2 font-bold underline-offset-4 hover:underline",
            tone === "dark" ? "text-flame-400" : "text-ember-700",
          )}
        >
          {link.label}
          <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
