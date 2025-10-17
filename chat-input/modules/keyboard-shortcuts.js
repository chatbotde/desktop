/**
 * Enhanced Keyboard Shortcuts Manager
 * Provides comprehensive keyboard shortcuts for better UX
 */

import { dom } from './dom.js';
import { state } from './state.js';
import { undo, redo, recordState } from './undo-redo.js';
import { clearAllMediaAttachments } from './attachments.js';
import { expandUI, collapseUI } from './expand-collapse.js';
import { toggleTheme } from './theme.js';
import { sendMessage } from './messaging.js';

const shortcuts = {
    // Text editing shortcuts
    'ctrl+z': { action: undo, description: 'Undo last action', category: 'editing' },
    'ctrl+y': { action: redo, description: 'Redo last undone action', category: 'editing' },
    'ctrl+shift+z': { action: redo, description: 'Redo (alternative)', category: 'editing' },
    
    // Selection shortcuts
    'ctrl+a': { action: selectAllText, description: 'Select all text', category: 'editing' },
    'escape': { action: clearSelection, description: 'Clear selection / Collapse', category: 'editing' },
    
    // Deletion shortcuts
    'ctrl+backspace': { action: deleteWord, description: 'Delete word', category: 'editing' },
    'ctrl+delete': { action: deleteWordForward, description: 'Delete word forward', category: 'editing' },
    'ctrl+shift+k': { action: clearInput, description: 'Clear all input', category: 'editing' },
    
    // Navigation shortcuts
    'ctrl+home': { action: moveCursorToStart, description: 'Move cursor to start', category: 'navigation' },
    'ctrl+end': { action: moveCursorToEnd, description: 'Move cursor to end', category: 'navigation' },
    
    // Window shortcuts
    'ctrl+h': { action: hideWindow, description: 'Hide window', category: 'window' },
    'ctrl+t': { action: toggleTheme, description: 'Toggle theme', category: 'window' },
    'ctrl+e': { action: toggleExpanded, description: 'Toggle expanded/collapsed', category: 'window' },
    
    // Action shortcuts
    'ctrl+shift+x': { action: clearAllMediaAttachments, description: 'Clear all attachments', category: 'action' },
    
    // Help
    'ctrl+/': { action: showShortcutsHelp, description: 'Show keyboard shortcuts', category: 'help' },
    'f1': { action: showShortcutsHelp, description: 'Show help', category: 'help' },
};

/**
 * Check if an input element is focused (excluding messageInput)
 */
function isOtherInputFocused() {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    // Check if it's an input/textarea but NOT our messageInput
    if (activeElement === dom.messageInput) return false;
    
    return (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable ||
        activeElement.closest('.mcp-modal, .dropdown-menu')
    );
}

/**
 * Select all text in messageInput
 */
function selectAllText(e) {
    if (isOtherInputFocused()) return true; // Allow default behavior
    
    e?.preventDefault();
    if (dom.messageInput) {
        dom.messageInput.focus();
        dom.messageInput.select();
        showKeyboardFeedback('All text selected');
    }
    return false;
}

/**
 * Clear selection and collapse if expanded
 */
function clearSelection(e) {
    if (isOtherInputFocused()) return true; // Allow default behavior
    
    e?.preventDefault();
    
    // First clear selection if any
    if (dom.messageInput && dom.messageInput.selectionStart !== dom.messageInput.selectionEnd) {
        dom.messageInput.setSelectionRange(
            dom.messageInput.selectionEnd,
            dom.messageInput.selectionEnd
        );
        return false;
    }
    
    // Then collapse if expanded
    const promptInput = document.querySelector('.prompt-input');
    if (promptInput && promptInput.classList.contains('expanded')) {
        collapseUI();
        showKeyboardFeedback('Collapsed');
        return false;
    }
    
    return false;
}

/**
 * Delete word backward
 */
function deleteWord(e) {
    if (isOtherInputFocused() && document.activeElement !== dom.messageInput) return true;
    
    e?.preventDefault();
    
    if (!dom.messageInput) return false;
    
    const input = dom.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    if (start !== end) {
        // If text is selected, delete selection
        input.value = value.slice(0, start) + value.slice(end);
        input.setSelectionRange(start, start);
    } else if (start > 0) {
        // Find word boundary
        let pos = start - 1;
        
        // Skip whitespace
        while (pos > 0 && /\s/.test(value[pos])) {
            pos--;
        }
        
        // Delete until word boundary or start
        while (pos > 0 && !/\s/.test(value[pos - 1])) {
            pos--;
        }
        
        input.value = value.slice(0, pos) + value.slice(start);
        input.setSelectionRange(pos, pos);
    }
    
    // Record state and update UI
    recordState(true);
    const { autoResize, updateSendButton } = require('./expand-collapse.js');
    autoResize();
    updateSendButton();
    
    return false;
}

/**
 * Delete word forward
 */
function deleteWordForward(e) {
    if (isOtherInputFocused() && document.activeElement !== dom.messageInput) return true;
    
    e?.preventDefault();
    
    if (!dom.messageInput) return false;
    
    const input = dom.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    if (start !== end) {
        // If text is selected, delete selection
        input.value = value.slice(0, start) + value.slice(end);
        input.setSelectionRange(start, start);
    } else if (start < value.length) {
        // Find word boundary
        let pos = start;
        
        // Skip whitespace
        while (pos < value.length && /\s/.test(value[pos])) {
            pos++;
        }
        
        // Delete until word boundary or end
        while (pos < value.length && !/\s/.test(value[pos])) {
            pos++;
        }
        
        input.value = value.slice(0, start) + value.slice(pos);
        input.setSelectionRange(start, start);
    }
    
    // Record state and update UI
    recordState(true);
    const { autoResize, updateSendButton } = require('./expand-collapse.js');
    autoResize();
    updateSendButton();
    
    return false;
}

/**
 * Clear all input
 */
function clearInput(e) {
    if (isOtherInputFocused()) return true;
    
    e?.preventDefault();
    
    if (dom.messageInput) {
        recordState(true); // Record before clearing
        dom.messageInput.value = '';
        dom.messageInput.focus();
        
        const { autoResize, updateSendButton } = require('./expand-collapse.js');
        autoResize();
        updateSendButton();
        
        showKeyboardFeedback('Input cleared');
    }
    
    return false;
}

/**
 * Move cursor to start
 */
function moveCursorToStart(e) {
    if (isOtherInputFocused() && document.activeElement !== dom.messageInput) return true;
    
    e?.preventDefault();
    
    if (dom.messageInput) {
        dom.messageInput.setSelectionRange(0, 0);
        dom.messageInput.focus();
    }
    
    return false;
}

/**
 * Move cursor to end
 */
function moveCursorToEnd(e) {
    if (isOtherInputFocused() && document.activeElement !== dom.messageInput) return true;
    
    e?.preventDefault();
    
    if (dom.messageInput) {
        const len = dom.messageInput.value.length;
        dom.messageInput.setSelectionRange(len, len);
        dom.messageInput.focus();
    }
    
    return false;
}

/**
 * Hide window
 */
function hideWindow(e) {
    e?.preventDefault();
    window.chatInputAPI?.hideWindow?.();
    return false;
}

/**
 * Toggle expanded/collapsed state
 */
function toggleExpanded(e) {
    if (isOtherInputFocused()) return true;
    
    e?.preventDefault();
    
    const promptInput = document.querySelector('.prompt-input');
    if (promptInput) {
        if (promptInput.classList.contains('expanded')) {
            collapseUI();
            showKeyboardFeedback('Collapsed');
        } else {
            expandUI();
            showKeyboardFeedback('Expanded');
        }
    }
    
    return false;
}

/**
 * Show keyboard shortcuts help
 */
function showShortcutsHelp(e) {
    e?.preventDefault();
    
    // Create or show help modal
    let modal = document.getElementById('keyboard-shortcuts-help');
    
    if (!modal) {
        modal = createShortcutsHelpModal();
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    
    return false;
}

/**
 * Create keyboard shortcuts help modal
 */
function createShortcutsHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'keyboard-shortcuts-help';
    modal.className = 'keyboard-shortcuts-modal';
    
    // Group shortcuts by category
    const categories = {};
    Object.entries(shortcuts).forEach(([key, config]) => {
        const category = config.category || 'other';
        if (!categories[category]) categories[category] = [];
        categories[category].push({ key, ...config });
    });
    
    const categoryNames = {
        'editing': '✏️ Text Editing',
        'navigation': '🧭 Navigation',
        'window': '🪟 Window',
        'action': '⚡ Actions',
        'help': '❓ Help',
    };
    
    let content = '<div class="keyboard-shortcuts-content">';
    content += '<div class="keyboard-shortcuts-header">';
    content += '<h2>Keyboard Shortcuts</h2>';
    content += '<button class="keyboard-shortcuts-close" onclick="this.closest(\'.keyboard-shortcuts-modal\').classList.remove(\'show\'); setTimeout(() => this.closest(\'.keyboard-shortcuts-modal\').style.display = \'none\', 300);">';
    content += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    content += '</button>';
    content += '</div>';
    content += '<div class="keyboard-shortcuts-body">';
    
    Object.entries(categories).forEach(([category, items]) => {
        content += `<div class="shortcuts-category">`;
        content += `<h3 class="shortcuts-category-title">${categoryNames[category] || category}</h3>`;
        content += `<div class="shortcuts-list">`;
        
        items.forEach(item => {
            const keys = item.key.split('+').map(k => {
                const keyMap = { 'ctrl': 'Ctrl', 'shift': 'Shift', 'alt': 'Alt' };
                return keyMap[k.toLowerCase()] || k.toUpperCase();
            });
            
            content += `<div class="shortcut-item">`;
            content += `<div class="shortcut-keys">`;
            keys.forEach((k, i) => {
                if (i > 0) content += '<span class="key-separator">+</span>';
                content += `<kbd class="key">${k}</kbd>`;
            });
            content += `</div>`;
            content += `<div class="shortcut-description">${item.description}</div>`;
            content += `</div>`;
        });
        
        content += `</div></div>`;
    });
    
    content += '</div></div>';
    
    modal.innerHTML = content;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
    
    return modal;
}

/**
 * Show keyboard feedback
 */
function showKeyboardFeedback(message) {
    let feedback = document.getElementById('keyboard-feedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'keyboard-feedback';
        feedback.className = 'keyboard-feedback';
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.classList.remove('show');
    
    requestAnimationFrame(() => {
        feedback.classList.add('show');
    });
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 1000);
}

/**
 * Parse keyboard event to shortcut string
 */
function eventToShortcut(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    
    // Normalize key
    let key = e.key.toLowerCase();
    
    // Handle special keys
    if (key === 'control' || key === 'shift' || key === 'alt' || key === 'meta') {
        return null; // Don't trigger on modifier keys alone
    }
    
    parts.push(key);
    
    return parts.join('+');
}

/**
 * Handle keyboard event
 */
export function handleKeyboardShortcut(e) {
    const shortcut = eventToShortcut(e);
    
    if (!shortcut) return true;
    
    const config = shortcuts[shortcut];
    
    if (config && config.action) {
        const result = config.action(e);
        
        // If action returns false, prevent default
        if (result === false) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    return true;
}

/**
 * Initialize keyboard shortcuts
 */
export function initializeKeyboardShortcuts() {
    // Already handled in init.js via global keydown listener
    console.log('Keyboard shortcuts initialized:', Object.keys(shortcuts).length, 'shortcuts');
    
    // Add tooltip hints to buttons
    addTooltipHints();
}

/**
 * Add tooltip hints for keyboard shortcuts to buttons
 */
function addTooltipHints() {
    // Expand button
    const expandBtn = document.getElementById('expandButton');
    if (expandBtn) {
        const originalTitle = expandBtn.getAttribute('title') || 'Expand';
        expandBtn.setAttribute('title', `${originalTitle} (Ctrl+E)`);
    }
    
    // Collapse button
    const collapseBtn = document.getElementById('collapseButton');
    if (collapseBtn) {
        const originalTitle = collapseBtn.getAttribute('title') || 'Collapse';
        collapseBtn.setAttribute('title', `${originalTitle} (Ctrl+E or Esc)`);
    }
    
    // Send button
    const sendBtn = document.getElementById('sendButton');
    if (sendBtn) {
        const originalTitle = sendBtn.getAttribute('title') || 'Send';
        sendBtn.setAttribute('title', `${originalTitle} (Enter or Ctrl+Enter)`);
    }
    
    // Clear all attachments
    const clearBtn = document.getElementById('clearAllAttachments');
    if (clearBtn) {
        const originalTitle = clearBtn.getAttribute('title') || 'Clear all';
        clearBtn.setAttribute('title', `${originalTitle} (Ctrl+Shift+X)`);
    }
}

/**
 * Get all shortcuts
 */
export function getAllShortcuts() {
    return shortcuts;
}

