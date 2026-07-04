import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { EmberCritter } from "@/components/ember-critter";
import { FeatureShowcase } from "@/components/feature-showcase";
import { Footer } from "@/components/footer";

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
            <div className="relative inline-block">
              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                <span className="relative inline-block">
                  I
                  {/* Glowing Ember Pixel over the 'I' */}
                  <span className="absolute -top-1 left-[40%] h-2.5 w-2.5 animate-pulse rounded-full bg-ember-gold shadow-[0_0_12px_#ffb74d]" />
                </span>
                t{" "}
                <span className="relative inline-block text-ember-amber">
                  remembers
                  {/* Sitting Ember Critter */}
                  <div className="absolute -top-16 right-12 z-20 hidden sm:block animate-float">
                    <EmberCritter unit={5} />
                  </div>
                </span>
                <br />
                your life, and
                <br />
                <span className="text-ember-amber">reflects</span> it back.
              </h1>
            </div>
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
            Most AI forgets you the moment you close the tab. <span className="text-ember-amber">Ember is built to do
            the opposite.</span>
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border-soft bg-border-soft md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08} className="h-full">
              <div className="group h-full bg-surface p-8 transition-colors hover:bg-raised">
                <span className="font-mono text-sm text-faint">{p.n}</span>
                <h3 className="mt-6 font-display text-xl font-medium text-ember-amber">
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
              &ldquo;Three weeks ago you told me <span className="text-ember-amber">Sunday nights</span> make you spiral.
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

      {/* ---------- Feature Showcase ---------- */}
      <FeatureShowcase />

      {/* ---------- Behind the Code ---------- */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber">
            Under the hood
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
            Built for <span className="text-ember-amber">privacy</span>, powered by <span className="text-ember-amber">local models</span>.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border-soft bg-border-soft md:grid-cols-2 lg:grid-cols-3">
          <Reveal delay={0} className="h-full">
            <div className="group h-full bg-surface p-8 transition-colors hover:bg-raised">
              <h3 className="font-display text-xl font-medium text-ember-amber">Local First</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Your memory garden lives on your machine. No cloud sync, no tracking, no data mining. What Ember remembers stays entirely with you.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="h-full">
            <div className="group h-full bg-surface p-8 transition-colors hover:bg-raised">
              <h3 className="font-display text-xl font-medium text-ember-amber">Open Architecture</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ember's stack is built for tinkerers. Swap out the LLM backend, write your own Python memory plugins, and shape it exactly how you want.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.16} className="h-full md:col-span-2 lg:col-span-1">
            <div className="group h-full bg-surface p-8 transition-colors hover:bg-raised">
              <h3 className="font-display text-xl font-medium text-ember-amber">Own Your Data</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Export your entire history as plain text or JSON at any moment. Clear your memory instantly. You hold the keys.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Customize ---------- */}
      <section className="relative px-6 py-24 sm:px-12 sm:py-32 lg:px-24">
        <div className="relative mx-auto w-full max-w-none grid grid-cols-1 items-start gap-16 md:grid-cols-12 lg:gap-32">
          
          {/* Left Side: Cards */}
          <div className="order-last flex flex-col gap-[15vh] pb-[20vh] md:col-span-7 lg:col-span-7 md:order-first">
            <Reveal delay={0.08} className="sticky top-24 z-10">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center justify-between border-b border-border-soft pb-4">
                  <span className="text-sm font-medium text-foreground">Memory</span>
                  <div className="relative h-5 w-9 rounded-full bg-foreground">
                    <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-void" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Control the flow</h3>
                <p className="mt-2 text-sm text-muted">
                  Toggle proactive resurfacing, completely wipe specific memory clusters, or adjust how aggressively Ember connects past ideas.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.12} className="sticky top-28 z-20">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-3 border-b border-border-soft pb-4">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-border bg-raised text-xs text-foreground">E</span>
                  <span className="text-sm font-medium text-foreground">Persona</span>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Set the tone</h3>
                <p className="mt-2 text-sm text-muted">
                  Provide custom instructions to shape Ember's personality. Whether you want a gentle listener, an analytical partner, or a direct coach.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.16} className="sticky top-32 z-30">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-2 border-b border-border-soft pb-4">
                  <div className="h-6 w-6 rounded border border-border bg-raised" />
                  <div className="grid h-6 w-6 place-items-center rounded border border-foreground bg-foreground text-void"><span className="font-mono text-[10px]">Aa</span></div>
                  <div className="h-6 w-6 rounded border border-border bg-background" />
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Aesthetics</h3>
                <p className="mt-2 text-sm text-muted">
                  Choose between Light, Dark, or System themes. Adjust typography (Sans, System, Mono) and interface motion down to your exact liking.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.20} className="sticky top-36 z-40">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-3 border-b border-border-soft pb-4">
                  <span className="rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">Active</span>
                  <span className="text-sm font-medium text-foreground">Capabilities</span>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Extend the reach</h3>
                <p className="mt-2 text-sm text-muted">
                  Toggle powerful features like web search, code execution sandboxing, and file uploads. Connect Ember seamlessly to your workflow.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.24} className="sticky top-40 z-50">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-3 border-b border-border-soft pb-4">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium text-foreground">Speech</span>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Voice interactions</h3>
                <p className="mt-2 text-sm text-muted">
                  Choose from a selection of natural, expressive voices. Have fluid, spoken conversations with Ember when your hands are full.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.28} className="sticky top-44 z-[60]">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-3 border-b border-border-soft pb-4">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium text-foreground">Data Export</span>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Download your mind</h3>
                <p className="mt-2 text-sm text-muted">
                  Ember makes it easy to pack up and leave. Export your entire garden to standard JSON or Markdown files instantly.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.32} className="sticky top-48 z-[70]">
              <div className="rounded-2xl border border-border-soft bg-surface p-8 shadow-2xl transition-transform hover:scale-[1.01]">
                <div className="mb-6 flex items-center gap-3 border-b border-border-soft pb-4">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="text-foreground">
                    <path d="M9 7V4M15 7V4M7 7h10v4a5 5 0 0 1-10 0zM12 16v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-medium text-foreground">Plugins</span>
                </div>
                <h3 className="font-display text-lg font-medium text-ember-amber">Connect your world</h3>
                <p className="mt-2 text-sm text-muted">
                  Sync with Notion, GitHub, or Spotify to give Ember context on what you're building, reading, and listening to.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right Side: Heading */}
          <div className="order-first md:order-last md:col-span-5 lg:col-span-5 md:sticky md:top-32 md:text-right">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
                Make it yours
              </p>
              <h2 className="mt-4 text-balance font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
                A <span className="text-ember-amber">reflection</span> of your <span className="text-ember-amber">preferences</span>.
              </h2>
              <p className="mt-6 text-balance text-lg text-muted md:ml-auto md:max-w-md">
                Ember is built to be customized. From how it looks to what it remembers, you have complete control over the experience.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        {/* Massive Radial Glow Background */}
        <div className="absolute bottom-0 left-1/2 h-[800px] w-[1200px] -translate-x-1/2 translate-y-1/3 rounded-[100%] bg-ember-amber/30 blur-[120px]" />
        
        {/* Full Pixelated Ember Gold Background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(var(--color-ember-amber) 2px, transparent 2px), linear-gradient(90deg, var(--color-ember-amber) 2px, transparent 2px)', backgroundSize: '32px 32px', WebkitMaskImage: 'radial-gradient(ellipse at bottom, black 20%, transparent 100%)' }} />

        <div className="relative z-10 flex max-w-4xl flex-col items-center">
          <Reveal>
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="h-px w-16 sm:w-24 bg-border-soft/60" />
              <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/50 backdrop-blur-sm px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <span className="grid h-3 w-3 place-items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember-amber shadow-ember-sm" />
                </span>
                Act with memory
              </div>
              <div className="h-px w-16 sm:w-24 bg-border-soft/60" />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tighter sm:text-7xl lg:text-[6.5rem]">
              Start keeping the <span className="text-ember-amber">fire</span>.
            </h2>
          </Reveal>

          <Reveal delay={0.16}>
            <Link
              href="/reflect"
              data-cursor="hot"
              className="mt-12 flex items-center gap-2 rounded-md border border-border-soft bg-[#050505] px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-surface hover:border-border"
            >
              Begin reflecting
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12 w-full max-w-3xl">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-surface border border-border-soft">
                  <span className="h-2 w-2 rounded-full bg-ember-amber/80 shadow-ember-sm" />
                </div>
                <div className="text-left leading-[1.2]">
                  <span className="block text-sm font-medium text-foreground">Local-First</span>
                  <span className="block text-sm font-medium text-foreground">Clarity</span>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-surface border border-border-soft">
                  <span className="h-2 w-2 rounded-full bg-ember-amber/80 shadow-ember-sm" />
                </div>
                <div className="text-left leading-[1.2]">
                  <span className="block text-sm font-medium text-foreground">Built for Deep</span>
                  <span className="block text-sm font-medium text-foreground">Reflection</span>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-surface border border-border-soft">
                  <span className="h-2 w-2 rounded-full bg-ember-amber/80 shadow-ember-sm" />
                </div>
                <div className="text-left leading-[1.2]">
                  <span className="block text-sm font-medium text-foreground">Ready in</span>
                  <span className="block text-sm font-medium text-foreground">Seconds</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </main>
  );
}
