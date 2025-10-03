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
import { initializeClipboardInjection } from './clipboard-injector.js';
import { initClipboardUI } from './clipboard-ui.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from './auto-clipboard-state.js';

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
    initializeClipboardInjection();
    initClipboardUI();

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
    // Collapsed plus button toggles speed-dial first; holds expand shortcut on long-press
    {
    const speedDial = document.getElementById('collapsedSpeedDial');
    const speedDialLeft = document.getElementById('collapsedSpeedDialLeft');
        let pressTimer;
        const openDial = (dial) => { if (!dom.promptInput.classList.contains('expanded')) { dial?.classList.add('open'); dial?.setAttribute('aria-hidden', 'false'); } };
        const closeDial = (dial) => { dial?.classList.remove('open'); dial?.setAttribute('aria-hidden', 'true'); closeSubmenus(dial); };
        const toggleDial = (dial) => { if (!dial) return; if (dial.classList.contains('open')) closeDial(dial); else openDial(dial); };
    const closeAllDials = () => { closeDial(speedDial); closeDial(speedDialLeft); };
        const closeSubmenus = (dial) => {
            dial?.querySelector('.upload-submenu')?.classList.remove('open');
            dial?.querySelector('.capture-submenu')?.classList.remove('open');
        };

        // Right plus toggles right dial
        dom.plusButton.addEventListener('click', (e) => { e.stopPropagation(); toggleDial(speedDial); closeDial(speedDialLeft); });
        dom.plusButton.addEventListener('mousedown', () => { pressTimer = setTimeout(() => { expandUI(); }, 500); });
        dom.plusButton.addEventListener('mouseup', () => { if (pressTimer) clearTimeout(pressTimer); });
        dom.plusButton.addEventListener('mouseleave', () => { if (pressTimer) clearTimeout(pressTimer); });

        // Left-side trigger: model button opens the left dial quickly (can choose another trigger if needed)
        dom.modelSelectButton?.addEventListener('click', (e) => { e.stopPropagation(); toggleDial(speedDialLeft); closeDial(speedDial); });

    document.addEventListener('click', (e) => {
            const insideAny = (el) => el && (el.contains(e.target));
            if (!insideAny(speedDial) && e.target !== dom.plusButton) closeDial(speedDial);
            if (!insideAny(speedDialLeft) && e.target !== dom.modelSelectButton) closeDial(speedDialLeft);
        });

        // Close dial when expanding
        const closeOnExpand = () => closeAllDials();
        dom.expandButton.addEventListener('click', closeOnExpand);

        // Handle speed-dial actions
        function handleDialClicks(dial, triggerButton) {
            dial?.addEventListener('click', (e) => {
            const item = e.target.closest('.speed-item');
            if (!item) return;
            e.stopPropagation();
            const action = item.getAttribute('data-action');
            // small ripple/feedback
            item.style.transform = 'scale(0.94)';
            setTimeout(() => { item.style.transform = ''; }, 120);
            switch (action) {
                case 'upload':
                        // Toggle submenu and align to clicked item height
                        const u = dial.querySelector('.upload-submenu');
                        const c = dial.querySelector('.capture-submenu');
                        c?.classList.remove('open');
                        if (u) {
                            const top = item.offsetTop + (item.offsetHeight/2) - (u.offsetHeight/2);
                            u.style.top = `${Math.max(0, top)}px`;
                            u.classList.toggle('open');
                        }
                    break;
                case 'capture':
                        // Toggle submenu and align to clicked item height
                        const u2 = dial.querySelector('.upload-submenu');
                        const c2 = dial.querySelector('.capture-submenu');
                        u2?.classList.remove('open');
                        if (c2) {
                            const top2 = item.offsetTop + (item.offsetHeight/2) - (c2.offsetHeight/2);
                            c2.style.top = `${Math.max(0, top2)}px`;
                            c2.classList.toggle('open');
                        }
                    break;
                case 'theme':
                        toggleTheme();
                    break;
                case 'expand':
                        expandUI();
                    break;
                    case 'collapse':
                        collapseUI();
                    break;
            }
                // keep dial open for submenus, close for others
                if (action !== 'upload' && action !== 'capture') closeDial(dial);
            });

            // Submenu item clicks
            dial?.addEventListener('click', (e) => {
                const sub = e.target.closest('.submenu-item');
                if (!sub) return;
                e.stopPropagation();
                const subaction = sub.getAttribute('data-subaction');
                switch (subaction) {
                    case 'upload-image': handleImageUpload(); break;
                    case 'upload-video': handleVideoUpload(); break;
                    case 'upload-audio': handleAudioUpload(); break;
                    case 'desktop-capture': handleDesktopCapture(); break;
                    case 'audio-capture': handleAudioCapture(); break;
                    case 'capture-video': handleVideoCapture(); break;
                }
                closeSubmenus(dial);
                closeDial(dial);
                dom.messageInput.focus();
            });
        }

    handleDialClicks(speedDial, dom.plusButton);
    handleDialClicks(speedDialLeft, dom.modelSelectButton);
    }

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

    // Auto-paste toggle button
    if (dom.autoPasteToggleButton) {
        const reflect = () => {
            dom.autoPasteToggleButton.classList.toggle('active', isAutoClipboardEnabled());
            dom.autoPasteToggleButton.title = `Auto-paste is ${isAutoClipboardEnabled() ? 'ON' : 'OFF'} (click to toggle)`;
        };
        reflect();
        dom.autoPasteToggleButton.addEventListener('click', () => { toggleAutoClipboardEnabled(); reflect(); });
    }

    dom.messageInput.addEventListener('keydown', (e) => {
        const isCollapsed = !dom.promptInput.classList.contains('expanded');
        if (isCollapsed && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        if (!isCollapsed && e.key === 'Enter' && e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    dom.messageInput.addEventListener('input', () => { autoResize(); updateSendButton(); });

    // paste
    document.addEventListener('paste', (e) => {
        // Don't intercept paste if user is pasting into MCP modal or other input fields
        const isTypingInOtherInput = document.activeElement && (
            (document.activeElement.tagName === 'TEXTAREA' && document.activeElement.id !== 'messageInput') ||
            (document.activeElement.tagName === 'INPUT') ||
            document.activeElement.isContentEditable ||
            document.activeElement.closest('.mcp-modal, .dropdown-menu')
        );
        
        if (!isTypingInOtherInput && (document.activeElement === dom.messageInput || document.activeElement === document.body)) {
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
        // Check if user is typing in an input/textarea (like MCP modal)
        const isTypingInInput = document.activeElement && (
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.isContentEditable ||
            document.activeElement.closest('.mcp-modal, .dropdown-menu')
        );
        
        // If in MCP modal or other input, allow all standard shortcuts (Ctrl+V, Ctrl+C, Ctrl+A, etc.)
        if (isTypingInInput) {
            // Allow standard editing shortcuts to work normally
            if (e.ctrlKey && ['v', 'c', 'x', 'a', 'z', 'y'].includes(e.key.toLowerCase())) {
                return; // Let the browser handle it
            }
        }
        
        // Global shortcuts (only when NOT in other inputs)
        if (!isTypingInInput) {
            if (e.key === 'h' && e.ctrlKey) { e.preventDefault(); window.chatInputAPI?.hideWindow?.(); return; }
            if (e.key === 'm' && e.ctrlKey) { e.preventDefault(); window.chatInputAPI?.toggleMainWindow?.(); return; }
            if (e.key === 't' && e.ctrlKey) { e.preventDefault(); toggleTheme(); return; }
        }
        
        // Only auto-focus messageInput if not already typing in another input field
        if (!isTypingInInput && document.activeElement !== dom.messageInput && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && /^[a-zA-Z0-9\s]$/.test(e.key)) {
            dom.messageInput.focus();
        }
    });

    // Auto-focus messageInput when window gains focus, but not if user is in MCP modal or other inputs
    window.addEventListener('focus', () => {
        const isInOtherInput = document.activeElement && (
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.isContentEditable ||
            document.activeElement.closest('.mcp-modal, .dropdown-menu')
        );
        
        if (!isInOtherInput) {
            dom.messageInput.focus();
        }
    });
}


