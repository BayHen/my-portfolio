"use client";

import { motion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { motionSettings } from "@/lib/motion-settings";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  hero = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  hero?: boolean;
}) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    () => false,
  );
  const settings = motionSettings(reduced, delay);
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={settings.initial}
      animate={hero ? { opacity: 1, y: 0 } : undefined}
      whileInView={hero ? undefined : { opacity: 1, y: 0 }}
      viewport={hero ? undefined : { once: true, amount: 0.12 }}
      transition={settings.transition}
    >
      {children}
    </motion.div>
  );
}
