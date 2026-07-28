"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error";
type Toast = { id: number; msg: string; type: ToastType };

const ToastContext = createContext<{
  show: (msg: string, type?: ToastType) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fade-in whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg ${
              t.type === "error" ? "bg-perigo" : "bg-roxo"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
