import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-1.5 font-mono text-[10px] text-[var(--color-ink-soft)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
