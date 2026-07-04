/**
 * Ember — client-side preferences & editable profile.
 *
 * The backend only exposes Ember's *inferred* profile (read-only). These are the
 * user-set knobs Ember has no store for yet, persisted in localStorage and
 * applied to <html> so they take effect across the whole app.
 */

export type MotionPref = "full" | "reduced";
export type FontPref = "sans" | "system" | "mono";
export type AppearancePref = "system" | "light" | "dark";

export type Preferences = {
  appearance: AppearancePref;
  font: FontPref;
  motion: MotionPref;
};

export type ProfileForm = {
  fullName: string;
  callYou: string;
  work: string;
  instructions: string;
};

export const DEFAULT_PREFERENCES: Preferences = {
  appearance: "dark",
  font: "sans",
  motion: "full",
};

export const DEFAULT_PROFILE: ProfileForm = {
  fullName: "",
  callYou: "",
  work: "Engineering",
  instructions: "",
};

const PREF_KEY = "ember:prefs";
const PROFILE_KEY = "ember:profile";

const isBrowser = () => typeof window !== "undefined";

const FONT_STACKS: Record<FontPref, string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif, var(--emoji)",
  system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif, var(--emoji)",
  mono: "var(--font-geist-mono), ui-monospace, 'SFMono-Regular', monospace, var(--emoji)",
};

/** Resolve "system" to the OS preference; otherwise pass through. */
function resolveTheme(appearance: AppearancePref): "light" | "dark" {
  if (appearance !== "system") return appearance;
  if (!isBrowser()) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Push preferences onto the document root so CSS + font utilities react. */
export function applyPreferences(p: Preferences) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  const theme = resolveTheme(p.appearance);
  root.dataset.theme = theme;
  root.dataset.motion = p.motion;
  root.style.colorScheme = theme;
  root.style.setProperty("--font-sans", FONT_STACKS[p.font]);
}

export function loadPreferences(): Preferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(p: Preferences) {
  if (!isBrowser()) return;
  localStorage.setItem(PREF_KEY, JSON.stringify(p));
  applyPreferences(p);
}

export function loadProfile(): ProfileForm {
  if (!isBrowser()) return DEFAULT_PROFILE;
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: ProfileForm) {
  if (!isBrowser()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
