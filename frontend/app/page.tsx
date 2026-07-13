import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { EmberCritter } from "@/components/ember-critter";
import { GlitchTitle } from "@/components/glitch-title";
import { PrinciplesGrid } from "@/components/principles-grid";
import { MagicMoment } from "@/components/magic-moment";
import { FeatureShowcase } from "@/components/feature-showcase";
import { UnderTheHood } from "@/components/under-the-hood";
import { EcosystemIntegrations } from "@/components/ecosystem-integrations";
import { ConstellationOfMoments } from "@/components/constellation-of-moments";
import { CustomizeBento } from "@/components/customize-bento";
import { CTATunnel } from "@/components/cta-tunnel";
import { Footer } from "@/components/footer";

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
              <GlitchTitle />
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
      <section id="story" className="relative w-full py-32 bg-background border-t border-border-soft/30 mt-32">
        <div className="mx-auto max-w-6xl px-6 mb-20">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber">
              The idea
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
              Most AI forgets you the moment you close the tab. <span className="text-ember-amber">Ember is built to do
              the opposite.</span>
            </h2>
          </Reveal>
        </div>

        <PrinciplesGrid />
      </section>

      {/* ---------- The magic moment ---------- */}
      <MagicMoment />

      {/* ---------- Feature Showcase ---------- */}
      <FeatureShowcase />

      {/* ---------- Behind the Code ---------- */}
      <UnderTheHood />

      {/* ---------- Ecosystem Integrations ---------- */}
      <EcosystemIntegrations />

      {/* ---------- Constellation of Moments ---------- */}
      <ConstellationOfMoments />

      {/* ---------- Customize ---------- */}
      <CustomizeBento />

      {/* ---------- CTA ---------- */}
      <CTATunnel />

      <Footer />
    </main>
  );
}
