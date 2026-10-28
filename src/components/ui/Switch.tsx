import { cn } from "../../lib/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-sm)] px-1 py-2.5 text-left transition-colors hover:bg-[var(--color-hover)]"
    >
      <span className="min-w-0">
        <span className="block text-[12px] text-[var(--color-ink)]">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-[18px] w-8 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-line)] bg-[var(--color-sunken)]",
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] h-3 w-3 rounded-full transition-all",
            checked
              ? "left-[16px] bg-[var(--color-accent-contrast)]"
              : "left-[2px] bg-[var(--color-ink-muted)]",
          )}
        />
      </span>
    </button>
  );
}
