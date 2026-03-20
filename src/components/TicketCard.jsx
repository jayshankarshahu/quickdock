import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function TicketCard({ item, onClick }) {
    const [copiedId, setCopiedId] = useState(null);

    if (!item) return null;
    const { id, title, type, project, parentStory, assignedDate } = item;

    const handleCopy = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formattedDate = assignedDate
        ? new Date(assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className="notion-card flex-col" onClick={() => onClick(item)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                            className="id-badge copy-trigger"
                            onClick={(e) => handleCopy(e, id)}
                            title="Click to copy ID"
                        >
                            {id}
                            {copiedId === id ? <Check size={12} /> : <Copy size={12} className="copy-icon" />}
                        </span>
                        <span className={`badge ${type}`}>{type === 'story' ? 'Story' : 'Ticket'}</span>
                    </div>
                    {parentStory && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Parent:
                            <span
                                className="id-badge copy-trigger"
                                onClick={(e) => handleCopy(e, parentStory)}
                                title="Click to copy Parent ID"
                            >
                                {parentStory}
                                {copiedId === parentStory ? <Check size={10} /> : <Copy size={10} className="copy-icon" />}
                            </span>
                        </div>
                    )}
                </div>
                {formattedDate && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                    </span>
                )}
            </div>

            <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.4', marginBottom: '10px' }}>
                {title}
            </div>

            {project && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)' }}></div>
                    {project}
                </div>
            )}
        </div>
    );
}
