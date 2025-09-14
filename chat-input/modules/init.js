import { dom } from './dom.js';
import { state } from './state.js';
import { initializeContentProtection, toggleContentProtection } from './content-protection.js';
import { toggleTheme, initializeTheme, toggleLighting } from './theme.js';
import { addImageAttachment, updateAttachmentsVisibility, clearAllMediaAttachments, showAttachmentLoading, hideAttachmentLoading } from './attachments.js';
import { addMediaAttachment, removeMediaAttachment } from './richmedia.js';
import { showDropdownAdvanced, hideAllDropdowns, wireDropdownButtons } from './dropdowns.js';
import { expandUI, collapseUI, autoResize, updateSendButton, adjustWindowHeightSmooth } from './expand-collapse.js';
import { initializeClickThrough, toggleClickThrough } from './clickthrough.js';
import { initializeFloatingCards } from './floating-cards.js';
import { initializeModelSelection, updateModelDropdownSelection, selectModel, wireModelDropdownInteractions } from './model-selection.js';
import { sendMessage, resetSendingState } from './messaging.js';
import { handlePasteContent } from './paste-drop.js';
import { handleImageUpload, handleVideoUpload, handleAudioUpload, handleDesktopCapture, handleAudioCapture, handleVideoCapture } from './uploads-capture.js';
import { geometryController } from './geometry.js';
import { stopCurrentRecording, updateVolumeIndicator } from './recording.js';
import { initializeContainerDrag } from './container-drag.js';

// expose minimal globals used by inline HTML event handlers
window.removeImageAttachment = (id) => {
    // image removal is handled by richmedia removeMediaAttachment too
    removeMediaAttachment(id);
};
window.removeMediaAttachment = removeMediaAttachment;
window.stopCurrentRecording = stopCurrentRecording;

// expose helpers expected by some modules
window.__getImageAttachments = () => state.imageAttachments;
window.__getMediaAttachments = () => state.mediaAttachments;
window.__attachmentsCount = () => state.imageAttachments.length + state.mediaAttachments.length;
window.__clearAllAttachments = clearAllMediaAttachments;
window.__isSending = () => state.isSending;
window.__isRecording = () => state.isRecording;
window.__getRecordingType = () => state.currentRecordingType;

export async function boot() {
    await geometryController.init();
    initializeContentProtection();
    initializeTheme();
    initializeModelSelection();
    wireModelDropdownInteractions();
    wireDropdownButtons();
    initializeClickThrough();
    initializeFloatingCards();
    initializeContainerDrag();

    // legacy no-op to keep older calls safe
    window.adjustWindowHeight = () => {};

    if (dom.chatInputContainer) dom.chatInputContainer.classList.add('fullscreen');
    dom.promptInput.classList.remove('expanded');
    dom.messageInput.focus();
    updateSendButton();

    // listeners
    dom.messageInput.addEventListener('dblclick', () => expandUI());
    dom.collapseButton.addEventListener('click', () => collapseUI());
    dom.expandButton.addEventListener('click', () => expandUI());
    dom.plusButton.addEventListener('click', (e) => { e.stopPropagation(); expandUI(); });

    dom.uploadDropdown.addEventListener('click', (e) => {
        const button = e.target.closest('.dropdown-item-compact');
        if (!button) return;
        const action = button.getAttribute('data-action');
        switch (action) {
            case 'upload-image': handleImageUpload(); break;
            case 'upload-video': handleVideoUpload(); break;
            case 'upload-audio': handleAudioUpload(); break;
            default: break;
        }
        hideAllDropdowns();
        dom.messageInput.focus();
    });

    dom.captureDropdown.addEventListener('click', (e) => {
        const button = e.target.closest('.dropdown-item-compact');
        if (!button) return;
        const action = button.getAttribute('data-action');
        switch (action) {
            case 'desktop-capture': handleDesktopCapture(); break;
            case 'audio-capture': handleAudioCapture(); break;
            case 'capture-video': handleVideoCapture(); break;
        }
        hideAllDropdowns();
        dom.messageInput.focus();
    });

    // Plus actions dropdown
    dom.plusActionsDropdown.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        hideAllDropdowns();
        switch (action) {
            case 'upload':
                showDropdownAdvanced('uploadDropdown', dom.expandedPlusButton);
                break;
            case 'capture':
                showDropdownAdvanced('captureDropdown', dom.expandedPlusButton);
                break;
            case 'theme':
                toggleTheme();
                break;
            case 'lighting':
                toggleLighting();
                break;
            case 'hide':
                window.chatInputAPI?.hideWindow?.();
                break;
            case 'click-through':
                toggleClickThrough();
                break;
            case 'toggle-main':
                window.chatInputAPI?.toggleMainWindow?.();
                break;
            case 'protection':
                toggleContentProtection();
                break;
            case 'collapse':
                collapseUI();
                break;
        }
    });

    // Close buttons in dropdown headers
    document.getElementById('closeUploadDropdown')?.addEventListener('click', (e) => { e.stopPropagation(); hideAllDropdowns(); });
    document.getElementById('closeCaptureDropdown')?.addEventListener('click', (e) => { e.stopPropagation(); hideAllDropdowns(); });
    document.getElementById('closePlusActionsDropdown')?.addEventListener('click', (e) => { e.stopPropagation(); hideAllDropdowns(); });
    document.getElementById('closeModelSelectDropdown')?.addEventListener('click', (e) => { e.stopPropagation(); hideAllDropdowns(); });

    dom.clearAllButton.addEventListener('click', () => clearAllMediaAttachments());
    dom.sendButton.addEventListener('click', () => sendMessage());
    dom.lightingButton.addEventListener('click', () => toggleLighting());
    dom.themeToggleButton.addEventListener('click', () => toggleTheme());
    dom.hideShowButton.addEventListener('click', () => window.chatInputAPI?.hideWindow?.());
    dom.toggleMainWindowButton.addEventListener('click', () => window.chatInputAPI?.toggleMainWindow?.());

    dom.messageInput.addEventListener('keydown', (e) => {
        const isCollapsed = !dom.promptInput.classList.contains('expanded');
        if (isCollapsed && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        if (!isCollapsed && e.key === 'Enter' && e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    dom.messageInput.addEventListener('input', () => { autoResize(); updateSendButton(); });

    // paste
    document.addEventListener('paste', (e) => {
        if (document.activeElement === dom.messageInput || document.activeElement === document.body) {
            e.preventDefault();
            handlePasteContent();
        }
    });

    // IPC
    if (window.chatInputAPI) {
        window.chatInputAPI.onClearInput(() => { dom.messageInput.value = ''; autoResize(); resetSendingState(); dom.messageInput.focus(); });
        window.chatInputAPI.onFocusInput(() => { dom.messageInput.focus(); });
    }

    // capture api
    if (window.RendererCaptureAPI) {
        window.rendererCaptureAPI = new window.RendererCaptureAPI();
        window.rendererCaptureAPI.setVolumeCallback((data) => updateVolumeIndicator(data.volume));
    }

    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'h' && e.ctrlKey) { e.preventDefault(); window.chatInputAPI?.hideWindow?.(); return; }
        if (e.key === 'm' && e.ctrlKey) { e.preventDefault(); window.chatInputAPI?.toggleMainWindow?.(); return; }
        if (e.key === 't' && e.ctrlKey) { e.preventDefault(); toggleTheme(); return; }
        if (document.activeElement !== dom.messageInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && /^[a-zA-Z0-9\s]$/.test(e.key)) {
            dom.messageInput.focus();
        }
    });

    window.addEventListener('focus', () => dom.messageInput.focus());
}


