// Content Card Module - Shows list of available actions when speed-dial is opened
import { dom } from './dom.js';
import { state } from './state.js';
import { handleImageUpload, handleVideoUpload, handleAudioUpload, handleDesktopCapture, handleAudioCapture, handleVideoCapture } from './uploads-capture.js';
import { toggleTheme, toggleLighting } from './theme.js';
import { toggleClickThrough } from './clickthrough.js';
import { toggleContentProtection } from './content-protection.js';
import { collapseUI } from './expand-collapse.js';

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
    
    // Trigger animation
    requestAnimationFrame(() => {
        contentCard.classList.add('visible');
    });
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
            
        // Window actions
        case 'hide':
            window.chatInputAPI?.hideWindow?.();
            break;
        case 'toggle-main':
            window.chatInputAPI?.toggleMainWindow?.();
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
