import { useState, useEffect } from 'react';
import { Save, UserCheck } from 'lucide-react';
import './index.css';

export default function AppOptions() {
    const [ticketTemplate, setTicketTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?EntityType=SUBITEM&SearchText=[ID]');
    const [storyTemplate, setStoryTemplate] = useState('https://www.quickscrum.com/GlobalSearch/GlobalSearch?SearchText=[ID]');
    const [searchLimit, setSearchLimit] = useState(12);
    const [status, setStatus] = useState('');

    useEffect(() => {
        chrome.storage.sync.get(['ticketTemplate', 'storyTemplate', 'searchLimit'], (result) => {
            if (result.ticketTemplate) setTicketTemplate(result.ticketTemplate);
            if (result.storyTemplate) setStoryTemplate(result.storyTemplate);
            if (result.searchLimit) setSearchLimit(Number(result.searchLimit));
        });
    }, []);

    const saveOptions = () => {
        chrome.storage.sync.set(
            { ticketTemplate, storyTemplate, searchLimit: Number(searchLimit) },
            () => {
                setStatus('Options saved successfully.');
                setTimeout(() => setStatus(''), 2000);
            }
        );
    };

    const checkAuth = () => {
        chrome.identity.getAuthToken({ interactive: true }, () => {
            if (chrome.runtime.lastError) {
                alert('Authentication failed: ' + chrome.runtime.lastError.message);
            } else {
                alert('Authentication successful! You are connected to Google.');
            }
        });
    };

    return (
        <div style={{ maxWidth: '640px', margin: '60px auto', padding: '32px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <h1 style={{ marginBottom: '32px', fontSize: '28px', fontWeight: 600 }}>QuickDock Settings</h1>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 500 }}>Link Templates</h2>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ticket Link Template</label>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Use <code style={{ backgroundColor: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>[ID]</code> where the Ticket ID should be inserted.</p>
                    <input
                        className="notion-input"
                        value={ticketTemplate}
                        onChange={(e) => setTicketTemplate(e.target.value)}
                        placeholder="https://..."
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Story Link Template</label>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Use <code style={{ backgroundColor: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>[ID]</code> where the Story ID should be inserted.</p>
                    <input
                        className="notion-input"
                        value={storyTemplate}
                        onChange={(e) => setStoryTemplate(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 500 }}>Search Preferences</h2>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Search Limit (Months)</label>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Maximum consecutive empty months to search before stopping automatically.</p>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        className="notion-input"
                        value={searchLimit}
                        onChange={(e) => setSearchLimit(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 500 }}>Authentication</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                    This extension requires read access to your Gmail to fetch QuickScrum assignment emails securely.
                    If you are having issues viewing your tickets, you can manually verify the connection below.
                </p>
                <button className="notion-btn" onClick={checkAuth}>
                    <UserCheck size={16} /> Verify Google Connection
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="notion-btn primary" onClick={saveOptions}>
                    <Save size={16} /> Save Changes
                </button>
                {status && <span style={{ color: 'var(--accent-green)', fontSize: '14px', fontWeight: 500 }}>{status}</span>}
            </div>
        </div>
    );
}
