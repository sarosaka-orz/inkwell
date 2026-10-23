export type Theme =
  | "inkwell-dark"
  | "tokyo-night"
  | "nord"
  | "dracula"
  | "github-dark"
  | "craft-paper"
  | "github-light";

export interface ThemeDefinition {
  name: Theme;
  label: string;
  isDark: boolean;
}

export const themes: ThemeDefinition[] = [
  { name: "inkwell-dark", label: "Ink", isDark: true },
  { name: "tokyo-night", label: "Tokyo Night", isDark: true },
  { name: "nord", label: "Nord", isDark: true },
  { name: "dracula", label: "Dracula", isDark: true },
  { name: "github-dark", label: "GitHub Dark", isDark: true },
  { name: "craft-paper", label: "Paper", isDark: false },
  { name: "github-light", label: "GitHub Light", isDark: false },
];

export const DEFAULT_THEME: Theme = "inkwell-dark";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themes.some((t) => t.name === value);
}

export function getTheme(name: Theme): ThemeDefinition {
  return themes.find((t) => t.name === name) ?? themes[0];
}
