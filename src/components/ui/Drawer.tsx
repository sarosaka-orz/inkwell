import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

/**
 * Overlay drawer that never reflows the writing column. It stays mounted so
 * the file tree keeps its expanded folders between openings.
 */
export function Drawer({ open, onClose, label, children }: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);

  useFocusTrap({
    active: open,
    containerRef: panelRef as React.RefObject<HTMLElement | null>,
    onEscape: onClose,
    restoreFocus: true,
  });

  return createPortal(
    <div
      className={cn(
        "fixed inset-0",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ zIndex: "var(--z-drawer)" }}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-[var(--color-scrim)] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={open || undefined}
        aria-label={label}
        inert={!open}
        tabIndex={-1}
        className={cn(
          "absolute left-0 top-0 flex h-full w-[var(--drawer-w)] max-w-[86vw] flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-dock)] outline-none transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
