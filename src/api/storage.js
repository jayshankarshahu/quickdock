import { getAuthToken, extractHtmlBody } from './gmail';
import { parseQuickscrumEmail } from './parser';

export async function clearAllCache() {
    await chrome.storage.local.clear();
}

export async function fetchAndCacheMonth(monthStr, onProgress, forceRefresh = false) {
    if (!forceRefresh) {
        const cached = await chrome.storage.local.get(monthStr);
        if (cached[monthStr] && cached[monthStr].length > 0) {
            return cached[monthStr];
        }
    }

    let token;
    try {
        token = await getAuthToken();
    } catch (err) {
        throw new Error("Authentication failed: " + err.message);
    }

    const stats = { total: 0, processed: 0, month: monthStr };

    // Calculate dates
    const [year, month] = monthStr.split('-');
    const startDate = `${monthStr}-01`;

    const nextMonthDate = new Date(Date.UTC(parseInt(year), parseInt(month), 1));
    const endYear = nextMonthDate.getUTCFullYear();
    const endMonth = String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0');
    const endDate = `${endYear}-${endMonth}-01`;

    const query = `from:no-reply@quickscrum.com after:${startDate} before:${endDate}`;

    let msgIds = [];
    let pageToken = null;

    try {
        do {
            const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500${pageToken ? '&pageToken=' + pageToken : ''}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) {
                // Return gracefully if API limits hit temporarily, throw to show in UI
                throw new Error(res.status === 429 ? "Google API rate limit exceeded." : "Failed to fetch message list.");
            }
            const data = await res.json();
            if (data.messages) msgIds = msgIds.concat(data.messages.map(m => m.id));
            pageToken = data.nextPageToken;
        } while (pageToken);
    } catch (err) {
        throw new Error("Error fetching email list: " + err.message);
    }

    stats.total = msgIds.length;
    if (onProgress) onProgress(stats);

    const results = [];
    const seenIds = new Set();
    const BATCH_SIZE = 10;

    for (let i = 0; i < msgIds.length; i += BATCH_SIZE) {
        const batch = msgIds.slice(i, i + BATCH_SIZE);
        const fetches = batch.map(async (id) => {
            try {
                const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`;
                const msgRes = await fetch(msgUrl, { headers: { Authorization: `Bearer ${token}` } });
                if (!msgRes.ok) return null;
                const msgData = await msgRes.json();

                let assignedDate = Date.now();
                const dateHeader = msgData.payload.headers?.find(h => h.name.toLowerCase() === 'date');
                if (dateHeader) {
                    assignedDate = new Date(dateHeader.value).getTime();
                } else if (msgData.internalDate) {
                    assignedDate = parseInt(msgData.internalDate);
                }

                const html = extractHtmlBody(msgData);
                if (html) {
                    const { ticket, story } = parseQuickscrumEmail(html, assignedDate);
                    const items = [];
                    if (ticket && !seenIds.has(ticket.id)) {
                        seenIds.add(ticket.id);
                        items.push(ticket);
                    }
                    if (story && !seenIds.has(story.id)) {
                        seenIds.add(story.id);
                        items.push(story);
                    }
                    return items;
                }
            } catch (err) {
                console.error("Error fetching message details", err);
            }
            return [];
        });

        const batchResults = await Promise.all(fetches);
        for (const res of batchResults) {
            if (res) results.push(...res);
        }

        stats.processed += batch.length;
        if (onProgress) onProgress(stats); // Notify UI of pagination processing
    }

    results.sort((a, b) => b.assignedDate - a.assignedDate);

    // Save to storage
    const obj = {};
    obj[monthStr] = results;
    await chrome.storage.local.set(obj);

    return results;
}
