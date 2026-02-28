'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { Link, Collection, FilterState, ViewMode } from '@/types';
import { SAMPLE_LINKS, SAMPLE_COLLECTIONS } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { getUserData, saveUserData } from '@/lib/auth';
import { useNotification } from './NotificationContext';

interface AppContextType {
    links: Link[];
    collections: Collection[];
    filterState: FilterState;
    viewMode: ViewMode;
    sidebarOpen: boolean;
    activeModal: 'add-link' | 'edit-link' | 'add-collection' | 'edit-collection' | 'unlock-private' | null;
    selectedLink: Link | null;
    selectedCollection: Collection | null;
    filteredLinks: Link[];
    visibleLinks: Link[];
    visibleCollections: Collection[];
    allTags: string[];
    privateModeUnlocked: boolean;
    masterPin: string;
    syncLoading: boolean;
    isInitializing: boolean;

    // Actions
    addLink: (link: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'clickCount'>) => void;
    updateLink: (id: string, updates: Partial<Link>) => void;
    deleteLink: (id: string) => void;
    toggleFavorite: (id: string) => void;
    incrementClick: (id: string) => void;
    unlockPrivateMode: (pin: string) => boolean;
    lockPrivateMode: () => void;
    updateMasterPin: (oldPin: string, newPin: string) => boolean;

    // Batch Actions
    deleteMultipleLinks: (ids: string[]) => void;
    moveLinksToCollection: (ids: string[], targetId: string | null) => void;
    toggleFavoriteBatch: (ids: string[], favorite: boolean) => void;

    addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'linkCount'>) => void;
    updateCollection: (id: string, updates: Partial<Collection>) => void;
    deleteCollection: (id: string) => void;
    importData: (data: { links: any[], collections?: any[] }) => void;

    setFilterState: (state: Partial<FilterState>) => void;
    setViewMode: (mode: ViewMode) => void;
    setSidebarOpen: (open: boolean) => void;
    openModal: (modal: AppContextType['activeModal'], link?: Link, collection?: Collection) => void;
    closeModal: () => void;
    syncData: () => Promise<void>;
    clearAllData: () => void;
}

const defaultFilter: FilterState = {
    search: '',
    collectionId: null,
    tags: [],
    favoritesOnly: false,
    sortBy: 'newest',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [links, setLinks] = useState<Link[]>(SAMPLE_LINKS);
    const [collections, setCollections] = useState<Collection[]>(SAMPLE_COLLECTIONS);
    const [filterState, setFilterStateInternal] = useState<FilterState>(defaultFilter);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<AppContextType['activeModal']>(null);
    const [selectedLink, setSelectedLink] = useState<Link | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [privateModeUnlocked, setPrivateModeUnlocked] = useState(false);
    const [masterPin, setMasterPin] = useState('');
    const [syncLoading, setSyncLoading] = useState(false);
    const { showToast } = useNotification();

    const isFirstMount = useRef(true);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isInitializing, setIsInitializing] = useState(true);
    const [lastSyncedUser, setLastSyncedUser] = useState<string | null>(null);

    // Initial Data Load (from Cache)
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userObj = JSON.parse(savedUser);
                const cachedData = localStorage.getItem(`cache_${userObj.email}`);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    setLinks(parsed.links || []);
                    setCollections(parsed.collections || []);
                    if (parsed.masterPin) setMasterPin(parsed.masterPin);
                    setLastSyncedUser(userObj.email);
                    setIsInitializing(false); // Hide preloader immediately if cache found
                }
            } catch (e) {
                console.error('Failed to load cache:', e);
            }
        }
    }, []);

    // Fetch from Network
    useEffect(() => {
        if (user) {
            const loadData = async () => {
                // If we don't have cached data for THIS user, show loading
                const hasCacheForUser = lastSyncedUser === user.email;
                if (!hasCacheForUser) {
                    setSyncLoading(true);
                }

                try {
                    const res = await getUserData(user.email);
                    if (res.success && res.data) {
                        const cleanedLinks = (res.data.links || []).map((l: any) => {
                            let link = { ...l };
                            if (l.icon && !l.favicon) link.favicon = l.icon;
                            if (typeof link.title === 'string' && link.title.startsWith('{') && link.title.endsWith('}')) {
                                try {
                                    const parsed = JSON.parse(link.title);
                                    if (parsed && typeof parsed === 'object') link = { ...link, ...parsed, id: l.id };
                                } catch (e) { }
                            }
                            if (!link.favicon && link.url) {
                                try { link.favicon = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(link.url).hostname}`; } catch (e) { }
                            }
                            return link;
                        });

                        setLinks(cleanedLinks);
                        setCollections(res.data.collections || []);
                        if (res.data.config && res.data.config.masterPin) {
                            setMasterPin(res.data.config.masterPin);
                        }

                        // Update cache
                        localStorage.setItem(`cache_${user.email}`, JSON.stringify({
                            links: cleanedLinks,
                            collections: res.data.collections || [],
                            masterPin: res.data.config?.masterPin || ''
                        }));
                        setLastSyncedUser(user.email);
                    }
                } catch (err) {
                    console.error('Failed to fetch user data:', err);
                } finally {
                    setSyncLoading(false);
                    setIsInitializing(false);
                }
            };
            loadData();
        } else {
            setLinks([]);
            setCollections([]);
            setMasterPin('');
            setPrivateModeUnlocked(false);
            setIsInitializing(false);
        }
    }, [user]); // Removed lastSyncedUser to prevent unnecessary re-fetches

    // Auto-save logic (Debounced)
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        if (user) {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);

            saveTimeout.current = setTimeout(async () => {
                try {
                    await saveUserData(user.email, links, collections, { masterPin });
                    showToast('success', 'Changes Saved', 'Your data has been synced to the cloud.');
                } catch (err) {
                    console.error('Automated save failed:', err);
                    showToast('error', 'Cloud sync failed', 'Could not auto-save changes.');
                }
            }, 5000); // Save after 5 seconds of inactivity
        }

        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [links, collections, masterPin, user, showToast]); // Note: syncLoading intentionally omitted to avoid save being re-triggered by the save itself

    const syncData = useCallback(async () => {
        if (!user) return;
        setSyncLoading(true);
        try {
            await saveUserData(user.email, links, collections, { masterPin });
            showToast('success', 'Sync Successful', 'All links and collections are updated.');
        } catch (err) {
            console.error('Manual sync failed:', err);
            showToast('error', 'Sync Failed', 'Please check your connection.');
        } finally {
            setSyncLoading(false);
        }
    }, [user, links, collections, masterPin, showToast]);

    const visibleLinks = React.useMemo(() => links.filter(l => privateModeUnlocked || !l.isPrivate), [links, privateModeUnlocked]);
    const visibleCollections = React.useMemo(() => collections.filter(c => privateModeUnlocked || !c.isPrivate), [collections, privateModeUnlocked]);
    const allTags = React.useMemo(() => Array.from(new Set(visibleLinks.flatMap(l => l.tags))).sort(), [visibleLinks]);

    const filteredLinks = React.useMemo(() => {
        return links.filter(link => {
            if (!privateModeUnlocked && link.isPrivate) return false;
            if (filterState.search) {
                const s = filterState.search.toLowerCase();
                if (!link.title.toLowerCase().includes(s) &&
                    !link.url.toLowerCase().includes(s) &&
                    !link.description.toLowerCase().includes(s) &&
                    !link.tags.some(t => t.toLowerCase().includes(s))) {
                    return false;
                }
            }
            if (filterState.collectionId && link.collectionId !== filterState.collectionId) return false;
            if (filterState.favoritesOnly && !link.isFavorite) return false;
            if (filterState.tags.length > 0 && !filterState.tags.every(t => link.tags.includes(t))) return false;
            return true;
        }).sort((a, b) => {
            switch (filterState.sortBy) {
                case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'title': return a.title.localeCompare(b.title);
                case 'clicks': return b.clickCount - a.clickCount;
                case 'favorites': return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
                default: return 0;
            }
        });
    }, [links, filterState, privateModeUnlocked]);

    const addLink = useCallback((link: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'clickCount'>) => {
        const now = new Date().toISOString();
        const newLink: Link = { ...link, id: uuidv4(), createdAt: now, updatedAt: now, clickCount: 0 };
        setLinks(prev => [newLink, ...prev]);
        if (link.collectionId) {
            setCollections(prev => prev.map(c => c.id === link.collectionId ? { ...c, linkCount: c.linkCount + 1 } : c));
        }
    }, []);

    const updateLink = useCallback((id: string, updates: Partial<Link>) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
    }, []);

    const deleteLink = useCallback((id: string) => {
        setLinks(prev => {
            const link = prev.find(l => l.id === id);
            // Update collection count inside the same batch
            if (link?.collectionId) {
                setCollections(cols => cols.map(c => c.id === link.collectionId ? { ...c, linkCount: Math.max(0, c.linkCount - 1) } : c));
            }
            return prev.filter(l => l.id !== id);
        });
    }, []);

    const toggleFavorite = useCallback((id: string) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite, updatedAt: new Date().toISOString() } : l));
    }, []);

    const incrementClick = useCallback((id: string) => {
        setLinks(prev => prev.map(l => l.id === id ? { ...l, clickCount: l.clickCount + 1 } : l));
    }, []);

    const addCollection = useCallback((col: Omit<Collection, 'id' | 'createdAt' | 'linkCount'>) => {
        const newCol: Collection = { ...col, id: uuidv4(), createdAt: new Date().toISOString(), linkCount: 0, isPrivate: !!col.isPrivate };
        setCollections(prev => [newCol, ...prev]);
    }, []);

    const updateCollection = useCallback((id: string, updates: Partial<Collection>) => {
        setCollections(prev => {
            const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);

            // Cascade Privacy Logic: If a collection's privacy changes, all its sub-collections follow.
            if (updates.isPrivate !== undefined) {
                const isPriv = !!updates.isPrivate;
                return updated.map(c => c.parentId === id ? { ...c, isPrivate: isPriv } : c);
            }
            return updated;
        });

        // Cascade Privacy Logic for links
        if (updates.isPrivate !== undefined) {
            const isPriv = !!updates.isPrivate;
            setLinks(currentLinks => currentLinks.map(l =>
                l.collectionId === id ? { ...l, isPrivate: isPriv, updatedAt: new Date().toISOString() } : l
            ));
        }
    }, []);

    const deleteCollection = useCallback((id: string) => {
        setCollections(prev => prev
            .filter(c => c.id !== id)
            .map(c => c.parentId === id ? { ...c, parentId: null } : c)
        );
        setLinks(prev => prev.map(l => l.collectionId === id ? { ...l, collectionId: null } : l));
    }, []);

    const setFilterState = useCallback((updates: Partial<FilterState>) => {
        setFilterStateInternal(prev => ({ ...prev, ...updates }));
    }, []);

    const openModal = useCallback((modal: AppContextType['activeModal'], link?: Link, collection?: Collection) => {
        setActiveModal(modal);
        setSelectedLink(link || null);
        setSelectedCollection(collection || null);
    }, []);

    const lockPrivateMode = useCallback(() => {
        setPrivateModeUnlocked(false);
    }, []);

    const unlockPrivateMode = useCallback((pin: string) => {
        if (masterPin && pin === masterPin) {
            setPrivateModeUnlocked(true);
            return true;
        }
        return false;
    }, [masterPin]);

    const updateMasterPin = useCallback((oldPin: string, newPin: string) => {
        const isInitialSet = masterPin === '';
        if ((isInitialSet || oldPin === masterPin) && newPin.length === 4 && /^\d+$/.test(newPin)) {
            setMasterPin(newPin);
            return true;
        }
        return false;
    }, [masterPin]);

    // Batch Actions
    const deleteMultipleLinks = useCallback((ids: string[]) => {
        const idsSet = new Set(ids);
        setLinks(prev => {
            // Calculate affected collection counts from current state
            const affectedCollections: Record<string, number> = {};
            prev.forEach(l => {
                if (idsSet.has(l.id) && l.collectionId) {
                    affectedCollections[l.collectionId] = (affectedCollections[l.collectionId] || 0) + 1;
                }
            });
            if (Object.keys(affectedCollections).length > 0) {
                setCollections(cols => cols.map(c =>
                    affectedCollections[c.id] !== undefined
                        ? { ...c, linkCount: Math.max(0, c.linkCount - affectedCollections[c.id]) }
                        : c
                ));
            }
            return prev.filter(l => !idsSet.has(l.id));
        });
    }, []);

    const moveLinksToCollection = useCallback((ids: string[], targetId: string | null) => {
        const idsSet = new Set(ids);
        setLinks(prev => {
            const targetCol = prev.length > 0 ? undefined : undefined; // resolved via collections state below
            // Build count deltas from current links state
            const deltas: Record<string, number> = {};
            prev.forEach(l => {
                if (idsSet.has(l.id)) {
                    // Decrement old collection
                    if (l.collectionId) deltas[l.collectionId] = (deltas[l.collectionId] || 0) - 1;
                    // Increment new collection
                    if (targetId) deltas[targetId] = (deltas[targetId] || 0) + 1;
                }
            });
            setCollections(cols => {
                const targetIsPrivate = cols.find(c => c.id === targetId)?.isPrivate;
                // Update link privacy inline via setLinks already running; update counts here
                return cols.map(c => {
                    const delta = deltas[c.id];
                    return delta ? { ...c, linkCount: Math.max(0, c.linkCount + delta) } : c;
                });
                // Note: targetIsPrivate captured for link update below
                void targetIsPrivate;
            });
            return prev.map(l => {
                if (!idsSet.has(l.id)) return l;
                return { ...l, collectionId: targetId, updatedAt: new Date().toISOString() };
            });
        });
    }, []);

    const toggleFavoriteBatch = useCallback((ids: string[], favorite: boolean) => {
        const idsSet = new Set(ids);
        setLinks(prev => prev.map(l => idsSet.has(l.id) ? { ...l, isFavorite: favorite, updatedAt: new Date().toISOString() } : l));
    }, []);

    const importData = useCallback((data: { links: any[], collections?: any[] }) => {
        const now = new Date().toISOString();

        // Merge links, avoiding duplicates by URL if no ID exists, or by ID if it does
        setLinks(prev => {
            const existingUrls = new Set(prev.map(l => l.url));
            const existingIds = new Set(prev.map(l => l.id));

            const newLinks: Link[] = (data.links || [])
                .filter(l => l.url && !existingUrls.has(l.url) && !existingIds.has(l.id))
                .map(l => ({
                    id: l.id || uuidv4(),
                    title: l.title || 'Untitled',
                    url: l.url,
                    description: l.description || '',
                    tags: Array.isArray(l.tags) ? l.tags : (typeof l.tags === 'string' ? l.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
                    collectionId: l.collectionId || null,
                    isFavorite: !!l.isFavorite,
                    isPrivate: !!l.isPrivate,
                    favicon: l.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${new URL(l.url).hostname}`,
                    createdAt: l.createdAt || now,
                    updatedAt: l.updatedAt || now,
                    clickCount: l.clickCount || 0
                }));

            return [...newLinks, ...prev];
        });

        if (data.collections && data.collections.length > 0) {
            setCollections(prev => {
                const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
                const existingIds = new Set(prev.map(c => c.id));

                const newCols: Collection[] = data.collections!
                    .filter(c => c.name && !existingNames.has(c.name.toLowerCase()) && !existingIds.has(c.id))
                    .map(c => ({
                        id: c.id || uuidv4(),
                        name: c.name,
                        icon: c.icon || 'Folder',
                        color: c.color || '#6366f1',
                        description: c.description || '',
                        parentId: c.parentId || null,
                        createdAt: c.createdAt || now,
                        linkCount: c.linkCount || 0,
                        isPrivate: !!c.isPrivate
                    }));

                return [...newCols, ...prev];
            });
        }

        showToast('success', 'Import Complete', `Added ${data.links?.length || 0} items to your library.`);
    }, [showToast]);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setSelectedLink(null);
        setSelectedCollection(null);
    }, []);

    const clearAllData = useCallback(() => {
        setLinks([]);
        setCollections([]);
        setMasterPin('');
        setPrivateModeUnlocked(false);
        setFilterStateInternal(defaultFilter);
        showToast('info', 'Data Cleared', 'All your data has been permanently deleted.');
    }, [showToast]);

    return (
        <AppContext.Provider value={{
            links, collections, filterState, viewMode, sidebarOpen,
            activeModal, selectedLink, selectedCollection, filteredLinks, visibleLinks, visibleCollections, allTags,
            addLink, updateLink, deleteLink, toggleFavorite, incrementClick,
            addCollection, updateCollection, deleteCollection,
            setFilterState, setViewMode, setSidebarOpen, openModal, closeModal,
            privateModeUnlocked, unlockPrivateMode, lockPrivateMode,
            masterPin, updateMasterPin, syncLoading, syncData, importData,
            deleteMultipleLinks, moveLinksToCollection, toggleFavoriteBatch,
            isInitializing, clearAllData
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
