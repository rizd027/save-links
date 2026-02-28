'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { AddLinkModal, AddCollectionModal } from './LinkModal';
import { PrivateUnlockModal } from './PrivateUnlockModal';

export function ModalManager() {
    const { activeModal } = useApp();

    if (!activeModal) return null;
    if (activeModal === 'add-link' || activeModal === 'edit-link') return <AddLinkModal />;
    if (activeModal === 'add-collection' || activeModal === 'edit-collection') return <AddCollectionModal />;
    if (activeModal === 'unlock-private') return <PrivateUnlockModal />;
    return null;
}
