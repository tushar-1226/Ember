"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { label: "Reflect", href: "/reflect" },
  { label: "Garden", href: "/garden" },
  { label: "Story", href: "/#story" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // App surfaces have their own chrome — hide the marketing nav there.
  if (
    pathname?.startsWith("/reflect") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/code")
  )
    return null;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        {/* Wordmark */}
        <Link href="/" className="group flex items-center gap-2" data-cursor="hot">
          <span className="relative grid h-6 w-6 place-items-center">
            <span className="absolute h-2 w-2 rounded-full bg-ember-amber" />
            <span className="absolute h-6 w-6 rounded-full border border-ember-amber/25" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Ember
          </span>
        </Link>

        {/* Floating pill nav — desktop */}
        <nav className="hidden items-center gap-1 rounded-full border border-border-soft bg-surface/60 px-2 py-1.5 backdrop-blur-xl md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="hot"
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side — CTA (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-2">
          <Link
            href="/reflect"
            data-cursor="hot"
            className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-void transition-transform hover:scale-[1.03] sm:inline-block"
          >
            Begin
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-border-soft bg-surface/60 text-foreground backdrop-blur md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mb-2 rounded-2xl border border-border-soft bg-surface/95 p-2 backdrop-blur-xl md:hidden"
          >
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                    active ? "bg-raised text-foreground" : "text-muted hover:bg-raised/60 hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/reflect"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-void"
            >
              Begin
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
