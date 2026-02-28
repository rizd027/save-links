'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Link2, FolderOpen, Heart, Tag,
    ChevronLeft, ChevronRight, Plus, Settings,
    ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, Lock, LogOut
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { DynamicIcon } from '@/components/DynamicIcon';

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/links', icon: Link2, label: 'All Links' },
    { href: '/favorites', icon: Heart, label: 'Favorites' },
    { href: '/tags', icon: Tag, label: 'Tags' },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const {
        collections, visibleCollections, visibleLinks, sidebarOpen, setSidebarOpen,
        filterState, setFilterState, openModal,
        privateModeUnlocked, lockPrivateMode
    } = useApp();
    const { logout } = useAuth();
    const [collectionsExpanded, setCollectionsExpanded] = React.useState(true);

    const renderCollectionTree = (cols: typeof collections, depth: number) => {
        return cols.map(col => {
            const hasChildren = visibleCollections.some(c => c.parentId === col.id);
            const isActive = filterState.collectionId === col.id;
            const children = visibleCollections.filter(c => c.parentId === col.id);

            return (
                <React.Fragment key={col.id}>
                    <div className={`sidebar-collection-item${isActive ? ' active' : ''}`} style={{ paddingLeft: sidebarOpen ? 14 + (depth * 12) : 14 }}>
                        <Link
                            href="/links"
                            className="flex items-center gap-2 truncate"
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={(e) => {
                                setFilterState({ collectionId: isActive ? null : col.id });
                                if (window.innerWidth <= 768) {
                                    setSidebarOpen(false);
                                }
                            }}
                        >
                            <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>
                                <DynamicIcon name={col.icon} size={16} color={col.color} />
                            </span>
                            {sidebarOpen && <span className="truncate">{col.name}</span>}
                        </Link>

                        {sidebarOpen && (
                            <div className="sidebar-quick-actions">
                                <button className="sidebar-quick-add" onClick={(e) => { e.stopPropagation(); openModal('add-link', { collectionId: col.id } as any); }} title="Add link here">
                                    <Plus size={12} />
                                </button>
                                <button className="sidebar-quick-add" onClick={(e) => { e.stopPropagation(); openModal('add-collection', undefined, { parentId: col.id } as any); }} title="Add sub-collection">
                                    <FolderOpen size={12} />
                                </button>
                            </div>
                        )}

                        {sidebarOpen && (
                            <span className="nav-badge" style={{ fontSize: 11, marginLeft: 4 }}>
                                {visibleLinks.filter(l => l.collectionId === col.id).length}
                            </span>
                        )}
                    </div>
                    {sidebarOpen && hasChildren && (
                        <div className="collection-children">
                            {renderCollectionTree(children, depth + 1)}
                        </div>
                    )}
                </React.Fragment>
            );
        });
    };

    const favCount = visibleLinks.filter(l => l.isFavorite).length;

    return (
        <aside
            className={`sidebar${!sidebarOpen ? ' collapsed' : ' mobile-open'}`}
            onMouseEnter={() => {
                if (window.innerWidth > 768 && !sidebarOpen) {
                    setSidebarOpen(true);
                }
            }}
            onMouseLeave={() => {
                if (window.innerWidth > 768 && sidebarOpen) {
                    setSidebarOpen(false);
                }
            }}
        >
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Link2 size={18} color="white" />
                </div>
                {sidebarOpen && <span className="logo-text">SaveLinks</span>}
                <button
                    className="icon-btn mobile-only ml-auto"
                    onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}
                    style={{ color: 'var(--text-muted)' }}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {sidebarOpen && <div className="nav-label">Menu</div>}
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const count = item.href === '/favorites' ? favCount : item.href === '/links' ? visibleLinks.length : undefined;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth <= 768) {
                                        setSidebarOpen(false);
                                    }
                                }}
                            >
                                <div className={`nav-item${isActive ? ' active' : ''}`} title={!sidebarOpen ? item.label : undefined}>
                                    <span className="nav-icon"><Icon size={18} /></span>
                                    {sidebarOpen && <span>{item.label}</span>}
                                    {sidebarOpen && count !== undefined && (
                                        <span className="nav-badge">{count}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="divider" style={{ margin: '12px 0' }} />

                <div className="nav-section">
                    <div className="nav-header-toggle" onClick={() => sidebarOpen && setCollectionsExpanded(!collectionsExpanded)}>
                        {sidebarOpen && <div className="nav-label">Collections</div>}
                        {sidebarOpen && (
                            <span className={`collapse-icon ${collectionsExpanded ? 'expanded' : ''}`}>
                                <ChevronDown size={14} />
                            </span>
                        )}
                    </div>

                    <Link
                        href="/collections"
                        onClick={() => {
                            if (window.innerWidth <= 768) {
                                setSidebarOpen(false);
                            }
                        }}
                    >
                        <div className={`nav-item${pathname === '/collections' ? ' active' : ''}`} title={!sidebarOpen ? 'Collections' : undefined}>
                            <span className="nav-icon"><FolderOpen size={18} /></span>
                            {sidebarOpen && <span>All Collections</span>}
                            {sidebarOpen && <span className="nav-badge">{collections.length}</span>}
                        </div>
                    </Link>

                    {sidebarOpen && collectionsExpanded && (
                        <div className="collapsible-content">
                            {/* Recursive Collection Tree */}
                            {renderCollectionTree(visibleCollections.filter(c => !c.parentId), 0)}

                            <button
                                className="nav-item new-collection-btn"
                                onClick={() => {
                                    const activeColId = filterState.collectionId;
                                    openModal('add-collection', undefined, activeColId ? { parentId: activeColId } as any : undefined);
                                }}
                            >
                                <span className="nav-icon"><Plus size={16} /></span>
                                <span>{filterState.collectionId ? 'New Sub-Collection' : 'New Collection'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <Link
                    href="/settings"
                    onClick={() => {
                        if (window.innerWidth <= 768) {
                            setSidebarOpen(false);
                        }
                    }}
                >
                    <div className={`nav-item${pathname === '/settings' ? ' active' : ''}`} title={!sidebarOpen ? 'Settings' : undefined}>
                        <span className="nav-icon"><Settings size={18} /></span>
                        {sidebarOpen && <span>Settings</span>}
                    </div>
                </Link>

                <div
                    className={`nav-item ${privateModeUnlocked ? 'active' : ''}`}
                    onClick={() => {
                        if (privateModeUnlocked) {
                            lockPrivateMode();
                        } else {
                            openModal('unlock-private');
                        }
                        if (window.innerWidth <= 768) {
                            setSidebarOpen(false);
                        }
                    }}
                    title={!sidebarOpen ? (privateModeUnlocked ? 'Lock Private' : 'Unlock Private') : undefined}
                    style={{ cursor: 'pointer', color: privateModeUnlocked ? 'var(--danger)' : 'var(--text-muted)' }}
                >
                    <span className="nav-icon">
                        {privateModeUnlocked ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                    </span>
                    {sidebarOpen && <span>{privateModeUnlocked ? 'Private Unlocked' : 'Unlock Private'}</span>}
                </div>

                <div className="divider" style={{ margin: '8px 0', opacity: 0.5 }} />

                <div
                    className="nav-item logout-item"
                    onClick={() => {
                        logout();
                        if (window.innerWidth <= 768) {
                            setSidebarOpen(false);
                        }
                    }}
                    title={!sidebarOpen ? 'Logout' : undefined}
                    style={{ cursor: 'pointer', color: 'var(--danger)' }}
                >
                    <span className="nav-icon"><LogOut size={18} /></span>
                    {sidebarOpen && <span>Logout</span>}
                </div>
            </div>
        </aside>
    );
}
