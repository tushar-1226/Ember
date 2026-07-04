"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  getModels,
  getTokenStats,
  getUserProfile,
  type ModelInfo,
  type TokenStat,
  type UserProfile,
} from "@/lib/api";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  loadPreferences,
  loadProfile,
  savePreferences,
  saveProfile,
  type Preferences,
  type ProfileForm,
} from "@/lib/preferences";

/** Compact human token count: 1234 -> "1.2K", 1_830_000 -> "1.83M". */
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

/* --------------------------------------------------------------------------
 * Ember — Settings
 * A Claude-style two-pane settings surface in Ember's monochrome system.
 * Left: searchable section nav. Right: the active section.
 * Fully responsive — split panes on desktop, drill-down on mobile.
 *
 * Data here is scaffolding (placeholders / mock) — wire each section to the
 * backend as those features land.
 * ------------------------------------------------------------------------ */

type IconProps = { className?: string };
const Icon = {
  general: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 6 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H2.9a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-2.9l-.1-.1A2 2 0 1 1 7.3 5.2l.1.1A1.7 1.7 0 0 0 9 5.6V5.5a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 6.6l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 18.4 12v.1c0 .7.4 1.3 1 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  account: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  privacy: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  billing: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  usage: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  capabilities: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  connectors: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <path d="M9 7V4M15 7V4M7 7h10v4a5 5 0 0 1-10 0zM12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  back: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={p.className}>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  monitor: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  sun: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  moon: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <path d="M20 14a8 8 0 1 1-10-10 6.5 6.5 0 0 0 10 10z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
};

type SectionKey =
  | "general"
  | "account"
  | "privacy"
  | "billing"
  | "usage"
  | "capabilities"
  | "connectors";

const NAV: { key: SectionKey; label: string; Icon: (p: IconProps) => ReactNode }[] = [
  { key: "general", label: "General", Icon: Icon.general },
  { key: "account", label: "Account", Icon: Icon.account },
  { key: "privacy", label: "Privacy", Icon: Icon.privacy },
  { key: "billing", label: "Billing", Icon: Icon.billing },
  { key: "usage", label: "Usage", Icon: Icon.usage },
  { key: "capabilities", label: "Capabilities", Icon: Icon.capabilities },
  { key: "connectors", label: "Connectors", Icon: Icon.connectors },
];

/* --- Shared primitives ---------------------------------------------------- */

function SectionTitle({ children, badge }: { children: ReactNode; badge?: string }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{children}</h2>
      {badge && (
        <span className="rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
          {badge}
        </span>
      )}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
  stacked,
}: {
  label: string;
  hint?: ReactNode;
  children?: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className="border-b border-border-soft py-5 last:border-b-0">
      <div className={stacked ? "space-y-3" : "flex items-center justify-between gap-4"}>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {hint && <p className="mt-1 text-[13px] leading-relaxed text-muted">{hint}</p>}
        </div>
        {children && <div className={stacked ? "" : "shrink-0"}>{children}</div>}
      </div>
    </div>
  );
}

function Field({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-w-0 rounded-lg border border-border-soft bg-raised px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-border sm:w-64"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-border-soft bg-raised py-2 pl-3 pr-9 text-sm text-foreground outline-none transition-colors hover:border-border focus:border-border"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        width="14"
        height="14"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Toggle({
  defaultOn = false,
  checked,
  onChange,
}: {
  defaultOn?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [internal, setInternal] = useState(defaultOn);
  const on = checked ?? internal;
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => {
        const next = !on;
        if (checked === undefined) setInternal(next);
        onChange?.(next);
      }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-foreground" : "bg-raised border border-border"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
          on ? "left-[22px] bg-void" : "left-1 bg-muted"
        }`}
      />
    </button>
  );
}

function Meter({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
      <div className="h-full rounded-full bg-foreground" style={{ width: `${clamped}%` }} />
    </div>
  );
}

function UsageLine({
  label,
  hint,
  pct,
  used,
}: {
  label: string;
  hint?: string;
  pct: number;
  used: string;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 py-4 sm:grid-cols-[minmax(0,180px)_1fr_auto] sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
      </div>
      <Meter pct={pct} />
      <span className="text-right text-[13px] tabular-nums text-muted">{used}</span>
    </div>
  );
}

function DangerButton({ children }: { children: ReactNode }) {
  return (
    <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-muted hover:bg-raised">
      {children}
    </button>
  );
}

/* --- Sections ------------------------------------------------------------- */

const WORK_OPTIONS = [
  "Engineering",
  "Design",
  "Product",
  "Research",
  "Writing",
  "Student",
  "Founder",
  "Other",
].map((w) => ({ value: w, label: w }));

const APPEARANCE_OPTIONS: { k: Preferences["appearance"]; el: ReactNode; title: string }[] = [
  { k: "system", el: <Icon.monitor />, title: "Match system" },
  { k: "light", el: <Icon.sun />, title: "Light" },
  { k: "dark", el: <Icon.moon />, title: "Dark" },
];

function GeneralSection() {
  const [profile, setProfile] = useState<ProfileForm>(DEFAULT_PROFILE);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [dirty, setDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [inferred, setInferred] = useState<UserProfile | null>(null);

  // Load persisted values on mount, plus Ember's inferred profile from the API.
  useEffect(() => {
    setProfile(loadProfile());
    setPrefs(loadPreferences());
    getUserProfile()
      .then(setInferred)
      .catch(() => setInferred(null));
  }, []);

  const editProfile = (patch: Partial<ProfileForm>) => {
    setProfile((p) => ({ ...p, ...patch }));
    setDirty(true);
    setJustSaved(false);
  };

  const commitProfile = () => {
    saveProfile(profile);
    setDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  // Preferences apply immediately (theme/font/motion take effect app-wide).
  const setPref = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(next);
  };

  const initial = (profile.fullName || profile.callYou || "?").trim().charAt(0).toUpperCase();

  return (
    <div>
      <SectionTitle>Profile</SectionTitle>
      <Row label="Avatar" hint="Shown on your reflections.">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-border bg-raised text-sm font-semibold text-foreground">
          {initial}
        </span>
      </Row>
      <Row label="Full name">
        <Field value={profile.fullName} onChange={(v) => editProfile({ fullName: v })} placeholder="Your name" />
      </Row>
      <Row label="What should Ember call you?">
        <Field value={profile.callYou} onChange={(v) => editProfile({ callYou: v })} placeholder="A nickname" />
      </Row>
      <Row label="What best describes your work?">
        <Select value={profile.work} onChange={(v) => editProfile({ work: v })} options={WORK_OPTIONS} />
      </Row>
      <Row
        label="Instructions for Ember"
        hint="Ember keeps these in mind across every reflection."
        stacked
      >
        <textarea
          value={profile.instructions}
          onChange={(e) => editProfile({ instructions: e.target.value })}
          placeholder="e.g. keep reflections short and gentle"
          rows={3}
          className="w-full resize-none rounded-lg border border-border-soft bg-raised px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-border"
        />
      </Row>

      {/* Save affordance — only when there are unsaved edits */}
      <div className="flex items-center justify-end gap-3 py-4">
        {justSaved && <span className="text-[13px] text-muted">Saved.</span>}
        <button
          onClick={commitProfile}
          disabled={!dirty}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            dirty
              ? "bg-foreground text-void hover:scale-[1.03]"
              : "cursor-not-allowed border border-border-soft text-faint"
          }`}
        >
          Save changes
        </button>
      </div>

      <div className="h-6" />
      <SectionTitle>Preferences</SectionTitle>
      <Row label="Appearance" hint="Light, dark, or follow your system.">
        <div className="flex items-center gap-1 rounded-lg border border-border-soft bg-raised p-1">
          {APPEARANCE_OPTIONS.map((o) => {
            const active = prefs.appearance === o.k;
            return (
              <button
                key={o.k}
                title={o.title}
                aria-pressed={active}
                onClick={() => setPref({ appearance: o.k })}
                className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
                  active ? "bg-foreground text-void" : "text-muted hover:text-foreground"
                }`}
              >
                {o.el}
              </button>
            );
          })}
        </div>
      </Row>
      <Row label="Interface font" hint="Applies across Ember.">
        <Select
          value={prefs.font}
          onChange={(v) => setPref({ font: v as Preferences["font"] })}
          options={[
            { value: "sans", label: "Ember Sans" },
            { value: "system", label: "System" },
            { value: "mono", label: "Mono" },
          ]}
        />
      </Row>
      <Row label="Motion" hint="Interface transitions and hover animations.">
        <Toggle checked={prefs.motion === "full"} onChange={(v) => setPref({ motion: v ? "full" : "reduced" })} />
      </Row>

      <div className="h-6" />
      <SectionTitle>What Ember has learned about you</SectionTitle>
      <p className="-mt-2 mb-4 text-[13px] text-muted">
        Inferred from how you talk — Ember updates this over time.
      </p>
      {inferred ? (
        <dl className="grid gap-px overflow-hidden rounded-xl border border-border-soft bg-border-soft sm:grid-cols-3">
          {[
            ["Language", inferred.preferred_language],
            ["Tone", inferred.asking_tone],
            ["Style", inferred.user_style],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface px-4 py-3">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-faint">{k}</dt>
              <dd className="mt-1 text-sm capitalize text-foreground">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-[13px] text-faint">
          Nothing learned yet — keep chatting in Reflect and Ember will pick up your style.
        </p>
      )}
    </div>
  );
}

function AccountSection() {
  const sessions = [
    { device: "Chrome (Linux)", location: "New Delhi, Delhi, IN", created: "Jul 2, 2026, 5:10 PM", updated: "Jul 2, 2026, 5:10 PM" },
    { device: "Chrome (Linux)", location: "Delhi, Delhi, IN", created: "Jul 2, 2026, 11:00 AM", updated: "Jul 2, 2026, 11:02 AM" },
  ];
  return (
    <div>
      <SectionTitle>Account</SectionTitle>
      <Row label="Log out of all devices">
        <DangerButton>Log out</DangerButton>
      </Row>
      <Row label="Delete account" hint="To delete your account, cancel any active plan first.">
        <DangerButton>Delete account</DangerButton>
      </Row>
      <Row label="Organization ID">
        <code className="rounded-md border border-border-soft bg-raised px-2.5 py-1 font-mono text-[12px] text-muted">
          4e2efa5f-a1c9-4176-84c7-75ea5ed4bb11
        </code>
      </Row>

      <div className="h-10" />
      <SectionTitle>Trusted devices</SectionTitle>
      <p className="-mt-2 mb-4 text-[13px] text-muted">Devices that can control your local machine through remote sessions.</p>
      <div className="rounded-xl border border-border-soft bg-surface p-8 text-center text-[13px] text-faint">
        No trusted devices.
      </div>

      <div className="h-10" />
      <SectionTitle>Active sessions</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-soft text-faint">
              <th className="py-2 pr-4 font-medium">Device</th>
              <th className="py-2 pr-4 font-medium">Location</th>
              <th className="py-2 pr-4 font-medium">Created</th>
              <th className="py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} className="border-b border-border-soft last:border-b-0">
                <td className="py-3 pr-4 text-foreground">{s.device}</td>
                <td className="py-3 pr-4 text-muted">{s.location}</td>
                <td className="py-3 pr-4 text-muted tabular-nums">{s.created}</td>
                <td className="py-3 text-muted tabular-nums">{s.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsageSection() {
  const [stats, setStats] = useState<TokenStat[] | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let alive = true;
    Promise.all([getTokenStats(), getModels().catch(() => [] as ModelInfo[])])
      .then(([s, m]) => {
        if (!alive) return;
        setStats(s);
        setModels(m);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  // A stored model_key -> display label. Known keys use the model's label;
  // raw provider slugs (e.g. "mistralai/mistral-medium-3.5-128b") get their
  // provider prefix stripped so they read cleanly.
  const labelFor = (key: string) => {
    const known = models.find((m) => m.key === key)?.label;
    if (known) return known;
    return key.includes("/") ? key.split("/").pop()! : key;
  };

  const totalIn = stats?.reduce((a, s) => a + s.tokens_in, 0) ?? 0;
  const totalOut = stats?.reduce((a, s) => a + s.tokens_out, 0) ?? 0;
  const total = totalIn + totalOut;

  // Aggregate per display label (merges duplicate keys), busiest first;
  // bars scale to the busiest model.
  const agg = new Map<string, number>();
  for (const s of stats ?? []) {
    const label = labelFor(s.model);
    agg.set(label, (agg.get(label) ?? 0) + s.tokens_in + s.tokens_out);
  }
  const byModel = [...agg.entries()]
    .map(([label, tokens]) => ({ label, tokens }))
    .sort((a, b) => b.tokens - a.tokens);
  const maxTokens = byModel.reduce((m, r) => Math.max(m, r.tokens), 0) || 1;

  return (
    <div>
      <SectionTitle badge="Pro">Plan usage limits</SectionTitle>
      <UsageLine label="Current session" hint="Resets in 4 hr 36 min" pct={13} used="13% used" />

      <div className="h-8" />
      <SectionTitle>Token generation</SectionTitle>
      <p className="-mt-2 mb-5 text-[13px] text-muted">
        Real tokens Ember has generated for you, aggregated across all conversations.
      </p>

      {status === "error" && (
        <div className="rounded-xl border border-border-soft bg-surface p-6 text-[13px] text-muted">
          Couldn&apos;t reach Ember&apos;s usage data. Is the backend running on :8080?
        </div>
      )}

      {status === "loading" && (
        <p className="font-mono text-[13px] text-faint">Gathering usage…</p>
      )}

      {status === "ready" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { k: "Total tokens", v: fmtTokens(total) },
              { k: "Input", v: fmtTokens(totalIn) },
              { k: "Output", v: fmtTokens(totalOut) },
            ].map((t) => (
              <div key={t.k} className="rounded-xl border border-border-soft bg-surface p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-faint">{t.k}</p>
                <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-foreground">{t.v}</p>
              </div>
            ))}
          </div>

          <p className="mb-1 mt-6 text-[13px] font-medium text-foreground">By model</p>
          {byModel.length === 0 ? (
            <p className="py-4 text-[13px] text-faint">
              No tokens generated yet. Start a conversation in Reflect.
            </p>
          ) : (
            <div>
              {byModel.map((m) => (
                <UsageLine
                  key={m.label}
                  label={m.label}
                  pct={(m.tokens / maxTokens) * 100}
                  used={`${fmtTokens(m.tokens)} tokens`}
                />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-[12px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live · updated just now
          </div>
        </>
      )}

      <div className="h-8" />
      <SectionTitle>Usage credits</SectionTitle>
      <Row label="Keep going past your limit" hint="Turn on usage credits to keep using Ember if you hit a limit.">
        <Toggle />
      </Row>
    </div>
  );
}

function PrivacySection() {
  return (
    <div>
      <SectionTitle>Privacy</SectionTitle>
      <Row label="Remember what matters" hint="Let Ember keep facts, patterns, and context across chats.">
        <Toggle defaultOn />
      </Row>
      <Row label="Proactive resurfacing" hint="Ember can gently bring back a memory when it's relevant.">
        <Toggle defaultOn />
      </Row>
      <Row label="Improve Ember with my data" hint="Off by default. Your reflections stay private.">
        <Toggle />
      </Row>
      <Row label="Export your data" hint="Download everything Ember remembers as a file.">
        <DangerButton>Export</DangerButton>
      </Row>
      <Row label="Clear all memory" hint="Permanently forget every stored memory. This cannot be undone.">
        <DangerButton>Clear memory</DangerButton>
      </Row>
    </div>
  );
}

function BillingSection() {
  return (
    <div>
      <SectionTitle>Billing</SectionTitle>
      <div className="flex flex-col gap-4 rounded-xl border border-border-soft bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Ember Pro</p>
            <span className="rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">Active</span>
          </div>
          <p className="mt-1 text-[13px] text-muted">Renews Jul 20, 2026</p>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-raised">
          Manage plan
        </button>
      </div>

      <div className="h-8" />
      <SectionTitle>Payment method</SectionTitle>
      <Row label="Card on file" hint="No card added yet.">
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-raised">
          Add card
        </button>
      </Row>

      <div className="h-8" />
      <SectionTitle>Invoices</SectionTitle>
      <div className="rounded-xl border border-border-soft bg-surface p-8 text-center text-[13px] text-faint">
        No invoices yet.
      </div>
    </div>
  );
}

function CapabilitiesSection() {
  const caps = [
    { label: "Web search", hint: "Let Ember look things up when it helps.", on: true },
    { label: "Code execution", hint: "Run Python snippets in a sandbox.", on: true },
    { label: "File uploads", hint: "Attach PDFs, spreadsheets, and images.", on: true },
    { label: "Memory & the Garden", hint: "Keep, consolidate, and let go of memories.", on: true },
    { label: "PDF export", hint: "Download a conversation as a PDF.", on: false },
  ];
  return (
    <div>
      <SectionTitle>Capabilities</SectionTitle>
      {caps.map((c) => (
        <Row key={c.label} label={c.label} hint={c.hint}>
          <Toggle defaultOn={c.on} />
        </Row>
      ))}
    </div>
  );
}

function ConnectorsSection() {
  return (
    <div>
      <SectionTitle>Connectors</SectionTitle>
      <p className="-mt-2 mb-5 text-[13px] text-muted">Connect Ember to the tools where your life already lives.</p>
      <div className="rounded-xl border border-border-soft bg-surface p-8 text-center">
        <p className="text-[13px] text-faint">No connectors yet.</p>
        <button className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-void transition-transform hover:scale-[1.03]">
          Add connector
        </button>
      </div>
    </div>
  );
}

const SECTIONS: Record<SectionKey, () => ReactNode> = {
  general: GeneralSection,
  account: AccountSection,
  privacy: PrivacySection,
  billing: BillingSection,
  usage: UsageSection,
  capabilities: CapabilitiesSection,
  connectors: ConnectorsSection,
};

/* --- Page ----------------------------------------------------------------- */

export default function SettingsPage() {
  const [active, setActive] = useState<SectionKey>("general");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: showing a section's detail

  const filtered = useMemo(
    () => NAV.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  const ActiveSection = SECTIONS[active];
  const activeLabel = NAV.find((n) => n.key === active)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Left rail */}
      <aside
        className={`${mobileOpen ? "hidden" : "flex"} w-full flex-col border-r border-border-soft bg-surface md:flex md:w-64 lg:w-72`}
      >
        <div className="p-4">
          <label className="flex items-center gap-2 rounded-lg border border-border-soft bg-raised px-3 py-2 text-muted focus-within:border-border">
            <Icon.search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
            />
          </label>
        </div>
        <p className="px-6 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Settings</p>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" data-lenis-prevent>
          {filtered.map(({ key, label, Icon: I }) => {
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  setMobileOpen(true);
                }}
                className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-raised font-medium text-foreground" : "text-muted hover:bg-raised/60 hover:text-foreground"
                }`}
              >
                <I className={isActive ? "text-foreground" : "text-faint"} />
                {label}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-faint">No settings match “{query}”.</p>
          )}
        </nav>
        {/* Close (desktop) */}
        <div className="hidden border-t border-border-soft p-3 md:block">
          <Link
            href="/reflect"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised/60 hover:text-foreground"
          >
            <Icon.back /> Back to Ember
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className={`${mobileOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3 sm:px-8">
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground md:hidden"
          >
            <Icon.back /> {activeLabel}
          </button>
          <span className="hidden font-display text-sm font-medium text-foreground md:block">{activeLabel}</span>
          <Link
            href="/reflect"
            aria-label="Close settings"
            className="grid h-9 w-9 place-items-center rounded-full border border-border-soft text-muted transition-colors hover:text-foreground"
          >
            <Icon.close />
          </Link>
        </div>

        {/* Scroll area */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8" data-lenis-prevent>
          <div className="mx-auto max-w-2xl pb-16">
            <ActiveSection />
          </div>
        </div>
      </main>
    </div>
  );
}
