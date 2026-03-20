import { useState, useCallback } from 'react';
import { fetchQuickscrumEmails, extractHtmlBody } from '../api/gmail';
import { parseQuickscrumEmail } from '../api/parser';

export function useQuickscrum() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const emails = await fetchQuickscrumEmails();
            const newItems = [];
            const seenIds = new Set();

            for (const email of emails) {
                const html = extractHtmlBody(email);
                if (html) {
                    const { ticket, story } = parseQuickscrumEmail(html);
                    if (ticket && !seenIds.has(ticket.id)) {
                        newItems.push(ticket);
                        seenIds.add(ticket.id);
                    }
                    if (story && !seenIds.has(story.id)) {
                        newItems.push(story);
                        seenIds.add(story.id);
                    }
                }
            }
            setItems(newItems);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch items. Make sure you are authenticated.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { items, loading, error, refresh: loadItems };
}
