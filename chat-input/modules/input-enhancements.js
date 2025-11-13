/**
 * Enhanced Input Field UX Module
 * Provides better text selection, cursor positioning, and input handling
 */

import { dom } from './dom.js';
import { state } from './state.js';
import { recordState } from './undo-redo.js';
import { autoResize, updateSendButton } from './expand-collapse.js';

/**
 * Smart text insertion at cursor position
 */
export function insertTextAtCursor(text) {
    if (!dom.messageInput) return false;
    
    const input = dom.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    // Insert text at cursor position
    const before = value.substring(0, start);
    const after = value.substring(end);
    input.value = before + text + after;
    
    // Move cursor to end of inserted text
    const newPos = start + text.length;
    input.setSelectionRange(newPos, newPos);
    
    // Update UI
    recordState(true);
    autoResize();
    updateSendButton();
    input.focus();
    
    return true;
}

/**
 * Get selected text
 */
export function getSelectedText() {
    if (!dom.messageInput) return '';
    
    const start = dom.messageInput.selectionStart;
    const end = dom.messageInput.selectionEnd;
    
    if (start === end) return '';
    
    return dom.messageInput.value.substring(start, end);
}

/**
 * Replace selected text
 */
export function replaceSelectedText(newText) {
    if (!dom.messageInput) return false;
    
    const input = dom.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    // Replace selection
    input.value = value.substring(0, start) + newText + value.substring(end);
    
    // Move cursor to end of new text
    const newPos = start + newText.length;
    input.setSelectionRange(newPos, newPos);
    
    // Update UI
    recordState(true);
    autoResize();
    updateSendButton();
    input.focus();
    
    return true;
}

/**
 * Enhanced copy with visual feedback
 */
export async function copyTextWithFeedback() {
    const selectedText = getSelectedText();
    
    if (!selectedText) {
        showOperationFeedback('Nothing to copy', 'info');
        return false;
    }
    
    try {
        await navigator.clipboard.writeText(selectedText);
        showOperationFeedback('Copied!', 'success');
        return true;
    } catch (error) {
        showOperationFeedback('Copy failed', 'error');
        return false;
    }
}

/**
 * Enhanced cut with visual feedback
 */
export async function cutTextWithFeedback() {
    const selectedText = getSelectedText();
    
    if (!selectedText) {
        showOperationFeedback('Nothing to cut', 'info');
        return false;
    }
    
    try {
        await navigator.clipboard.writeText(selectedText);
        replaceSelectedText('');
        showOperationFeedback('Cut!', 'success');
        return true;
    } catch (error) {
        showOperationFeedback('Cut failed', 'error');
        return false;
    }
}

/**
 * Enhanced paste with visual feedback
 */
export async function pasteTextWithFeedback() {
    try {
        const text = await navigator.clipboard.readText();
        
        if (!text) {
            showOperationFeedback('Nothing to paste', 'info');
            return false;
        }
        
        if (getSelectedText()) {
            replaceSelectedText(text);
        } else {
            insertTextAtCursor(text);
        }
        
        showOperationFeedback('Pasted!', 'success');
        return true;
    } catch (error) {
        showOperationFeedback('Paste failed', 'error');
        return false;
    }
}

/**
 * Show operation feedback
 */
function showOperationFeedback(message, type = 'info') {
    // Create feedback element if it doesn't exist
    let feedback = document.getElementById('operation-feedback');
    
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'operation-feedback';
        feedback.className = 'operation-feedback';
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.className = `operation-feedback ${type}`;
    
    // Trigger animation
    feedback.style.animation = 'none';
    setTimeout(() => {
        feedback.style.animation = 'operationPop 0.6s ease';
    }, 10);
}

/**
 * Smart placeholder handling
 */
export function updatePlaceholder() {
    if (!dom.messageInput) return;
    
    const promptInput = document.querySelector('.prompt-input');
    const isCollapsed = promptInput && !promptInput.classList.contains('expanded');
    
    // Dynamic placeholder based on state
    if (isCollapsed) {
        dom.messageInput.placeholder = 'Ask Anything...';
    } else {
        dom.messageInput.placeholder = 'Type your message... ';
    }
}

/**
 * Auto-focus management
 */
export function smartAutoFocus() {
    // Don't auto-focus if user is in another input
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable ||
        activeElement.closest('.mcp-modal, .dropdown-menu')
    )) {
        return;
    }
    
    // Focus messageInput
    if (dom.messageInput) {
        dom.messageInput.focus();
    }
}

/**
 * Preserve cursor position during state transitions
 */
export function preserveCursorPosition(callback) {
    if (!dom.messageInput) {
        callback();
        return;
    }
    
    const start = dom.messageInput.selectionStart;
    const end = dom.messageInput.selectionEnd;
    
    callback();
    
    // Restore cursor position
    requestAnimationFrame(() => {
        try {
            dom.messageInput.setSelectionRange(start, end);
        } catch (e) {
            // Fallback to end
            const len = dom.messageInput.value.length;
            dom.messageInput.setSelectionRange(len, len);
        }
    });
}

/**
 * Enhanced text selection in collapsed mode
 */
export function enhanceCollapsedSelection() {
    if (!dom.messageInput) return;
    
    const input = dom.messageInput;
    const promptInput = document.querySelector('.prompt-input');
    
    // Listen for selection changes
    let selectionTimeout;
    
    input.addEventListener('select', () => {
        const isCollapsed = promptInput && !promptInput.classList.contains('expanded');
        
        if (isCollapsed) {
            // Clear existing timeout
            if (selectionTimeout) clearTimeout(selectionTimeout);
            
            // Show selection hint
            selectionTimeout = setTimeout(() => {
                const selectedText = getSelectedText();
                if (selectedText) {
                    showSelectionHint(selectedText.length);
                }
            }, 300);
        }
    });
    
    // Clear hint when selection is cleared
    input.addEventListener('click', () => {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        if (start === end) {
            hideSelectionHint();
        }
    });
}

/**
 * Show selection hint
 */
function showSelectionHint(charCount) {
    let hint = document.getElementById('selection-hint');
    
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'selection-hint';
        hint.className = 'input-state-indicator show';
        
        // Position it relative to input
        if (dom.promptInput) {
            dom.promptInput.appendChild(hint);
        }
    }
    
    hint.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 2H4a2 2 0 0 0-2 2v5M22 9V4a2 2 0 0 0-2-2h-5M9 22H4a2 2 0 0 1-2-2v-5M22 15v5a2 2 0 0 1-2 2h-5"/>
        </svg>
        ${charCount} selected
    `;
    hint.classList.add('show');
}

/**
 * Hide selection hint
 */
function hideSelectionHint() {
    const hint = document.getElementById('selection-hint');
    if (hint) {
        hint.classList.remove('show');
        setTimeout(() => hint.remove(), 200);
    }
}

/**
 * Character counter for expanded mode
 */
export function updateCharCounter() {
    const promptInput = document.querySelector('.prompt-input');
    const isExpanded = promptInput && promptInput.classList.contains('expanded');
    
    if (!isExpanded || !dom.messageInput) return;
    
    let counter = document.getElementById('char-counter');
    
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'char-counter';
        counter.className = 'char-counter';
        
        if (dom.promptActions) {
            dom.promptActions.appendChild(counter);
        }
    }
    
    const charCount = dom.messageInput.value.length;
    counter.textContent = `${charCount} chars`;
}

/**
 * Smart line breaks handling
 */
export function handleSmartLineBreaks(e) {
    const promptInput = document.querySelector('.prompt-input');
    const isCollapsed = promptInput && !promptInput.classList.contains('expanded');
    
    if (isCollapsed && e.key === 'Enter') {
        // In collapsed mode, Enter should send (handled elsewhere)
        // Don't allow line breaks
        return;
    }
    
    if (!isCollapsed && e.key === 'Enter' && !e.shiftKey) {
        // In expanded mode, Enter alone inserts line break
        // Shift+Enter sends (handled elsewhere)
        return;
    }
}

/**
 * Enhanced text wrapping in collapsed mode
 */
export function enforceCollapsedConstraints() {
    if (!dom.messageInput) return;
    
    const promptInput = document.querySelector('.prompt-input');
    const isCollapsed = promptInput && !promptInput.classList.contains('expanded');
    
    if (isCollapsed) {
        // Remove any line breaks
        const value = dom.messageInput.value;
        const cleaned = value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
        
        if (value !== cleaned) {
            const cursorPos = dom.messageInput.selectionStart;
            dom.messageInput.value = cleaned;
            
            // Try to maintain cursor position
            const newPos = Math.min(cursorPos, cleaned.length);
            dom.messageInput.setSelectionRange(newPos, newPos);
        }
        
        // Enforce single-line CSS
        dom.messageInput.style.whiteSpace = 'nowrap';
        dom.messageInput.style.overflow = 'hidden';
        dom.messageInput.style.textOverflow = 'ellipsis';
    } else {
        // Allow multi-line in expanded mode
        dom.messageInput.style.whiteSpace = 'pre-wrap';
        dom.messageInput.style.overflow = 'auto';
        dom.messageInput.style.textOverflow = 'clip';
    }
}

/**
 * Initialize input enhancements
 */
export function initializeInputEnhancements() {
    if (!dom.messageInput) return;
    
    // Set initial placeholder
    updatePlaceholder();
    
    // Enhance selection in collapsed mode
    enhanceCollapsedSelection();
    
    // Update placeholder on expand/collapse
    const observer = new MutationObserver(() => {
        updatePlaceholder();
        enforceCollapsedConstraints();
    });
    
    const promptInput = document.querySelector('.prompt-input');
    if (promptInput) {
        observer.observe(promptInput, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Update character counter on input
    dom.messageInput.addEventListener('input', () => {
        updateCharCounter();
        enforceCollapsedConstraints();
    });
    
    // Smart auto-focus on window focus
    window.addEventListener('focus', () => {
        setTimeout(smartAutoFocus, 100);
    });
    
    console.log('Input enhancements initialized');
}


