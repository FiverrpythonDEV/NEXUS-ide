import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types';

interface ToastContextType {
  toast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  success: (text: string) => void;
  info: (text: string) => void;
  warning: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback((text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((text: string) => triggerToast(text, 'success'), [triggerToast]);
  const info = useCallback((text: string) => triggerToast(text, 'info'), [triggerToast]);
  const warning = useCallback((text: string) => triggerToast(text, 'warning'), [triggerToast]);
  const error = useCallback((text: string) => triggerToast(text, 'error'), [triggerToast]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />,
    info: <Info className="w-4 h-4 text-accent-purple shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />,
    error: <XCircle className="w-4 h-4 text-status-error shrink-0" />,
  };

  const borders = {
    success: 'border-status-success/20',
    info: 'border-accent-purple/20',
    warning: 'border-status-warning/20',
    error: 'border-status-error/20',
  };

  return (
    <ToastContext.Provider value={{ toast: triggerToast, success, info, warning, error }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-lg ${borders[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 text-xs font-sans font-medium text-text-primary leading-tight">
                {t.text}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
