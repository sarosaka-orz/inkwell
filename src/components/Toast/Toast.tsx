import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  info: "text-[var(--color-accent)]",
};

export function ToastContainer() {
  const toasts = useEditorStore((s) => s.toasts);
  const removeToast = useEditorStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(var(--statusbar-h)+12px)] right-3 flex flex-col items-end gap-1.5"
      style={{ zIndex: 75 }}
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex max-w-[min(420px,80vw)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-2.5 pr-1.5 text-[11.5px] shadow-[var(--shadow-dock)] animate-fade-up"
          >
            <Icon size={13} className={`shrink-0 ${COLORS[toast.type]}`} />
            <span className="min-w-0 flex-1 text-[var(--color-ink-soft)]">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
