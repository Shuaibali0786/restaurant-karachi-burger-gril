import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center py-16 text-center", className)}>
      <span className="flex size-20 items-center justify-center rounded-full bg-ember-500/10 text-ember-700 ring-1 ring-ember-500/25">
        {icon}
      </span>
      <h2 className="font-display mt-5 text-3xl font-black text-ink-900">{title}</h2>
      {text && <p className="mt-2 text-ink-600">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
