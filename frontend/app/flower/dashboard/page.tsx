"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function CustomSelect({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-border-soft bg-raised px-3 py-2.5 text-sm text-foreground transition-colors hover:border-border focus:border-foreground focus:outline-none"
      >
        {value}
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border border-border-soft bg-surface shadow-2xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-raised ${value === opt ? "bg-raised font-medium text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FlowerDashboardPage() {
  const [deliveryMethod, setDeliveryMethod] = useState("Desktop Notification");
  const [dataRetention, setDataRetention] = useState("Keep forever");

  return (
    <main className="relative min-h-screen pb-32 pt-24">
      {/* Header - Full Width */}
      <section className="px-6 py-8 md:px-12 lg:px-16 w-full border-b border-border-soft bg-surface/30">
        <div className="w-full">
          <Link href="/flower" className="mb-6 inline-flex items-center gap-2 text-sm text-faint transition-colors hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Flower
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Flower Dashboard
              </h1>
              <p className="mt-2 text-muted">Manage your ambient connections, privacy, and proactive settings.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-faint">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Syncing Active
              </span>
              <button className="rounded-full bg-raised px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border-soft">
                Force Sync
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full px-6 md:px-12 lg:px-16 mt-12">
        {/* Main Grid - Full Width 12 Columns */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Left Column: Active Connections & Feed (Spans 8 cols) */}
          <div className="flex flex-col gap-12 lg:col-span-8">
            
            {/* Connections */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-medium text-foreground">Active Connections</h2>
                <Link href="#" className="text-sm font-medium text-muted hover:text-foreground">Browse all apps &rarr;</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {/* Spotify */}
                <div className="flex flex-col justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/10 text-[#1DB954]">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.573.398-.868.217-2.378-1.45-5.37-1.78-8.895-.975-.336.077-.666-.134-.743-.47-.077-.335.134-.665.47-.743 3.864-.882 7.16-.497 9.818 1.103.296.18.4.573.218.868zm1.31-2.923c-.226.37-.714.485-1.085.258-2.723-1.674-6.9-2.188-10.158-1.2-1.087.33-2.158-.293-2.487-1.38-.073-.243-.132-.51.137-.768.243-.242.493-.19.723-.118 3.754 1.138 8.423.57 11.613-1.385.37-.226.858-.112 1.084.257.227.37.113.858-.258 1.084l.43.653zm.126-3.05c-3.256-1.93-8.618-2.11-11.724-1.168-.454.137-.923-.117-1.06-.572-.138-.454.117-.924.573-1.06 3.633-1.102 9.544-.897 13.34 1.353.407.24.542.766.302 1.173-.24.406-.767.54-1.173.303h-.258z" />
                      </svg>
                    </div>
                    <span className="rounded-full bg-[#1DB954]/10 px-2.5 py-0.5 text-xs font-medium text-[#1DB954]">Listening</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium text-foreground">Spotify</p>
                    <p className="text-xs text-muted">Last synced: 2m ago</p>
                  </div>
                </div>
                
                {/* Notion */}
                <div className="flex flex-col justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-void">
                      <span className="font-mono text-sm font-bold">N</span>
                    </div>
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Reading</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium text-foreground">Notion</p>
                    <p className="text-xs text-muted">Last synced: 1h ago</p>
                  </div>
                </div>

                {/* GitHub (New) */}
                <div className="flex flex-col justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border-soft text-foreground">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    </div>
                    <span className="rounded-full bg-border-soft px-2.5 py-0.5 text-xs font-medium text-foreground">Paused</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium text-foreground">GitHub</p>
                    <p className="text-xs text-muted">Sync paused (auth needed)</p>
                  </div>
                </div>
                
                {/* Add New */}
                <div className="flex min-h-[140px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border-soft bg-transparent p-5 transition-colors hover:border-border hover:bg-surface/50">
                  <div className="text-center">
                    <span className="grid h-8 w-8 mx-auto mb-2 place-items-center rounded-full bg-raised text-muted">+</span>
                    <p className="text-sm font-medium text-muted">Connect App</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-12 xl:grid-cols-2">
              {/* Ambient Feed */}
              <section>
                <h2 className="mb-6 font-display text-xl font-medium text-foreground">Ambient Feed</h2>
                <div className="relative border-l border-border-soft pl-6">
                  
                  <div className="relative mb-8 last:mb-0">
                    <div className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-[#1DB954] shadow-[0_0_8px_#1DB954]" />
                    <p className="text-sm text-faint">Just now · Spotify</p>
                    <p className="mt-1 font-medium text-foreground">Listened to &quot;Weightless&quot; by Marconi Union</p>
                    <p className="mt-1 text-sm text-muted">Ember noted a pattern of deep focus ambient music.</p>
                  </div>
                  
                  <div className="relative mb-8 last:mb-0">
                    <div className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-foreground" />
                    <p className="text-sm text-faint">2 hours ago · Notion</p>
                    <p className="mt-1 font-medium text-foreground">Updated &quot;Q3 Goals &amp; OKRs&quot;</p>
                    <p className="mt-1 text-sm text-muted">Added 3 new action items regarding the upcoming launch.</p>
                  </div>
                  
                  <div className="relative mb-8 last:mb-0">
                    <div className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-ember-gold" />
                    <p className="text-sm text-faint">Yesterday · Ember</p>
                    <p className="mt-1 font-medium text-foreground">Proactive Check-in</p>
                    <p className="mt-1 text-sm text-muted">Ember asked how you felt about your deadlines; you mentioned feeling slightly overwhelmed.</p>
                  </div>

                </div>
              </section>

              {/* Ambient Insights (New Panel) */}
              <section>
                <h2 className="mb-6 font-display text-xl font-medium text-foreground">Ambient Insights</h2>
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border-soft bg-surface p-4">
                    <div className="mb-2 flex items-center gap-2 text-ember-gold">
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-wider">Pattern Detected</span>
                    </div>
                    <p className="text-sm text-foreground">You consistently listen to Lo-Fi playlists when working on Notion documents tagged as "Strategy".</p>
                  </div>
                  
                  <div className="rounded-xl border border-border-soft bg-surface p-4">
                    <div className="mb-2 flex items-center gap-2 text-accent">
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-semibold uppercase tracking-wider">Health Context</span>
                    </div>
                    <p className="text-sm text-foreground">Apple Health sync indicates low sleep quality last night. Ember has suppressed morning task reminders.</p>
                  </div>
                </div>
              </section>
            </div>

          </div>

          {/* Right Column: Settings & Privacy (Spans 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Proactive Settings */}
            <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h2 className="mb-6 font-display text-xl font-medium text-foreground">Proactive Settings</h2>
              
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Allow Proactive Notifications</label>
                  <div className="relative h-5 w-9 cursor-pointer rounded-full bg-emerald-500">
                    <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-void shadow-sm" />
                  </div>
                </div>
                <p className="text-xs text-muted">Ember will reach out when it detects stress or a good moment for reflection.</p>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-foreground">Check-in Windows</label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="grid h-5 w-5 place-items-center rounded border border-emerald-500 bg-emerald-500 text-void">
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-sm text-foreground">Morning (8am - 10am)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="h-5 w-5 rounded border border-border-soft bg-raised"></div>
                    <span className="text-sm text-muted">Afternoon (12pm - 2pm)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="grid h-5 w-5 place-items-center rounded border border-emerald-500 bg-emerald-500 text-void">
                      <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-sm text-foreground">Evening (7pm - 9pm)</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">Delivery Method</label>
                <CustomSelect 
                  options={["Desktop Notification", "Email Summary", "In-App Only"]}
                  value={deliveryMethod}
                  onChange={setDeliveryMethod}
                />
              </div>

              <button className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-void transition-transform hover:scale-[1.02]">
                Save Preferences
              </button>
            </div>

            {/* Privacy & Storage (New Panel) */}
            <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h2 className="mb-6 font-display text-xl font-medium text-foreground">Privacy & Data</h2>
              
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Local Storage Only</label>
                  <div className="relative h-5 w-9 cursor-pointer rounded-full bg-emerald-500">
                    <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-void shadow-sm" />
                  </div>
                </div>
                <p className="text-xs text-muted">Ambient events are stored locally and never leave your machine.</p>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">Data Retention</label>
                <CustomSelect 
                  options={["Keep forever", "Auto-delete after 30 days", "Auto-delete after 7 days"]}
                  value={dataRetention}
                  onChange={setDataRetention}
                />
              </div>

              <button className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20">
                Clear Ambient Cache
              </button>
            </div>

          </div>
          
        </div>
      </div>
    </main>
  );
}
