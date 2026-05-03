import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

// Wrap your app in <ToastProvider> once (in main.jsx). Then anywhere:
//   const { error, success, info } = useToast();
//   error('Could not save change.');
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', durationMs = 4500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
    return id;
  }, [dismiss]);

  const api = {
    show,
    dismiss,
    info:    (m, d) => show(m, 'info', d),
    success: (m, d) => show(m, 'success', d),
    error:   (m, d) => show(m, 'error', d ?? 6000),
    toasts,
  };

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
