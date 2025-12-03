import { state } from '../core/state.js';
import { dom } from '../core/dom.js';
import { updateAttachmentsVisibility } from './attachments.js';
import { updateSendButton } from '../ui/expand-collapse.js';

export function addMediaAttachment(mediaFile) {
    const attachment = {
        id: `media_${++state.attachmentIdCounter}`,
        name: mediaFile.name,
        type: mediaFile.type,
        size: mediaFile.size,
        data: mediaFile.data,
        mediaType: mediaFile.mediaType,
        source: mediaFile.source || 'upload',
        timestamp: Date.now(),
        duration: mediaFile.duration,
        dimensions: mediaFile.dimensions,
    };
    if (attachment.mediaType === window?.MediaUtils?.MediaType?.IMAGE) {
        state.imageAttachments.push(attachment);
        renderImage(attachment);
    } else {
        state.mediaAttachments.push(attachment);
        renderMedia(attachment);
    }
    updateAttachmentsVisibility();
    updateSendButton();
    setTimeout(() => { if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight(); }, 100);
    return attachment;
}

function renderImage(attachment) {
    const el = document.createElement('div');
    el.className = 'attachment-item';
    el.setAttribute('data-attachment-id', attachment.id);
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
    el.innerHTML = `
        <img src="${attachment.data}" alt="${attachment.name}" class="attachment-preview" />
        <div class="attachment-info">${attachment.name}</div>
        <button class="attachment-remove" onclick="window.removeMediaAttachment('${attachment.id}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
            </svg>
        </button>
    `;
    dom.attachmentsGrid.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'scale(1)'; });
}

function renderMedia(attachment) {
    const attachmentElement = document.createElement('div');
    const isAudio = attachment.mediaType === window?.MediaUtils?.MediaType?.AUDIO;
    attachmentElement.className = `attachment-item media-thumbnail ${isAudio ? 'audio' : 'video'}`;
    attachmentElement.setAttribute('data-attachment-id', attachment.id);
    attachmentElement.setAttribute('data-media-url', attachment.data);
    attachmentElement.setAttribute('data-media-type', isAudio ? 'audio' : 'video');
    attachmentElement.setAttribute('data-mime-type', attachment.type);
    attachmentElement.style.opacity = '0';
    attachmentElement.style.transform = 'scale(0.8)';

    const durationText = attachment.duration ? formatDuration(attachment.duration) : '';
    
    // Determine icon and label based on media type
    const icon = isAudio ? `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
        </svg>
    ` : `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
    `;
    const typeLabel = isAudio ? 'Audio' : 'Video';

    attachmentElement.innerHTML = `
        <div class="media-thumb-content" onclick="window.previewMedia('${attachment.id}')" title="Click to preview">
            <div class="media-thumb-icon ${isAudio ? 'audio' : 'video'}">
                ${icon}
            </div>
            <div class="media-thumb-label">${typeLabel}</div>
            ${durationText ? `<div class="media-thumb-duration">${durationText}</div>` : ''}
        </div>
        <button class="attachment-remove" onclick="event.stopPropagation(); window.removeMediaAttachment('${attachment.id}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
            </svg>
        </button>
    `;
    dom.attachmentsGrid.appendChild(attachmentElement);
    requestAnimationFrame(() => { attachmentElement.style.opacity = '1'; attachmentElement.style.transform = 'scale(1)'; });
}

// Preview media in a modal
window.previewMedia = function(attachmentId) {
    const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (!element) return;
    
    const mediaUrl = element.getAttribute('data-media-url');
    const mediaType = element.getAttribute('data-media-type');
    const mimeType = element.getAttribute('data-mime-type');
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'media-preview-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    let mediaElement = '';
    if (mediaType === 'audio') {
        mediaElement = `
            <audio controls autoplay style="width: 100%; max-width: 400px;">
                <source src="${mediaUrl}" type="${mimeType}">
            </audio>
        `;
    } else {
        mediaElement = `
            <video controls autoplay style="width: 100%; max-width: 600px; max-height: 80vh; border-radius: 8px;">
                <source src="${mediaUrl}" type="${mimeType}">
            </video>
        `;
    }
    
    modal.innerHTML = `
        <div class="media-preview-content">
            <button class="media-preview-close" onclick="this.closest('.media-preview-modal').remove()" title="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
            ${mediaElement}
        </div>
    `;
    
    document.body.appendChild(modal);
};

export function removeMediaAttachment(attachmentId) {
    let index = state.mediaAttachments.findIndex(att => att.id === attachmentId);
    if (index !== -1) {
        state.mediaAttachments.splice(index, 1);
    } else {
        index = state.imageAttachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) state.imageAttachments.splice(index, 1);
    }
    
    updateSendButton();
    
    const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (element) {
        element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        setTimeout(() => {
            element.remove();
            updateAttachmentsVisibility();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 200);
    } else {
        updateAttachmentsVisibility();
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


