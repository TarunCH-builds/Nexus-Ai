/**
 * NEXUS AI - Accessible Toast Notification Container
 * Provides non-intrusive, dismissible feedback for asynchronous operations.
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notification alerts"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-500/30 bg-neutral-900/95',
          error: 'border-rose-500/30 bg-neutral-900/95',
          warning: 'border-amber-500/30 bg-neutral-900/95',
          info: 'border-indigo-500/30 bg-neutral-900/95',
        };

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2 ${borderColors[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-xs font-semibold text-neutral-200 leading-tight">
                  {toast.title}
                </div>
              )}
              <div className="text-[11px] text-neutral-300 leading-relaxed break-words mt-0.5">
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-neutral-500 hover:text-neutral-300 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
