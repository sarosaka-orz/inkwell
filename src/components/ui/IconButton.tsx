import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  size?: "sm" | "md";
}

export function IconButton({
  label,
  icon,
  active = false,
  size = "md",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        active && "bg-[var(--color-active)] text-[var(--color-accent)]",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
