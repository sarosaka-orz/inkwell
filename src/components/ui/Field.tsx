import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[12px] font-medium text-[var(--color-ink)]">
          {label}
        </label>
        {hint && (
          <span className="max-w-[45%] shrink-0 truncate text-right text-[11px] text-[var(--color-ink-muted)]">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-2.5 text-[12px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_2px_var(--color-accent-soft)]";
