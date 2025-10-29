import { dom } from './dom.js';
import { state } from './state.js';
import { updateAttachmentsVisibility } from './attachments.js';

// Helper to update hide button position (imported from container-drag conceptually)
function updateHideButtonPosition() {
    const hideButton = dom.hideChatButton;
    if (!hideButton || !dom.chatInputContainer) return;
    
    const containerRect = dom.chatInputContainer.getBoundingClientRect();
    const buttonWidth = 36;
    const gap = 10;
    
    hideButton.style.position = 'fixed';
    hideButton.style.left = (containerRect.left - buttonWidth - gap) + 'px';
    hideButton.style.top = (containerRect.top + containerRect.height / 2) + 'px';
    hideButton.style.transform = 'translateY(-50%)';
    
    // Add 'positioned' class to show the button after positioning
    hideButton.classList.add('positioned');
}

export function expandUI() {
    if (state.isTransitioning || state.expansionState === 'expanded' || state.expansionState === 'expanding') return;
    state.isTransitioning = true;
    state.expansionState = 'expanding';
    
    // Store initial height before expansion for upward positioning
    const initialHeight = dom.chatInputContainer.offsetHeight;
    
    dom.promptInput.classList.add('expanded');
    dom.chatInputContainer.classList.add('expanded');
    if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer();
    if ((window.imageAttachments?.length > 0 || window.mediaAttachments?.length > 0)) {
        showAttachmentsSmoothly();
    }
    // Apply expanded state styles and resize to show all content
    autoResize();
    // Small delay to ensure styles are applied before height adjustment
    setTimeout(() => { 
        autoResize(); 
        if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer(); 
        
        // Calculate height difference for upward expansion animation
        const expandedHeight = dom.chatInputContainer.offsetHeight;
        const heightDiff = expandedHeight - initialHeight;
        
        // Trigger upward expansion animation
        if (heightDiff > 0) {
            requestAnimationFrame(() => adjustWindowHeightSmooth('expand'));
        }
        // Update button positions after expansion
        updateHideButtonPosition();
        if (window.updatePersistentTogglePosition) window.updatePersistentTogglePosition();
    }, 50);
    
    setTimeout(() => { 
        state.isTransitioning = false; 
        state.expansionState = 'expanded'; 
        if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer();
    }, 300);
}

export function collapseUI() {
    if (state.isTransitioning || state.expansionState === 'collapsed' || state.expansionState === 'collapsing') return;
    state.isTransitioning = true;
    state.expansionState = 'collapsing';
    
    // Update button positions when collapsing starts
    updateHideButtonPosition();
    if (window.updatePersistentTogglePosition) window.updatePersistentTogglePosition();
    
    // Store expanded height before collapse for downward positioning
    const expandedHeight = dom.chatInputContainer.offsetHeight;
    
    // Do not hide attachments on collapse; keep them visible if present
    updateAttachmentsVisibility();
    
    // Remove expanded class to trigger collapsed state CSS
    dom.promptInput.classList.remove('expanded');
    dom.chatInputContainer.classList.remove('expanded');
    if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer();
    
    // Apply collapsed state styles
    autoResize();
    
    requestAnimationFrame(() => { 
        // Calculate height difference for downward collapse animation
        const collapsedHeight = dom.chatInputContainer.offsetHeight;
        const heightDiff = expandedHeight - collapsedHeight;
        
        // Trigger collapse animation with proper positioning
        if (heightDiff > 0) {
            adjustWindowHeightSmooth('collapse'); 
        }
        if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer(); 
    });
    
    setTimeout(() => { 
        state.isTransitioning = false; 
        state.expansionState = 'collapsed';
        // Ensure collapsed state is fully applied
        autoResize();
        if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer();
        // Update button positions after collapse is complete
        updateHideButtonPosition();
        if (window.updatePersistentTogglePosition) window.updatePersistentTogglePosition();
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
        // Keep collapsed to single line via CSS; here only enforce height and overflow
        dom.messageInput.style.setProperty('height', '44px');
        dom.messageInput.style.setProperty('min-height', '44px');
        dom.messageInput.style.setProperty('max-height', '44px');
        dom.messageInput.style.setProperty('overflow', 'hidden');
        dom.messageInput.style.setProperty('overflow-y', 'hidden');
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
        // Let CSS handle white-space, wrapping and line-height
        
        // Auto-resize height based on content
        dom.messageInput.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(dom.messageInput.scrollHeight, maxHeight);
        dom.messageInput.style.height = newHeight + 'px';
        dom.messageInput.style.width = '100%';

        // While expanded, keep the window bottom anchored as height changes
        adjustWindowHeightSmooth('expand');
        if (window.__positionAttachmentsContainer) window.__positionAttachmentsContainer();
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
                // NOTE: Removed bottom-anchoring behavior - window stays centered now
                // The CSS keeps the window centered with transform: translate(-50%, -50%)
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
    
    // Same behavior for both collapsed and expanded states
    if (!hasText && !hasAttachments && !window.__isSending?.()) {
        dom.expandButton.style.display = 'flex';
        dom.sendButton.style.display = 'none';
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