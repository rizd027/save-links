'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
    name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
    const IconComponent = (LucideIcons as any)[name];

    if (!IconComponent) {
        return <LucideIcons.Folder {...props} />;
    }

    return <IconComponent {...props} />;
}
