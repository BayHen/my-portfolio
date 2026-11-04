"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { motionSettings } from "@/lib/motion-settings";

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
  const reduced = !!useReducedMotion();
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
