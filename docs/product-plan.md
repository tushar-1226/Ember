# Horizon AI — Product Plan

> **The pitch:** *Horizon is a personal-reflection companion that remembers your life and
> reflects it back to help you grow.* Unlike a chatbot that forgets you the moment you close
> the tab, Horizon builds a living memory of who you are — and the reason it feels magical
> instead of creepy is that you can **see it remember, see it strengthen what matters, and
> see it gently let go of what doesn't.**

---

## 1. The problem

People think in scattered fragments — a worry on Tuesday, a win on Friday, a pattern they
never notice because nothing connects the dots across weeks. Generic AI assistants make this
worse: they're brilliant in the moment and amnesiac forever after. Every conversation starts
from zero. There's no growth, no continuity, no *relationship*.

Journaling apps store your entries but don't *understand* them. Therapy is expensive and
weekly. There is no always-available companion that **remembers your whole story and helps
you make sense of it.**

## 2. The product in one sentence

An AI companion you talk to (by text or voice) that **remembers everything that matters,
notices your patterns over time, and proactively reflects them back** — so you actually grow
instead of repeating the same loops.

## 3. Who it's for

- **Primary:** self-improvement–minded people 20–40 who already journal, use Notion, or
  have tried therapy/coaching and want continuity between sessions.
- **Emotional job-to-be-done:** *"Help me understand myself and become who I want to be —
  and don't make me repeat my whole history every time."*
- **Willing to pay** because the alternatives (therapy, coaching) are expensive or the free
  tools (ChatGPT, plain journals) have no memory.

---

## 4. The magic moment (the whole product hinges on this)

Retention lives or dies on **one experience**: Horizon resurfaces something you forgot you
told it, at exactly the right time, with visible provenance.

> *"Three weeks ago, before your last big week, you told me Sunday nights make you spiral.
> It's Sunday. Want to plan tomorrow now so it feels lighter? (I remembered this from our
> chat on May 3rd.)"*

A naive "remember everything and dump it into the prompt" system produces this moment as
**noisy or creepy** — it recalls the wrong thing, or too much, or something you wish it had
forgotten. Horizon's **consolidation + decay pipeline** is exactly what makes the moment
land: it surfaces the *right* memory, at the *right* strength, and can always explain *why*.

**Your job in month one is to make this single moment undeniable. Everything else is support.**

---

## 5. Why "consolidation/decay made visible" is the moat

Competitors treat memory as invisible storage. Horizon makes the *lifecycle* of memory a
first-class, visible part of the experience — which flips the two biggest consumer fears
(creepy + wrong) into trust and delight.

| Fear | Horizon's visible answer |
|---|---|
| "It's creepy that it knows this." | Every memory shows **provenance**: *"from our chat on May 3rd."* You knowingly told it. |
| "It remembered something embarrassing/outdated." | Memories **decay** and visibly **fade**; you can watch old, unreinforced things weaken and prune them in one tap. |
| "It's a black box hoarding my data." | A **"What I know about you"** view — every fact, its confidence, editable and deletable. |
| "It just parrots the last thing I said." | **Weekly reflections** synthesize *consolidated* patterns across sessions, not single messages. |

The tagline this earns: **"A memory that grows with you — and knows when to let go."**

### Visible-memory surfaces (build these)
1. **Memory Garden / "What I know about you"** — living cards of facts, goals, people,
   themes. Strong memories glow; fading ones dim. Tap to edit, pin (protect from decay), or
   forget. *This makes the moat tangible and the switching cost felt.*
2. **Provenance chips** — every time Horizon uses a memory in chat, a small "why I know this"
   chip links back to the source moment.
3. **The Weekly Reflection** — an auto-generated digest from consolidated episodic memory:
   *"This week you felt most alive when… you kept circling back to… a pattern I'm noticing…"*
   High-value, low-friction retention hook that *shows off* consolidation.
4. **Decay you can see** — a gentle "these memories are fading, keep or release?" moment that
   turns forgetting into a feature the user controls.

---

## 6. Feature scope

### MVP (the only things that matter for launch)
- Conversational companion (text) with streaming responses.
- The memory pipeline end-to-end: sensory (Redis) → consolidation → episodic/semantic
  (Postgres) → **retrieval with provenance**.
- The **magic moment**: proactive, well-timed resurfacing.
- **"What I know about you"** view (visible memory, editable).
- **Weekly Reflection** digest.
- Auth + encryption + "your memory is yours" trust page
  (see [`authentication.md`](./authentication.md)).

### Post-MVP (only after the magic moment retains)
- Voice conversations (huge for a companion — talking feels like a relationship).
- Daily check-in ritual / mood tracking with trend charts over months.
- Goal tracking with memory-aware nudges.
- Photo/screenshot memories.
- Shareable (opt-in) reflection cards.

### Deliberately cut for now
Multi-model routing, image generation, URL scraping, document RAG. They're generic
table-stakes that dilute a focused companion. Horizon doesn't need five models — it needs to
**remember well**. Ruthless focus beats feature breadth for a consumer wedge.

---

## 7. Differentiation vs. the market

| | ChatGPT/Claude memory | Journaling apps (Rosebud, Day One) | Companion apps (Replika) | **Horizon** |
|---|---|---|---|---|
| Remembers across sessions | Shallow, generic | Stores, doesn't understand | Yes, but shallow | **Deep, structured, longitudinal** |
| Proactive resurfacing | ❌ | ❌ | Limited | **✅ core feature** |
| Consolidation & decay | ❌ | ❌ | ❌ | **✅ visible & controllable** |
| Provenance ("why I know this") | ❌ | n/a | ❌ | **✅** |
| Memory is user-owned/portable | ❌ locked in | Partial | ❌ | **✅ export/delete, encrypted** |
| Growth-oriented reflection | ❌ | Manual | Emotional, not growth | **✅ patterns → insight** |

**Positioning:** Horizon is not a smarter chatbot and not a prettier journal. It's the first
companion whose **memory is the feature** — and the only one that shows you memory *working*.

---

## 8. Retention & growth loop

```
   Talk to Horizon  ──▶  It consolidates & remembers
        ▲                          │
        │                          ▼
  Weekly reflection  ◀──  Proactive "I remembered…" moment
   (pulls you back)          (the aha; builds trust)
        │                          │
        └────────  Memory grows → switching cost grows  ◀────┘
```

Every day of use makes the memory richer, the reflections sharper, and leaving more painful.
**That compounding switching cost is the single durable moat a consumer AI app can have.**

## 9. Monetization

- **Freemium.** Free: limited memory horizon (e.g. last 2 weeks of deep memory), basic chat.
- **Horizon Plus (~$12–15/mo):** unlimited long-term memory, weekly reflections, voice,
  trends, priority model. Anchored against therapy/coaching prices, not against free chatbots.
- **Private Vault add-on:** zero-knowledge encryption tier for privacy-maximalists
  (see [`authentication.md`](./authentication.md) §6).
- Willingness to pay is real here because the value (self-understanding, continuity) maps to
  categories people already pay for.

## 10. Metrics that matter

- **North star:** weekly *reflective* active users (had a real conversation **and** engaged
  with a memory/reflection surface).
- **The magic-moment metric:** % of users who get a "wow, it remembered" moment in their
  first 3 days. If this isn't high, nothing else matters — fix it first.
- Memory-view engagement, weekly-reflection open rate, D7/D30 retention, free→paid conversion.
- **Memory quality benchmark** (also your investor story): does consolidation+decay beat a
  naive "store-everything + vector search" baseline on retrieval relevance? Build this early.

## 11. Roadmap

- **0–30 days:** multi-tenant + auth + encryption; nail the memory pipeline; ship the magic
  moment + "What I know about you" view. Get it into 20 real users' hands.
- **30–60 days:** Weekly Reflection; visible decay UX; retention instrumentation; the memory
  benchmark. Tune retrieval scoring until the magic moment is reliable.
- **60–90 days:** voice; mood/goal trends; freemium paywall; referral loop; first paid users.

## 12. Risks & honest mitigations

- **Retention is brutal for consumer AI.** → Obsess over the first-3-days magic moment before
  any breadth.
- **Space isn't empty** (Rosebud, Dot, Stoic, Replika). → Your wedge is *visible
  consolidation/decay + proactive growth reflection* — none do all three. Not winner-take-all;
  per-user emotional retention is defensible.
- **Trust/privacy is existential.** → Encryption + provenance + one-tap forget aren't
  features, they're the price of entry. Lead with them.
- **Creepy-valley risk.** → Provenance on every memory + user control over decay is the
  designed antidote. Never surface a memory Horizon can't explain.
- **LLM cost at scale.** → Consolidation *reduces* context size (that's the point); cheap
  models for extraction/summarization, premium model only for the conversation.

---

## 13. Name suggestions

You've been calling it **Horizon AI**, and it's genuinely strong — "horizon" evokes looking
forward, growth, and the long view, which fits a *long-horizon* memory companion perfectly.
I'd keep it as the front-runner. Alternatives, grouped by the feeling they evoke:

**Memory / continuity**
- **Horizon** *(recommended — keep it; ties to your long-horizon memory thesis)*
- **Ember** — a small flame kept alive; memory that's tended, warm, personal.
- **Throughline** — the thread that connects your scattered moments into a story.
- **Keep** — simple, warm; "the thing that keeps you."
- **Cairn** — the stacked stones that mark a path you've walked; quiet, grounded.

**Reflection / growth**
- **Mirora** — from "mirror"; it reflects you back. Ownable, brandable, .com-friendly-ish.
- **Reya** — soft, human, friendly companion name (like a person, not a tool).
- **Lumen** — light/insight; "seeing yourself clearly."
- **Grove** — pairs beautifully with the "Memory Garden" UI metaphor; growth over time.
- **Sage** — wise companion; short, warm, memorable (though somewhat used).

**My shortlist:** **Horizon** (keep it), with **Ember** and **Mirora** as the strongest
alternatives if you want something more emotional/companion-like and easier to trademark.
Check domain + trademark + app-store availability before committing.

---

**See also:** [`authentication.md`](./authentication.md) (how "your memory is yours" is
enforced) and [`database.md`](./database.md) (how the memory tiers, consolidation, and decay
are actually stored).
