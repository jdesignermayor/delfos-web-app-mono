"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Card } from "@heroui/react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// Agregar estilos de animación
const TOAST_STYLES = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  .toast-enter {
    animation: slideDown 0.3s ease-out forwards;
  }

  .toast-exit {
    animation: slideUp 0.3s ease-in forwards;
  }

  @keyframes toastCountdown {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  .toast-countdown {
    transform-origin: left;
    animation: toastCountdown linear forwards;
  }
`;

export type ToastType = "success" | "error" | "warning" | "info";

/** A button inside the toast (e.g. "Deshacer"); pressing it runs `onPress` and dismisses the toast. */
export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  type: ToastType;
  title: string;
  description?: string;
  /** Milliseconds before it closes on its own; `0` keeps it open. */
  duration?: number;
  action?: ToastAction;
}

interface Toast extends ToastOptions {
  id: string;
  duration: number;
}

interface ToastContextType {
  success: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
  /** Shows a toast with every option (e.g. an action button) and returns its id. */
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const show = useCallback(({ duration = 3000, ...options }: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...options, id, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string, duration?: number) => {
      show({ type, title, description, duration });
    },
    [show],
  );

  const removeToast = useCallback((id: string) => {
    setExitingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const success = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast("success", title, description, duration);
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast("error", title, description, duration);
    },
    [addToast],
  );

  const warning = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast("warning", title, description, duration);
    },
    [addToast],
  );

  const info = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast("info", title, description, duration);
    },
    [addToast],
  );

  const value = { success, error, warning, info, show, dismiss: removeToast };

  return (
    <ToastContext.Provider value={value}>
      <style dangerouslySetInnerHTML={{ __html: TOAST_STYLES }} />
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} exitingIds={exitingIds} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
  exitingIds,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
  exitingIds: Set<string>;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex max-w-md flex-col gap-2 z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} isExiting={exitingIds.has(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
  isExiting,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
  isExiting: boolean;
}) {
  const getConfig = () => {
    switch (toast.type) {
      case "success":
        return {
          bgColor: "bg-emerald-700 border-emerald-800",
          textColor: "text-emerald-50",
          icon: <CheckCircle className="h-5 w-5 text-emerald-200" />,
        };
      case "error":
        return {
          bgColor: "bg-danger-50 border-danger-200",
          textColor: "text-danger-700",
          icon: <AlertCircle className="h-5 w-5 text-danger-600" />,
        };
      case "warning":
        return {
          bgColor: "bg-warning-50 border-warning-200",
          textColor: "text-warning-700",
          icon: <AlertTriangle className="h-5 w-5 text-warning-600" />,
        };
      case "info":
        return {
          bgColor: "bg-info-50 border-info-200",
          textColor: "text-info-700",
          icon: <Info className="h-5 w-5 text-info-600" />,
        };
    }
  };

  const config = getConfig();

  return (
    <Card className={`relative flex flex-row items-start gap-3 overflow-hidden p-4 border ${config.bgColor} ${isExiting ? "toast-exit" : "toast-enter"}`}>
      {config.icon}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${config.textColor}`}>{toast.title}</p>
        {toast.description && <p className={`text-xs mt-1 ${config.textColor} opacity-75`}>{toast.description}</p>}
      </div>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onPress();
            onRemove(toast.id);
          }}
          className={`self-center border border-current px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 ${config.textColor}`}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => onRemove(toast.id)}
        className={`text-sm transition-colors hover:opacity-80 ${config.textColor}`}
      >
        <X className="h-4 w-4" />
      </button>
      {toast.action && toast.duration > 0 ? (
        // How long the action stays available.
        <span
          aria-hidden
          className={`toast-countdown absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-40 ${config.textColor}`}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      ) : null}
    </Card>
  );
}
