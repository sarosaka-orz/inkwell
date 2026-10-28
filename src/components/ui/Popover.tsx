import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { useDismissableLayer } from "../../hooks/useDismissableLayer";

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: "start" | "end";
  role?: string;
  label?: string;
  className?: string;
  contentRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function Popover({
  open,
  onClose,
  anchorRef,
  align = "end",
  role = "dialog",
  label,
  className,
  contentRef,
  children,
}: PopoverProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const ref = contentRef ?? innerRef;
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  useDismissableLayer({ open, triggerRef: anchorRef, contentRef: ref, onClose });

  const position = useCallback(() => {
    const anchor = anchorRef.current;
    const content = ref.current;
    if (!anchor || !content) return;

    const rect = anchor.getBoundingClientRect();
    const width = content.offsetWidth;
    const height = content.offsetHeight;
    const gap = 6;

    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - height - gap);
    }
    let left = align === "end" ? rect.right - width : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);

    setStyle({ position: "fixed", top, left, visibility: "visible", maxHeight: "70vh" });
  }, [anchorRef, ref, align]);

  useLayoutEffect(() => {
    if (!open) return;
    position();
    const frame = requestAnimationFrame(position);
    const onResize = () => position();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, position]);

  if (!open) return null;

  return createPortal(
    <div
      ref={ref}
      role={role}
      aria-label={label}
      style={{ ...style, zIndex: 50 }}
      className={cn(
        "min-w-[200px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-dock)] animate-fade-up",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
