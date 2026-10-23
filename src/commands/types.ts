import type { LucideIcon } from "lucide-react";

export type CommandGroup = "Document" | "Edit" | "View" | "Theme" | "App";

export interface AppCommand {
  id: string;
  title: string;
  detail?: string;
  group: CommandGroup;
  keywords?: string;
  shortcut?: string;
  icon?: LucideIcon;
  active?: boolean;
  run: () => void | Promise<void>;
}
