/**
 * Undo/Redo History Management System
 * Manages history for text input and attachments with Ctrl+Z/Ctrl+Y support
 */

import { state } from './state.js';
import { dom } from './dom.js';
import { addImageAttachment, removeImageAttachment, clearAllMediaAttachments, updateAttachmentsVisibility } from './attachments.js';
import { autoResize, updateSendButton } from './expand-collapse.js';

// History state
const historyState = {
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    isUndoRedoAction: false, // Flag to prevent recording during undo/redo
    lastRecordedState: null,
    debounceTimer: null,
    debounceDelay: 500, // ms before recording state
};

/**
 * Create a snapshot of current state
 */
function createSnapshot() {
    return {
        text: dom.messageInput?.value || '',
        cursorStart: dom.messageInput?.selectionStart || 0,
        cursorEnd: dom.messageInput?.selectionEnd || 0,
        imageAttachments: JSON.parse(JSON.stringify(state.imageAttachments)),
        mediaAttachments: JSON.parse(JSON.stringify(state.mediaAttachments)),
        timestamp: Date.now(),
    };
}

/**
 * Check if two snapshots are meaningfully different
 */
function isDifferentSnapshot(snapshot1, snapshot2) {
    if (!snapshot1 || !snapshot2) return true;
    
    // Check text difference
    if (snapshot1.text !== snapshot2.text) return true;
    
    // Check attachments count difference
    if (snapshot1.imageAttachments.length !== snapshot2.imageAttachments.length) return true;
    if (snapshot1.mediaAttachments.length !== snapshot2.mediaAttachments.length) return true;
    
    // Check attachments IDs
    const ids1 = snapshot1.imageAttachments.map(a => a.id).sort().join(',');
    const ids2 = snapshot2.imageAttachments.map(a => a.id).sort().join(',');
    if (ids1 !== ids2) return true;
    
    return false;
}

/**
 * Record current state to history (debounced for text input)
 */
export function recordState(immediate = false) {
    if (historyState.isUndoRedoAction) return;
    
    const record = () => {
        const snapshot = createSnapshot();
        
        // Don't record if nothing changed
        if (!isDifferentSnapshot(snapshot, historyState.lastRecordedState)) {
            return;
        }
        
        historyState.lastRecordedState = snapshot;
        historyState.undoStack.push(snapshot);
        
        // Limit stack size
        if (historyState.undoStack.length > historyState.maxHistorySize) {
            historyState.undoStack.shift();
        }
        
        // Clear redo stack on new action
        historyState.redoStack = [];
    };
    
    if (immediate) {
        // Clear any pending debounce
        if (historyState.debounceTimer) {
            clearTimeout(historyState.debounceTimer);
            historyState.debounceTimer = null;
        }
        record();
    } else {
        // Debounce for text input
        if (historyState.debounceTimer) {
            clearTimeout(historyState.debounceTimer);
        }
        historyState.debounceTimer = setTimeout(record, historyState.debounceDelay);
    }
}

/**
 * Restore a snapshot
 */
function restoreSnapshot(snapshot) {
    if (!snapshot) return false;
    
    historyState.isUndoRedoAction = true;
    
    try {
        // Restore text
        if (dom.messageInput) {
            dom.messageInput.value = snapshot.text;
            
            // Restore cursor position
            setTimeout(() => {
                try {
                    dom.messageInput.setSelectionRange(snapshot.cursorStart, snapshot.cursorEnd);
                    dom.messageInput.focus();
                } catch (e) {
                    // Fallback: just set cursor at end
                    dom.messageInput.setSelectionRange(snapshot.text.length, snapshot.text.length);
                }
            }, 0);
        }
        
        // Restore attachments
        state.imageAttachments = JSON.parse(JSON.stringify(snapshot.imageAttachments));
        state.mediaAttachments = JSON.parse(JSON.stringify(snapshot.mediaAttachments));
        
        // Re-render attachments
        if (dom.attachmentsGrid) {
            dom.attachmentsGrid.innerHTML = '';
            // Import dynamically to avoid circular dependency
            snapshot.imageAttachments.forEach(att => {
                import('./attachments.js').then(({ renderImageAttachment }) => {
                    renderImageAttachment(att);
                });
            });
            // Update visibility after a short delay to ensure rendering is complete
            setTimeout(() => {
                updateAttachmentsVisibility();
            }, 50);
        }
        
        // Update UI
        autoResize();
        updateSendButton();
        
        // Show visual feedback
        showUndoRedoFeedback('restored');
        
        return true;
    } finally {
        historyState.isUndoRedoAction = false;
    }
}

/**
 * Undo last action
 */
export function undo() {
    if (historyState.undoStack.length === 0) {
        showUndoRedoFeedback('nothing-to-undo');
        return false;
    }
    
    // Save current state to redo stack before undoing
    const currentSnapshot = createSnapshot();
    historyState.redoStack.push(currentSnapshot);
    
    // Pop from undo stack
    const previousSnapshot = historyState.undoStack.pop();
    
    // Restore previous state
    const success = restoreSnapshot(previousSnapshot);
    
    if (success) {
        historyState.lastRecordedState = previousSnapshot;
        showUndoRedoFeedback('undo');
    }
    
    return success;
}

/**
 * Redo last undone action
 */
export function redo() {
    if (historyState.redoStack.length === 0) {
        showUndoRedoFeedback('nothing-to-redo');
        return false;
    }
    
    // Save current state to undo stack
    const currentSnapshot = createSnapshot();
    historyState.undoStack.push(currentSnapshot);
    
    // Pop from redo stack
    const nextSnapshot = historyState.redoStack.pop();
    
    // Restore next state
    const success = restoreSnapshot(nextSnapshot);
    
    if (success) {
        historyState.lastRecordedState = nextSnapshot;
        showUndoRedoFeedback('redo');
    }
    
    return success;
}

/**
 * Clear all history
 */
export function clearHistory() {
    historyState.undoStack = [];
    historyState.redoStack = [];
    historyState.lastRecordedState = null;
}

/**
 * Get history stats
 */
export function getHistoryStats() {
    return {
        undoAvailable: historyState.undoStack.length,
        redoAvailable: historyState.redoStack.length,
        canUndo: historyState.undoStack.length > 0,
        canRedo: historyState.redoStack.length > 0,
    };
}

/**
 * Show visual feedback for undo/redo actions
 */
function showUndoRedoFeedback(action) {
    const messages = {
        'undo': 'Undo',
        'redo': 'Redo',
        'restored': 'Restored',
        'nothing-to-undo': 'Nothing to undo',
        'nothing-to-redo': 'Nothing to redo',
    };
    
    const message = messages[action] || action;
    
    // Create feedback element
    let feedback = document.getElementById('undo-redo-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'undo-redo-feedback';
        feedback.className = 'undo-redo-feedback';
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.classList.remove('show', 'error');
    
    // Add appropriate class
    if (action.includes('nothing')) {
        feedback.classList.add('error');
    }
    
    // Trigger animation
    requestAnimationFrame(() => {
        feedback.classList.add('show');
    });
    
    // Hide after delay
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 1500);
}

/**
 * Initialize undo/redo system
 */
export function initializeUndoRedo() {
    // Record initial state
    recordState(true);
    
    // Listen to input changes (debounced)
    if (dom.messageInput) {
        dom.messageInput.addEventListener('input', () => {
            recordState(false); // Debounced
        });
        
        // Record on blur (immediate)
        dom.messageInput.addEventListener('blur', () => {
            recordState(true);
        });
    }
    
    // Keyboard shortcuts handled in init.js
    console.log('Undo/Redo system initialized');
}

// Export for external state recording
export function recordAttachmentChange() {
    recordState(true); // Immediate for attachment changes
}

