import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type EmberStyle = CSSProperties & { "--ember-drift": string };

// Deterministic pseudo-random values so server and client render identical HTML.
const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const embers = Array.from({ length: 18 }, (_, i) => {
  const size = 2 + seeded(i, 1) * 4;
  const style: EmberStyle = {
    left: `${5 + seeded(i, 2) * 90}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${(seeded(i, 3) * 6).toFixed(2)}s`,
    animationDuration: `${(4.5 + seeded(i, 4) * 4).toFixed(2)}s`,
    "--ember-drift": `${Math.round((seeded(i, 5) - 0.5) * 80)}px`,
  };
  return { id: i, style, gold: i % 3 === 0 };
});

/** Glowing embers drifting up from the grill. Decorative; removed for reduced motion. */
export function EmberParticles({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden", className)}>
      {embers.map(({ id, style, gold }) => (
        <span
          key={id}
          style={style}
          className={cn(
            "absolute bottom-[8%] animate-ember-rise rounded-full opacity-0 blur-[0.5px]",
            gold
              ? "bg-flame-300 shadow-[0_0_8px_2px_rgb(255_176_32/0.8)]"
              : "bg-ember-400 shadow-[0_0_8px_2px_rgb(255_90_31/0.8)]",
          )}
        />
      ))}
    </div>
  );
}
