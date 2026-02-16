"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { X, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "confirm";
  onConfirm?: () => void | Promise<void>;
}

interface ToastContextValue {
  toast: (message: string, type?: Exclude<Toast["type"], "confirm">) => void;
  confirm: (message: string, onConfirm: () => void | Promise<void>) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {}, confirm: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
  confirm: Trash2,
};

const STYLES = {
  success: "border-[var(--color-bullish)]/30 bg-[var(--card)] text-[var(--foreground)]",
  error:   "border-red-500/30 bg-[var(--card)] text-[var(--foreground)]",
  info:    "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
  confirm: "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]",
};

const ICON_STYLES = {
  success: "text-[var(--color-bullish)]",
  error:   "text-red-500",
  info:    "text-[var(--color-brand)]",
  confirm: "text-[var(--muted-foreground)]",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (toast.type === "confirm") return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss, toast.type]);

  const Icon = ICONS[toast.type];

  return (
    <div className={`animate-slide-up flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl min-w-[240px] max-w-[400px] ${STYLES[toast.type]}`}>
      <Icon className={`h-4 w-4 shrink-0 ${ICON_STYLES[toast.type]}`} />
      <span className="flex-1 font-medium">{toast.message}</span>
      {toast.type === "confirm" ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { onDismiss(); toast.onConfirm?.(); }}
            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            Remove
          </button>
          <button
            onClick={onDismiss}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onDismiss}
          className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: Exclude<Toast["type"], "confirm"> = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const confirm = useCallback((message: string, onConfirm: () => void | Promise<void>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type: "confirm", onConfirm }]);
  }, []);

  return (
    <ToastContext value={{ toast, confirm }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext>
  );
}
