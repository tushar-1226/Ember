"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPendingResurfacing,
  reactToResurfacing,
  type Resurfacing,
  type ResurfacingReaction,
} from "@/lib/api";

/**
 * The magic moment made visible: Ember gently resurfaces a memory you shared,
 * at a fitting time, with its provenance in plain sight — the whole product in
 * one small glowing card. Reactions feed back into memory strength/decay.
 */
export function ResurfacingCard() {
  const [nudge, setNudge] = useState<Resurfacing | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPendingResurfacing()
      .then((r) => {
        if (!cancelled) setNudge(r.nudge);
      })
      .catch(() => {
        /* backend down or nothing to surface — stay quiet */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function respond(reaction: ResurfacingReaction) {
    if (!nudge) return;
    setLeaving(true);
    try {
      await reactToResurfacing(nudge.id, reaction);
    } catch {
      /* best-effort; dismiss regardless */
    }
    // Let the exit animation play before unmounting.
    setTimeout(() => setNudge(null), 450);
  }

  const actions: { label: string; reaction: ResurfacingReaction }[] = [
    { label: "This helped", reaction: "helpful" },
    { label: "Not now", reaction: "not_now" },
    { label: "Let it go", reaction: "forget" },
  ];

  return (
    <AnimatePresence>
      {nudge && !leaving && (
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mb-8 w-full max-w-xl overflow-hidden rounded-3xl border border-border-soft bg-surface/70 p-6 backdrop-blur-xl"
        >
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ember-amber" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
                Ember remembered
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-foreground">
              {nudge.message}
            </p>

            {/* Provenance chip — the antidote to "creepy": you knowingly told it this. */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface/60 px-3 py-1 font-mono text-[11px] text-muted">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {nudge.provenance}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {actions.map((a) => (
                <button
                  key={a.reaction}
                  data-cursor="hot"
                  onClick={() => respond(a.reaction)}
                  className={
                    a.reaction === "helpful"
                      ? "rounded-full bg-ember-amber/90 px-4 py-1.5 text-[13px] font-medium text-void transition-transform hover:scale-[1.03]"
                      : "rounded-full border border-border-soft bg-surface/50 px-4 py-1.5 text-[13px] text-muted transition-colors hover:text-foreground"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
