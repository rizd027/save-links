'use client';

import React from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Link2, ChevronLeft, Lock, Unlock, Grid3X3, List } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useNotification } from '@/context/NotificationContext';
import { LinkCard } from '@/components/LinkCard';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';

export default function CollectionsPage() {
    const { collections, visibleCollections, visibleLinks, openModal, deleteCollection, updateCollection, setFilterState, viewMode, setViewMode, privateModeUnlocked } = useApp();
    const { showAlert, showToast } = useNotification();
    const router = useRouter();
    const [currentPath, setCurrentPath] = React.useState<string[]>([]); // Array of IDs
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => selected ? [...prev, id] : prev.filter(i => i !== id));
    };

    const currentCollectionId = currentPath[currentPath.length - 1] || null;
    const currentCollection = collections.find(c => c.id === currentCollectionId);

    const subCollections = visibleCollections.filter(c => c.parentId === currentCollectionId);
    const getCollectionLinks = (colId: string) => visibleLinks.filter(l => l.collectionId === colId);
    const currentLinks = currentCollectionId ? getCollectionLinks(currentCollectionId) : [];

    const handleViewLinks = (colId: string) => {
        setFilterState({ collectionId: colId });
        router.push('/links');
    };

    const enterFolder = (colId: string) => {
        setCurrentPath([...currentPath, colId]);
    };

    const navigateTo = (index: number) => {
        if (index === -1) setCurrentPath([]);
        else setCurrentPath(currentPath.slice(0, index + 1));
    };

    return (
        <div>
            <div className="page-head">
                <div style={{ flex: 1 }}>
                    <h1 className="page-title">Collections</h1>
                    <div className="breadcrumb" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                        {currentPath.length > 0 && (
                            <button
                                className="icon-btn"
                                onClick={() => navigateTo(currentPath.length - 2)}
                                title="Go back"
                                style={{ width: 24, height: 24, marginRight: 4, background: 'var(--bg-tertiary)' }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <span style={{ cursor: 'pointer' }} onClick={() => navigateTo(-1)}>Root</span>
                        {currentPath.map((id, idx) => {
                            const col = collections.find(c => c.id === id);
                            return (
                                <React.Fragment key={id}>
                                    <span>/</span>
                                    <span
                                        style={{ cursor: 'pointer', color: idx === currentPath.length - 1 ? 'var(--text-primary)' : 'inherit' }}
                                        onClick={() => navigateTo(idx)}
                                    >
                                        {col?.name || 'Unknown'}
                                    </span>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {currentCollectionId && (
                        <button className="btn btn-secondary" onClick={() => openModal('add-link', { collectionId: currentCollectionId } as any)}>
                            <Plus size={16} /> Add Link
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => openModal('add-collection', undefined, currentCollectionId ? { parentId: currentCollectionId } as any : undefined)}>
                        <Plus size={16} /> New {currentCollectionId ? 'Sub-Collection' : 'Collection'}
                    </button>
                </div>
            </div>

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

            {subCollections.length > 0 || currentLinks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Sub-Collections Section */}
                    {subCollections.length > 0 && (
                        <div>
                            {currentCollectionId && <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Folders</h3>}
                            <div className={viewMode === 'grid' ? 'collections-grid' : 'collections-list'}>
                                {subCollections.map(col => {
                                    const colLinks = getCollectionLinks(col.id);
                                    const hasSub = visibleCollections.some(c => c.parentId === col.id);

                                    if (viewMode === 'list') {
                                        return (
                                            <div key={col.id} className="collection-list-item" style={{ borderLeft: `4px solid ${col.color}` }} onClick={() => hasSub ? enterFolder(col.id) : handleViewLinks(col.id)}>
                                                <div className="collection-icon-wrap" style={{ background: col.color + '22', color: col.color, width: 40, height: 40, borderRadius: 10, fontSize: 18 }}>
                                                    <DynamicIcon name={col.icon} size={18} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="collection-name" style={{ fontSize: 15 }}>{col.name}</div>
                                                    <div className="collection-desc" style={{ fontSize: 12, marginTop: 1 }}>{col.description || 'No description'}</div>
                                                </div>
                                                {hasSub && (
                                                    <div className="folder-indicator" style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <FolderOpen size={12} /> Sub-folders
                                                    </div>
                                                )}
                                                <div className="collection-count" style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 8 }}>
                                                    <Link2 size={12} />
                                                    <span>{colLinks.length}</span>
                                                    {col.isPrivate && <Lock size={10} style={{ marginLeft: 6, color: 'var(--danger)' }} />}
                                                </div>
                                                <div className="link-card-actions" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className={`icon-btn ${col.isPrivate ? 'active' : ''}`}
                                                        onClick={() => updateCollection(col.id, { isPrivate: !col.isPrivate })}
                                                        title={col.isPrivate ? "Make Public" : "Make Private"}
                                                        style={{ color: col.isPrivate ? 'var(--danger)' : 'inherit' }}
                                                    >
                                                        {col.isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                                                    </button>
                                                    <button className="icon-btn" onClick={() => openModal('edit-collection', undefined, col)} title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={() => {
                                                        showAlert({
                                                            title: 'Delete Collection?',
                                                            message: `Are you sure you want to delete "${col.name}"? This will move sub-collections to root.`,
                                                            type: 'danger',
                                                            confirmText: 'Delete Now',
                                                            onConfirm: () => {
                                                                deleteCollection(col.id);
                                                                showToast('info', 'Collection removed', `"${col.name}" has been deleted.`);
                                                            }
                                                        });
                                                    }} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={col.id} className="collection-card" style={{ borderTop: `3px solid ${col.color}` }} onClick={() => enterFolder(col.id)}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <div className="collection-icon-wrap" style={{ background: col.color + '22', color: col.color }}>
                                                    <DynamicIcon name={col.icon} size={24} />
                                                </div>
                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    <button
                                                        className={`icon-btn ${col.isPrivate ? 'active' : ''}`}
                                                        onClick={() => updateCollection(col.id, { isPrivate: !col.isPrivate })}
                                                        title={col.isPrivate ? "Make Public" : "Make Private"}
                                                        style={{ color: col.isPrivate ? 'var(--danger)' : 'inherit' }}
                                                    >
                                                        {col.isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                                                    </button>
                                                    <button className="icon-btn" onClick={() => openModal('edit-collection', undefined, col)} title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={() => {
                                                        showAlert({
                                                            title: 'Delete Collection?',
                                                            message: `Are you sure you want to delete "${col.name}"? Sub-collections will be moved to root.`,
                                                            type: 'danger',
                                                            confirmText: 'Delete Now',
                                                            onConfirm: () => {
                                                                deleteCollection(col.id);
                                                                showToast('info', 'Collection removed', `"${col.name}" has been deleted.`);
                                                            }
                                                        });
                                                    }} title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="collection-name">{col.name}</div>
                                                {col.description && <div className="collection-desc">{col.description}</div>}
                                            </div>

                                            {/* Sample favicon previews */}
                                            {colLinks.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {colLinks.slice(0, 4).map(link => (
                                                        <img
                                                            key={link.id}
                                                            src={link.favicon}
                                                            alt=""
                                                            width={20}
                                                            height={20}
                                                            style={{ borderRadius: 4, objectFit: 'contain', background: 'var(--bg-tertiary)' }}
                                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    ))}
                                                    {colLinks.length > 4 && (
                                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>+{colLinks.length - 4} more</span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="collection-footer">
                                                <div className="collection-count">
                                                    <Link2 size={13} />
                                                    {colLinks.length} items
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); handleViewLinks(col.id); }}>
                                                        Links
                                                    </button>
                                                    {hasSub && (
                                                        <div style={{ color: 'var(--accent-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <FolderOpen size={14} /> View Sub
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Links Section */}
                    {currentLinks.length > 0 && (
                        <div>
                            {currentCollectionId && subCollections.length > 0 && (
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Links</h3>
                            )}

                            {/* Selection Status */}
                            {selectedIds.length > 0 && (
                                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds([])}>
                                        Clear Selection ({selectedIds.length})
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(currentLinks.map(l => l.id))}>
                                        Select All
                                    </button>
                                </div>
                            )}

                            <div className={viewMode === 'grid' ? 'links-grid' : 'links-list'}>
                                {currentLinks.map(link => (
                                    <LinkCard
                                        key={link.id}
                                        link={link}
                                        viewMode={viewMode}
                                        isSelected={selectedIds.includes(link.id)}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <FolderOpen size={32} color="var(--text-muted)" />
                    </div>
                    <div className="empty-title">No {currentCollectionId ? 'content' : 'collections'} here</div>
                    <div className="empty-desc">
                        {currentCollectionId ? 'This folder is empty.' : 'Start by creating a collection to group your links.'}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        {currentCollectionId && (
                            <button className="btn btn-secondary" onClick={() => openModal('add-link', { collectionId: currentCollectionId } as any)}>
                                <Plus size={16} /> Add Link
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => openModal('add-collection', undefined, currentCollectionId ? { parentId: currentCollectionId } as any : undefined)}>
                            <Plus size={16} /> Add {currentCollectionId ? 'Sub-Collection' : 'Collection'}
                        </button>
                    </div>
                </div>
            )}
            <BulkActionToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}
