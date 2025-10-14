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
import { initializeContentCard, showContentCard, hideContentCard, isContentCardOpen } from './content-card.js';
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
import { initializeUndoRedo, recordState } from './undo-redo.js';
import { handleKeyboardShortcut, initializeKeyboardShortcuts } from './keyboard-shortcuts.js';
import { initializeInputEnhancements } from './input-enhancements.js';

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
    await initializeModelSelection(); // Now awaiting async function
    wireModelDropdownInteractions();
    wireDropdownButtons();
    initializeClickThrough();
    initializeFloatingCards();
    initializeContentCard();
    initializeContainerDrag();
    initializeClipboardInjection();
    initClipboardUI();
    initializeUndoRedo();
    initializeKeyboardShortcuts();
    initializeInputEnhancements();

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
    // Plus button shows content card
    {
        let pressTimer;
        
        // Collapsed plus button shows content card
        dom.plusButton.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if (isContentCardOpen()) {
                hideContentCard();
            } else {
                showContentCard();
            }
        });
        
        // Long press to expand
        dom.plusButton.addEventListener('mousedown', () => { pressTimer = setTimeout(() => { expandUI(); }, 500); });
        dom.plusButton.addEventListener('mouseup', () => { if (pressTimer) clearTimeout(pressTimer); });
        dom.plusButton.addEventListener('mouseleave', () => { if (pressTimer) clearTimeout(pressTimer); });

        // Close content card when expanding
        const closeOnExpand = () => {
            hideContentCard();
        };
        dom.expandButton.addEventListener('click', closeOnExpand);
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

    // Expanded plus button shows content card instead of dropdown
    dom.expandedPlusButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isContentCardOpen()) {
            hideContentCard();
        } else {
            showContentCard();
        }
        hideAllDropdowns();
    });

    // Plus actions dropdown (kept for backward compatibility)
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
    
    // Hide chat button (cross button on left side) - hides only the chat input, not the whole window
    if (dom.hideChatButton) {
        dom.hideChatButton.addEventListener('click', (e) => {
            console.log('Hide button clicked!');
            e.stopPropagation(); // Prevent the click from triggering the show logic
            // Hide the chat input container and the hide button itself
            if (dom.chatInputContainer) {
                console.log('Hiding chat input container');
                dom.chatInputContainer.style.display = 'none';
            }
            if (dom.hideChatButton) {
                console.log('Hiding hide button');
                dom.hideChatButton.style.display = 'none';
            }
        });
    }

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
        
        // Listen for show chat input UI event (triggered when launch window is clicked)
        if (window.chatInputAPI.onShowChatInputUI) {
            window.chatInputAPI.onShowChatInputUI(() => {
                console.log('Show chat input UI event received from launch window');
                if (dom.chatInputContainer && dom.chatInputContainer.style.display === 'none') {
                    console.log('Chat input is hidden, showing it now');
                    dom.chatInputContainer.style.display = 'flex';
                    if (dom.hideChatButton) {
                        dom.hideChatButton.style.display = 'flex';
                    }
                    setTimeout(() => {
                        if (window.updateHideButtonPosition) {
                            window.updateHideButtonPosition();
                        }
                        if (dom.messageInput) {
                            dom.messageInput.focus();
                        }
                    }, 50);
                }
            });
        }
    }
    
    // Show chat input when clicking anywhere on the window (if it's hidden)
    document.body.addEventListener('click', (e) => {
        console.log('Body clicked, checking if chat input is hidden');
        console.log('Chat input display:', dom.chatInputContainer?.style.display);
        
        // Check if chat input is hidden
        if (dom.chatInputContainer && dom.chatInputContainer.style.display === 'none') {
            console.log('Chat input is hidden, showing it now');
            // Show the chat input container and button
            dom.chatInputContainer.style.display = 'flex';
            if (dom.hideChatButton) {
                dom.hideChatButton.style.display = 'flex';
            }
            // Update button position after showing
            setTimeout(() => {
                if (window.updateHideButtonPosition) {
                    console.log('Updating hide button position');
                    window.updateHideButtonPosition();
                }
                // Focus the message input
                if (dom.messageInput) {
                    dom.messageInput.focus();
                }
            }, 50);
        }
    });
    
    // Also listen for window focus to show chat input (when launch window is clicked)
    window.addEventListener('focus', () => {
        console.log('Window focused');
        if (dom.chatInputContainer && dom.chatInputContainer.style.display === 'none') {
            console.log('Chat input is hidden on focus, showing it');
            dom.chatInputContainer.style.display = 'flex';
            if (dom.hideChatButton) {
                dom.hideChatButton.style.display = 'flex';
            }
            setTimeout(() => {
                if (window.updateHideButtonPosition) {
                    window.updateHideButtonPosition();
                }
                if (dom.messageInput) {
                    dom.messageInput.focus();
                }
            }, 50);
        }
    });

    // capture api
    if (window.RendererCaptureAPI) {
        window.rendererCaptureAPI = new window.RendererCaptureAPI();
        window.rendererCaptureAPI.setVolumeCallback((data) => updateVolumeIndicator(data.volume));
    }

    // keyboard shortcuts - now handled by keyboard-shortcuts module
    document.addEventListener('keydown', (e) => {
        // Handle keyboard shortcuts with the new system
        handleKeyboardShortcut(e);
        
        // Check if user is typing in an input/textarea (like MCP modal)
        const isTypingInInput = document.activeElement && (
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.isContentEditable ||
            document.activeElement.closest('.mcp-modal, .dropdown-menu')
        );
        
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


