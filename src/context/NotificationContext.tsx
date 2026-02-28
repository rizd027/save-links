'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
}

interface AlertOptions {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface NotificationContextType {
    showToast: (type: NotificationType, title: string, message?: string, duration?: number) => void;
    showAlert: (options: AlertOptions) => void;
    closeAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [alert, setAlert] = useState<AlertOptions | null>(null);

    const showToast = useCallback((type: NotificationType, title: string, message?: string, duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const showAlert = useCallback((options: AlertOptions) => {
        setAlert(options);
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, showAlert, closeAlert }}>
            {children}

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'warning' && <AlertTriangle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <div className="toast-content">
                            <div className="toast-title">{toast.title}</div>
                            {toast.message && <div className="toast-message">{toast.message}</div>}
                        </div>
                        <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Alert Dialog */}
            {alert && (
                <div className="alert-overlay" onClick={closeAlert}>
                    <div className={`alert-dialog alert-${alert.type || 'info'}`} onClick={e => e.stopPropagation()}>
                        <button className="alert-close" onClick={closeAlert}>
                            <X size={18} />
                        </button>
                        <div className="alert-body">
                            <div className="alert-icon-box">
                                {alert.type === 'danger' ? <AlertCircle size={32} /> :
                                    alert.type === 'warning' ? <AlertTriangle size={32} /> :
                                        <Info size={32} />}
                            </div>
                            <h3 className="alert-title">{alert.title}</h3>
                            <p className="alert-message">{alert.message}</p>
                        </div>
                        <div className={`alert-footer ${!alert.onCancel ? 'single-btn' : ''}`}>
                            {alert.onCancel && (
                                <button className="alert-btn cancel" onClick={() => {
                                    alert.onCancel?.();
                                    setAlert(null);
                                }}>
                                    {alert.cancelText || 'Cancel'}
                                </button>
                            )}
                            <button className="alert-btn confirm" onClick={() => {
                                alert.onConfirm?.();
                                setAlert(null);
                            }}>
                                {alert.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
}
