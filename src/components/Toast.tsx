"use client";

import { useState, useCallback, createContext, useContext, useRef, type ReactNode } from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  actions?: ToastAction[];
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"], options?: { actions?: ToastAction[]; duration?: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info", options?: { actions?: ToastAction[]; duration?: number }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const duration = options?.duration ?? (options?.actions ? 10000 : 3000);
      const toast: Toast = { id, message, type, actions: options?.actions };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm animate-slideUp ${
              t.type === "success"
                ? "bg-green-500/90 text-white"
                : t.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
            }`}
          >
            <div className="font-medium">{t.message}</div>
            {t.actions && t.actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {t.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      action.onClick();
                      dismissToast(t.id);
                    }}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      i === 0
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
