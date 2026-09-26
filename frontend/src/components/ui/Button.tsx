import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "dark";
type Size = "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  // Charcoal text on ember keeps AA contrast (research R2).
  primary:
    "bg-ember-500 text-charcoal-950 shadow-[0_8px_24px_-10px_rgb(255_90_31/0.8)] hover:bg-flame-400 hover:shadow-glow",
  secondary: "border-2 border-current bg-transparent hover:border-ember-500 hover:text-ember-500",
  ghost: "bg-transparent hover:bg-charcoal-900/10",
  dark: "bg-charcoal-950 text-cream-50 hover:bg-charcoal-800",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = StyleProps & Omit<ComponentPropsWithoutRef<"button">, keyof StyleProps>;

export function Button({ variant, size, icon, trailingIcon, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button {...rest} type={type} className={buttonClasses(variant, size, className)}>
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}

type ButtonLinkProps = StyleProps & Omit<ComponentPropsWithoutRef<typeof Link>, keyof StyleProps>;

export function ButtonLink({ variant, size, icon, trailingIcon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link {...rest} className={buttonClasses(variant, size, className)}>
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}
