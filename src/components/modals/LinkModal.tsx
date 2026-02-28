'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/data';
import { DynamicIcon } from '@/components/DynamicIcon';
import { CustomSelect } from '@/components/CustomSelect';

export function AddLinkModal() {
    const { closeModal, addLink, updateLink, selectedLink, collections, activeModal } = useApp();
    const isEdit = activeModal === 'edit-link';

    const [form, setForm] = useState({
        title: '',
        url: '',
        description: '',
        tags: '',
        collectionId: '' as string,
        isFavorite: false,
        favicon: '',
        color: '#6366f1',
        isPrivate: false,
    });

    useEffect(() => {
        if (isEdit && selectedLink) {
            setForm({
                title: selectedLink.title,
                url: selectedLink.url,
                description: selectedLink.description,
                tags: selectedLink.tags.join(', '),
                collectionId: selectedLink.collectionId || '',
                isFavorite: selectedLink.isFavorite,
                favicon: selectedLink.favicon,
                color: selectedLink.color || '#6366f1',
                isPrivate: selectedLink.isPrivate || false,
            });
        } else if (!isEdit && selectedLink && selectedLink.collectionId) {
            // Handle template for new link in a specific collection
            const parentCol = collections.find(c => c.id === selectedLink.collectionId);
            setForm(prev => ({
                ...prev,
                collectionId: selectedLink.collectionId || '',
                isPrivate: parentCol?.isPrivate || false
            }));
        }
    }, [isEdit, selectedLink]);

    const handleUrlBlur = async () => {
        if (form.url && !form.favicon) {
            try {
                const url = new URL(form.url.startsWith('http') ? form.url : 'https://' + form.url);
                setForm(f => ({ ...f, favicon: `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}` }));
                if (!form.title) {
                    setForm(f => ({ ...f, title: url.hostname.replace('www.', '') }));
                }
            } catch { }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
        const url = form.url.startsWith('http') ? form.url : 'https://' + form.url;
        const favicon = form.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;

        if (isEdit && selectedLink) {
            updateLink(selectedLink.id, { ...form, url, tags, favicon, collectionId: form.collectionId || null });
        } else {
            addLink({ ...form, url, tags, favicon, collectionId: form.collectionId || null });
        }
        closeModal();
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Link' : 'Add New Link'}</h2>
                    <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">URL *</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="https://example.com"
                                value={form.url}
                                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                onBlur={handleUrlBlur}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Link title"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                placeholder="Short description..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (comma separated)</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="react, frontend, tools"
                                value={form.tags}
                                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Collection</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'No collection' },
                                    ...collections.map(col => ({ value: col.id, label: col.name }))
                                ]}
                                value={form.collectionId}
                                onChange={val => setForm(f => ({ ...f, collectionId: val }))}
                                placeholder="Select a collection"
                            />
                        </div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={form.isFavorite}
                                    onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))}
                                />
                                <span className="checkmark"></span>
                                Mark as Favorite
                            </label>
                            <label className="checkbox-container private">
                                <input
                                    type="checkbox"
                                    checked={form.isPrivate}
                                    onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                                />
                                <span className="checkmark"></span>
                                Private Link
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Add Link'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function AddCollectionModal() {
    const { closeModal, addCollection, updateCollection, selectedCollection, activeModal, collections } = useApp();
    const isEdit = activeModal === 'edit-collection';

    const [form, setForm] = useState({
        name: '',
        description: '',
        icon: 'Code',
        color: COLLECTION_COLORS[0],
        parentId: null as string | null,
        isPrivate: false,
    });

    useEffect(() => {
        if (isEdit && selectedCollection) {
            setForm({
                name: selectedCollection.name,
                description: selectedCollection.description,
                icon: selectedCollection.icon,
                color: selectedCollection.color,
                parentId: selectedCollection.parentId || null,
                isPrivate: selectedCollection.isPrivate || false,
            });
        } else if (!isEdit && selectedCollection && selectedCollection.parentId) {
            // Handle template for new sub-collection
            setForm(prev => ({
                ...prev,
                parentId: selectedCollection.parentId || null
            }));
        }
    }, [isEdit, selectedCollection]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && selectedCollection) {
            updateCollection(selectedCollection.id, { ...form, parentId: form.parentId || null });
        } else {
            addCollection({ ...form, parentId: form.parentId || null });
        }
        closeModal();
    };

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEdit ? 'Edit Collection' : 'New Collection'}</h2>
                    <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Icon preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: form.color + '22', border: `2px solid ${form.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.color, flexShrink: 0 }}>
                                <DynamicIcon name={form.icon} size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.name || 'Collection Name'}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{form.description || 'Description'}</div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input className="form-input" type="text" placeholder="Collection name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="form-input" type="text" placeholder="Short description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Parent Collection</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'Root (No Parent)' },
                                    ...collections
                                        .filter(c => !isEdit || c.id !== selectedCollection?.id) // Prevent self-parenting
                                        .map(c => ({ value: c.id, label: c.name }))
                                ]}
                                value={form.parentId || ''}
                                onChange={val => setForm(f => ({ ...f, parentId: val || null }))}
                                placeholder="Select parent"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Icon</label>
                            <div className="icon-picker-row">
                                {COLLECTION_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`icon-option${form.icon === icon ? ' selected' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, icon }))}
                                        style={{ color: form.icon === icon ? 'var(--accent-secondary)' : 'var(--text-muted)' }}
                                    >
                                        <DynamicIcon name={icon} size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Color</label>
                            <div className="color-picker-row">
                                {COLLECTION_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-swatch${form.color === color ? ' selected' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => setForm(f => ({ ...f, color }))}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="checkbox-container private">
                                <input
                                    type="checkbox"
                                    checked={form.isPrivate}
                                    onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                                />
                                <span className="checkmark"></span>
                                Private Collection
                            </label>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 28 }}>
                                Marking a collection as private will also hide all links and sub-collections inside it.
                            </p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Create Collection'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
