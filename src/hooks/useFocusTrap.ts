import { useEffect, type RefObject } from "react";
import { getFocusable } from "../lib/focusable";

interface FocusTrapOptions {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onEscape?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
}

/**
 * Traps Tab/Shift+Tab inside a container, handles Escape, and returns focus
 * to the element that opened it when it closes.
 */
export function useFocusTrap({
  active,
  containerRef,
  onEscape,
  initialFocusRef,
  restoreFocus = true,
}: FocusTrapOptions) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previous = document.activeElement as HTMLElement | null;

    const focusTarget = () => {
      const preferred =
        initialFocusRef?.current ??
        container.querySelector<HTMLElement>("[data-autofocus]") ??
        getFocusable(container)[0] ??
        container;
      preferred.focus();
    };

    focusTarget();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (!restoreFocus || !previous?.isConnected) return;
      const current = document.activeElement;
      if (!current || current === document.body || container.contains(current)) {
        previous.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, onEscape, restoreFocus]);
}
