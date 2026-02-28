'use client';

import React, { useState } from 'react';
import { Lock, X, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function PrivateUnlockModal() {
    const { closeModal, unlockPrivateMode, masterPin } = useApp();
    const hasPinSet = masterPin !== '';
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (unlockPrivateMode(pin)) {
            closeModal();
        } else {
            setError(true);
            setPin('');
        }
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldAlert size={18} className="text-danger" />
                        <h2 className="modal-title">Unlock Private Mode</h2>
                    </div>
                    <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ textAlign: 'center', padding: '16px 20px' }}>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            {hasPinSet
                                ? "Please enter your security PIN to reveal hidden private links."
                                : "You haven't set a security PIN yet. Please go to Settings to set your PIN first."}
                        </p>

                        {hasPinSet && (
                            <div style={{ position: 'relative', maxWidth: 160, margin: '0 auto' }}>
                                <input
                                    className={`form-input${error ? ' error' : ''}`}
                                    type="password"
                                    maxLength={4}
                                    autoFocus
                                    value={pin}
                                    onChange={e => {
                                        setError(false);
                                        setPin(e.target.value.replace(/\D/g, ''));
                                    }}
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 24,
                                        letterSpacing: '0.4em',
                                        padding: '12px',
                                        height: 'auto'
                                    }}
                                    placeholder="••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 13, justifyContent: 'center', marginTop: 12 }}>
                                <AlertCircle size={14} />
                                <span>Incorrect PIN. Please try again.</span>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer" style={{ justifyContent: 'center' }}>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        {hasPinSet ? (
                            <button type="submit" className="btn btn-primary" disabled={pin.length < 4}>Unlock</button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    closeModal();
                                    window.location.href = '/settings';
                                }}
                            >Go to Settings</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
