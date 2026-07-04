"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export default function MemoryDashboard() {
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = async () => {
    try {
      const res = await fetch("http://localhost:8080/memory/graph");
      const data = await res.json();
      setGraphData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFacts = async () => {
    try {
      const res = await fetch("http://localhost:8080/memory/facts");
      const data = await res.json();
      setFacts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteFact = async (id: string) => {
    try {
      await fetch(`http://localhost:8080/memory/facts/${id}`, { method: "DELETE" });
      fetchFacts();
      fetchGraph();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGraph(), fetchFacts()]).then(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-light mb-8">Ember Memory Core</h1>
        
        <div className="flex gap-4 mb-6 border-b border-neutral-800 pb-2">
          <button 
            className={`px-4 py-2 ${activeTab === 'graph' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph View
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'list' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}
            onClick={() => setActiveTab("list")}
          >
            List View
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96 text-neutral-500">Loading memories...</div>
        ) : activeTab === "graph" ? (
          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900 h-[600px]">
            <ForceGraph2D
              graphData={graphData}
              nodeAutoColorBy="group"
              nodeLabel="label"
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={d => d.value * 0.01}
            />
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Fact</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Strength</th>
                  <th className="px-6 py-4 font-medium">Last Accessed</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {facts.map((fact: any) => (
                  <tr key={fact.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 text-neutral-300">{fact.fact}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-800 text-amber-500/80 rounded text-xs">{fact.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-neutral-800 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(fact.strength * 100, 100)}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs">
                      {new Date(fact.last_accessed).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => deleteFact(fact.id)}
                        className="text-red-400/70 hover:text-red-400 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
