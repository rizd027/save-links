'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function LoginPage() {
    const { user, login, forgotPassword, resetPassword } = useAuth();
    const { showToast } = useNotification();
    const router = useRouter();

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Forgot Password Flow State
    const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await login(email, password);
        if (result.success) {
            showToast('success', 'Logged in successfully', `Welcome back, ${result.user?.name || 'User'}!`);
            setIsLoading(false);
            router.push('/');
        } else {
            setError(result.message || 'Login failed');
            showToast('error', 'Login Failed', result.message || 'Invalid email or password.');
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await forgotPassword(email);
        if (result.success) {
            showToast('success', 'Code Sent', 'Please check your email for the verification code.');
            setView('reset');
            setIsLoading(false);
        } else {
            setError(result.message || 'Failed to send reset code');
            showToast('error', 'Error', result.message || 'Failed to send reset code.');
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetCode || !newPassword || !confirmNewPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await resetPassword(email, resetCode, newPassword);
        if (result.success) {
            showToast('success', 'Password Reset', 'Your password has been updated successfully.');
            setView('login');
            setPassword('');
            setIsLoading(false);
        } else {
            setError(result.message || 'Failed to reset password');
            showToast('error', 'Reset Failed', result.message || 'Invalid code or expired request.');
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="mesh-bg" />

            <div className="auth-card glass-card animate-fade-in">
                <div className="auth-header">
                    <div className="logo-icon animate-float" style={{ width: 56, height: 56, fontSize: 28, margin: '0 auto 20px', borderRadius: 16 }}>
                        <Link2 size={24} color="white" />
                        <div className="logo-glow" />
                    </div>

                    {view === 'login' && (
                        <>
                            <h1 className="auth-title gradient-text" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Welcome Back</h1>
                            <p className="auth-subtitle">Sign in to manage your link collections</p>
                        </>
                    )}

                    {view === 'forgot' && (
                        <>
                            <h1 className="auth-title gradient-text" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Forgot Password</h1>
                            <p className="auth-subtitle">Enter your email for a verification code</p>
                        </>
                    )}

                    {view === 'reset' && (
                        <>
                            <h1 className="auth-title gradient-text" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Reset Password</h1>
                            <p className="auth-subtitle">Enter the code and your new password</p>
                        </>
                    )}
                </div>

                {error && (
                    <div className="alert alert-danger animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13, marginTop: 20, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {view === 'login' && (
                    <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Password</label>
                                <button type="button" onClick={() => { setView('forgot'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                                    Forgot Password?
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary animate-fade-in" style={{ width: '100%', height: 48, marginTop: 24, borderRadius: 12, fontSize: 15, fontWeight: 700, gap: 10, background: 'var(--gradient-primary)', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }} disabled={isLoading}>
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Sign In</>}
                        </button>
                    </form>
                )}

                {view === 'forgot' && (
                    <form className="auth-form" onSubmit={handleForgotPassword} style={{ marginTop: 24 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Account Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button type="button" onClick={() => { setView('login'); setError(''); }} className="btn btn-secondary" style={{ flex: 1, height: 48, borderRadius: 12 }}>
                                Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, height: 48, borderRadius: 12, fontWeight: 700 }} disabled={isLoading}>
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send Code'}
                            </button>
                        </div>
                    </form>
                )}

                {view === 'reset' && (
                    <form className="auth-form" onSubmit={handleResetPassword} style={{ marginTop: 24 }}>
                        <div className="form-group">
                            <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Verification Code</label>
                            <input
                                type="text"
                                className="form-input"
                                style={{ height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)', textAlign: 'center', fontSize: 20, letterSpacing: 8, fontWeight: 700 }}
                                placeholder="000000"
                                maxLength={6}
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                    placeholder="Minimum 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                    placeholder="Repeat new password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button type="button" onClick={() => { setView('forgot'); setError(''); }} className="btn btn-secondary" style={{ flex: 1, height: 48, borderRadius: 12 }}>
                                Back
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2, height: 48, borderRadius: 12, fontWeight: 700 }} disabled={isLoading}>
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer" style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
                    Don't have an account? <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: 700, marginLeft: 4 }}>Create an account</Link>
                </div>
            </div>
        </div>
    );
}
