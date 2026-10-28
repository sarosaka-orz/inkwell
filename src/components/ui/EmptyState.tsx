import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, actions, children, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-8 text-center", className)}>
      {icon && (
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-accent)]">
          {icon}
        </div>
      )}
      <h2 className="font-document text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-[34ch] text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
          {description}
        </p>
      )}
      {actions && <div className="mt-5 flex items-center gap-2">{actions}</div>}
      {children && <div className="mt-7 w-full max-w-xs">{children}</div>}
    </div>
  );
}
