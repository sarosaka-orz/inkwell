import { useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { IconButton } from "./IconButton";

interface ModalShellProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
  bodyClassName?: string;
  panelClassName?: string;
}

const sizes = {
  sm: "w-[min(420px,92vw)]",
  md: "w-[min(600px,92vw)]",
  lg: "w-[min(820px,94vw)]",
};

export function ModalShell({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  initialFocusRef,
  restoreFocus = true,
  bodyClassName,
  panelClassName,
}: ModalShellProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap({
    active: true,
    containerRef: panelRef,
    onEscape: onClose,
    initialFocusRef,
    restoreFocus,
  });

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-[var(--color-scrim)] p-6 animate-fade-in"
      style={{ zIndex: "var(--z-modal)" }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[86vh] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] outline-none animate-fade-up",
          sizes[size],
          panelClassName,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-muted)]">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} icon={<X size={14} />} />
        </header>

        <div className={cn("min-h-0 flex-1", bodyClassName ?? "overflow-y-auto px-5 py-4")}>
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--color-line)] px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
