import { state } from './state.js';
import { dom } from './dom.js';
import { updateAttachmentsVisibility } from './attachments.js';

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
    attachmentElement.className = 'attachment-item media-attachment';
    attachmentElement.setAttribute('data-attachment-id', attachment.id);
    attachmentElement.style.opacity = '0';
    attachmentElement.style.transform = 'scale(0.8)';

    let mediaPreview = '';
    if (attachment.mediaType === window?.MediaUtils?.MediaType?.AUDIO) {
        mediaPreview = `
            <div class="audio-preview">
                <div class="media-icon"></div>
                <audio controls preload="metadata" style="width: 100%;">
                    <source src="${attachment.data}" type="${attachment.type}">
                </audio>
            </div>
        `;
    } else if (attachment.mediaType === window?.MediaUtils?.MediaType?.VIDEO) {
        const videoId = `video_${attachment.id}`;
        mediaPreview = `
            <div class="video-preview" style="position: relative;">
                <video id="${videoId}" controls preload="metadata" muted playsinline webkit-playsinline crossorigin="anonymous"
                    style="width: 100%; max-height: 200px; min-height: 120px; background: #000; display: block !important; visibility: visible !important; object-fit: contain; border-radius: 8px;">
                    <source src="${attachment.data}" type="${attachment.type}">
                </video>
                <div id="${videoId}_error" class="video-error" style="display: none; padding: 8px; background: #d32f2f; color: #fff; text-align: center; border-radius: 4px; margin-top: 4px; font-size: 11px;">
                    ❌ Video cannot be displayed. This may be due to codec incompatibility or corrupted data.
                </div>
                <div class="video-info" style="padding: 4px 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; position: absolute; bottom: 4px; left: 4px; border-radius: 3px;">
                    Video: ${attachment.type}
                </div>
            </div>
        `;
    }

    const durationText = attachment.duration ? ` (${formatDuration(attachment.duration)})` : '';
    const sizeText = window?.MediaUtils?.formatFileSize ? window.MediaUtils.formatFileSize(attachment.size) : `${attachment.size} bytes`;
    attachmentElement.innerHTML = `
        ${mediaPreview}
        <div class="attachment-info">
            <div class="attachment-name">${attachment.name}</div>
            <div class="attachment-meta">${sizeText}${durationText}</div>
        </div>
        <button class="attachment-remove" onclick="window.removeMediaAttachment('${attachment.id}')" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/>
                <path d="M6 6l12 12"/>
            </svg>
        </button>
    `;
    dom.attachmentsGrid.appendChild(attachmentElement);
    requestAnimationFrame(() => { attachmentElement.style.opacity = '1'; attachmentElement.style.transform = 'scale(1)'; });
}

export function removeMediaAttachment(attachmentId) {
    let index = state.mediaAttachments.findIndex(att => att.id === attachmentId);
    if (index !== -1) {
        state.mediaAttachments.splice(index, 1);
    } else {
        index = state.imageAttachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) state.imageAttachments.splice(index, 1);
    }
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


