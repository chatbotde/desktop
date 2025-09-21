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
    // Apply expanded state styles and resize to show all content
    autoResize();
    // Small delay to ensure styles are applied before height adjustment
    setTimeout(() => autoResize(), 50);
    requestAnimationFrame(() => adjustWindowHeightSmooth('expand'));
    setTimeout(() => { state.isTransitioning = false; state.expansionState = 'expanded'; }, 300);
}

export function collapseUI() {
    if (state.isTransitioning || state.expansionState === 'collapsed' || state.expansionState === 'collapsing') return;
    state.isTransitioning = true;
    state.expansionState = 'collapsing';
    hideAttachmentsSmoothly();
    
    // Remove expanded class to trigger collapsed state CSS
    dom.promptInput.classList.remove('expanded');
    dom.chatInputContainer.classList.remove('expanded');
    
    // Apply collapsed state styles
    autoResize();
    
    requestAnimationFrame(() => adjustWindowHeightSmooth('collapse'));
    setTimeout(() => { 
        state.isTransitioning = false; 
        state.expansionState = 'collapsed';
        // Ensure collapsed state is fully applied
        autoResize();
    }, 300);
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
        // Force collapsed state with maximum specificity - use setProperty with important
        dom.messageInput.style.setProperty('height', '44px', 'important');
        dom.messageInput.style.setProperty('min-height', '44px', 'important');
        dom.messageInput.style.setProperty('max-height', '44px', 'important');
        dom.messageInput.style.setProperty('overflow', 'hidden', 'important');
        dom.messageInput.style.setProperty('overflow-y', 'hidden', 'important');
        dom.messageInput.style.setProperty('white-space', 'nowrap', 'important');
        dom.messageInput.style.setProperty('text-overflow', 'ellipsis', 'important');
        dom.messageInput.style.setProperty('word-wrap', 'normal', 'important');
        dom.messageInput.style.setProperty('word-break', 'normal', 'important');
        dom.messageInput.style.setProperty('line-height', '28px', 'important');
        dom.messageInput.style.width = '100%';
        
        // Reset scroll position to show content from beginning
        dom.messageInput.scrollTop = 0;
        dom.messageInput.scrollLeft = 0;
    } else {
        // Expanded state - remove important flags and allow normal resizing
        dom.messageInput.style.removeProperty('height');
        dom.messageInput.style.removeProperty('max-height');
        dom.messageInput.style.setProperty('min-height', '44px');
        dom.messageInput.style.setProperty('max-height', '200px');
        dom.messageInput.style.setProperty('overflow', 'auto');
        dom.messageInput.style.setProperty('overflow-y', 'auto');
        dom.messageInput.style.setProperty('white-space', 'pre-wrap');
        dom.messageInput.style.setProperty('text-overflow', 'clip');
        dom.messageInput.style.setProperty('word-wrap', 'break-word');
        dom.messageInput.style.setProperty('word-break', 'break-word');
        dom.messageInput.style.removeProperty('line-height'); // Use default line-height
        
        // Auto-resize height based on content
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
        // Include overflow from any open speed-dials and submenus so they are visible within window
        try {
            const pRect = promptInput.getBoundingClientRect();
            let extraTop = 0, extraBottom = 0;
            const openDials = promptInput.querySelectorAll('.speed-dial.open, .speed-dial .submenu.open');
            openDials.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.top < pRect.top) extraTop = Math.max(extraTop, pRect.top - r.top);
                if (r.bottom > pRect.bottom) extraBottom = Math.max(extraBottom, r.bottom - pRect.bottom);
            });
            const extra = Math.ceil(extraTop + extraBottom);
            if (extra > 0) targetHeight += extra + 8; // small cushion
        } catch {}
    const minHeight = 80, maxHeight = 720;
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


