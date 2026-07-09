"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Reveal } from "@/components/reveal";
import { getMemoryGraph, getMemoryFacts, deleteMemoryFact } from "../../lib/api";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphData = { nodes: any[]; links: any[] };

export default function MemoryDashboard() {
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = () => getMemoryGraph().then(setGraphData);
  const fetchFacts = () => getMemoryFacts().then(setFacts);

  const deleteFact = async (id: string) => {
    try {
      await deleteMemoryFact(id);
      await Promise.all([fetchFacts(), fetchGraph()]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchGraph(), fetchFacts()])
      .catch(() => alive && setError("Couldn't reach Ember's memory. Is the backend running on :8080?"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pt-36 pb-32">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember-amber">
          Memory core
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          What Ember remembers
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Every fact Ember has kept, as a graph of connections or a plain list you can prune.
        </p>
      </Reveal>

      <div className="mt-10 flex gap-2 border-b border-border-soft">
        {(["graph", "list"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
              activeTab === tab
                ? "border-ember-amber text-foreground"
                : "border-transparent text-faint hover:text-muted"
            }`}
          >
            {tab === "graph" ? "Graph view" : "List view"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-ember-red/30 bg-surface p-6 text-sm text-muted">
          {error}
        </div>
      )}

      {!error && loading && (
        <p className="mt-16 font-mono text-sm text-faint">Gathering embers…</p>
      )}

      {!error && !loading && activeTab === "graph" && (
        (graphData?.nodes.length ?? 0) === 0 ? (
          <div className="mt-8 rounded-2xl border border-border-soft bg-surface p-8 text-muted">
            No memories yet. Head to{" "}
            <a href="/reflect" className="text-ember-gold underline-offset-4 hover:underline">
              Reflect
            </a>{" "}
            and tell Ember something — it will start remembering what matters.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border-soft bg-surface h-[600px]">
            <ForceGraph2D
              graphData={graphData as GraphData}
              backgroundColor="transparent"
              nodeAutoColorBy="group"
              nodeLabel="label"
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={(d: any) => d.value * 0.01}
            />
          </div>
        )
      )}

      {!error && !loading && activeTab === "list" && (
        facts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border-soft bg-surface p-8 text-muted">
            No memories yet. Head to{" "}
            <a href="/reflect" className="text-ember-gold underline-offset-4 hover:underline">
              Reflect
            </a>{" "}
            and tell Ember something — it will start remembering what matters.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border-soft bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-raised text-faint">
                  <tr>
                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest font-medium">Fact</th>
                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest font-medium">Category</th>
                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest font-medium">Strength</th>
                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest font-medium">Last accessed</th>
                    <th className="px-6 py-4 font-mono text-[11px] uppercase tracking-widest font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {facts.map((fact: any) => (
                    <tr key={fact.id} className="transition-colors hover:bg-raised/60">
                      <td className="px-6 py-4 text-foreground">{fact.fact}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-border-soft px-2 py-1 font-mono text-[11px] text-muted">
                          {fact.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raised">
                          <div
                            className="h-1.5 rounded-full bg-ember-amber"
                            style={{ width: `${Math.min((fact.strength ?? 1) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-faint">
                        {fact.last_accessed ? new Date(fact.last_accessed).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteFact(fact.id)}
                          className="font-mono text-[11px] uppercase tracking-widest text-faint transition-colors hover:text-foreground"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </main>
  );
}
