import Link from "next/link";
import { Reveal } from "@/components/reveal";

const PRINCIPLES = [
  {
    n: "01",
    title: "It remembers",
    body: "Every conversation leaves an ember. Ember keeps the moments that matter — your goals, your people, the things you keep circling back to.",
  },
  {
    n: "02",
    title: "It consolidates",
    body: "Scattered thoughts get gathered into a story. Ember quietly connects the dots across weeks so patterns you'd never notice surface on their own.",
  },
  {
    n: "03",
    title: "It lets go",
    body: "Memory that never forgets is noise. Ember lets the unimportant fade — visibly — so what stays lit is only what's worth keeping warm.",
  },
];

export default function Home() {
  return (
    <main className="relative">
      {/* ---------- Hero ---------- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-ember-amber shadow-ember-sm animate-flicker" />
              A companion that remembers
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              It remembers
              <br />
              your life, and
              <br />
              <span className="text-ember-gradient">reflects it back.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mx-auto mt-8 max-w-xl text-balance text-lg text-muted">
              Ember is a personal-reflection companion. It holds your story, notices your
              patterns, and gently shows you yourself — so you actually grow.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/reflect"
                data-cursor="hot"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-void transition-transform hover:scale-[1.03]"
              >
                Light your first ember
              </Link>
              <Link
                href="/#story"
                data-cursor="hot"
                className="rounded-full border border-border px-6 py-3 text-sm text-muted transition-colors hover:text-foreground"
              >
                How it works
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
          scroll
        </div>
      </section>

      {/* ---------- Story / principles ---------- */}
      <section id="story" className="relative mx-auto max-w-6xl px-6 py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber">
            The idea
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
            Most AI forgets you the moment you close the tab. Ember is built to do
            the opposite.
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border-soft bg-border-soft md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08} className="h-full">
              <div className="group h-full bg-surface p-8 transition-colors hover:bg-raised">
                <span className="font-mono text-sm text-faint">{p.n}</span>
                <h3 className="mt-6 font-display text-xl font-medium text-ember-gold">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- The magic moment ---------- */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
              The moment it clicks
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <blockquote className="mt-8 font-display text-2xl font-medium leading-snug tracking-tight sm:text-4xl">
              &ldquo;Three weeks ago you told me Sunday nights make you spiral.
              It&apos;s Sunday. Want to plan tomorrow now, so it feels lighter?&rdquo;
            </blockquote>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1.5 font-mono text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ember-amber" />
              remembered from your chat · May 3
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative px-6 pb-40 pt-16">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border-soft bg-surface px-6 py-16 text-center sm:px-8 sm:py-20">
          <div className="relative z-10">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Start keeping the fire.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-md text-muted">
                The longer you talk to Ember, the better it knows you — and the more
                it reflects back.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <Link
                href="/reflect"
                data-cursor="hot"
                className="mt-9 inline-block rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-void transition-transform hover:scale-[1.03]"
              >
                Begin reflecting
              </Link>
            </Reveal>
          </div>
        </div>
        <footer className="mx-auto mt-24 flex max-w-6xl items-center justify-between border-t border-border-soft pt-8 font-mono text-xs text-faint">
          <span>Ember</span>
          <span>it remembers · it reflects · it lets go</span>
        </footer>
      </section>
    </main>
  );
}
