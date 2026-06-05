import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type ToastVariant = 'default' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium min-w-[280px]',
              t.variant === 'success' && 'bg-green-600 text-white',
              t.variant === 'error' && 'bg-red-600 text-white',
              t.variant === 'default' && 'bg-gray-900 text-white',
            )}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
