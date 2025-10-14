import { dom } from './dom.js';
import { state, getNextAttachmentId } from './state.js';
import { recordAttachmentChange } from './undo-redo.js';

function positionAttachmentsContainer() {
    const container = dom.attachmentsContainer;
    const prompt = dom.promptInput;
    if (!container || !prompt) return;
    const promptRect = prompt.getBoundingClientRect();
    // Use prompt width until 8+ items force scroll; don't pre-reserve width
    container.style.width = `${Math.round(promptRect.width)}px`;

    // After sizing, measure container height for placement calc
    const containerHeight = container.offsetHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    // Prefer placing attachments above the prompt to avoid covering it
    const spaceAbove = promptRect.top;
    const spaceBelow = viewportHeight - promptRect.bottom;
    let top;
    if (spaceAbove >= containerHeight + 12) {
        // Place above the prompt
        top = Math.max(0, promptRect.top - containerHeight - 8);
    } else {
        // Place below the prompt but try not to go off screen
        top = Math.min(viewportHeight - containerHeight - 8, promptRect.bottom + 8);
    }
    container.style.top = `${Math.max(0, top)}px`;

    // Horizontal anchor to the prompt center
    const centerX = promptRect.left + promptRect.width / 2;
    container.style.left = `${Math.round(centerX)}px`;
}

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
    positionAttachmentsContainer();
    
    // Record state change for undo/redo
    try {
        recordAttachmentChange();
    } catch (e) {
        console.warn('Failed to record attachment change:', e);
    }
    
    setTimeout(() => {
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        positionAttachmentsContainer();
    }, 100);
    return attachment;
}

export function removeImageAttachment(attachmentId) {
    const index = state.imageAttachments.findIndex(att => att.id === attachmentId);
    if (index !== -1) state.imageAttachments.splice(index, 1);
    
    // Record state change for undo/redo
    try {
        recordAttachmentChange();
    } catch (e) {
        console.warn('Failed to record attachment change:', e);
    }
    
    const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (element) {
        element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8)';
        setTimeout(() => {
            element.remove();
            updateAttachmentsVisibility();
            positionAttachmentsContainer();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 150);
    } else {
        updateAttachmentsVisibility();
        positionAttachmentsContainer();
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
    }
}

export function clearAllMediaAttachments() {
    state.imageAttachments = [];
    state.mediaAttachments = [];
    dom.attachmentsGrid.innerHTML = '';
    
    // Record state change for undo/redo
    try {
        recordAttachmentChange();
    } catch (e) {
        console.warn('Failed to record attachment change:', e);
    }
    
    updateAttachmentsVisibility();
    positionAttachmentsContainer();
    if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
}

export function renderImageAttachment(attachment) {
    const attachmentElement = document.createElement('div');
    attachmentElement.className = 'attachment-item';
    attachmentElement.setAttribute('data-attachment-id', attachment.id);
    
    // Skip animation for screenshot captures
    const skipAnimation = attachment.source === 'screenshot';
    
    if (!skipAnimation) {
        attachmentElement.style.opacity = '0';
        attachmentElement.style.transform = 'scale(0.8)';
    }
    
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
    
    if (!skipAnimation) {
        requestAnimationFrame(() => {
            attachmentElement.style.opacity = '1';
            attachmentElement.style.transform = 'scale(1)';
            positionAttachmentsContainer();
        });
    } else {
        positionAttachmentsContainer();
    }
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
        positionAttachmentsContainer();
    });
    setTimeout(() => {
        if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        positionAttachmentsContainer();
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
            positionAttachmentsContainer();
            if (typeof window.adjustWindowHeight === 'function') window.adjustWindowHeight();
        }, 200);
    }
}

export function updateAttachmentsVisibility() {
    const hasAttachments = state.imageAttachments.length > 0 || state.mediaAttachments.length > 0 || document.getElementById('attachment-loading');
    const attachmentsContainer = dom.attachmentsContainer;

    if (hasAttachments) {
        // Show attachments container
        attachmentsContainer.style.display = 'block';
        attachmentsContainer.classList.add('visible', 'has-attachments');
        
        // Show attachments section
        if (dom.attachmentsSection.style.display === 'none') {
            dom.attachmentsSection.style.display = 'block';
            dom.attachmentsSection.style.opacity = '0';
            dom.attachmentsSection.style.maxHeight = '0px';
            requestAnimationFrame(() => {
                dom.attachmentsSection.style.opacity = '1';
                dom.attachmentsSection.style.maxHeight = '300px';
                positionAttachmentsContainer();
            });
        }

        // Toggle horizontal scroll only when 8+ items
        const items = dom.attachmentsGrid?.querySelectorAll('.attachment-item, .attachment-loading') || [];
        if (items.length >= 8) dom.attachmentsGrid.classList.add('scrollable');
        else dom.attachmentsGrid.classList.remove('scrollable');
        positionAttachmentsContainer();
    } else {
        // Hide attachments container
        attachmentsContainer.classList.remove('visible', 'has-attachments');
        
        // Hide attachments section
        dom.attachmentsSection.style.opacity = '0';
        dom.attachmentsSection.style.maxHeight = '0px';
        
        setTimeout(() => {
            if (state.imageAttachments.length === 0 && state.mediaAttachments.length === 0 && !document.getElementById('attachment-loading')) {
                dom.attachmentsSection.style.display = 'none';
                attachmentsContainer.style.display = 'none';
            }
        }, 300);
    }
}

// Reposition on window resize and scroll to keep alignment
window.addEventListener('resize', () => positionAttachmentsContainer());
window.addEventListener('scroll', () => positionAttachmentsContainer(), { passive: true });

// Expose for other modules to call during transitions
window.__positionAttachmentsContainer = positionAttachmentsContainer;

// Track dragging of the chat input container to keep attachments attached
let __dragRaf = null;
function __startDragTracking() {
    if (__dragRaf) return;
    const loop = () => {
        positionAttachmentsContainer();
        __dragRaf = requestAnimationFrame(loop);
    };
    __dragRaf = requestAnimationFrame(loop);
}

function __stopDragTracking() {
    if (__dragRaf) {
        cancelAnimationFrame(__dragRaf);
        __dragRaf = null;
    }
}

// Observe class changes for the dragging state
try {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const isDragging = dom.chatInputContainer?.classList.contains('dragging');
                if (isDragging) __startDragTracking(); else __stopDragTracking();
                positionAttachmentsContainer();
            }
        }
    });
    if (dom.chatInputContainer) {
        observer.observe(dom.chatInputContainer, { attributes: true, attributeFilter: ['class'] });
    }
} catch {}

// Drag-to-scroll with inertia for smooth cursor scrolling
function enableDragScroll() {
    const grid = dom.attachmentsGrid;
    if (!grid || grid.__dragScrollBound) return;
    grid.__dragScrollBound = true;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let rafId = null;
    let lastX = 0;
    let lastTime = 0;

    const onMouseDown = (e) => {
        if (!grid.classList.contains('scrollable')) return;
        isDown = true;
        grid.classList.add('dragging');
        startX = e.pageX;
        scrollLeft = grid.scrollLeft;
        velocity = 0;
        lastX = e.pageX;
        lastTime = performance.now();
        cancelMomentum();
    };
    const onMouseMove = (e) => {
        if (!isDown) return;
        const x = e.pageX;
        const dx = x - startX;
        grid.scrollLeft = scrollLeft - dx;
        const now = performance.now();
        const dt = Math.max(1, now - lastTime);
        velocity = (x - lastX) / dt; // px per ms
        lastX = x; lastTime = now;
    };
    const onMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        grid.classList.remove('dragging');
        startMomentum();
    };
    const onMouseLeave = () => { if (isDown) onMouseUp(); };

    const momentum = () => {
        grid.scrollLeft -= velocity * 16; // 60fps ~16ms
        velocity *= 0.95;
        if (Math.abs(velocity) > 0.02) rafId = requestAnimationFrame(momentum);
        else rafId = null;
    };
    const startMomentum = () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (Math.abs(velocity) > 0.02) rafId = requestAnimationFrame(momentum);
    };
    const cancelMomentum = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } };

    grid.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    grid.addEventListener('mouseleave', onMouseLeave);
}

// Initialize once DOM references are ready
try { enableDragScroll(); } catch {}


