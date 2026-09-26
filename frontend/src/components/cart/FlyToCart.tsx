"use client";

import { motion } from "motion/react";
import { useUi } from "@/stores/ui";

const SIZE = 72;
const ARC_HEIGHT = 120;

/** The item photo arcs from the item view into the navbar bag, then the bag bounces. */
export function FlyToCart() {
  const flight = useUi((state) => state.flight);
  const endFlight = useUi((state) => state.endFlight);
  if (!flight) return null;

  const { from, to } = flight;
  const startX = from.x + from.width / 2 - SIZE / 2;
  const startY = from.y + from.height / 2 - SIZE / 2;
  const endX = to.x + to.width / 2 - SIZE / 2;
  const endY = to.y + to.height / 2 - SIZE / 2;
  const peakY = Math.min(startY, endY) - ARC_HEIGHT;

  return (
    // Plain <img>: a transient decorative clone of an already-loaded, optimised photo.
    <motion.img
      key={flight.id}
      src={flight.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[70] rounded-full object-cover shadow-[0_10px_30px_rgb(255_90_31/0.6)] ring-4 ring-flame-400"
      style={{ width: SIZE, height: SIZE }}
      initial={{ x: startX, y: startY, scale: 1.4, opacity: 1 }}
      animate={{
        x: [startX, (startX + endX) / 2, endX],
        y: [startY, peakY, endY],
        scale: [1.4, 0.9, 0.25],
        opacity: [1, 1, 0.6],
      }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      onAnimationComplete={endFlight}
    />
  );
}
