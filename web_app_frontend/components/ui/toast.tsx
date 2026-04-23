'use client';

import * as React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
};

const accentStyles: Record<ToastVariant, React.CSSProperties> = {
  success: { borderColor: '#16a34a', boxShadow: '0 12px 30px rgba(22,163,74,0.12)' },
  error: { borderColor: '#dc2626', boxShadow: '0 12px 30px rgba(220,38,38,0.12)' },
  warning: { borderColor: '#f59e0b', boxShadow: '0 12px 30px rgba(245,158,11,0.12)' },
  info: { borderColor: '#2563eb', boxShadow: '0 12px 30px rgba(37,99,235,0.12)' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-6 top-6 z-50 flex w-[320px] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-2xl border bg-white p-4"
            style={accentStyles[toast.variant]}
          >
            <div className="flex items-start gap-3">
              {icons[toast.variant]}
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {toast.title}
                </div>
                {toast.description ? (
                  <div className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {toast.description}
                  </div>
                ) : null}
              </div>
              <button
                className="rounded-full p-1 text-neutral-400 hover:text-neutral-600"
                onClick={() => remove(toast.id)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
