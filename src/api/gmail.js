export async function getAuthToken(interactive = false) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, function (token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
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
            return decodeURIComponent(escape(atob(b64)));
        } catch (e) {
            console.error('Error decoding email body:', e);
            return '';
        }
    }
    return '';
}
