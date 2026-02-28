'use client';

// AuthContext for Google Sheets Authentication

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useRouter } from 'next/navigation';
import { fetchFromAppsScript } from '../lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
    updatePassword: (currentPin: string, newPin: string) => Promise<{ success: boolean; message?: string }>;
    forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetchFromAppsScript({ action: 'login', email, password });
            if (res.success) {
                setUser(res.user);
                localStorage.setItem('user', JSON.stringify(res.user));
                return { success: true, user: res.user };
            }
            return { success: false, message: res.message || 'Invalid credentials' };
        } catch (err) {
            return { success: false, message: 'Connection failed. Check your API URL.' };
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const res = await fetchFromAppsScript({ action: 'register', name, email, password });
            if (res.success) {
                return { success: true };
            }
            return { success: false, message: res.message || 'Registration failed' };
        } catch (err) {
            return { success: false, message: 'Connection failed. Check your API URL.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return { success: false, message: 'Not logged in' };

        try {
            const res = await fetchFromAppsScript({ action: 'updateProfile', email: user.email, ...data });
            if (res.success) {
                const updatedUser = { ...user, ...data };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return { success: true };
            }
            return { success: false, message: res.message || 'Update failed' };
        } catch (err: any) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    };


    const updatePassword = async (currentPassword: string, newPassword: string) => {
        if (!user) return { success: false, message: 'Not logged in' };
        try {
            const res = await fetchFromAppsScript({ action: 'updatePassword', email: user.email, currentPassword, newPassword });
            return res;
        } catch (err: any) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            const res = await fetchFromAppsScript({ action: 'requestResetCode', email });
            return res;
        } catch (err: any) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    };

    const resetPassword = async (email: string, code: string, newPassword: string) => {
        try {
            const res = await fetchFromAppsScript({ action: 'resetPassword', email, code, newPassword });
            return res;
        } catch (err: any) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword, forgotPassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
