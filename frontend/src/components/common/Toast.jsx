import { useToast } from '../../hooks/useToast';

// Renders the live toast stack. Mount once near the app root, inside
// <ToastProvider>. Self-positioning via the .toast-stack styles.
function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-msg">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
