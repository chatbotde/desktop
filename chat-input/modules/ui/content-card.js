// Content Card Module - Shows list of available actions when plus button is clicked
import { dom } from '../core/dom.js';
import { state } from '../core/state.js';
import { handleImageUpload, handleVideoUpload, handleAudioUpload, handleDesktopCapture, handleAudioCapture, handleVideoCapture, handleAreaScreenshot } from '../capture/uploads-capture.js';
import { toggleTheme, toggleLighting, toggleGlassMode } from './theme.js';
import { toggleClickThrough } from '../input/clickthrough.js';
import { toggleContentProtection } from '../core/content-protection.js';
import { collapseUI } from './expand-collapse.js';
import { isAutoScreenEnabled, toggleAutoScreenEnabled } from '../capture/auto-screen-state.js';
import { toggleWebView } from '../webview/webview.js';
import { showAudioRecordingTablet } from '../capture/audio-recording-tablet.js';

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
    
    // Sync auto-screen button
    const autoScreenButton = contentCard.querySelector('.action-item[data-action="auto-screen"]');
    if (autoScreenButton) {
        const enabled = isAutoScreenEnabled();
        if (enabled) {
            autoScreenButton.classList.add('active');
            autoScreenButton.setAttribute('aria-pressed', 'true');
        } else {
            autoScreenButton.classList.remove('active');
            autoScreenButton.setAttribute('aria-pressed', 'false');
        }
        const statusSpan = autoScreenButton.querySelector('.toggle-status');
        if (statusSpan) {
            statusSpan.textContent = enabled ? '(ON)' : '(OFF)';
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

    // Sync glass mode button
    const glassButton = contentCard.querySelector('.action-item[data-action="glass-mode"]');
    if (glassButton) {
        // Check if the class is present on the prompt input
        // We need to access dom.promptInput, but dom is not imported here directly, 
        // however we can query it or import dom. 
        // dom is imported at the top.
        if (dom.promptInput && dom.promptInput.classList.contains('backdrop-blur-md')) {
            glassButton.classList.add('active');
            glassButton.setAttribute('aria-pressed', 'true');
        } else {
            glassButton.classList.remove('active');
            glassButton.setAttribute('aria-pressed', 'false');
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
        case 'audio-record':
            showAudioRecordingTablet();
            break;
        case 'audio-capture':
            handleAudioCapture();
            break;
        case 'capture-video':
            handleVideoCapture();
            break;
        case 'auto-screen':
            // Toggle auto-screen state and update UI
            const newAutoScreenState = toggleAutoScreenEnabled();
            const autoScreenBtn = contentCard?.querySelector('.action-item[data-action="auto-screen"]');
            if (autoScreenBtn) {
                if (newAutoScreenState) {
                    autoScreenBtn.classList.add('active');
                    autoScreenBtn.setAttribute('aria-pressed', 'true');
                } else {
                    autoScreenBtn.classList.remove('active');
                    autoScreenBtn.setAttribute('aria-pressed', 'false');
                }
                const statusSpan = autoScreenBtn.querySelector('.toggle-status');
                if (statusSpan) {
                    statusSpan.textContent = newAutoScreenState ? '(ON)' : '(OFF)';
                }
            }
            // Don't hide card for toggle actions
            return;
            
        // Settings actions
        case 'theme':
            toggleTheme();
            break;
        case 'lighting':
            toggleLighting();
            break;
        case 'glass-mode':
            toggleGlassMode();
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
        case 'model-settings':
            // Open Model settings modal
            const modelModal = document.getElementById('modelSettingsModal');
            if (modelModal) {
                modelModal.style.display = 'flex';
                // Import and render the settings list
                import('./model-settings/model-settings-ui.js').then(({ renderModelSettingsList, wireModelSettingsInteractions }) => {
                    renderModelSettingsList();
                    wireModelSettingsInteractions();
                });
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
            
        // Tools actions
        case 'search':
            handleSearchAction();
            break;

        default:
            console.warn('Unknown content card action:', action);
    }
    
    // Focus message input after action
    if (dom.messageInput) {
        dom.messageInput.focus();
    }
}

// Handle search action
async function handleSearchAction() {
    const query = dom.messageInput.value.trim();
    if (!query) {
        console.warn("Search query is empty");
        // Optionally show a visual indication that input is required
        if (dom.messageInput) {
            dom.messageInput.placeholder = "Please enter a search query...";
            setTimeout(() => {
                dom.messageInput.placeholder = "Ask Anything.. ";
            }, 2000);
        }
        return;
    }

    // Clear input
    dom.messageInput.value = '';

    // Show loading state if possible (e.g. spinner)
    // For now, we rely on the async nature.

    try {
        if (!window.chatInputAPI || !window.chatInputAPI.performSearch) {
            console.error("Search API not available");
            return;
        }

        // Send search request
        const response = await window.chatInputAPI.performSearch(query);
        
        if (response.success) {
            // Format results
            let content = `**Search Results for "${query}":**\n\n`;
            
            if (response.results && response.results.results && response.results.results.length > 0) {
                content += response.results.results.map(r => `* [${r.title}](${r.url})\n  ${r.text ? r.text.substring(0, 200) + '...' : ''}`).join('\n\n');
            } else {
                content += "No results found.";
            }

            // Send result to main window
            const messageData = {
                id: Date.now().toString(),
                role: 'assistant',
                content: content,
                timestamp: new Date().toISOString()
            };
            
            // Also send the user's query as a message so it appears in history
            const userMessageData = {
                id: (Date.now() - 1).toString(),
                role: 'user',
                content: `Search: ${query}`,
                timestamp: new Date().toISOString()
            };

            window.chatInputAPI.sendMessage(userMessageData);
            setTimeout(() => {
                window.chatInputAPI.sendMessage(messageData);
            }, 100);

        } else {
            console.error("Search failed:", response.error);
            // Send error message
             const errorMessageData = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `**Search Error:** ${response.error}`,
                timestamp: new Date().toISOString()
            };
            window.chatInputAPI.sendMessage(errorMessageData);
        }
    } catch (e) {
        console.error("Search error:", e);
    }
}

// Check if content card is visible
export function isContentCardOpen() {
    return isContentCardVisible;
}
