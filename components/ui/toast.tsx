"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (title: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback((title: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { id, title, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`rounded-2xl border px-4 py-3 shadow-soft ${
                item.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : item.tone === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-brand-primary/10 bg-white text-brand-primary"
              }`}
            >
              {item.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
