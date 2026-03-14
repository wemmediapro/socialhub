import { useState, useCallback } from 'react';
import Toast, { ToastType } from '@/components/Toast';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('success', title, message, duration);
  }, [showToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('error', title, message, duration);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('warning', title, message, duration);
  }, [showToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('info', title, message, duration);
  }, [showToast]);

  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );

  return {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    ToastContainer,
  };
}

