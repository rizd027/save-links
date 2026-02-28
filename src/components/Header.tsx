'use client';

import React from 'react';
import { Search, Grid3X3, List, Plus, LogOut, Menu } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
    const { filterState, setFilterState, viewMode, setViewMode, openModal, setSidebarOpen } = useApp();
    const { logout } = useAuth();

    return (
        <header className="header">
            <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)} style={{ marginRight: 8 }}>
                <Menu size={20} />
            </button>

            {/* Search */}
            <div className="header-search">
                <Search size={16} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search links, tags, collections..."
                    value={filterState.search}
                    onChange={e => setFilterState({ search: e.target.value })}
                />
            </div>

            <div className="header-actions">



                {/* Logout Button in Header */}
                <button
                    className="icon-btn logout-btn-header"
                    onClick={logout}
                    title="Logout"
                    style={{ color: 'var(--danger)' }}
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
