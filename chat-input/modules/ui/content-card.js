// Content Card Module - Shows list of available actions when speed-dial is opened
import { dom } from '../core/dom.js';
import { state } from '../core/state.js';
import { handleImageUpload, handleVideoUpload, handleAudioUpload, handleDesktopCapture, handleAudioCapture, handleVideoCapture, handleAreaScreenshot } from '../capture/uploads-capture.js';
import { toggleTheme, toggleLighting } from './theme.js';
import { toggleClickThrough } from '../input/clickthrough.js';
import { toggleContentProtection } from '../core/content-protection.js';
import { collapseUI } from './expand-collapse.js';
import { toggleWebView } from '../webview/webview.js';

let contentCard = null;
let isContentCardVisible = false;

// Initialize content card
export function initializeContentCard() {
    // Get the template
    const template = document.getElementById('contentCardTemplate');
    if (!template) {
        console.warn('Content card template not found');
        return;
    }

    // Clone the template content
    contentCard = template.content.cloneNode(true).querySelector('.content-card');
    if (!contentCard) {
        console.warn('Content card element not found in template');
        return;
    }

    // Add to body
    document.body.appendChild(contentCard);

    // Wire up event listeners
    wireContentCardEvents();
}

// Wire up content card event listeners
function wireContentCardEvents() {
    if (!contentCard) return;

    // Close button
    const closeBtn = contentCard.querySelector('.content-card-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideContentCard);
    }

    // Action buttons
    const actionItems = contentCard.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.getAttribute('data-action');
            handleContentCardAction(action);
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (isContentCardVisible && contentCard && !contentCard.contains(e.target)) {
            hideContentCard();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isContentCardVisible) {
            hideContentCard();
        }
    });
}

// Show content card
export function showContentCard() {
    if (!contentCard) return;
    
    isContentCardVisible = true;
    contentCard.style.display = 'block';
    
    // Sync toggle button states when showing the card
    syncToggleButtonStates();
    
    // Trigger animation
    requestAnimationFrame(() => {
        contentCard.classList.add('visible');
    });
}

// Sync toggle button states in content card with current state
function syncToggleButtonStates() {
    if (!contentCard) return;
    
    // Sync protection button
    const protectionButton = contentCard.querySelector('.action-item[data-action="protection"]');
    if (protectionButton) {
        if (state.contentProtectionEnabled) {
            protectionButton.classList.add('active');
            protectionButton.setAttribute('aria-pressed', 'true');
            const span = protectionButton.querySelector('span');
            if (span) {
                span.textContent = 'Invisible Mode (On)';
            }
        } else {
            protectionButton.classList.remove('active');
            protectionButton.setAttribute('aria-pressed', 'false');
            const span = protectionButton.querySelector('span');
            if (span) {
                span.textContent = 'Invisible Mode (Off)';
            }
        }
    }
    
    // Sync theme button
    const themeButton = contentCard.querySelector('.action-item[data-action="theme"]');
    if (themeButton) {
        const span = themeButton.querySelector('span');
        if (span) {
            span.textContent = state.currentTheme === 'light' ? 'Dark Theme' : 'Light Theme';
        }
        if (state.currentTheme === 'light') {
            themeButton.classList.add('active');
        } else {
            themeButton.classList.remove('active');
        }
    }
}

// Hide content card
export function hideContentCard() {
    if (!contentCard || !isContentCardVisible) return;
    
    isContentCardVisible = false;
    contentCard.classList.remove('visible');
    
    // Hide after animation
    setTimeout(() => {
        if (contentCard) {
            contentCard.style.display = 'none';
        }
    }, 300);
}

// Toggle content card
export function toggleContentCard() {
    if (isContentCardVisible) {
        hideContentCard();
    } else {
        showContentCard();
    }
}

// Handle action from content card
function handleContentCardAction(action) {
    hideContentCard();
    
    switch (action) {
        // Upload actions
        case 'upload-image':
            handleImageUpload();
            break;
        case 'upload-video':
            handleVideoUpload();
            break;
        case 'upload-audio':
            handleAudioUpload();
            break;
            
        // Capture actions
        case 'desktop-capture':
            handleDesktopCapture();
            break;
        case 'area-screenshot':
            handleAreaScreenshot();
            break;
        case 'audio-capture':
            handleAudioCapture();
            break;
        case 'capture-video':
            handleVideoCapture();
            break;
            
        // Settings actions
        case 'theme':
            toggleTheme();
            break;
        case 'lighting':
            toggleLighting();
            break;
        case 'click-through':
            toggleClickThrough();
            break;
        case 'protection':
            toggleContentProtection();
            // Update will be handled by updateContentProtectionButton
            break;
            
        // MCP actions
        case 'mcp-settings':
            // Open MCP settings modal
            const mcpModal = document.getElementById('mcpSettingsModal');
            if (mcpModal) {
                mcpModal.style.display = 'block';
                // Focus the modal
                const firstInput = mcpModal.querySelector('input, textarea, button');
                if (firstInput) firstInput.focus();
            }
            break;
        case 'mcp-servers':
            // Open MCP servers management
            console.log('MCP Servers clicked - functionality to be implemented');
            break;
        case 'mcp-connections':
            // Open MCP connections management
            console.log('MCP Connections clicked - functionality to be implemented');
            break;
            
        // Web View actions
        case 'toggle-webview':
            toggleWebView();
            break;
            
        // Account actions
        case 'sign-out':
            // Call the auth logout via IPC
            if (window.chatInputAPI?.signOut) {
                window.chatInputAPI.signOut();
            } else {
                console.warn('Sign out API not available');
            }
            break;
            
        // Window actions
        case 'hide':
            window.chatInputAPI?.hideWindow?.();
            break;
        case 'collapse':
            collapseUI();
            break;
            
        default:
            console.warn('Unknown content card action:', action);
    }
    
    // Focus message input after action
    if (dom.messageInput) {
        dom.messageInput.focus();
    }
}

// Check if content card is visible
export function isContentCardOpen() {
    return isContentCardVisible;
}
