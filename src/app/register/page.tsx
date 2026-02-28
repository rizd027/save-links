'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function RegisterPage() {
    const { user, register } = useAuth();
    const { showToast } = useNotification();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await register(name, email, password);
        if (result.success) {
            setIsSuccess(true);
            showToast('success', 'Account Created!', 'Registration successful! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } else {
            setError(result.message || 'Registration failed');
            showToast('error', 'Registration Failed', result.message || 'Please check your details.');
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
                    <h1 className="auth-title gradient-text" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>Create Account</h1>
                    <p className="auth-subtitle">Join us to start organizing your links</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
                    {error && (
                        <div className="alert alert-danger animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <AlertCircle size={16} />
                            Registration successful! Redirecting to login...
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
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
                        <label className="form-label" style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-input"
                                style={{ paddingLeft: 44, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary animate-fade-in" style={{ width: '100%', height: 48, marginTop: 24, borderRadius: 12, fontSize: 15, fontWeight: 700, gap: 10, background: 'var(--gradient-primary)', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }} disabled={isLoading}>
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><UserPlus size={20} /> Register</>}
                    </button>
                </form>

                <div className="auth-footer" style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
                    Already have an account? <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, marginLeft: 4 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}
