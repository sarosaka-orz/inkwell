import { DEFAULT_THEME, getTheme, isTheme, type Theme } from "./index";

export const THEME_STORAGE_KEY = "inkwell:theme";

/** Read the persisted theme, tolerating private-mode/disabled storage. */
export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Apply a palette by swapping the data-theme attribute. All colors live in
 * themes.css, so no CSS variables need to be written from JavaScript.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = getTheme(theme).isDark;
  root.dataset.theme = theme;
  root.dataset.scheme = isDark ? "dark" : "light";
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function themeIsDark(theme: Theme): boolean {
  return getTheme(theme).isDark;
}
