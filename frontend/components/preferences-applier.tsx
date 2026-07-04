"use client";

import { useEffect } from "react";
import { applyPreferences, loadPreferences } from "@/lib/preferences";

/**
 * Applies the user's saved preferences (theme, font, motion) to <html> on load,
 * so a choice made in Settings takes effect across every page.
 */
export function PreferencesApplier() {
  useEffect(() => {
    applyPreferences(loadPreferences());
  }, []);
  return null;
}
