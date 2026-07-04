# Horizon AI — Data & Database Architecture

> **Context:** Horizon AI is a personal-reflection companion. Its entire value is that it
> *remembers your life and reflects it back*. That means the database is not a supporting
> component — **the database *is* the product**. The quality of memory retrieval, decay,
> and consolidation is what makes the app feel magical instead of forgetful or creepy.
> This document explains what we store, where, and why.

---

## 1. The memory model drives the schema

Horizon AI models human memory as tiers. Each tier has different access patterns, and we
pick the store that fits each one — this is the core reason we run **more than one datastore**.

| Memory tier | What it holds | Store | Why |
|---|---|---|---|
| **Sensory** | Raw last-N turns of the current session | **Redis** | Ephemeral, hot, high-write, TTL'd. Never needs durability. |
| **Working / session** | Active conversation state for the agent graph | **Postgres** (LangGraph checkpointer) | Durable, resumable across devices. |
| **Episodic** | Consolidated summaries of past sessions ("what happened, how you felt") | **Postgres** + vector | Long-lived, searchable by similarity and time. |
| **Semantic** | Extracted facts, preferences, people, goals (with confidence) | **Postgres** + vector | Structured, queryable, decays over time. |
| **Procedural** | Learned routines the user wants Horizon to follow | **Postgres** | Structured, rarely changes, toggleable. |

**The key insight:** the tiers aren't just storage — they're a *pipeline*. Sensory buffers
(Redis) get **consolidated** into episodic summaries (Postgres) by a background job, and
semantic facts **decay** in confidence over time and get pruned. That lifecycle is the
differentiated tech, and the schema is built to make it observable (see §6).

---

## 2. Why Postgres + pgvector as the primary store

We deliberately use **one relational database with a vector extension** rather than bolting
on a dedicated vector DB (Pinecone / Weaviate / Qdrant).

**Why Postgres over a dedicated vector DB:**
1. **Single source of truth + transactions.** A memory is a *fact row* **and** an
   *embedding row*. With Postgres they're written in one transaction — no dual-write drift
   where the vector store and the metadata store disagree.
2. **Hybrid queries.** Reflection needs "facts about *this* user, of type *goal*, similar to
   *this* topic, above confidence *0.4*, from the last *90 days*." That's a `WHERE` +
   vector-distance + time filter in a single SQL query. Dedicated vector DBs make metadata
   filtering awkward; Postgres makes it trivial.
3. **The consolidation/decay jobs are relational.** Aggregating sensory buffers, decrementing
   confidence, pruning — these are set-based SQL operations, not vector operations.
4. **Operational simplicity.** One database to back up, secure (RLS + encryption), and scale.
   For a startup, fewer moving parts = faster and safer.
5. **pgvector is enough at our scale.** With HNSW indexing, pgvector serves millions of
   vectors with low latency — far beyond what a single consumer needs, and we shard by user
   long before it's a problem.

> We revisit a dedicated vector DB **only** if per-user vector counts explode (unlikely for
> personal memory) — the abstraction in `agent/memory.py` keeps that door open.

**Why Redis alongside it:**
- **Sensory buffer** (`sensory:{user_id}:{session_id}`) — a capped list of recent turns,
  the raw material for consolidation.
- **Caching** — hot user profile, recent retrievals, JWKS.
- **Rate limiting & magic-link tokens** — short-TTL counters and one-time codes.
- **Ephemeral by design:** nothing in Redis is a source of truth; losing it costs at most
  the current session's un-consolidated buffer.

---

## 3. Multi-tenant schema (the big change from the prototype)

The current prototype is implicitly single-user. For a real product, **every memory row
must carry `user_id`** and be protected by Row-Level Security (see [`authentication.md`](./authentication.md) §5).

```
users
  id (uuid, pk)            email (unique, encrypted)     dek_ciphertext (bytea)
  created_at               tz / locale                   plan

chat_sessions
  id (uuid, pk)            user_id (fk)                  title
  created_at               updated_at                    archived (bool)

chat_messages
  id (uuid, pk)            user_id (fk)  session_id (fk)  role
  content (encrypted)      created_at                     token_count

semantic_facts                          -- SEMANTIC memory
  id (uuid, pk)            user_id (fk)  entity            category
  fact (encrypted)         confidence (float)             source_session_id
  created_at               last_seen_at  last_reinforced_at  decay_state

procedural_workflows                    -- PROCEDURAL memory
  id (uuid, pk)            user_id (fk)  name              description
  steps (jsonb)            enabled (bool) confidence        created_at

episodic_snapshots                      -- EPISODIC memory (new)
  id (uuid, pk)            user_id (fk)  session_id
  summary (encrypted)      mood (text)   themes (text[])   period_start / period_end
  created_at               salience (float)

memory_embeddings                       -- vector index for retrieval
  id (uuid, pk)            user_id (fk)  memory_type        memory_id (fk)
  content (text, transient) embedding (vector(1024))       created_at

uploaded_files / document_chunks        -- optional RAG (deprioritized for MVP)
  ...                      user_id (fk)  embedding (vector(1024))

token_usage / audit_log                 -- ops & compliance
  ...                      user_id (fk)
```

Notes:
- `embedding` is `vector(1024)` to match the NVIDIA `nv-embedqa-e5-v5` model already in use.
- Encrypted columns store AES-256-GCM ciphertext; plaintext exists only in memory during a
  request (see [`authentication.md`](./authentication.md) §6).
- `decay_state` / `last_reinforced_at` are what power the "self-curating memory" UX.

---

## 4. Vector indexing & retrieval

- **Index:** HNSW on `memory_embeddings.embedding` using cosine distance
  (`vector_cosine_ops`). HNSW gives high recall with low query latency and handles frequent
  inserts better than IVFFlat for our write pattern.
- **Retrieval query shape** (per turn, scoped to the user):
  ```sql
  SELECT sf.fact, sf.confidence, sf.entity,
         1 - (me.embedding <=> :query_vec) AS similarity
  FROM   memory_embeddings me
  JOIN   semantic_facts sf ON sf.id = me.memory_id
  WHERE  me.user_id = current_setting('app.user_id')::uuid
    AND  me.memory_type = 'semantic'
    AND  sf.confidence  > 0.35
  ORDER  BY me.embedding <=> :query_vec
  LIMIT  8;
  ```
- **Scoring blends three signals** so retrieval feels *relevant*, not just *similar*:
  `score = w1·similarity + w2·confidence + w3·recency`. Tuning these weights is what makes
  the "it remembered the *right* thing" moment land.

---

## 5. Data lifecycle — consolidation & decay (the differentiator)

This is the part competitors skip. The database is designed around a *lifecycle*, not just
storage.

**Consolidation (sensory → episodic), runs on a schedule / session-end:**
1. Read `sensory:{user}:{session}` from Redis.
2. Summarize into an `episodic_snapshots` row (summary + mood + themes + salience).
3. Extract new/updated `semantic_facts` and reinforce existing ones
   (`last_reinforced_at = now`, bump confidence).
4. Clear the Redis buffer.

**Decay (forgetting well), runs daily:**
1. Reduce `confidence` for facts not reinforced recently (exponential decay by age since
   `last_reinforced_at`).
2. Prune facts below a floor (e.g. `confidence < 0.15`) unless pinned by the user.
3. Boost salience of episodic snapshots that keep getting referenced.

This is why Horizon feels alive: it **strengthens what matters and lets go of noise**,
exactly like human memory — and because it's all in Postgres, each step is an auditable,
tunable SQL job.

---

## 6. Making memory *visible* (schema supports the UX)

The product promise is "magical, not creepy." That requires showing users what Horizon
knows and *why it surfaced it*. The schema enables that directly:

- `source_session_id` → "I remember this because you said it on May 3rd."
- `confidence` + `decay_state` → a "fading" vs "strong" memory indicator in the UI.
- `last_reinforced_at` → "you've mentioned this 4 times."
- `salience` on episodic snapshots → what shows up in the weekly reflection.

Every retrieved memory carries provenance, so the UI can always answer *"why do you know
that?"* — the antidote to creepiness.

---

## 7. Scaling, backup, and privacy operations

- **Scaling:** partition/shard by `user_id`; a single user's memory is tiny, and users are
  independent, so horizontal scaling is embarrassingly parallel. Read replicas for
  retrieval; primary for writes.
- **Connection pooling:** `psycopg` async pool (already in place) + PgBouncer in production.
- **Backups:** PITR (point-in-time recovery) on Postgres; Redis is disposable, no backup needed.
- **GDPR/CCPA:** hard-delete cascades on `user_id`; crypto-shred the user's DEK so backup
  ciphertext is unrecoverable. Export endpoint reads all `user_id` rows into a portable JSON.
- **No PII in logs:** memory content is never logged; only IDs, counts, and latencies.

---

## 8. Migration path from the current prototype

1. Add `user_id` (uuid, FK) to every existing table; backfill the demo data under one user.
2. Enable RLS + policies (see [`authentication.md`](./authentication.md)).
3. Add `episodic_snapshots`, `last_reinforced_at`, `decay_state`, `salience` columns.
4. Switch the HNSW index on; add the blended retrieval scoring.
5. Introduce Alembic migrations (the prototype uses `create_all`; a real product needs
   versioned migrations).
6. Encrypt sensitive columns behind the KMS/DEK layer.

---

**See also:** [`authentication.md`](./authentication.md) for RLS + encryption, and
[`product-plan.md`](./product-plan.md) for how consolidation/decay become the visible,
magical core of the experience.
