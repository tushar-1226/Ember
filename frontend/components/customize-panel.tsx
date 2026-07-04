"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile, type ModelInfo, type ModelKey, type UserProfile } from "@/lib/api";

/**
 * Customize — a slide-in settings panel (stays inside the reflect shell).
 * Sets the default model (persisted, flows back into the composer) and shows
 * the conversational profile Ember has inferred about the user.
 */
export function CustomizePanel({
  open,
  onClose,
  models,
  defaultModel,
  onDefaultModelChange,
}: {
  open: boolean;
  onClose: () => void;
  models: ModelInfo[];
  defaultModel: ModelKey;
  onDefaultModelChange: (key: ModelKey) => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (open && !profile) getUserProfile().then(setProfile).catch(() => setProfile(null));
  }, [open, profile]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col overflow-y-auto border-l border-border-soft bg-surface/95 backdrop-blur-xl"
            data-lenis-prevent
          >
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
              <h2 className="font-display text-xl font-medium text-foreground">Customize</h2>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full border border-border-soft text-muted hover:text-foreground"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Default model */}
            <section className="px-6 pb-6">
              <p className="mb-1 text-sm font-medium text-foreground">Default model</p>
              <p className="mb-3 text-[12px] text-faint">Used when you start a new chat.</p>
              <div className="space-y-1.5">
                {models.map((m) => {
                  const active = m.key === defaultModel;
                  return (
                    <button
                      key={m.key}
                      onClick={() => onDefaultModelChange(m.key)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        active
                          ? "border-ember-amber/40 bg-ember-amber/10"
                          : "border-border-soft bg-raised/40 hover:bg-raised/70"
                      }`}
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${m.kind === "image" ? "bg-ember-coral" : "bg-ember-amber"} ${active ? "" : "opacity-50"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{m.label}</span>
                          <span className="rounded-full border border-border-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-faint">{m.ability}</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{m.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Inferred profile */}
            <section className="border-t border-border-soft px-6 py-6">
              <p className="mb-1 text-sm font-medium text-foreground">What Ember has learned about you</p>
              <p className="mb-3 text-[12px] text-faint">Inferred from how you talk — updates over time.</p>
              {profile ? (
                <dl className="space-y-2">
                  {[
                    ["Language", profile.preferred_language],
                    ["Tone", profile.asking_tone],
                    ["Style", profile.user_style],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg border border-border-soft bg-raised/40 px-3 py-2">
                      <dt className="text-[12px] text-faint">{k}</dt>
                      <dd className="text-[13px] capitalize text-foreground">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[13px] text-faint">No profile yet — keep chatting and Ember will learn.</p>
              )}
            </section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
