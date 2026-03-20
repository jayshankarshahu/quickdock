export function parseQuickscrumEmail(htmlString, assignedDate) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    let ticket = null;
    let story = null;
    let project = null;

    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
        const text = p.textContent.replace(/\s+/g, ' ').trim();

        // Look for ticket (subitem)
        if (text.includes('Assigned to subitem')) {
            const match = text.match(/Assigned to subitem\s*(DE#\d+)\s*-\s*(.*)/);
            if (match) {
                ticket = {
                    id: match[1],
                    title: match[2].trim(),
                    type: 'ticket',
                    assignedDate
                };
            }
        }

        // Look for story (workitem)
        if (text.includes('in workitem:')) {
            const match = text.match(/in workitem:\s*(ST#\d+)\s*-\s*(.*)/);
            if (match) {
                story = {
                    id: match[1],
                    title: match[2].trim(),
                    type: 'story',
                    assignedDate
                };
            }
        }

        // Look for project
        if (text.includes('in Project:')) {
            const match = text.match(/in Project:\s*(.*)/);
            if (match) {
                project = match[1].trim();
            }
        }
    }

    if (ticket) {
        if (project) ticket.project = project;
        if (story) ticket.parentStory = story.id;
    }
    if (story && project) {
        story.project = project;
    }

    return { ticket, story };
}
