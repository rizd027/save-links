'use client';

import React from 'react';
import { Link2, FolderOpen, Heart, Tag, TrendingUp, Star, ExternalLink, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LinkCard } from '@/components/LinkCard';

export default function DashboardPage() {
    const { visibleLinks, collections, openModal } = useApp();

    const totalClicks = visibleLinks.reduce((sum, l) => sum + l.clickCount, 0);
    const favorites = visibleLinks.filter(l => l.isFavorite);
    const allTags = Array.from(new Set(visibleLinks.flatMap(l => l.tags)));
    const recentLinks = [...visibleLinks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
    const topLinks = [...visibleLinks].sort((a, b) => b.clickCount - a.clickCount).slice(0, 5);

    const stats = [
        { label: 'Total Links', value: visibleLinks.length, icon: Link2, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
        { label: 'Collections', value: collections.length, icon: FolderOpen, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        { label: 'Favorites', value: favorites.length, icon: Heart, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        { label: 'Total Clicks', value: totalClicks, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        { label: 'Tags Used', value: allTags.length, icon: Tag, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    ];

    return (
        <div>
            {/* Page Head */}
            <div className="page-head">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back! Here&#39;s your link overview.</p>
                </div>
                <button className="btn btn-primary desktop-only" onClick={() => openModal('add-link')}>
                    <Plus size={16} /> Add Link
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {stats.map(stat => (
                    <div key={stat.label} className="stat-card">
                        <div className="stat-icon-wrap" style={{ background: stat.bg }}>
                            <stat.icon size={22} color={stat.color} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value" style={{ color: stat.color }}>{stat.value.toLocaleString()}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="recent-grid">
                {/* Recent Links */}
                <div>
                    <div className="section-title">
                        <Link2 size={18} color="var(--accent-secondary)" />
                        Recently Added
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recentLinks.map(link => (
                            <LinkCard key={link.id} link={link} viewMode="list" />
                        ))}
                    </div>
                    {visibleLinks.length === 0 && (
                        <div className="empty-state" style={{ padding: '40px 0' }}>
                            <div className="empty-title">No links yet</div>
                            <button className="btn btn-primary btn-sm" onClick={() => openModal('add-link')}>
                                <Plus size={14} /> Add your first link
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Favorites */}
                    <div>
                        <div className="section-title">
                            <Star size={18} color="#f59e0b" fill="#f59e0b" />
                            Favorites
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {favorites.slice(0, 4).map(link => (
                                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                >
                                    <img src={link.favicon} alt="" width={16} height={16} style={{ borderRadius: 3, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title}</span>
                                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                                </a>
                            ))}
                            {favorites.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No favorites yet</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
