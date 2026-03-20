export function parseQuickscrumEmail(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    let ticket = null;
    let story = null;

    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
        const text = p.textContent.replace(/\s+/g, ' ').trim();

        // Look for ticket (subitem)
        if (text.includes('Assigned to subitem')) {
            // e.g. "You have been successfully Assigned to subitem DE#6917 - Admin : Some of the module..."
            const match = text.match(/Assigned to subitem\s*(DE#\d+)\s*-\s*(.*)/);
            if (match) {
                ticket = {
                    id: match[1],
                    title: match[2].trim(),
                    type: 'ticket'
                };
            }
        }

        // Look for story (workitem)
        if (text.includes('in workitem:')) {
            // e.g. "in workitem: ST#1461 - [Admin + Mobile] Sensitive Information Masking..."
            const match = text.match(/in workitem:\s*(ST#\d+)\s*-\s*(.*)/);
            if (match) {
                story = {
                    id: match[1],
                    title: match[2].trim(),
                    type: 'story'
                };
            }
        }
    }

    return { ticket, story };
}
