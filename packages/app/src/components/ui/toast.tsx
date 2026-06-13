'use client';
import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4 text-zinc-400" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
};

const BORDER: Record<ToastVariant, string> = {
  default: 'border-zinc-700',
  success: 'border-emerald-800',
  error: 'border-red-800',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, variant: 'default', ...msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(t => (
          <ToastPrimitive.Root
            key={t.id}
            open
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-zinc-900 p-4 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-right-full',
              BORDER[t.variant ?? 'default'],
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.variant ?? 'default']}</span>
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-medium text-zinc-100">{t.title}</ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-0.5 text-xs text-zinc-400">{t.description}</ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss notification" className="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
