'use client';

import React, { useState } from 'react';
import { Trash2, FolderInput, Star, X, Check, Lock, Unlock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotification } from '@/context/NotificationContext';
import { CustomSelect } from './CustomSelect';

interface BulkActionToolbarProps {
    selectedIds: string[];
    onClear: () => void;
}

export function BulkActionToolbar({ selectedIds, onClear }: BulkActionToolbarProps) {
    const { collections, deleteMultipleLinks, moveLinksToCollection, toggleFavoriteBatch, updateLink } = useApp();
    const { showAlert, showToast } = useNotification();
    const [isMoving, setIsMoving] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleDelete = () => {
        showAlert({
            title: `Delete ${selectedIds.length} items?`,
            message: `Are you sure you want to delete these ${selectedIds.length} links? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete All',
            onConfirm: () => {
                deleteMultipleLinks(selectedIds);
                showToast('info', 'Links deleted', `${selectedIds.length} links have been removed.`);
                onClear();
            }
        });
    };

    const handleMove = (targetId: string | null) => {
        moveLinksToCollection(selectedIds, targetId);
        showToast('success', 'Links moved', `Successfully moved ${selectedIds.length} links.`);
        setIsMoving(false);
        onClear();
    };

    const handleFavorite = (fav: boolean) => {
        toggleFavoriteBatch(selectedIds, fav);
        showToast('success', 'Favorites updated', `Marked ${selectedIds.length} links as ${fav ? 'favorite' : 'not favorite'}.`);
        onClear();
    };

    const handleTogglePrivate = (isPriv: boolean) => {
        selectedIds.forEach(id => updateLink(id, { isPrivate: isPriv }));
        showToast('success', 'Privacy updated', `Marked ${selectedIds.length} links as ${isPriv ? 'private' : 'public'}.`);
        onClear();
    };

    const moveOptions = [
        { value: 'root', label: 'Move to Root (No Folder)' },
        ...collections.map(c => ({ value: c.id, label: `Move to ${c.name}` }))
    ];

    return (
        <div className="bulk-toolbar shadow-lg">
            <div className="bulk-info">
                <div className="bulk-count">{selectedIds.length}</div>
                <span className="bulk-label">Items selected</span>
            </div>

            <div className="bulk-divider" />

            <div className="bulk-actions">
                {isMoving ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                        <CustomSelect
                            options={moveOptions}
                            value=""
                            onChange={(val) => handleMove(val === 'root' ? null : val)}
                            placeholder="Select destination..."
                            direction="up"
                        />
                        <button className="icon-btn" onClick={() => setIsMoving(false)}>
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <button className="bulk-btn" onClick={() => setIsMoving(true)}>
                            <FolderInput size={16} /> Move
                        </button>
                        <button className="bulk-btn" onClick={() => handleFavorite(true)}>
                            <Star size={16} /> Favorite
                        </button>
                        <button className="bulk-btn" onClick={() => handleTogglePrivate(true)}>
                            <Lock size={16} /> Private
                        </button>
                        <button className="bulk-btn" onClick={() => handleTogglePrivate(false)}>
                            <Unlock size={16} /> Public
                        </button>
                        <button className="bulk-btn danger" onClick={handleDelete}>
                            <Trash2 size={16} /> Delete
                        </button>
                    </>
                )}
            </div>

            <button className="bulk-close" onClick={onClear} title="Clear selection">
                <X size={18} />
            </button>

            <style>{`
                .bulk-toolbar {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(17, 20, 29, 0.95);
                    backdrop-filter: blur(12px) saturate(180%);
                    border: 1px solid var(--accent-primary);
                    border-radius: 20px;
                    padding: 8px 16px 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    z-index: 1000;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2);
                }

                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }

                .bulk-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .bulk-count {
                    background: var(--accent-primary);
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 700;
                }

                .bulk-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .bulk-divider {
                    width: 1px;
                    height: 24px;
                    background: var(--border);
                }

                .bulk-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .bulk-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    background: transparent;
                }

                .bulk-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .bulk-btn.danger:hover {
                    color: var(--danger);
                    background: rgba(239, 68, 68, 0.1);
                }

                .bulk-close {
                    margin-left: 8px;
                    color: var(--text-muted);
                    padding: 4px;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }

                .bulk-close:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                @media (max-width: 768px) {
                    .bulk-toolbar {
                        bottom: 16px;
                        width: calc(100% - 24px);
                        padding: 6px 10px;
                        gap: 8px;
                        border-radius: 16px;
                    }
                    .bulk-label {
                        display: none;
                    }
                    .bulk-divider {
                        height: 20px;
                    }
                    .bulk-actions {
                        gap: 4px;
                        flex: 1;
                        justify-content: space-around;
                    }
                    .bulk-btn {
                        padding: 8px;
                        gap: 0;
                        font-size: 0; /* Hide text */
                        min-width: 40px;
                        height: 40px;
                        justify-content: center;
                        border-radius: 12px;
                        background: rgba(255, 255, 255, 0.03);
                    }
                    .bulk-btn :global(svg) {
                        width: 18px;
                        height: 18px;
                    }
                    .bulk-close {
                        margin-left: 4px;
                    }
                }
            `}</style>
        </div>
    );
}
