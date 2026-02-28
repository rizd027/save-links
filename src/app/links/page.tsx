'use client';

import React from 'react';
import { Link2, Plus, SortAsc, Grid3X3, List } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LinkCard } from '@/components/LinkCard';
import { CustomSelect } from '@/components/CustomSelect';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'clicks', label: 'Most clicked' },
    { value: 'favorites', label: 'Favorites first' },
];

export default function LinksPage() {
    const { filteredLinks, filterState, setFilterState, viewMode, setViewMode, openModal, allTags, collections } = useApp();
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => selected ? [...prev, id] : prev.filter(i => i !== id));
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <h1 className="page-title">All Links</h1>
                    <p className="page-subtitle">{filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''} found</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal('add-link', filterState.collectionId ? { collectionId: filterState.collectionId } as any : undefined)}>
                    <Plus size={16} /> Add Link
                </button>
            </div>

            {/* Selection Status */}
            {selectedIds.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds([])}>
                        Clear Selection ({selectedIds.length})
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(filteredLinks.map(l => l.id))}>
                        Select All
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
                {/* Favorites filter */}
                <button
                    className={`filter-chip${filterState.favoritesOnly ? ' active' : ''}`}
                    onClick={() => setFilterState({ favoritesOnly: !filterState.favoritesOnly })}
                >
                    ⭐ Favorites
                </button>

                {/* Collection filters */}
                {collections.map(col => (
                    <button
                        key={col.id}
                        className={`filter-chip${filterState.collectionId === col.id ? ' active' : ''}`}
                        onClick={() => setFilterState({ collectionId: filterState.collectionId === col.id ? null : col.id })}
                    >
                        {col.icon} {col.name}
                    </button>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', minWidth: 160 }}>
                    <SortAsc size={16} color="var(--text-muted)" />
                    <CustomSelect
                        options={SORT_OPTIONS}
                        value={filterState.sortBy}
                        onChange={val => setFilterState({ sortBy: val as any })}
                        placeholder="Sort by..."
                    />

                    <div className="divider-v" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />

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
            </div>

            {/* Active Tags */}
            {filterState.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Filtered by tags:</span>
                    {filterState.tags.map(tag => (
                        <button key={tag} className="tag active" onClick={() => setFilterState({ tags: filterState.tags.filter(t => t !== tag) })}>
                            #{tag} ×
                        </button>
                    ))}
                    <button className="btn btn-sm btn-secondary" onClick={() => setFilterState({ tags: [] })}>Clear tags</button>
                </div>
            )}

            {/* Links Grid/List */}
            {filteredLinks.length > 0 ? (
                <div className={viewMode === 'grid' ? 'links-grid' : 'links-list'}>
                    {filteredLinks.map(link => (
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
                        <Link2 size={32} color="var(--text-muted)" />
                    </div>
                    <div className="empty-title">No links found</div>
                    <div className="empty-desc">
                        {filterState.search || filterState.collectionId || filterState.tags.length > 0 || filterState.favoritesOnly
                            ? 'Try adjusting your filters or search query.'
                            : 'Start adding links to your collection.'}
                    </div>
                    {!filterState.search && !filterState.collectionId && filterState.tags.length === 0 && !filterState.favoritesOnly && (
                        <button className="btn btn-primary" onClick={() => openModal('add-link')}>
                            <Plus size={16} /> Add your first link
                        </button>
                    )}
                </div>
            )}

            <BulkActionToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}
