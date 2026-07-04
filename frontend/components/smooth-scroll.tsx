"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { raf } from "@/lib/raf";
import { prefersReducedMotion } from "@/lib/motion";

/** Lenis smooth scroll on the shared rAF loop. Off under reduced-motion. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    const unsub = raf.add((time) => lenis.raf(time), 0);
    return () => {
      unsub();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
