# Ember — UI & Motion Design Plan

> **Design thesis:** The name *is* the interface. An ember is a small living light that
> **glows when tended and fades when neglected** — which is exactly what Horizon's memory
> does (consolidation strengthens, decay dims). So the WebGL isn't decoration; it's the
> product made visible. Every memory is an ember. The whole UI is a dark room lit only by
> the embers you've kept alive.
>
> **Feel:** black, quiet, cinematic, minimal — but alive. Nothing moves without meaning.
> Smooth to the point of feeling *physical*.

---

## 1. Design principles

1. **Darkness as canvas.** Near-black backgrounds so the ember light (red/amber) is the only
   color that speaks. Restraint makes the glow feel precious.
2. **Light = memory.** Brightness encodes memory strength. A vivid ember = a strong,
   reinforced memory; a dim, drifting one = a fading memory. This ties motion to meaning.
3. **Motion is physics, not animation.** Inertia, easing, weight. Lenis + spring-based
   transitions so scrolling and navigation feel like moving a heavy, warm object.
4. **Minimal chrome, maximal presence.** Very few UI elements on screen; generous negative
   space; type and light do the work.
5. **Performance is a feature.** "Smoothest" is the brief — 60fps is non-negotiable. WebGL is
   budgeted and gated behind capability + reduced-motion checks (see §10).

---

## 2. Color system

Pure black/white base with ember accents (red → amber). Keep accents *rare* so they glow.

```css
/* Base — near-black to pure black layers */
--bg-void:      #000000;   /* deepest layer, WebGL clear color */
--bg-base:      #0A0A0A;   /* app background */
--bg-raised:    #131313;   /* cards, panels */
--bg-overlay:   #1A1A1A;   /* modals, popovers */
--border:       #262626;   /* hairline borders */
--border-soft:  #1E1E1E;

/* Ink — white/gray text */
--fg:           #FAFAFA;   /* primary text */
--fg-muted:     #A1A1A1;   /* secondary */
--fg-faint:     #6B6B6B;   /* tertiary / metadata */

/* Ember — red → amber accent ramp (use sparingly) */
--ember-red:    #FF3B2F;   /* hottest — alerts, active flame */
--ember-coral:  #FF5A36;
--ember-amber:  #FFB627;   /* warm glow — primary accent */
--ember-gold:   #FFD166;   /* soft highlight, hover glow */
--ember-deep:   #B71C0C;   /* dying ember, deep shadow of red */

/* The signature gradient (used for flame, active states, key CTAs) */
--ember-grad:   linear-gradient(135deg, #FF3B2F 0%, #FF8A3D 45%, #FFD166 100%);
--ember-glow:   0 0 24px rgba(255, 90, 54, 0.45);  /* bloom-like CSS halo */
```

**Semantic mapping (memory strength → color):**
- Strong / recently reinforced memory → `--ember-amber` / `--ember-gold`, high bloom.
- Neutral → dim white-gold.
- Decaying / low confidence → desaturated `--ember-deep`, low opacity, drifting.
- Alert / "you keep circling this" → `--ember-red` pulse.

---

## 3. Typography

- **Display / headlines:** a wide **geometric sans** (variable) — cold, sharp, "advanced/tech"
  (e.g. Clash Display, Neue Montreal, or a variable geometric grotesque). Big, confident,
  sparse. *(Decision: geometric sans over serif.)*
- **Body / UI:** **Geist** (already in the project) — clean, neutral, quiet.
- **Data / metadata / provenance chips:** **Geist Mono** — timestamps, confidence, "why I
  know this."
- Scale: large type ramp with lots of air. Tight leading on display, relaxed on body.
- Treatment: occasional text-mask reveals with the ember gradient bleeding through key words.

---

## 4. UI tech stack

Built on your existing **Next.js 14 (App Router) + TypeScript + Tailwind** frontend.

| Concern | Library | Notes |
|---|---|---|
| WebGL scene | **Three.js** via **React Three Fiber (R3F)** | Declarative Three in React; plays well with Next. |
| R3F helpers | **@react-three/drei** | Cameras, loaders, shaders, `<Points>`, env. |
| Post-processing | **@react-three/postprocessing** | **Bloom** (the ember glow), vignette, noise, chromatic aberration (subtle). |
| Smooth scroll | **Lenis** (`@studio-freight/lenis`) | Inertial scroll; synced to R3F render loop. |
| Page/element motion | **GSAP** (+ ScrollTrigger) **and** **Framer Motion** | **Decision: use both.** GSAP owns cinematic timelines & page transitions (intro, carrying-the-flame); Framer Motion owns component micro-states (hover, press, list stagger, layout). |
| Page transitions | **`next-view-transitions`** or a custom GSAP overlay | Coordinated exit→enter (see §7). |
| Custom cursor | Custom React + `requestAnimationFrame` (lerp) | Ember-dot cursor with trailing glow (see §8). |
| State | **Zustand** (already in project) | Shares memory data between DOM and WebGL. |
| Shaders | GLSL (raw or `glslify`) | Ember particle + flame + noise displacement. |

**Golden rule:** one `requestAnimationFrame` loop. Drive Lenis, cursor lerp, and R3F from a
single render tick to avoid competing loops and jank.

---

## 5. Signature WebGL: the Ember system

A reusable GPU particle system that represents memories as embers. Same system, different
densities/behaviors per page.

- **Ember particles:** GPU-instanced `<Points>` with a custom shader. Each particle carries
  `strength` (0–1), `hue` (red→amber), `age`, and drift velocity.
- **Glow:** additive blending + **Bloom** post-processing = the warm halo. This is what makes
  it feel *lit* rather than drawn.
- **Behavior encodes the product:**
  - New memory → a spark ignites (bright flash, then settles).
  - Reinforced memory → ember brightens and rises.
  - Decaying memory → ember dims, desaturates toward `--ember-deep`, drifts down/out.
  - Consolidation (weekly) → many small embers merge into a few brighter ones (visual
    metaphor for summarization).
- **Central flame** (home/landing): a soft, noise-displaced flame plane using GLSL simplex
  noise — the "living" heart of Ember. Reacts subtly to cursor proximity.
- **Interaction:** cursor exerts a gentle heat field — embers near the cursor warm and drift
  toward it, then settle. Keep it subtle; presence over spectacle.

---

## 6. Page map

Multi-page, each a "room" in the dark. Consistent ember system, escalating density by intimacy.

| Route | Name | Purpose | WebGL role |
|---|---|---|---|
| `/` | **The Hearth** (landing) | Pitch + the central flame; converts. | Full flame + drifting embers; heaviest scene. |
| `/onboarding` | **First Spark** | Sign-in, "light your first ember." | Single spark ignites into your first memory. |
| `/` (app) | **Dashboard / Home** | Daily entry point: today's reflection, quick talk. | Ambient embers, low density; calm. |
| `/talk` | **Conversation** | The chat companion (streaming). | Minimal WebGL (perf); ember pulses when Ember "remembers." |
| `/garden` | **Memory Garden** | "What I know about you" — the visible-memory moat. | **Signature scene:** every memory is an ember; strong glow, faint fade; hover to inspect provenance. |
| `/reflect` | **Weekly Reflection** | The consolidated digest; patterns over time. | Embers merge/consolidate animation. |
| `/self` | **Trends / You over time** | Mood & theme trajectories. | Ember trails as timelines. |
| `/settings` | **Privacy & Vault** | "Your memory is yours"; export/delete; encryption. | Near-zero WebGL; trust = calm, clear, fast. |

---

## 7. Opening & closing animations

### App intro (first paint / landing) — "the ignition"
1. **Black.** Pure void, one second of held silence. A single point of light in the center.
2. **Ignite.** The spark blooms into the central flame; a low ember-red vignette breathes in
   from the edges. Title text mask-reveals with the ember gradient bleeding through.
3. **Settle.** Embers scatter outward and drift; UI (nav, CTA) fades up last. Lenis engages.
   Total: ~2.5–3.5s, skippable, and **respects `prefers-reduced-motion`** (jump to settled).

### Page-to-page transitions — "carrying the flame"
Coordinated **exit → enter** so navigation feels continuous, not a hard cut:
1. **Exit:** current page's content lifts/dims; embers converge into a single traveling
   ember that moves toward the new section's anchor.
2. **Cover:** a brief ember-lit wipe (near-black with a warm gradient sweep) masks the route swap.
3. **Enter:** the traveling ember arrives and *re-scatters* into the new page's embers;
   content reveals in a staggered rise.
- Implement with a GSAP timeline over a fixed full-screen overlay, gated on Next route change
  (or `next-view-transitions`). Keep it ~600–900ms — cinematic but never in the way.

### Micro "closing" states
- Signing out / locking the vault: embers **cool** — desaturate, dim, drift down, screen
  returns to void. Reinforces "your memory is safely put to rest," not "app closed."

---

## 8. Custom cursor

- **Form:** a small solid ember dot (`--ember-amber`) with a soft outer glow, plus a larger,
  lagging ring that **lerps** behind it (spring follow) for weight.
- **States:**
  - Default: gentle idle flicker of the glow.
  - Hover interactive: ring expands, dot brightens to `--ember-gold`.
  - Press: quick contract + spark burst.
  - Over WebGL: cursor becomes the "heat source" that warms nearby embers.
  - Text/inputs: ring collapses to a thin caret so it never obstructs typing.
- **Rules:** hide the native cursor only on pointer-fine devices; **restore native cursor on
  touch and on `prefers-reduced-motion`.** Never let the custom cursor add input latency —
  the dot tracks 1:1, only the ring lerps.

---

## 9. Motion principles

- **Easing:** custom ember ease — slow-in, gentle overshoot, soft-out (like heat rising).
- **Stagger:** content reveals in small staggered groups (60–90ms) so nothing pops in at once.
- **Scroll:** Lenis inertia tuned soft (lerp ~0.08–0.1); scroll-linked ember density and
  parallax via ScrollTrigger.
- **Restraint:** a maximum of *one* hero motion per view. Everything else is ambient and quiet.

---

## 10. Performance & fallbacks (how we keep it "smoothest")

WebGL + Lenis + custom cursor is exactly the combo that *janks* if undisciplined. Guardrails:

- **Single RAF loop** driving Lenis + cursor + R3F (no competing tickers).
- **Frame budget:** target 60fps; cap DPR at ~1.5–2; particle counts scale to device.
- **Capability gating:** detect GPU tier (`detect-gpu`); low-tier devices get a lightweight
  CSS-gradient ember fallback instead of the shader scene.
- **Reduced motion:** `prefers-reduced-motion` → disable intro sequence, particle drift, and
  custom cursor; keep static ember imagery. Fully usable, still on-brand.
- **Lazy-load WebGL:** the heavy scenes (`/`, `/garden`) load the R3F bundle on demand;
  `/talk` and `/settings` stay light for responsiveness.
- **Pause offscreen:** stop the render loop when the tab/scene isn't visible.
- **Accessibility:** WebGL is decorative — all content lives in real DOM, keyboard-navigable,
  screen-reader friendly. The experience must fully work with the canvas removed.

---

## 11. Component inventory (build list)

- `<EmberCanvas>` — R3F scene wrapper + post-processing (bloom/vignette).
- `<EmberField>` — the GPU particle system (props: density, strengths[], behavior).
- `<Flame>` — central noise-displaced flame (landing/home).
- `<SmoothScroll>` — Lenis provider synced to RAF.
- `<EmberCursor>` — custom cursor with lerp ring + states.
- `<PageTransition>` — GSAP overlay timeline for exit/enter.
- `<IntroSequence>` — the ignition opening animation.
- `<MemoryEmber>` — a single memory rendered as an interactive ember (garden), with
  provenance tooltip.
- `<ProvenanceChip>` — mono "why I know this" tag.
- `<ReflectionCard>`, `<TrendTrail>`, `<TalkStream>` — page-level content blocks.
- Base UI (buttons, inputs, panels) restyled to the dark/ember system on top of shadcn/ui.

---

## 12. Build phases

- **Phase 0 — Foundation:** design tokens (colors/type), Tailwind theme, Lenis + single RAF
  loop, custom cursor. *(No WebGL yet — prove smoothness first.)*
- **Phase 1 — Ember core:** `<EmberCanvas>` + `<EmberField>` + Bloom; the central `<Flame>`;
  the landing "Hearth" with the ignition intro.
- **Phase 2 — Navigation:** `<PageTransition>` (carrying-the-flame), multi-page routing, the
  dark UI shell (nav, layout) across all routes.
- **Phase 3 — The Garden (signature):** memories → interactive embers with strength-based
  glow, decay drift, and provenance on hover. *This is the moat, made visible.*
- **Phase 4 — Reflection & trends:** consolidation "embers merge" animation; trend trails.
- **Phase 5 — Polish & perf pass:** GPU gating, reduced-motion, mobile fallbacks, 60fps audit.

---

## 13. Locked decisions

- **Motion engine:** **GSAP + Framer Motion (both).** GSAP for cinematic timelines & page
  transitions; Framer Motion for component micro-states.
- **Display font:** **geometric sans** (cold, sharp, advanced) for display; **Geist** for UI;
  **Geist Mono** for data/provenance.
- **Accent balance:** **amber-dominant.** Warm gold/amber (`--ember-amber` / `--ember-gold`)
  leads across the UI; **red (`--ember-red`) is reserved** for hot/alert states ("you keep
  circling this") and the dying-ember deep shade. Keeps the minimalism calm and inviting.

---

**See also:** [`product-plan.md`](./product-plan.md) — the Memory Garden and visible
consolidation/decay this UI renders; and [`database.md`](./database.md) — the `strength`,
`confidence`, and `decay_state` fields that drive each ember's brightness.
