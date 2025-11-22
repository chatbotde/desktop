/**
 * TSF Insert Button Module
 * Handles the insert button functionality to send text to last focused application
 */

import { dom } from './dom.js';

class TsfInsertManager {
    constructor() {
        this.insertButton = null;
        this.insertBadge = null;
        this.lastTrackedApp = null;
        this.lastResponseText = null;
        this.initialized = false;
    }

    /**
     * Initialize the insert button manager
     */
    async init() {
        if (this.initialized) return;

        this.insertButton = document.getElementById('insertButton');
        this.insertBadge = document.getElementById('insertBadge');

        if (!this.insertButton) {
            console.error('Insert button not found');
            return;
        }

        // Initialize TSF
        try {
            await window.tsfAPI.initialize();
            console.log('✅ TSF initialized for insert button');
            this.setupEventListeners();
            this.initialized = true;
        } catch (err) {
            console.error('Failed to initialize TSF:', err);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Button click handler
        this.insertButton.addEventListener('click', () => this.handleInsertClick());

        // Track external app focus changes
        window.tsfAPI.onExternalFocusChanged((focusInfo) => {
            this.lastTrackedApp = focusInfo;
            this.updateButtonState(focusInfo);
            console.log(`📍 Tracked: ${focusInfo.processName}`);
        });

        // Success handler
        window.tsfAPI.onTextInserted((data) => {
            console.log(`✅ Text inserted into ${data.focusInfo.processName}`);
            this.showSuccessAnimation();
            this.showNotification(`Sent to ${data.focusInfo.processName}!`, 'success');
        });

        // Failure handler
        window.tsfAPI.onInsertFailed((data) => {
            console.error('❌ Insert failed');
            this.showNotification('Failed to insert text', 'error');
            this.insertButton.classList.remove('inserting');
        });

        // Warning handler
        window.tsfAPI.onWarning((data) => {
            console.warn('⚠️', data.message);
            this.showNotification(data.message, 'warning');
        });
    }

    /**
     * Update button state based on tracked app
     */
    updateButtonState(focusInfo) {
        if (!this.insertButton) return;

        if (focusInfo && focusInfo.processName) {
            // Show button and add has-target class
            this.insertButton.style.display = 'flex';
            this.insertButton.classList.add('has-target');
            
            // Update badge with app name
            if (this.insertBadge) {
                const appName = this.getShortAppName(focusInfo.processName);
                this.insertBadge.textContent = appName;
                this.insertBadge.style.display = 'block';
            }

            // Update tooltip
            this.insertButton.title = `Insert to ${focusInfo.processName}`;
        } else {
            // Hide or disable button if no app tracked
            this.insertButton.classList.remove('has-target');
            if (this.insertBadge) {
                this.insertBadge.style.display = 'none';
            }
            this.insertButton.title = 'Insert to last app';
        }
    }

    /**
     * Get short app name from process name
     */
    getShortAppName(processName) {
        if (!processName) return '';
        
        // Remove .exe extension
        let name = processName.replace(/\.exe$/i, '');
        
        // Handle common apps
        const shortNames = {
            'chrome': 'CHR',
            'msedge': 'EDGE',
            'firefox': 'FFX',
            'notepad': 'NOTE',
            'code': 'CODE',
            'winword': 'WORD',
            'excel': 'XLS',
            'outlook': 'OUT',
            'slack': 'SLCK',
            'discord': 'DISC',
            'teams': 'TEAM'
        };

        const nameLower = name.toLowerCase();
        for (const [key, short] of Object.entries(shortNames)) {
            if (nameLower.includes(key)) {
                return short;
            }
        }

        // Return first 4 characters uppercase
        return name.substring(0, 4).toUpperCase();
    }

    /**
     * Set the last response text to be inserted
     */
    setLastResponse(text) {
        this.lastResponseText = text;
        
        // Show button if we have text and tracked app
        if (text && this.lastTrackedApp) {
            this.insertButton.style.display = 'flex';
        }
    }

    /**
     * Handle insert button click
     */
    async handleInsertClick() {
        // Get text to insert
        let textToInsert = this.lastResponseText;

        // If no cached text, try to get from message input or last response
        if (!textToInsert) {
            const messageInput = dom.messageInput;
            textToInsert = messageInput?.value?.trim();
        }

        if (!textToInsert) {
            this.showNotification('No text to insert', 'warning');
            return;
        }

        // Check if we have a tracked app
        if (!this.lastTrackedApp) {
            const tracked = await window.tsfAPI.getLastExternalFocus();
            if (!tracked || !tracked.processName) {
                this.showNotification('Please click on a text editor first!', 'warning');
                return;
            }
            this.lastTrackedApp = tracked;
        }

        // Clear message input immediately to prevent it from receiving the paste
        const messageInput = dom.messageInput;
        if (messageInput) {
            messageInput.value = '';
            messageInput.blur(); // Remove focus from input
        }

        // Show inserting animation
        this.insertButton.classList.add('inserting');

        try {
            // Focus and insert text - the native code handles the focus switch and paste
            const success = await window.tsfAPI.focusAndInsertText(textToInsert);

            if (success) {
                console.log(`✅ Inserted to ${this.lastTrackedApp.processName}`);
                this.showNotification(`Sent to ${this.lastTrackedApp.processName}!`, 'success');
            } else {
                this.showNotification('Failed to insert text', 'error');
            }
        } catch (err) {
            console.error('Insert error:', err);
            this.showNotification('Error: ' + err.message, 'error');
        } finally {
            // Remove animation
            setTimeout(() => {
                this.insertButton?.classList.remove('inserting');
            }, 600);
        }
    }

    /**
     * Show success animation
     */
    showSuccessAnimation() {
        if (!this.insertButton) return;

        this.insertButton.classList.add('inserting');
        setTimeout(() => {
            this.insertButton.classList.remove('inserting');
        }, 600);
    }

    /**
     * Show notification (integrate with your existing notification system)
     */
    showNotification(message, type = 'info') {
        // You can integrate this with your existing notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `tsf-toast tsf-toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Get current tracked app info
     */
    getTrackedApp() {
        return this.lastTrackedApp;
    }

    /**
     * Manually refresh tracking
     */
    async refreshTracking() {
        try {
            const focusInfo = await window.tsfAPI.getLastExternalFocus();
            if (focusInfo && focusInfo.processName) {
                this.lastTrackedApp = focusInfo;
                this.updateButtonState(focusInfo);
            }
        } catch (err) {
            console.error('Error refreshing tracking:', err);
        }
    }
}

// Create singleton instance
const tsfInsertManager = new TsfInsertManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tsfInsertManager.init());
} else {
    tsfInsertManager.init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

export default tsfInsertManager;
