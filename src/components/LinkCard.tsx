'use client';

import React, { useState } from 'react';
import { Heart, ExternalLink, Edit2, Trash2, Copy, Star, Lock } from 'lucide-react';
import { Link } from '@/types';
import { useApp } from '@/context/AppContext';
import { useNotification } from '@/context/NotificationContext';

interface LinkCardProps {
    link: Link;
    viewMode?: 'grid' | 'list';
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
}

export function LinkCard({ link, viewMode = 'grid', isSelected = false, onSelect }: LinkCardProps) {
    const { toggleFavorite, deleteLink, incrementClick, openModal, filterState, setFilterState } = useApp();
    const { showAlert, showToast } = useNotification();
    const [imgError, setImgError] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleOpen = () => {
        incrementClick(link.id);
        window.open(link.url, '_blank', 'noopener,noreferrer');
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(link.url);
        setCopied(true);
        showToast('success', 'URL Copied', 'The link has been copied to your clipboard.');
        setTimeout(() => setCopied(false), 1500);
    };

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(link.id);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal('edit-link', link);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        showAlert({
            title: 'Delete Link?',
            message: `Are you sure you want to delete "${link.title}"? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Now',
            onConfirm: () => {
                deleteLink(link.id);
                showToast('info', 'Link removed', `"${link.title}" has been deleted.`);
            }
        });
    };

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        const current = filterState.tags;
        setFilterState({
            tags: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
        });
    };

    const hostname = (() => {
        try { return new URL(link.url).hostname.replace('www.', ''); }
        catch { return link.url; }
    })();

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(link.id, !isSelected);
    };

    const checkbox = onSelect && (
        <div className={`link-checkbox ${isSelected ? 'selected' : ''}`} onClick={handleSelect}>
            <div className="checkbox-inner">
                {isSelected && <div className="checkbox-check" />}
            </div>
        </div>
    );

    const actions = (
        <div className="link-card-actions">
            <button className={`icon-btn favorite${link.isFavorite ? ' active' : ''}`} onClick={handleFavorite} title={link.isFavorite ? 'Remove favorite' : 'Add favorite'}>
                {link.isFavorite ? <Star size={14} fill="currentColor" /> : <Heart size={14} />}
            </button>
            <button className="icon-btn" onClick={handleCopy} title="Copy URL">
                <Copy size={14} />
            </button>
            <button className="icon-btn" onClick={handleEdit} title="Edit">
                <Edit2 size={14} />
            </button>
            <button className="icon-btn danger" onClick={handleDelete} title="Delete">
                <Trash2 size={14} />
            </button>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <div className={`link-list-item ${isSelected ? 'selected' : ''}`} onClick={handleOpen}>
                {checkbox}
                <div className="link-favicon" style={{ flexShrink: 0 }}>
                    {!imgError ? (
                        <img src={link.favicon} alt="" onError={() => setImgError(true)} />
                    ) : (
                        <ExternalLink size={16} color="var(--text-muted)" />
                    )}
                </div>
                <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div className="link-title truncate" style={{ fontSize: 13, fontWeight: 700 }}>{link.title}</div>
                    <div className="link-url truncate" style={{ fontSize: 11, opacity: 0.7 }}>{hostname}</div>
                </div>
                <div className="desktop-only" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200, justifyContent: 'flex-start', margin: '0 8px' }}>
                    {link.tags.slice(0, 2).map(tag => (
                        <span key={tag} className={`tag${filterState.tags.includes(tag) ? ' active' : ''}`}
                            style={{ fontSize: 9, padding: '1px 6px' }}
                            onClick={e => handleTagClick(e, tag)}>
                            #{tag}
                        </span>
                    ))}
                </div>
                <div className="link-meta" style={{ flexShrink: 0, gap: 6 }}>
                    <span className="link-meta-item" style={{ fontSize: 10, opacity: 0.7 }}>
                        <ExternalLink size={10} /> {link.clickCount}
                    </span>
                    {link.isFavorite && <Star size={11} fill="var(--warning)" color="var(--warning)" />}
                    {link.isPrivate && <Lock size={10} className="text-danger" style={{ opacity: 0.8 }} />}
                </div>
                <div className="link-card-actions desktop-only" style={{ marginLeft: 'auto' }}>
                    <button className={`icon-btn favorite${link.isFavorite ? ' active' : ''}`} onClick={handleFavorite} title={link.isFavorite ? 'Remove favorite' : 'Add favorite'} style={{ width: 26, height: 26 }}>
                        {link.isFavorite ? <Star size={13} fill="currentColor" /> : <Heart size={13} />}
                    </button>
                    <button className="icon-btn" onClick={handleCopy} title="Copy URL" style={{ width: 26, height: 26 }}>
                        <Copy size={13} />
                    </button>
                    <button className="icon-btn" onClick={handleEdit} title="Edit" style={{ width: 26, height: 26 }}>
                        <Edit2 size={13} />
                    </button>
                    <button className="icon-btn danger" onClick={handleDelete} title="Delete" style={{ width: 26, height: 26 }}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`link-card ${isSelected ? 'selected' : ''}`} onClick={handleOpen}>
            {checkbox}
            <div className="link-card-header">
                <div className="link-favicon">
                    {!imgError ? (
                        <img src={link.favicon} alt="" onError={() => setImgError(true)} />
                    ) : (
                        <ExternalLink size={16} color="var(--text-muted)" />
                    )}
                </div>
                <div className="link-title-url">
                    <div className="link-title">{link.title}</div>
                    <div className="link-url">{hostname}</div>
                </div>
                {actions}
            </div>

            {link.description && (
                <p className="link-description">{link.description}</p>
            )}

            {link.tags.length > 0 && (
                <div className="link-tags">
                    {link.tags.map(tag => (
                        <span key={tag} className={`tag${filterState.tags.includes(tag) ? ' active' : ''}`} onClick={e => handleTagClick(e, tag)}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="link-card-footer">
                <div className="link-meta">
                    <span className="link-meta-item">
                        <ExternalLink size={11} /> {link.clickCount} clicks
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {copied && <span style={{ fontSize: 11, color: 'var(--success)' }}>Copied!</span>}
                    {link.isFavorite && <Star size={13} fill="var(--warning)" color="var(--warning)" />}
                    {link.isPrivate && <Lock size={12} className="text-danger" style={{ opacity: 0.8 }} />}
                </div>
            </div>
        </div>
    );
}
