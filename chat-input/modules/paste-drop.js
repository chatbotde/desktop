import { addImageAttachment, showAttachmentLoading, hideAttachmentLoading } from './attachments.js';

export async function handlePasteContent() {
    try {
        if (navigator.clipboard?.read) {
            const clipboardItems = await navigator.clipboard.read();
            await handleImagePaste(clipboardItems);
            // Prefer a single text source to avoid duplicate appends
            let appended = false;
            for (const item of clipboardItems) {
                if (!appended && item.types.includes('text/plain')) {
                    const textBlob = await item.getType('text/plain');
                    const text = await textBlob.text();
                    if (text) {
                        appendToInput(text);
                        appended = true;
                    }
                } else if (!appended && item.types.includes('text/html')) {
                    const htmlBlob = await item.getType('text/html');
                    const html = await htmlBlob.text();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    if (plainText) {
                        appendToInput(plainText);
                        appended = true;
                    }
                }
            }
            if (!appended && navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text) appendToInput(text);
            }
        } else if (navigator.clipboard?.readText) {
            const text = await navigator.clipboard.readText();
            if (text) appendToInput(text);
        }
    } catch (error) {
        try {
            const text = await navigator.clipboard.readText();
            if (text) appendToInput(text);
        } catch (fallbackError) {
            console.log('Paste failed:', fallbackError);
        }
    }
}

export async function handleImagePaste(items) {
    for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            try {
                showAttachmentLoading();
                const imageType = item.types.find(type => type.startsWith('image/'));
                const imageBlob = await item.getType(imageType);
                const reader = new FileReader();
                reader.onload = function(e) {
                    hideAttachmentLoading();
                    addImageAttachment({
                        name: `pasted-image-${Date.now()}.${imageType.split('/')[1]}`,
                        type: imageType,
                        size: imageBlob.size,
                        data: e.target.result,
                        source: 'paste'
                    });
                };
                reader.readAsDataURL(imageBlob);
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error processing pasted image:', error);
            }
        }
    }
}

function appendToInput(content) {
    const input = document.getElementById('messageInput');
    const hadText = input.value.length > 0;

    // Determine collapsed state
    const prompt = document.querySelector('.prompt-input');
    const isCollapsed = prompt && !prompt.classList.contains('expanded');

    // Normalize content based on state
    let incoming = String(content ?? '');
    if (isCollapsed) {
        // Strip newlines/tabs and collapse whitespace to keep a single line
        incoming = incoming.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        // Join with a single space if there is existing text
        input.value = (input.value.trim() + (hadText ? ' ' : '') + incoming).trim();
    } else {
        // In expanded mode, keep newlines; add a line break only when there is prior content
        input.value += (hadText ? '\n' : '') + incoming;
    }
    
    // If collapsed, immediately enforce single-line UI sizing
    if (isCollapsed) {
        input.style.setProperty('height', '44px', 'important');
        input.style.setProperty('max-height', '44px', 'important');
        input.style.setProperty('white-space', 'nowrap', 'important');
        input.style.setProperty('overflow', 'hidden', 'important');
        input.style.setProperty('text-overflow', 'ellipsis', 'important');
        // Remove any carriage returns/newlines that might still exist
        input.value = input.value.replace(/[\r\n]+/g, ' ');
    }
    
    // Trigger resize and update send button
    import('./expand-collapse.js').then(({ autoResize, updateSendButton }) => {
        autoResize();
        updateSendButton();
    });
}


