import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "../../lib/cn";
import { Kbd } from "./Kbd";
import { Popover } from "./Popover";

const MenuCloseContext = createContext<() => void>(() => {});

interface MenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  align?: "start" | "end";
  children: ReactNode;
  className?: string;
}

export function Menu({ open, onClose, anchorRef, label, align, children, className }: MenuProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const closeAndRestore = () => {
    onClose();
    window.setTimeout(() => anchorRef.current?.focus(), 0);
  };

  const closeAndMaybeRestore = () => {
    onClose();
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body) anchorRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!open) return;
    // Wait for the popover to become visible before moving focus into it.
    const timer = window.setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        '[role^="menuitem"]:not([disabled])',
      );
      first?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestore();
      return;
    }
    if (event.key === "Tab") {
      onClose();
      return;
    }

    const items = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      align={align}
      role="menu"
      label={label}
      contentRef={contentRef}
      className={cn("w-56", className)}
    >
      <MenuCloseContext.Provider value={closeAndMaybeRestore}>
        <div onKeyDown={onKeyDown}>{children}</div>
      </MenuCloseContext.Provider>
    </Popover>
  );
}

interface MenuItemProps {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  keepOpen?: boolean;
}

export function MenuItem({
  label,
  onSelect,
  icon,
  shortcut,
  checked,
  disabled,
  danger,
  keepOpen = false,
}: MenuItemProps) {
  const close = useContext(MenuCloseContext);
  return (
    <button
      type="button"
      role={checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={checked}
      disabled={disabled}
      tabIndex={-1}
      onClick={() => {
        onSelect();
        if (!keepOpen) close();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-xs)] px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--color-hover)] focus:bg-[var(--color-hover)] focus:outline-none disabled:pointer-events-none disabled:opacity-40",
        danger ? "text-[var(--color-danger)]" : "text-[var(--color-ink)]",
      )}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--color-ink-muted)]">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {checked !== undefined && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            checked ? "bg-[var(--color-accent)]" : "bg-transparent",
          )}
        />
      )}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-2 text-[10px] font-medium text-[var(--color-ink-muted)]">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-[var(--color-line)]" />;
}
