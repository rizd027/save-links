'use client';

import React from 'react';
import { Tag, Link2, Grid3X3, List } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function TagsPage() {
    const { visibleLinks, filterState, setFilterState, viewMode, setViewMode } = useApp();
    const router = useRouter();

    // Build tag stats
    const tagStats = visibleLinks.flatMap(l => l.tags).reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});

    const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);
    const maxCount = sortedTags[0]?.[1] || 1;

    const TAG_COLORS = [
        '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#06b6d4',
        '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16',
    ];

    const handleTagClick = (tag: string) => {
        const isAlreadyActive = filterState.tags.includes(tag);
        const newTags = isAlreadyActive
            ? filterState.tags.filter(t => t !== tag)
            : [...filterState.tags, tag];
        setFilterState({ tags: newTags });
        // Only navigate to the links page when adding a tag filter
        if (!isAlreadyActive) {
            router.push('/links');
        }
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <h1 className="page-title">Tags</h1>
                    <p className="page-subtitle">{sortedTags.length} unique tags across {visibleLinks.length} links</p>
                </div>
            </div>

            {sortedTags.length > 0 ? (
                <div>
                    {/* Tag Cloud */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '32px',
                        marginBottom: 32,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {sortedTags.map(([tag, count], i) => {
                            const size = 12 + Math.floor((count / maxCount) * 12);
                            const color = TAG_COLORS[i % TAG_COLORS.length];
                            const isActive = filterState.tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    style={{
                                        fontSize: size,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? 'white' : color,
                                        background: isActive ? color : color + '18',
                                        border: `1.5px solid ${color}${isActive ? 'ff' : '44'}`,
                                        borderRadius: 20,
                                        padding: '4px 14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = color + '30';
                                            e.currentTarget.style.borderColor = color + '88';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = color + '18';
                                            e.currentTarget.style.borderColor = color + '44';
                                        }
                                    }}
                                >
                                    #{tag}
                                    <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>({count})</span>
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div className="section-title" style={{ marginBottom: 0 }}>
                            <Tag size={18} color="var(--accent-secondary)" />
                            All Tags
                        </div>
                        <div className="view-toggle">
                            <button
                                className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? 'tags-grid' : 'tags-list'}>
                        {sortedTags.map(([tag, count], i) => {
                            const color = TAG_COLORS[i % TAG_COLORS.length];
                            const isActive = filterState.tags.includes(tag);
                            const tagLinks = visibleLinks.filter(l => l.tags.includes(tag));

                            if (viewMode === 'list') {
                                return (
                                    <div
                                        key={tag}
                                        className="tag-list-item"
                                        onClick={() => handleTagClick(tag)}
                                        style={{ borderLeft: `4px solid ${color}` }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Tag size={16} color={color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>#{tag}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Link2 size={11} /> {count} link{count !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {tagLinks.slice(0, 5).map(link => (
                                                <img
                                                    key={link.id}
                                                    src={link.favicon}
                                                    alt=""
                                                    width={18}
                                                    height={18}
                                                    style={{ borderRadius: 4, objectFit: 'contain', background: 'var(--bg-tertiary)' }}
                                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={tag}
                                    className="tag-grid-item"
                                    onClick={() => handleTagClick(tag)}
                                    style={{
                                        background: isActive ? color + '18' : 'var(--bg-card)',
                                        border: `1px solid ${isActive ? color + '55' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                    }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
                                >
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Tag size={16} color={color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>#{tag}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            <Link2 size={11} /> {count} link{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    {/* Favicon previews */}
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {tagLinks.slice(0, 3).map(link => (
                                            <img
                                                key={link.id}
                                                src={link.favicon}
                                                alt=""
                                                width={16}
                                                height={16}
                                                style={{ borderRadius: 3, objectFit: 'contain' }}
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Tag size={32} color="var(--text-muted)" />
                    </div>
                    <div className="empty-title">No tags yet</div>
                    <div className="empty-desc">
                        Add tags to your links to organize and filter them easily.
                    </div>
                </div>
            )}
        </div>
    );
}
