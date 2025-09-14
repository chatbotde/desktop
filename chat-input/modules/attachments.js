import { dom } from './dom.js';
import { state, getNextAttachmentId } from './state.js';

export function addImageAttachment(imageData) {
    const attachment = {
        id: getNextAttachmentId(),
        name: imageData.name,
        type: imageData.type,
        size: imageData.size,
        data: imageData.data,
        source: imageData.source || 'upload',
        timestamp: Date.now(),
        mediaType: (window?.MediaUtils?.MediaType?.IMAGE) || 'image',
    };
    state.imageAttachments.push(attachment);
    renderImageAttachment(attachment);
    updateAttachmentsVisibility();
    setTimeout(() => {
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }, 100);
    return attachment;
}

export function removeImageAttachment(attachmentId) {
    const index = state.imageAttachments.findIndex(att => att.id === attachmentId);
    if (index !== -1) state.imageAttachments.splice(index, 1);
    const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (element) {
        element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        setTimeout(() => {
            element.remove();
            updateAttachmentsVisibility();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 150);
    } else {
        updateAttachmentsVisibility();
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }
}

export function clearAllMediaAttachments() {
    state.imageAttachments = [];
    state.mediaAttachments = [];
    dom.attachmentsGrid.innerHTML = '';
    updateAttachmentsVisibility();
    if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
}

export function renderImageAttachment(attachment) {
    const attachmentElement = document.createElement('div');
    attachmentElement.className = 'attachment-item';
    attachmentElement.setAttribute('data-attachment-id', attachment.id);
    attachmentElement.style.opacity = '0';
    attachmentElement.style.transform = 'scale(0.8)';
    attachmentElement.innerHTML = `
        <img src="${attachment.data}" alt="${attachment.name}" class="attachment-preview" />
        <div class="attachment-info">${attachment.name}</div>
        <button class="attachment-remove" onclick="window.removeImageAttachment('${attachment.id}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
            </svg>
        </button>
    `;
    dom.attachmentsGrid.appendChild(attachmentElement);
    requestAnimationFrame(() => {
        attachmentElement.style.opacity = '1';
        attachmentElement.style.transform = 'scale(1)';
    });
}

export function showAttachmentLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'attachment-loading';
    loadingElement.id = 'attachment-loading';
    loadingElement.style.opacity = '0';
    loadingElement.style.transform = 'scale(0.8)';
    dom.attachmentsGrid.appendChild(loadingElement);
    updateAttachmentsVisibility();
    requestAnimationFrame(() => {
        loadingElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        loadingElement.style.opacity = '1';
        loadingElement.style.transform = 'scale(1)';
    });
    setTimeout(() => {
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }, 100);
    return loadingElement;
}

export function hideAttachmentLoading() {
    const loadingElement = document.getElementById('attachment-loading');
    if (loadingElement) {
        loadingElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        loadingElement.style.opacity = '0';
        loadingElement.style.transform = 'scale(0.8)';
        setTimeout(() => {
            loadingElement.remove();
            updateAttachmentsVisibility();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 200);
    }
}

export function updateAttachmentsVisibility() {
    const hasAttachments = state.imageAttachments.length > 0 || state.mediaAttachments.length > 0 || document.getElementById('attachment-loading');
    const container = dom.promptInput;
    const isExpanded = container.classList.contains('expanded');
    if (hasAttachments && isExpanded) {
        if (dom.attachmentsSection.style.display === 'none') {
            dom.attachmentsSection.style.display = 'block';
            dom.attachmentsSection.style.opacity = '0';
            dom.attachmentsSection.style.maxHeight = '0px';
            requestAnimationFrame(() => {
                dom.attachmentsSection.style.opacity = '1';
                dom.attachmentsSection.style.maxHeight = '300px';
            });
        }
    } else {
        dom.attachmentsSection.style.opacity = '0';
        dom.attachmentsSection.style.maxHeight = '0px';
        setTimeout(() => {
            if (state.imageAttachments.length === 0 && state.mediaAttachments.length === 0 && !document.getElementById('attachment-loading')) {
                dom.attachmentsSection.style.display = 'none';
            }
        }, 300);
    }
}


