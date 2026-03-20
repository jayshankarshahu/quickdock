export async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

export async function fetchQuickscrumEmails() {
    const token = await getAuthToken();
    const query = "from:no-reply@quickscrum.com";

    // 1. Fetch message IDs
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;
    const response = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data?.messages) return [];

    // 2. Fetch full message payload for each ID
    const emails = [];
    for (const msg of data.messages) {
        const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const msgRes = await fetch(msgUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const msgData = await msgRes.json();
        emails.push(msgData);
    }
    return emails;
}

export function extractHtmlBody(message) {
    let body = '';

    function getHtmlPart(parts) {
        if (!parts) return null;
        for (const part of parts) {
            if (part.mimeType === 'text/html') {
                return part.body?.data;
            }
            if (part.parts) {
                const nested = getHtmlPart(part.parts);
                if (nested) return nested;
            }
        }
        return null;
    }

    if (message.payload.mimeType === 'text/html') {
        body = message.payload.body?.data;
    } else if (message.payload.parts) {
        body = getHtmlPart(message.payload.parts);
    }

    if (body) {
        const b64 = body.replace(/-/g, '+').replace(/_/g, '/');
        try {
            // Decode base64 to Unicode string
            return decodeURIComponent(escape(atob(b64)));
        } catch (e) {
            console.error('Error decoding email body:', e);
            return '';
        }
    }
    return '';
}
