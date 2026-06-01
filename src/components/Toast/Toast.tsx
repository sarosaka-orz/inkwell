import { useEditorStore } from "../../store/editorStore";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

const iconMap = {
  info: <Info size={15} />,
  success: <CheckCircle size={15} />,
  error: <AlertCircle size={15} />,
};

const colorMap = {
  info: "var(--color-accent)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
};

export function ToastContainer() {
  const { toasts, removeToast } = useEditorStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-enter flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-sm pointer-events-auto"
          style={{
            background: "var(--color-bg-tertiary)",
            border: `1px solid var(--color-border)`,
            color: "var(--color-text-primary)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ color: colorMap[toast.type] }}>{iconMap[toast.type]}</span>
          <span className="text-[13px]">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 p-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
