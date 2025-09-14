import { addImageAttachment, showAttachmentLoading, hideAttachmentLoading } from './attachments.js';

export async function handlePasteContent() {
    try {
        if (navigator.clipboard?.read) {
            const clipboardItems = await navigator.clipboard.read();
            await handleImagePaste(clipboardItems);
            for (const item of clipboardItems) {
                if (item.types.includes('text/plain')) {
                    const textBlob = await item.getType('text/plain');
                    const text = await textBlob.text();
                    if (text) appendToInput(text);
                }
                if (item.types.includes('text/html')) {
                    const htmlBlob = await item.getType('text/html');
                    const html = await htmlBlob.text();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    if (plainText) appendToInput(plainText);
                }
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
    input.value += (hadText ? '\n' : '') + content;
}


