"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/reveal";
import {
  getSemanticMemories,
  getMemoryStats,
  type SemanticMemory,
  type MemoryStats,
} from "@/lib/api";

function EmberDot({ strength }: { strength: number }) {
  // Monochrome: a plain white dot whose opacity (not colour or glow) conveys strength.
  return (
    <span
      aria-hidden
      className="relative grid h-4 w-4 place-items-center"
      style={{ opacity: 0.35 + strength * 0.65 }}
    >
      <span className="h-2 w-2 rounded-full bg-foreground" />
    </span>
  );
}

function formatSource(ts: string | null): string {
  if (!ts) return "unknown";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function GardenPage() {
  const [memories, setMemories] = useState<SemanticMemory[] | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([getSemanticMemories(), getMemoryStats().catch(() => null)])
      .then(([mems, st]) => {
        if (!alive) return;
        // brightest (highest confidence) first
        setMemories([...mems].sort((a, b) => (b.confidence ?? 1) - (a.confidence ?? 1)));
        setStats(st);
      })
      .catch(() => alive && setError("Couldn't reach Ember's memory. Is the backend running on :8080?"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pt-36 pb-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber">
          What I know about you
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          The garden
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Every memory is an ember. The ones you keep alive glow bright; the ones that
          stop mattering quietly fade.
        </p>
        {stats && (
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-muted">
            <span className="rounded-full border border-border-soft bg-surface px-3 py-1">
              {stats.semantic_count} facts
            </span>
            <span className="rounded-full border border-border-soft bg-surface px-3 py-1">
              {stats.procedural_count} workflows
            </span>
            {stats.avg_confidence != null && (
              <span className="rounded-full border border-border-soft bg-surface px-3 py-1">
                avg confidence {(stats.avg_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </Reveal>

      {error && (
        <div className="mt-16 rounded-2xl border border-ember-red/30 bg-surface p-6 text-sm text-muted">
          {error}
        </div>
      )}

      {!error && memories === null && (
        <p className="mt-16 font-mono text-sm text-faint">Gathering embers…</p>
      )}

      {!error && memories?.length === 0 && (
        <div className="mt-16 rounded-2xl border border-border-soft bg-surface p-8 text-muted">
          <p>No memories yet. Head to{" "}
            <a href="/reflect" className="text-ember-gold underline-offset-4 hover:underline">
              Reflect
            </a>{" "}
            and tell Ember something — it will start remembering what matters.
          </p>
        </div>
      )}

      {memories && memories.length > 0 && (
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((m, i) => {
            const strength = m.confidence ?? 1;
            return (
              <Reveal key={m.id} delay={i * 0.04}>
                <div
                  data-cursor="hot"
                  className="group relative overflow-hidden rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:border-border"
                  style={{ opacity: 0.55 + strength * 0.45 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-faint">
                      {m.category || m.entity || "Memory"}
                    </span>
                    <EmberDot strength={strength} />
                  </div>
                  <p className="mt-6 text-[15px] leading-relaxed text-foreground">{m.fact}</p>
                  <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-faint">
                    <span className="h-1 w-1 rounded-full bg-ember-amber/70" />
                    {m.entity ? `${m.entity} · ` : ""}remembered · {formatSource(m.timestamp)}
                  </div>
                  {strength < 0.3 && (
                    <span className="mt-4 inline-block rounded-full border border-border-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-faint">
                      fading
                    </span>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </main>
  );
}
