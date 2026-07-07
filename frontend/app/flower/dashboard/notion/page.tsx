"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getNotionDashboardData, NotionDashboardData } from "@/lib/api";

export default function NotionDashboardPage() {
  const [data, setData] = useState<NotionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getNotionDashboardData();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load Notion data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className="relative min-h-screen pb-32 pt-24 px-6 md:px-12 lg:px-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ember-gold border-t-transparent" />
          <p className="text-sm text-muted">Syncing with Notion workspace...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative min-h-screen pb-32 pt-24 px-6 md:px-12 lg:px-16">
        <Link href="/flower/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-faint transition-colors hover:text-foreground">
          &larr; Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-lg mx-auto mt-20">
          <h2 className="text-lg font-medium text-red-500 mb-2">Notion Connection Error</h2>
          <p className="text-sm text-muted mb-6">{error || "Could not retrieve data."}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-raised rounded-lg text-sm text-foreground hover:bg-surface">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const hasContent = data.databases.length > 0 || data.recent_pages.length > 0;

  return (
    <main className="relative min-h-screen pb-32 pt-24">
      {/* Header */}
      <section className="px-6 py-8 md:px-12 lg:px-16 w-full border-b border-border-soft bg-surface/30">
        <div className="w-full">
          <Link href="/flower/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-faint transition-colors hover:text-foreground">
            &larr; Back to Main Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-black font-serif font-bold text-lg">
                  N
                </div>
                <h1 className="font-display text-3xl font-semibold text-foreground">Notion Workspace</h1>
              </div>
              <p className="text-muted">Live extraction from your connected pages and databases.</p>
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-raised rounded-lg text-sm font-medium text-foreground hover:bg-surface transition-colors flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path d="M2 12A10 10 0 1112 22a10 10 0 01-10-10zM12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="w-full px-6 md:px-12 lg:px-16 mt-12">
        {!hasContent ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto"
          >
            <div className="h-16 w-16 bg-raised rounded-full flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24" className="text-muted">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-foreground mb-4">No Shared Pages Found</h2>
            <p className="text-muted mb-8">
              Your Notion integration is connected, but Ember doesn't have access to any pages yet. 
              Because Notion is privacy-first, you must explicitly grant access to pages you want to track.
            </p>
            <div className="bg-surface border border-border-soft rounded-xl p-6 text-left w-full">
              <h3 className="font-medium text-foreground mb-4">How to share a page:</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm text-faint">
                <li>Open your Notion workspace in a browser or app.</li>
                <li>Go to the page or database you want to connect.</li>
                <li>Click the three dots <strong>(...)</strong> in the top right corner.</li>
                <li>Scroll down and click <strong>Add connections</strong>.</li>
                <li>Search for and select your integration.</li>
              </ol>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            
            {/* Databases Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <h2 className="font-display text-xl font-medium text-foreground">Accessible Databases</h2>
              {data.databases.length === 0 ? (
                <p className="text-sm text-faint italic">No databases found.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.databases.map((db, i) => (
                    <motion.a 
                      key={db.id}
                      href={db.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group block rounded-xl border border-border-soft bg-surface p-5 transition-all hover:-translate-y-1 hover:border-ember-gold/50 hover:shadow-lg hover:shadow-ember-gold/5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-raised text-muted">
                          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-ember-gold opacity-0 transition-opacity group-hover:opacity-100">
                          Open &rarr;
                        </span>
                      </div>
                      <h3 className="font-medium text-foreground">{db.title || "Untitled Database"}</h3>
                      <p className="mt-1 text-xs text-faint">
                        Last edited: {db.last_edited ? new Date(db.last_edited).toLocaleDateString() : "Unknown"}
                      </p>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Pages List */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <h2 className="font-display text-xl font-medium text-foreground">Recent Pages</h2>
              {data.recent_pages.length === 0 ? (
                <p className="text-sm text-faint italic">No pages found.</p>
              ) : (
                <div className="flex flex-col rounded-xl border border-border-soft bg-surface">
                  {data.recent_pages.map((page, i) => (
                    <a
                      key={page.id}
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border-b border-border-soft p-4 last:border-0 transition-colors hover:bg-raised"
                    >
                      <h3 className="font-medium text-foreground transition-colors group-hover:text-ember-gold">
                        {page.title || "Untitled Page"}
                      </h3>
                      <p className="mt-1 text-xs text-muted">
                        Edited {page.last_edited ? new Date(page.last_edited).toLocaleString() : "Unknown"}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
