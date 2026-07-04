/** Ember — shared motion helpers. */

export const ease = {
  ember: [0.22, 1, 0.36, 1] as const,
  emberOut: [0.16, 1, 0.3, 1] as const,
  flame: [0.34, 1.56, 0.64, 1] as const,
};

/** Frame-rate-independent smoothing. */
export function damp(current: number, target: number, lambda: number, dtMs: number): number {
  const t = 1 - Math.exp(-lambda * (dtMs / 1000));
  return current + (target - current) * t;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}
