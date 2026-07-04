"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ModelInfo, ModelKey } from "@/lib/api";

/**
 * Ember-themed model picker — a custom dropdown (not a native <select>) so it
 * matches the dark, glowing aesthetic and can show each model's special ability.
 */
export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ModelInfo[];
  value: ModelKey;
  onChange: (key: ModelKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = models.find((m) => m.key === value) ?? models[0];

  // Prefer dropping *down*; only flip up when there isn't room below (e.g. the
  // composer is pinned to the bottom of the screen) so the panel never clips.
  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      setDropUp(spaceBelow < 360 && spaceAbove > spaceBelow);
    }
    setOpen((o) => !o);
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) {
      setTimeout(() => setShowAll(false), 200);
      return;
    }
    
    const idx = models.findIndex(m => m.key === value);
    if (idx > 2) setShowAll(true);

    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        data-cursor="hot"
        onClick={toggle}
        className="group flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 py-1 pl-3 pr-2 font-mono text-[11px] text-muted transition-colors hover:border-ember-amber/40 hover:text-foreground focus:outline-none"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            current.kind === "image" ? "bg-ember-coral" : "bg-ember-amber"
          }`}
        />
        <span className="text-foreground">{current.label}</span>
        <span className="hidden text-faint sm:inline">· {current.ability}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-0 z-50 max-h-[min(360px,55vh)] w-72 overflow-y-auto rounded-2xl border border-border-soft bg-overlay/95 p-1.5 shadow-ember-sm backdrop-blur-xl ${
              dropUp ? "bottom-full mb-2" : "top-full mt-2"
            }`}
            data-lenis-prevent
          >
            {models.slice(0, showAll ? models.length : 3).map((m) => {
              const active = m.key === value;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    onChange(m.key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-ember-amber/10" : "hover:bg-surface/70"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      m.kind === "image" ? "bg-ember-coral" : "bg-ember-amber"
                    } ${active ? "" : "opacity-50"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{m.label}</span>
                      <span className="rounded-full border border-border-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-faint">
                        {m.ability}
                      </span>
                    </span>
                  </span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-1 shrink-0 text-ember-amber" aria-hidden>
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
            
            {!showAll && models.length > 3 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAll(true);
                }}
                className="w-full mt-1 rounded-xl px-3 py-2 text-[12px] font-medium text-muted hover:text-foreground hover:bg-surface/70 transition-colors text-center"
              >
                Show all models &rarr;
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
