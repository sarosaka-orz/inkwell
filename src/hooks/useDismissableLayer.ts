import { useEffect, type RefObject } from "react";

interface DismissableLayerOptions {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/** Close a popover/menu on an outside pointer press. Escape is handled by Menu. */
export function useDismissableLayer({
  open,
  triggerRef,
  contentRef,
  onClose,
}: DismissableLayerOptions) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, triggerRef, contentRef, onClose]);
}
