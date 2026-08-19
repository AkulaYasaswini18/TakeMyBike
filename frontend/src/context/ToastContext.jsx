import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import '../components/common/Toast.css';

const ToastContext = createContext(null);

const toastIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠️',
  info: 'ℹ️'
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [timers] = useState(() => new Map());

  const removeToast = useCallback((id) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [timers]);

  const addToast = useCallback((type, message, title = '', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      type,
      message,
      title: title || (type === 'error' ? 'Error' : (type === 'success' ? 'Success' : (type === 'warning' ? 'Notice' : 'Information'))),
      duration
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
        timers.delete(id);
      }, duration);
      timers.set(id, timer);
    }
  }, [removeToast, timers]);

  useEffect(() => () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  }, [timers]);

  const toast = {
    success: (msg, title, dur) => addToast('success', msg, title, dur),
    error: (msg, title, dur) => addToast('error', msg, title, dur),
    warning: (msg, title, dur) => addToast('warning', msg, title, dur),
    info: (msg, title, dur) => addToast('info', msg, title, dur)
  };

  // Global custom event listener for non-React contexts (like Axios interceptor)
  useEffect(() => {
    const handleGlobalToast = (event) => {
      if (event.detail) {
        const { type = 'info', message, title, duration } = event.detail;
        addToast(type, message, title, duration);
      }
    };

    window.addEventListener('bikeshare-toast', handleGlobalToast);
    return () => window.removeEventListener('bikeshare-toast', handleGlobalToast);
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <div className="toast-icon">{toastIcons[t.type] || '🔔'}</div>
            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              <div className="toast-message">{t.message}</div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="toast-close-btn"
              aria-label="Close notification"
            >
              ✕
            </button>
            {t.duration > 0 && (
              <div className="toast-progress">
                <div
                  className="toast-progress-fill"
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Helper function to trigger toast from anywhere (e.g. api.js)
export function emitToast(type, message, title, duration) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('bikeshare-toast', {
        detail: { type, message, title, duration }
      })
    );
  }
}

export default ToastContext;
