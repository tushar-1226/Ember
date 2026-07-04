import Link from "next/link";
import { Reveal } from "@/components/reveal";

export default function FlowerInfoPage() {
  return (
    <main className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
        <div className="relative z-10 mx-auto max-w-4xl">
          <Reveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ember-gold shadow-ember-sm" />
              Ambient Context
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Ember <span className="text-ember-gradient">Flower</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mx-auto mt-8 max-w-xl text-balance text-lg text-muted">
              Connect the apps you already use. Ember quietly gathers context from your digital life to understand your mood, your work, and your world—without you typing a word.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/flower/dashboard"
                data-cursor="hot"
                className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-void transition-transform hover:scale-[1.03]"
              >
                Plant your first seed
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <Reveal delay={0.1}>
            <div className="group h-full rounded-2xl border border-border-soft bg-surface p-8 transition-colors hover:bg-raised">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.573.398-.868.217-2.378-1.45-5.37-1.78-8.895-.975-.336.077-.666-.134-.743-.47-.077-.335.134-.665.47-.743 3.864-.882 7.16-.497 9.818 1.103.296.18.4.573.218.868zm1.31-2.923c-.226.37-.714.485-1.085.258-2.723-1.674-6.9-2.188-10.158-1.2-1.087.33-2.158-.293-2.487-1.38-.073-.243-.132-.51.137-.768.243-.242.493-.19.723-.118 3.754 1.138 8.423.57 11.613-1.385.37-.226.858-.112 1.084.257.227.37.113.858-.258 1.084l.43.653zm.126-3.05c-3.256-1.93-8.618-2.11-11.724-1.168-.454.137-.923-.117-1.06-.572-.138-.454.117-.924.573-1.06 3.633-1.102 9.544-.897 13.34 1.353.407.24.542.766.302 1.173-.24.406-.767.54-1.173.303h-.258z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-medium text-foreground">Spotify</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ember notices the vibe of what you&apos;re listening to. Heavy rotation of lo-fi? It knows you&apos;re focusing. Sad indie tracks? It might ask if you&apos;re okay.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="group h-full rounded-2xl border border-border-soft bg-surface p-8 transition-colors hover:bg-raised">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-void">
                  <span className="font-mono text-sm font-bold">N</span>
                </div>
                <h3 className="font-display text-xl font-medium text-foreground">Notion</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Connect your workspace. Ember reads your open projects, upcoming deadlines, and brain dumps to proactively help you plan your week.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3} className="md:col-span-2 lg:col-span-1">
            <div className="group h-full rounded-2xl border border-border-soft bg-surface p-8 transition-colors hover:bg-raised">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-raised text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-medium text-foreground">Proactive Care</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Set quiet hours and preferred check-in times. Ember will gently nudge you with a reflection prompt right when you need it most.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 pb-40 pt-16">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border-soft bg-surface px-6 py-16 text-center sm:px-8 sm:py-20">
          <div className="relative z-10">
            <Reveal>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Make your life easier.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-md text-muted">
                Let Ember quietly assemble the pieces so you can focus on the big picture.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <Link
                href="/flower/dashboard"
                data-cursor="hot"
                className="mt-9 inline-block rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-void transition-transform hover:scale-[1.03]"
              >
                Go to Dashboard
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
