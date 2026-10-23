import type { FontChoice } from "../store/editorStore";

export interface FontOption {
  value: FontChoice;
  label: string;
  stack: string;
  note: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    value: "literata",
    label: "Literata",
    stack: "var(--font-document)",
    note: "Editorial serif",
  },
  {
    value: "instrument",
    label: "Instrument Sans",
    stack: "var(--font-ui)",
    note: "Humanist sans",
  },
  {
    value: "mono",
    label: "JetBrains Mono",
    stack: "var(--font-mono)",
    note: "Monospace",
  },
  {
    value: "system",
    label: "System",
    stack:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    note: "Platform default",
  },
];

export function resolveFontStack(choice: FontChoice): string {
  return FONT_OPTIONS.find((option) => option.value === choice)?.stack ?? "var(--font-document)";
}

export function fontLabel(choice: FontChoice): string {
  return FONT_OPTIONS.find((option) => option.value === choice)?.label ?? "Literata";
}
