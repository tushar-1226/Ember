"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFlowerConnections,
  getFlowerFeed,
  forceSyncFlower,
  connectFlowerService,
  getFlowerSettings,
  updateFlowerSettings,
  clearAmbientFeed,
  API_BASE,
  FlowerConnection,
  FlowerEvent,
} from "@/lib/api";

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

const PROVIDER_INFO: Record<string, { label: string, color: string, icon: React.ReactNode, action: string }> = {
  spotify: {
    label: "Spotify",
    color: "#1DB954",
    action: "Listening",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.573.398-.868.217-2.378-1.45-5.37-1.78-8.895-.975-.336.077-.666-.134-.743-.47-.077-.335.134-.665.47-.743 3.864-.882 7.16-.497 9.818 1.103.296.18.4.573.218.868zm1.31-2.923c-.226.37-.714.485-1.085.258-2.723-1.674-6.9-2.188-10.158-1.2-1.087.33-2.158-.293-2.487-1.38-.073-.243-.132-.51.137-.768.243-.242.493-.19.723-.118 3.754 1.138 8.423.57 11.613-1.385.37-.226.858-.112 1.084.257.227.37.113.858-.258 1.084l.43.653zm.126-3.05c-3.256-1.93-8.618-2.11-11.724-1.168-.454.137-.923-.117-1.06-.572-.138-.454.117-.924.573-1.06 3.633-1.102 9.544-.897 13.34 1.353.407.24.542.766.302 1.173-.24.406-.767.54-1.173.303h-.258z" />
      </svg>
    )
  },
  notion: {
    label: "Notion",
    color: "#fff",
    action: "Reading",
    icon: <span className="font-mono text-sm font-bold text-black">N</span>
  },
  github: {
    label: "GitHub",
    color: "#fff",
    action: "Coding",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    )
  },
  obsidian: {
    label: "Obsidian",
    color: "#7a3ff0",
    action: "Writing",
    icon: <span className="font-mono text-sm font-bold text-white">O</span>
  },
  slack: {
    label: "Slack",
    color: "#E01E5A",
    action: "Chatting",
    icon: <span className="font-mono text-sm font-bold text-white">S</span>
  },
  read: {
    label: "Read",
    color: "#facc15",
    action: "Learning",
    icon: <span className="font-mono text-sm font-bold text-black">R</span>
  }
};

function ConnectDropdown({ availableProviders, onConnect }: { availableProviders: string[], onConnect: (provider: string) => void }) {
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

  if (availableProviders.length === 0) return null;

  return (
    <div className="relative flex min-h-[140px]" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border-soft bg-transparent p-5 transition-colors hover:border-border hover:bg-surface/50"
      >
        <div className="text-center">
          <span className="grid h-8 w-8 mx-auto mb-2 place-items-center rounded-full bg-raised text-muted">+</span>
          <p className="text-sm font-medium text-muted">Connect App</p>
        </div>
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-0 z-50 w-full overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-2xl p-2"
          >
            <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Select App</p>
            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
              {availableProviders.map(provider => {
                const info = PROVIDER_INFO[provider.toLowerCase()] || { label: provider, icon: <span>?</span>, color: "#fff" };
                return (
                  <button
                    key={provider}
                    onClick={() => { onConnect(provider); setOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-raised"
                  >
                    <div 
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: info.color, color: info.color === "#fff" || info.color === "#facc15" ? "#000" : "#fff" }}
                    >
                      <div className="scale-75">{info.icon}</div>
                    </div>
                    <span className="font-medium text-foreground">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DELIVERY_LABEL_TO_VALUE: Record<string, string> = {
  "Desktop Notification": "desktop",
  "Email Summary": "email",
  "In-App Only": "in_app",
};
const DELIVERY_VALUE_TO_LABEL: Record<string, string> = {
  desktop: "Desktop Notification",
  email: "Email Summary",
  in_app: "In-App Only",
};

export default function FlowerDashboardPage() {
  const [deliveryMethod, setDeliveryMethod] = useState("Desktop Notification");
  const [dataRetention, setDataRetention] = useState("Keep forever");

  const [allowNotifications, setAllowNotifications] = useState(true);
  const [morningWindow, setMorningWindow] = useState(true);
  const [afternoonWindow, setAfternoonWindow] = useState(false);
  const [eveningWindow, setEveningWindow] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const [connections, setConnections] = useState<FlowerConnection[]>([]);
  const [feed, setFeed] = useState<FlowerEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; placeholder: string; resolve: (val: string | null) => void } | null>(null);

  const askForToken = (title: string, placeholder: string) => {
    return new Promise<string | null>((resolve) => {
      setPromptModal({ isOpen: true, title, placeholder, resolve });
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const [connData, feedData] = await Promise.all([
        getFlowerConnections(),
        getFlowerFeed()
      ]);
      setConnections(connData);
      setFeed(feedData);
    } catch (e) {
      console.error("Failed to load flower data", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    getFlowerSettings()
      .then((s) => {
        setAllowNotifications(s.allow_notifications);
        setMorningWindow(s.morning_window);
        setAfternoonWindow(s.afternoon_window);
        setEveningWindow(s.evening_window);
        setDeliveryMethod(DELIVERY_VALUE_TO_LABEL[s.delivery_method] || "Desktop Notification");
      })
      .catch((e) => console.error("Failed to load flower settings", e));
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncFlower();
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateFlowerSettings({
        allow_notifications: allowNotifications,
        morning_window: morningWindow,
        afternoon_window: afternoonWindow,
        evening_window: eveningWindow,
        delivery_method: DELIVERY_LABEL_TO_VALUE[deliveryMethod] || "desktop",
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2200);
    } catch (e) {
      console.error(e);
      window.alert("Couldn't save preferences. Please try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm("Clear all ambient event history? This cannot be undone.")) return;
    setClearingCache(true);
    try {
      await clearAmbientFeed();
      setFeed([]);
    } catch (e) {
      console.error(e);
      window.alert("Couldn't clear ambient cache. Please try again.");
    } finally {
      setClearingCache(false);
    }
  };

  const ALL_PROVIDERS = Object.keys(PROVIDER_INFO);
  const connectedProviders = connections.map(c => c.provider.toLowerCase());
  const availableProviders = ALL_PROVIDERS.filter(p => !connectedProviders.includes(p));

  const handleConnect = async (provider: string) => {
    if (provider.toLowerCase() === "spotify") {
      // Top-level navigation can't carry an Authorization header, so the
      // session token rides along as a query param instead.
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const token = (session as any)?.backendToken;
      if (!token) {
        console.error("No session token available for Spotify connect.");
        return;
      }
      window.location.href = `${API_BASE}/auth/spotify/login?token=${encodeURIComponent(token)}`;
      return;
    }
    
    let token: string | null | undefined = undefined;
    if (provider.toLowerCase() === "notion") {
      token = await askForToken("Notion Integration", "Enter your Internal Integration Token...");
      if (!token) return;
    } else if (provider.toLowerCase() === "obsidian") {
      token = await askForToken("Obsidian Vault", "Enter absolute path (e.g. /home/user/Documents/Vault)...");
      if (!token) return;
    }
    
    try {
      await connectFlowerService(provider, token);
      await fetchData(); // Refresh connections
    } catch (e) {
      console.error("Failed to connect", e);
    }
  };

  return (
    <>
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
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 ${isSyncing ? "animate-ping" : ""}`}></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                {isSyncing ? "Syncing..." : "Sync Active"}
              </span>
              <button 
                onClick={handleForceSync}
                disabled={isSyncing}
                className="rounded-full bg-raised px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border-soft disabled:opacity-50"
              >
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
                {connections.map((conn) => {
                  const info = PROVIDER_INFO[conn.provider.toLowerCase()] || { label: conn.provider, color: "#fff", action: "Active", icon: <span>?</span> };
                  return (
                    <div key={conn.provider} className="flex flex-col justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: info.color, color: info.color === "#fff" || info.color === "#facc15" ? "#000" : "#fff" }}
                        >
                          {info.icon}
                        </div>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${info.color}20`, color: info.color }}>
                          {info.action}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <div>
                          <p className="font-medium text-foreground">{info.label}</p>
                          <p className="text-xs text-muted">Last synced: {conn.last_synced ? new Date(conn.last_synced + 'Z').toLocaleTimeString() : 'Never'}</p>
                        </div>
                        {conn.provider.toLowerCase() === "notion" && (
                          <Link href="/flower/dashboard/notion" className="mt-2 text-center rounded bg-ember-gold/10 px-3 py-1.5 text-xs font-medium text-ember-gold transition-colors hover:bg-ember-gold/20">
                            View Dashboard &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Add New */}
                <ConnectDropdown 
                  availableProviders={availableProviders} 
                  onConnect={handleConnect} 
                />
              </div>
            </section>

            <div className="grid gap-12 xl:grid-cols-2">
              {/* Ambient Feed */}
              <section>
                <h2 className="mb-6 font-display text-xl font-medium text-foreground">Ambient Feed</h2>
                <div className="relative border-l border-border-soft pl-6">
                  {feed.length === 0 && <p className="text-sm text-muted">No recent events.</p>}
                  {feed.map((event) => {
                    const info = PROVIDER_INFO[event.provider.toLowerCase()] || { label: event.provider, color: "#fff" };
                    return (
                      <div key={event.id} className="relative mb-8 last:mb-0">
                        <div 
                          className="absolute -left-[29px] top-1 h-2 w-2 rounded-full" 
                          style={{ backgroundColor: info.color, boxShadow: `0 0 8px ${info.color}` }}
                        />
                        <p className="text-sm text-faint">
                          {event.timestamp ? new Date(event.timestamp + 'Z').toLocaleString() : "Just now"} · {info.label}
                        </p>
                        <p className="mt-1 font-medium text-foreground">{event.summary}</p>
                        <p className="mt-1 text-sm text-muted">Synced successfully.</p>
                      </div>
                    );
                  })}
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
                  <button
                    role="switch"
                    aria-checked={allowNotifications}
                    onClick={() => setAllowNotifications((v) => !v)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      allowNotifications ? "bg-foreground" : "bg-raised border border-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                        allowNotifications ? "left-[18px] bg-void" : "left-0.5 bg-muted"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted">Ember will reach out when it detects stress or a good moment for reflection.</p>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-foreground">Check-in Windows</label>
                <div className="flex flex-col gap-3">
                  {([
                    ["Morning (8am - 10am)", morningWindow, setMorningWindow],
                    ["Afternoon (12pm - 2pm)", afternoonWindow, setAfternoonWindow],
                    ["Evening (7pm - 9pm)", eveningWindow, setEveningWindow],
                  ] as const).map(([label, checked, setChecked]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setChecked(!checked)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                          checked ? "border-foreground bg-foreground text-void" : "border-border-soft bg-raised"
                        }`}
                      >
                        {checked && (
                          <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                      <span className={`text-sm ${checked ? "text-foreground" : "text-muted"}`}>{label}</span>
                    </button>
                  ))}
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

              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-void transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {savingPrefs ? "Saving…" : prefsSaved ? "Saved" : "Save Preferences"}
              </button>
            </div>

            {/* Privacy & Storage (New Panel) */}
            <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
              <h2 className="mb-6 font-display text-xl font-medium text-foreground">Privacy & Data</h2>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">Data Retention</label>
                <CustomSelect
                  options={["Keep forever", "Auto-delete after 30 days", "Auto-delete after 7 days"]}
                  value={dataRetention}
                  onChange={setDataRetention}
                />
              </div>

              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-70"
              >
                {clearingCache ? "Clearing…" : "Clear Ambient Cache"}
              </button>
            </div>

          </div>
          
        </div>
      </div>
    </main>

    {/* Custom Prompt Modal */}
      <AnimatePresence>
        {promptModal?.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border-soft bg-surface p-6 shadow-2xl"
            >
              <h3 className="mb-4 font-display text-lg font-medium text-foreground">{promptModal.title}</h3>
              <input 
                type="text" 
                autoFocus
                placeholder={promptModal.placeholder}
                className="mb-6 w-full rounded-lg border border-border-soft bg-raised px-4 py-3 text-sm text-foreground placeholder-muted transition-colors focus:border-ember-amber focus:outline-none focus:ring-1 focus:ring-ember-amber"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    promptModal.resolve(e.currentTarget.value);
                    setPromptModal(null);
                  } else if (e.key === 'Escape') {
                    promptModal.resolve(null);
                    setPromptModal(null);
                  }
                }}
                id="prompt-input"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => { promptModal.resolve(null); setPromptModal(null); }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-foreground"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const input = document.getElementById("prompt-input") as HTMLInputElement;
                    promptModal.resolve(input?.value || "");
                    setPromptModal(null);
                  }}
                  className="rounded-lg bg-ember-amber px-4 py-2 text-sm font-medium text-void transition-colors hover:bg-ember-amber/90"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
