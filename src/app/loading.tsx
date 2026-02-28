import React from 'react';
import { Link2 } from 'lucide-react';

export default function Loading({ fadeOut }: { fadeOut?: boolean }) {
    return (
        <div className={`loading-root${fadeOut ? ' fade-out' : ''}`}>
            <div className="loading-logo">
                <Link2 size={32} color="white" />
            </div>
            <div className="loading-text">Loading SaveLinks</div>
        </div>
    );
}
