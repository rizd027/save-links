export interface Link {
    id: string;
    title: string;
    url: string;
    description: string;
    tags: string[];
    collectionId: string | null;
    isFavorite: boolean;
    favicon: string;
    createdAt: string;
    updatedAt: string;
    clickCount: number;
    color?: string;
    isPrivate: boolean;
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    linkCount: number;
    createdAt: string;
    parentId: string | null;
    isPrivate: boolean;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'newest' | 'oldest' | 'title' | 'clicks' | 'favorites';

export interface FilterState {
    search: string;
    collectionId: string | null;
    tags: string[];
    favoritesOnly: boolean;
    sortBy: SortBy;
}
export interface User {
    name: string;
    email: string;
    avatar?: string;
}
