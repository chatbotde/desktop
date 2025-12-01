import { dom } from './dom.js';
import { state } from './state.js';
import { initializeContentProtection, toggleContentProtection } from './content-protection.js';
import { toggleTheme, initializeTheme, toggleLighting } from '../ui/theme.js';
import { addImageAttachment, updateAttachmentsVisibility, clearAllMediaAttachments, showAttachmentLoading, hideAttachmentLoading } from '../media/attachments.js';
import { addMediaAttachment, removeMediaAttachment } from '../media/richmedia.js';
import { showDropdownAdvanced, hideAllDropdowns, wireDropdownButtons } from '../ui/dropdowns.js';
import { expandUI, collapseUI, autoResize, updateSendButton, adjustWindowHeightSmooth } from '../ui/expand-collapse.js';
import { initializeClickThrough, toggleClickThrough } from '../input/clickthrough.js';
import { initializeFloatingCards, hideAllCards } from '../ui/floating-cards.js';
import { initializeContentCard, showContentCard, hideContentCard, isContentCardOpen } from '../ui/content-card.js';
import { initializeModelSelection, updateModelDropdownSelection, selectModel, wireModelDropdownInteractions } from '../ui/model-selection.js';
import { sendMessage, resetSendingState } from './messaging.js';
import { handlePasteContent } from '../clipboard/paste-drop.js';
import { handleImageUpload, handleVideoUpload, handleAudioUpload, handleDesktopCapture, handleAudioCapture, handleVideoCapture, handleAreaScreenshot } from '../capture/uploads-capture.js';
import { geometryController } from './geometry.js';
import { stopCurrentRecording, updateVolumeIndicator } from '../capture/recording.js';
import { initializeContainerDrag } from '../input/container-drag.js';
import { initializeClipboardInjection } from '../clipboard/clipboard-injector.js';
import { initClipboardUI } from '../clipboard/clipboard-ui.js';
import { isAutoClipboardEnabled, toggleAutoClipboardEnabled } from '../clipboard/auto-clipboard-state.js';
import { initializeUndoRedo, recordState } from '../input/undo-redo.js';
import { handleKeyboardShortcut, initializeKeyboardShortcuts } from '../input/keyboard-shortcuts.js';
import { initializeInputEnhancements } from '../input/input-enhancements.js';
import { initTextSelectionUI } from '../input/text-selection-ui.js';
import { 
    validateBeforeSend, 
    willAttachmentBeSupported, 
    getCapabilitySummary, 
    getCurrentModelCapabilities,
    showCapabilityWarning,
    hideNotification
} from '../ui/capability-validator.js';

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

// expose capability validation functions for UI components
window.__validateBeforeSend = validateBeforeSend;
window.__willAttachmentBeSupported = willAttachmentBeSupported;
window.__getCapabilitySummary = getCapabilitySummary;
window.__getCurrentModelCapabilities = getCurrentModelCapabilities;
window.__showCapabilityWarning = showCapabilityWarning;
window.__hideCapabilityNotification = hideNotification;

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
    initTextSelectionUI();

    // Handle persistent toggle click
    const persistentToggle = document.getElementById('persistentToggle');
    if (persistentToggle) {
        persistentToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle chat input visibility
            if (dom.chatInputContainer) {
                const isHidden = dom.chatInputContainer.style.display === 'none';
                dom.chatInputContainer.style.display = isHidden ? 'flex' : 'none';
                
                // Store hidden state
                sessionStorage.setItem('chatInputHidden', isHidden ? 'false' : 'true');
                
                // Also toggle hide button visibility
                if (dom.hideChatButton) {
                    dom.hideChatButton.style.display = isHidden ? 'flex' : 'none';
                }
            }
        });
    }

    // legacy no-op to keep older calls safe
    window.adjustWindowHeight = () => {};

    if (dom.chatInputContainer) dom.chatInputContainer.classList.add('fullscreen');
    
    // Ensure proper initial collapsed state
    dom.promptInput.classList.remove('expanded');
    dom.chatInputContainer.classList.remove('expanded');
    state.expansionState = 'collapsed';
    state.isTransitioning = false;
    
    // Initialize UI in collapsed state
    autoResize();
    updateSendButton();
    dom.messageInput.focus();

    // Update expand button title based on state
    const updateExpandButtonTitle = () => {
        if (dom.promptInput.classList.contains('expanded')) {
            dom.expandButton.setAttribute('title', 'Collapse');
            dom.expandButton.setAttribute('aria-label', 'Collapse');
        } else {
            dom.expandButton.setAttribute('title', 'Expand');
            dom.expandButton.setAttribute('aria-label', 'Expand');
        }
    };

    // Override expandUI and collapseUI to update button title
    const originalExpandUI = expandUI;
    const originalCollapseUI = collapseUI;
    
    window.expandUI = () => {
        originalExpandUI();
        setTimeout(updateExpandButtonTitle, 0);
    };
    
    window.collapseUI = () => {
        originalCollapseUI();
        setTimeout(updateExpandButtonTitle, 0);
    };

    // listeners
    dom.messageInput.addEventListener('dblclick', () => expandUI());
    dom.collapseButton.addEventListener('click', () => collapseUI());
    dom.expandButton.addEventListener('click', () => {
        if (dom.promptInput.classList.contains('expanded')) {
            collapseUI();
        } else {
            expandUI();
        }
    });
    
    // Initial title update
    updateExpandButtonTitle();
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
            case 'area-screenshot': handleAreaScreenshot(); break;
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
    
    // New Chat button - clears conversation and resets to new chat
    if (dom.newChatButton) {
        dom.newChatButton.addEventListener('click', () => {
            // Clear the message input
            dom.messageInput.value = '';
            
            // Clear all attachments
            clearAllMediaAttachments();
            
            // Reset sending state
            resetSendingState();
            
            // Clear the primary card content by reloading the iframe
            const primaryCard = document.querySelector('.floating-card[data-card-number="1"]');
            if (primaryCard) {
                const iframe = primaryCard.querySelector('iframe');
                if (iframe && iframe.src) {
                    // Reload the iframe to clear content
                    iframe.src = iframe.src;
                }
            }
            
            // Optionally notify the backend to clear conversation history
            if (window.chatInputAPI && window.chatInputAPI.clearConversation) {
                window.chatInputAPI.clearConversation();
            }
            
            // Focus back on the input
            dom.messageInput.focus();
            
            // Auto-resize the input
            autoResize();
        });
    }
    
    dom.lightingButton.addEventListener('click', () => toggleLighting());
    dom.themeToggleButton.addEventListener('click', () => toggleTheme());
    dom.hideShowButton.addEventListener('click', () => window.chatInputAPI?.hideWindow?.());
    
    // Hide chat button (cross button on left side) - hides only the chat input, not the whole window
    if (dom.hideChatButton) {
        dom.hideChatButton.addEventListener('click', (e) => {
            console.log('Hide button clicked!');
            e.stopPropagation(); // Prevent the click from triggering the show logic
            // Hide the chat input container and the hide button itself
            if (dom.chatInputContainer) {
                console.log('Hiding chat input container');
                dom.chatInputContainer.style.display = 'none';
                // Store hidden state to prevent issues
                sessionStorage.setItem('chatInputHidden', 'true');
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
        // Send on Enter (but not with Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        // No need for specific newline handling, as Shift+Enter is the default.
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

    // Helper function to show chat input (centralized logic)
    const showChatInput = () => {
        console.log('Showing chat input');
        if (dom.chatInputContainer) {
            dom.chatInputContainer.style.display = 'flex';
            sessionStorage.setItem('chatInputHidden', 'false');
        }
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
    };
    
    // Expose globally for easy access
    window.showChatInput = showChatInput;

    // IPC
    if (window.chatInputAPI) {
        window.chatInputAPI.onClearInput(() => { dom.messageInput.value = ''; autoResize(); resetSendingState(); dom.messageInput.focus(); });
        window.chatInputAPI.onFocusInput(() => { dom.messageInput.focus(); });
        
        // Listen for Ctrl+Shift+L shortcut - show chat input in collapsed state and hide all other UI
        window.chatInputAPI.onSetCollapsedState?.((shouldCollapse) => {
            console.log('Received set-collapsed-state:', shouldCollapse);
            // Show the chat input if hidden
            showChatInput();
            
            // Ensure collapsed state
            if (shouldCollapse) {
                // Force collapse - update state first to ensure expandUI can work later
                state.isTransitioning = false;
                state.expansionState = 'collapsed';
                
                // Remove expanded classes
                dom.promptInput.classList.remove('expanded');
                dom.chatInputContainer.classList.remove('expanded');
                autoResize();
                updateSendButton();
                
                // Hide all other UI elements (floating cards, dropdowns, modals)
                hideAllCards();  // Hides all floating cards and cards manager
                hideAllDropdowns();  // Hides any open dropdowns
                hideContentCard();  // Hides content card if open
                
                // Hide model settings modal if open
                const modelSettingsModal = document.getElementById('modelSettingsModal');
                if (modelSettingsModal && modelSettingsModal.style.display === 'flex') {
                    modelSettingsModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
                
                // Focus the input
                setTimeout(() => {
                    dom.messageInput.focus();
                }, 100);
            }
        });
        
        // Removed onShowChatInputUI handler - chat input should only appear via persistent toggle (right side transparent element)
    }
    
    // Chat input should only appear when clicking the persistent toggle (right side transparent element)
    // Removed body click and window focus handlers - only persistent toggle can show/hide chat input
    
    // Periodic check to ensure chat input is always restorable (runs every 5 seconds)
    // This is a safety net in case events fail
    setInterval(() => {
        // Only check if hidden flag is set
        if (sessionStorage.getItem('chatInputHidden') === 'true' && dom.chatInputContainer && dom.chatInputContainer.style.display === 'none') {
            console.log('Periodic check: Chat input visibility check OK');
        }
    }, 5000);

    // capture api
    if (window.RendererCaptureAPI) {
        window.rendererCaptureAPI = new window.RendererCaptureAPI();
        window.rendererCaptureAPI.setVolumeCallback((data) => updateVolumeIndicator(data.volume));
    }

    // Text selection UI initialization (creates the floating panel)
    // This is called in the boot() function above

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