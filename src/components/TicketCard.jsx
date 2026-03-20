import React from 'react';

export default function TicketCard({ item, onClick }) {
    if (!item) return null;
    const { id, title, type } = item;

    return (
        <div className="notion-card" onClick={() => onClick(item)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{id}</span>
                <span className={`badge ${type}`}>{type === 'story' ? 'Story' : 'Ticket'}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.4' }}>
                {title}
            </div>
        </div>
    );
}
