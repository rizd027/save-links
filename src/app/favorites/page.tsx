'use client';

import React from 'react';
import { Heart, Plus, Grid3X3, List } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LinkCard } from '@/components/LinkCard';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';

export default function FavoritesPage() {
    const { visibleLinks, viewMode, setViewMode, openModal } = useApp();
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const favorites = visibleLinks.filter(l => l.isFavorite);

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => selected ? [...prev, id] : prev.filter(i => i !== id));
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <h1 className="page-title">Favorites</h1>
                    <p className="page-subtitle">{favorites.length} favorite link{favorites.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('add-link')}>
                    <Plus size={16} /> Add Link
                </button>
            </div>

            {/* Selection Status */}
            {selectedIds.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds([])}>
                        Clear Selection ({selectedIds.length})
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(favorites.map(l => l.id))}>
                        Select All
                    </button>
                </div>
            )}

            {/* Filter Bar with View Toggle */}
            <div className="filter-bar" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
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

            {favorites.length > 0 ? (
                <div className={viewMode === 'grid' ? 'links-grid' : 'links-list'}>
                    {favorites.map(link => (
                        <LinkCard
                            key={link.id}
                            link={link}
                            viewMode={viewMode}
                            isSelected={selectedIds.includes(link.id)}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Heart size={32} color="var(--text-muted)" />
                    </div>
                    <div className="empty-title">No favorites yet</div>
                    <div className="empty-desc">
                        Star your most important links to access them quickly here.
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal('add-link')}>
                        <Plus size={16} /> Add a link
                    </button>
                </div>
            )}

            <BulkActionToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}
