'use client';

// Layout Wrapper with Auth Gating

import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { usePathname, useRouter } from 'next/navigation';
import Loading from '@/app/loading';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const { sidebarOpen, setSidebarOpen, isInitializing } = useApp();
    const { user, loading: authLoading } = useAuth();
    const [showLoading, setShowLoading] = React.useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = pathname === '/login' || pathname === '/register';

    useEffect(() => {
        if (!authLoading && !isInitializing) {
            setShowLoading(false);
        }
    }, [authLoading, isInitializing]);

    useEffect(() => {
        if (!authLoading && !isInitializing && !user && !isAuthPage) {
            router.replace('/login');
        }
    }, [authLoading, isInitializing, user, isAuthPage, router]);

    // Prefetch all main routes as soon as user is authenticated
    // so subsequent page navigation is instant even after clearing cache
    useEffect(() => {
        if (user) {
            router.prefetch('/links');
            router.prefetch('/favorites');
            router.prefetch('/collections');
            router.prefetch('/tags');
            router.prefetch('/settings');
        }
    }, [user, router]);

    // Body Scroll Lock for Mobile Sidebar
    useEffect(() => {
        const isMobile = window.innerWidth <= 768;
        if (sidebarOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    // Show Auth Page directly
    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="app-shell">
            {showLoading && <Loading fadeOut={!authLoading && !isInitializing} />}

            {!authLoading && !isInitializing && user && (
                <>
                    <Sidebar />

                    {/* Mobile Backdrop */}
                    {sidebarOpen && (
                        <div
                            className="sidebar-backdrop mobile-only"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <div className={`main-area${!sidebarOpen ? ' sidebar-collapsed' : ''}`}>
                        <Header />
                        <main className="page-content">
                            {children}
                        </main>
                    </div>
                </>
            )}
        </div>
    );
}
