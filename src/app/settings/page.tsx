'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Download, Upload, Trash2, Link2, Database, Info, ShieldAlert, FileJson, FileSpreadsheet, FileText, ChevronDown, User, Camera, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function SettingsPage() {
    const { links, collections, masterPin, updateMasterPin, importData, clearAllData } = useApp();
    const { user, updateProfile, updatePassword } = useAuth();
    const { showAlert, showToast } = useNotification();
    const router = useRouter();

    // Prefetch all main routes so navigation is instant from settings
    useEffect(() => {
        router.prefetch('/');
        router.prefetch('/links');
        router.prefetch('/favorites');
        router.prefetch('/collections');
        router.prefetch('/tags');
    }, [router]);
    const [newPin, setNewPin] = useState('');
    const [oldPin, setOldPin] = useState('');
    const [isEditingPin, setIsEditingPin] = useState(false);
    const [pinError, setPinError] = useState('');
    const [accountName, setAccountName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
    const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });

    const handleExportJSON = () => {
        const data = { links, collections, exportedAt: new Date().toISOString(), version: '1.1' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savelinks-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const headers = ['Title', 'URL', 'Description', 'Tags', 'Collection', 'Favorite', 'Created At'];
        const rows = links.map(l => [
            l.title,
            l.url,
            l.description || '',
            l.tags.join(', '),
            collections.find(c => c.id === l.collectionId)?.name || 'No collection',
            l.isFavorite ? 'Yes' : 'No',
            new Date(l.createdAt).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savelinks-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        const linkData = links.map(l => ({
            Title: l.title,
            URL: l.url,
            Description: l.description || '',
            Tags: l.tags.join(', '),
            Collection: collections.find(c => c.id === l.collectionId)?.name || 'No collection',
            Favorite: l.isFavorite ? 'Yes' : 'No',
            'Created At': new Date(l.createdAt).toLocaleString()
        }));

        const collectionData = collections.map(c => ({
            Name: c.name,
            Description: c.description || '',
            Parent: collections.find(p => p.id === c.parentId)?.name || 'Root'
        }));

        const wb = XLSX.utils.book_new();
        const wsLinks = XLSX.utils.json_to_sheet(linkData);
        const wsCollections = XLSX.utils.json_to_sheet(collectionData);

        XLSX.utils.book_append_sheet(wb, wsLinks, "Links");
        XLSX.utils.book_append_sheet(wb, wsCollections, "Collections");

        XLSX.writeFile(wb, `savelinks-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress image before uploading to avoid Apps Script payload limits
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimensions 150x150 for profile avatar
                const MAX_SIZE = 150;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.7 quality
                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                await updateProfile({ avatar: base64 });
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    };


    const handleUpdatePassword = async () => {
        if (!currentPassword) {
            setAccountMessage({ type: 'error', text: 'Please enter your current password' });
            return;
        }
        if (!newPassword || newPassword !== confirmPassword) {
            setAccountMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setAccountMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setIsUpdatingAccount(true);
        try {
            const res = await updatePassword(currentPassword, newPassword);
            if (res.success) {
                setAccountMessage({ type: 'success', text: 'Password updated successfully' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setAccountMessage({ type: '', text: '' }), 3000);
            } else {
                setAccountMessage({ type: 'error', text: res.message || 'Failed to update password' });
            }
        } catch (err: any) {
            setAccountMessage({ type: 'error', text: err.message || 'Connection error' });
        } finally {
            setIsUpdatingAccount(false);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv,.xlsx,.xls';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            const extension = file.name.split('.').pop()?.toLowerCase();

            reader.onload = (ev) => {
                try {
                    const result = ev.target?.result;
                    if (!result) return;

                    if (extension === 'json') {
                        const data = JSON.parse(result as string);
                        if (data.links) {
                            importData(data);
                        } else {
                            importData({ links: Array.isArray(data) ? data : [] });
                        }
                    } else {
                        const workbook = XLSX.read(result, { type: 'binary' });
                        const linksSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('link')) || workbook.SheetNames[0];
                        const linksData = XLSX.utils.sheet_to_json(workbook.Sheets[linksSheetName]);
                        const collectionsSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('collection'));
                        const collectionsData = collectionsSheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[collectionsSheetName]) : [];

                        const mappedLinks = (linksData as any[]).map(item => ({
                            title: item.Title || item.title || item.Name || '',
                            url: item.URL || item.url || '',
                            description: item.Description || item.description || '',
                            tags: item.Tags || item.tags || '',
                            collectionId: item.Collection || item.collectionId || null,
                            isFavorite: item.Favorite === 'Yes' || item.isFavorite === true,
                            isPrivate: item.Private === 'Yes' || item.isPrivate === true,
                            createdAt: item['Created At'] || item.createdAt || null
                        })).filter(l => l.url);

                        const mappedCollections = (collectionsData as any[]).map(item => ({
                            name: item.Name || item.name || '',
                            description: item.Description || item.description || '',
                            parentId: item.Parent || item.parentId || null
                        })).filter(c => c.name);

                        importData({ links: mappedLinks, collections: mappedCollections });
                    }
                } catch (err) {
                    console.error('Import error:', err);
                    alert('Failed to import file. Please ensure it follows the correct format.');
                }
            };

            if (extension === 'json' || extension === 'csv') {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        };
        input.click();
    };

    const handleClearAll = () => {
        showAlert({
            title: 'Clear All Data?',
            message: 'Are you absolutely sure you want to permanently delete all links, collections, and settings? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Yes, Delete Everything',
            onConfirm: () => {
                clearAllData();
            }
        });
    };

    return (
        <div>
            <div className="page-head">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Customize your SaveLinks experience</p>
                </div>
            </div>

            <div className="settings-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Account Settings */}
                    <div className="settings-section">
                        <div className="section-title" style={{ marginBottom: 20 }}>
                            <User size={18} color="var(--accent-secondary)" />
                            Account Information
                        </div>

                        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }} className="settings-avatar-row">
                            <div className="avatar-preview-container">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <User size={40} />
                                    </div>
                                )}
                                <label className="avatar-edit-badge">
                                    <Camera size={16} />
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ marginBottom: 4 }}>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
                                    <div style={{ fontSize: 14, color: 'var(--accent-primary)', opacity: 0.8 }}>{user?.email}</div>
                                </div>

                                <div className="account-form-row">
                                    <div className="account-form-header">
                                        <Lock size={16} color="var(--accent-primary)" />
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>Update Password</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="Current Password"
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="password"
                                                className="form-input"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                            />
                                            <input
                                                type="password"
                                                className="form-input"
                                                placeholder="Confirm New"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                marginTop: 4,
                                                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                                border: 'none',
                                                color: '#fff',
                                                fontWeight: 600,
                                                letterSpacing: '0.02em',
                                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            disabled={isUpdatingAccount || !newPassword}
                                            onClick={handleUpdatePassword}
                                        >
                                            {isUpdatingAccount ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </div>

                                {accountMessage.text && (
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: accountMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: accountMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontWeight: 500
                                    }}>
                                        {accountMessage.type === 'success' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                                        {accountMessage.text}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Security */}
                    <div className="settings-section">
                        <div className="section-title" style={{ marginBottom: 20 }}>
                            <ShieldAlert size={18} color="var(--accent-secondary)" />
                            Security
                        </div>
                        <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Private Mode PIN</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        {masterPin === ''
                                            ? "Set a PIN to enable private link security."
                                            : "Used to unlock all private links."}
                                    </div>
                                </div>
                                {!isEditingPin && (
                                    <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsEditingPin(true)}>
                                        {masterPin === '' ? 'Set Private PIN' : 'Change PIN'}
                                    </button>
                                )}
                            </div>

                            {isEditingPin && (
                                <div className="settings-pin-edit animate-fade-in" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20, marginTop: 4 }}>
                                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                        {masterPin !== '' && (
                                            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current PIN</label>
                                                <input
                                                    type="password"
                                                    maxLength={4}
                                                    className={`form-input${pinError ? ' border-danger' : ''}`}
                                                    value={oldPin}
                                                    onChange={e => {
                                                        setPinError('');
                                                        setOldPin(e.target.value.replace(/\D/g, ''));
                                                    }}
                                                    style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: 20, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}
                                                    placeholder="••••"
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{masterPin === '' ? 'Set New PIN' : 'New PIN'}</label>
                                            <input
                                                type="password"
                                                maxLength={4}
                                                className="form-input"
                                                value={newPin}
                                                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: 20, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}
                                                placeholder="••••"
                                                autoFocus={masterPin === ''}
                                            />
                                        </div>
                                    </div>

                                    {pinError && <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{pinError}</div>}

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setIsEditingPin(false);
                                                setOldPin('');
                                                setNewPin('');
                                                setPinError('');
                                            }}
                                        >Cancel</button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                const currentOldPin = masterPin === '' ? '' : oldPin;
                                                if (newPin.length === 4 && (masterPin === '' || oldPin.length === 4)) {
                                                    if (updateMasterPin(currentOldPin, newPin)) {
                                                        setIsEditingPin(false);
                                                        setNewPin('');
                                                        setOldPin('');
                                                        alert(masterPin === '' ? 'PIN set successfully' : 'PIN updated successfully');
                                                    } else {
                                                        setPinError('Incorrect PIN');
                                                    }
                                                }
                                            }}
                                            disabled={newPin.length < 4 || (masterPin !== '' && oldPin.length < 4)}
                                        >Save PIN</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Data Management */}
                    <div className="settings-section">
                        <div className="section-title" style={{ marginBottom: 20 }}>
                            <Database size={18} color="var(--accent-secondary)" />
                            Data Management
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Export Section */}
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-primary)22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                        <Download size={16} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Export Data</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Download your data for backup or usage elsewhere</div>
                                    </div>
                                </div>
                                <div className="settings-export-row" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(0,0,0,0.1)' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} style={{ justifyContent: 'center' }}>
                                        <FileSpreadsheet size={14} /> Excel
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} style={{ justifyContent: 'center' }}>
                                        <FileText size={14} /> CSV
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} style={{ justifyContent: 'center' }}>
                                        <FileJson size={14} /> JSON
                                    </button>
                                </div>
                            </div>

                            {/* Import Section */}
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-secondary)22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
                                        <Upload size={16} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Import Data</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Upload data from JSON, CSV, or Excel files</div>
                                    </div>
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleImport} style={{ width: '100%', justifyContent: 'center', height: 40 }}>
                                        <Upload size={16} /> Select File to Import
                                    </button>
                                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                                        Supported formats: .json, .csv, .xlsx, .xls
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="settings-section" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                        <div className="section-title" style={{ marginBottom: 20, color: 'var(--danger)' }}>
                            <Trash2 size={18} color="var(--danger)" />
                            Danger Zone
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Clear All</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Permanently delete everything</div>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
                                <Trash2 size={14} /> Clear All
                            </button>
                        </div>
                    </div>

                    {/* About */}
                    <div className="settings-section">
                        <div className="section-title" style={{ marginBottom: 12 }}>
                            <Info size={18} color="var(--accent-secondary)" />
                            About
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Version</span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>1.1.0</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Built with</span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Next.js 15</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Icons</span><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Lucide React</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                <span>Made with <span style={{ color: 'var(--danger)' }}></span> by</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>rizddf</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <span>Support Developer</span>
                                <a
                                    href="https://saweria.co/frd027"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm"
                                    style={{ background: '#FFC83D', color: '#000', fontWeight: 600, padding: '4px 12px', height: 'auto', borderRadius: 'var(--radius)' }}
                                >
                                    🥤 Traktir Es Teh
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
}
