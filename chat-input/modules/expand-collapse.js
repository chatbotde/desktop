import { dom } from './dom.js';
import { state } from './state.js';
import { updateAttachmentsVisibility } from './attachments.js';

export function expandUI() {
    if (state.isTransitioning || state.expansionState === 'expanded' || state.expansionState === 'expanding') return;
    state.isTransitioning = true;
    state.expansionState = 'expanding';
    dom.promptInput.classList.add('expanded');
    dom.chatInputContainer.classList.add('expanded');
    if ((window.imageAttachments?.length > 0 || window.mediaAttachments?.length > 0)) {
        showAttachmentsSmoothly();
    }
    autoResize();
    requestAnimationFrame(() => adjustWindowHeightSmooth('expand'));
    setTimeout(() => { state.isTransitioning = false; state.expansionState = 'expanded'; }, 300);
}

export function collapseUI() {
    if (state.isTransitioning || state.expansionState === 'collapsed' || state.expansionState === 'collapsing') return;
    state.isTransitioning = true;
    state.expansionState = 'collapsing';
    hideAttachmentsSmoothly();
    dom.messageInput?.style && (dom.messageInput.style.height = '44px');
    dom.promptInput.classList.remove('expanded');
    dom.chatInputContainer.classList.remove('expanded');
    requestAnimationFrame(() => adjustWindowHeightSmooth('collapse'));
    setTimeout(() => { state.isTransitioning = false; state.expansionState = 'collapsed'; }, 300);
}

export function showAttachmentsSmoothly() {
    const section = dom.attachmentsSection;
    if (!section) return;
    section.style.display = 'block';
    section.style.opacity = '0';
    section.style.maxHeight = '0px';
    section.style.overflow = 'hidden';
    section.offsetHeight; // force reflow
    section.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
    section.style.opacity = '1';
    section.style.maxHeight = '200px';
    setTimeout(() => {
        section.style.transition = '';
        section.style.overflow = '';
        section.style.maxHeight = '';
    }, 300);
}

export function hideAttachmentsSmoothly() {
    const section = dom.attachmentsSection;
    if (!section || section.style.display === 'none') return;
    section.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
    section.style.opacity = '0';
    section.style.maxHeight = '0px';
    section.style.overflow = 'hidden';
    setTimeout(() => {
        section.style.display = 'none';
        section.style.transition = '';
        section.style.overflow = '';
        section.style.maxHeight = '';
    }, 300);
}

export function autoResize() {
    const isCollapsed = !dom.promptInput.classList.contains('expanded');
    if (isCollapsed) {
        dom.messageInput.style.height = 'auto';
        dom.messageInput.style.height = '44px';
        dom.messageInput.style.width = '100%';
    } else {
        dom.messageInput.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(dom.messageInput.scrollHeight, maxHeight);
        dom.messageInput.style.height = newHeight + 'px';
        dom.messageInput.style.width = '100%';
    }
    if (state.expansionState === 'expanding' || state.expansionState === 'collapsing') {
        adjustWindowHeightSmooth(state.expansionState === 'expanding' ? 'expand' : 'collapse');
    }
}

export function adjustWindowHeightSmooth(action = 'auto') {
    if (action !== 'expand' && action !== 'collapse') return;
    if (state.isHeightAdjusting) { state.heightAdjustmentQueue.push(action); return; }
    state.isHeightAdjusting = true;
    if (state.adjustHeightTimeout) clearTimeout(state.adjustHeightTimeout);
    state.adjustHeightTimeout = setTimeout(() => {
        const promptInput = dom.promptInput; const attachments = dom.attachmentsSection;
        if (!promptInput) { state.isHeightAdjusting = false; processHeightQueue(); return; }
        let targetHeight = promptInput.offsetHeight + 20;
        if (attachments && attachments.style.display !== 'none' && attachments.offsetHeight > 0) {
            targetHeight += attachments.offsetHeight + 10;
        }
        const minHeight = 80, maxHeight = 600;
        targetHeight = Math.max(minHeight, Math.min(maxHeight, targetHeight));
        if (Math.abs(targetHeight - state.lastTargetHeight) > 3) {
            const previousHeight = state.lastTargetHeight; state.lastTargetHeight = targetHeight;
            requestAnimationFrame(() => {
                if (window.chatInputAPI?.updateWindowHeight) window.chatInputAPI.updateWindowHeight(targetHeight);
                if (action === 'expand' && window.chatInputAPI?.updateWindowPosition) {
                    const diff = targetHeight - previousHeight; const currentY = window.screenY; const newY = Math.max(0, currentY - diff);
                    window.chatInputAPI.updateWindowPosition(window.screenX, newY);
                }
            });
        }
        state.isHeightAdjusting = false; processHeightQueue();
    }, (action === 'expand' || action === 'collapse') ? 100 : 50);
}

function processHeightQueue() {
    if (state.heightAdjustmentQueue.length > 0) {
        const next = state.heightAdjustmentQueue.shift();
        setTimeout(() => adjustWindowHeightSmooth(next), 50);
    }
}

export function updateSendButton() {
    const hasText = dom.messageInput.value.trim().length > 0;
    const hasAttachments = (window.__attachmentsCount?.() ?? 0) > 0;
    const isExpanded = dom.promptInput.classList.contains('expanded');
    if (!isExpanded) {
        if (!hasText && !hasAttachments && !window.__isSending?.()) {
            dom.expandButton.style.display = 'flex';
            dom.sendButton.style.display = 'none';
        } else {
            dom.expandButton.style.display = 'none';
            dom.sendButton.style.display = 'flex';
            dom.sendButton.disabled = (!hasText && !hasAttachments) || window.__isSending?.();
        }
    } else {
        dom.expandButton.style.display = 'none';
        dom.sendButton.style.display = 'flex';
        dom.sendButton.disabled = (!hasText && !hasAttachments) || window.__isSending?.();
    }
    if (window.__isSending?.()) {
        dom.sendIcon.style.display = 'none';
        dom.loadingSpinner.style.display = 'block';
    } else {
        dom.sendIcon.style.display = 'block';
        dom.loadingSpinner.style.display = 'none';
    }
}


