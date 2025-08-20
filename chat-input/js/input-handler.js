// Input handling, auto-resize, and send button management
export class InputHandler {
    constructor(elements, state) {
        this.elements = elements;
        this.state = state;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.autoResize();
        this.updateSendButton();
    }

    setupEventListeners() {
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResize();
            this.updateSendButton();
        });

        this.elements.messageInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        this.elements.messageInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.autoResize();
                this.updateSendButton();
            }, 0);
        });
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        } else if (e.key === 'Escape') {
            this.elements.messageInput.blur();
        } else if (e.key === 'h' && e.ctrlKey) {
            e.preventDefault();
            this.toggleWindowVisibility();
        } else if (e.key === 'm' && e.ctrlKey) {
            e.preventDefault();
            this.toggleMainWindow();
        }
    }

    // Auto-resize textarea with smooth expansion
    autoResize() {
        const messageInput = this.elements.messageInput;
        messageInput.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(messageInput.scrollHeight, maxHeight);
        messageInput.style.height = newHeight + 'px';

        // Adjust window height dynamically
        this.adjustWindowHeight();
    }

    // Adjust window height based on content
    adjustWindowHeight() {
        const container = document.querySelector('.chat-input-container');
        const promptInput = this.elements.promptInput;
        const currentHeight = promptInput.offsetHeight;
        const dropdown = this.elements.attachmentDropdown;
        let targetHeight = currentHeight + 40; // base height with padding
        
        if (dropdown && dropdown.classList.contains('open')) {
            // Ensure dropdown bottom is visible inside the window
            const menuRect = dropdown.getBoundingClientRect();
            targetHeight = Math.max(targetHeight, Math.ceil(menuRect.bottom + 16));
        }
        
        // Notify main process about height change for window resizing
        if (window.chatInputAPI?.updateWindowHeight) {
            window.chatInputAPI.updateWindowHeight(targetHeight);
        }
    }

    // Update send button state
    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendButton.disabled = !hasText || this.state.isSending;

        if (this.state.isSending) {
            this.elements.sendIcon.style.display = 'none';
            this.elements.loadingSpinner.style.display = 'block';
        } else {
            this.elements.sendIcon.style.display = 'block';
            this.elements.loadingSpinner.style.display = 'none';
        }
    }

    // Send message function with enhanced feedback
    sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message || this.state.isSending || message === this.state.lastMessageSent) return;

        if (!window.chatInputAPI) {
            console.error('Chat Input: chatInputAPI not available');
            return;
        }

        // Set loading state
        this.state.setSendingState(message);
        this.updateSendButton();
        this.elements.typingIndicator.classList.add('active');
        this.elements.messageInput.disabled = true;

        try {
            window.chatInputAPI.sendMessage({
                content: message,
                timestamp: new Date().toISOString(),
                id: Date.now().toString(),
                type: 'text'
            });

            // Clear input immediately for better UX
            this.elements.messageInput.value = '';
            this.autoResize();

        } catch (err) {
            console.error('Chat Input: Error sending message', err);
            this.resetSendingState();
        }

        // Reset state after delay
        setTimeout(() => {
            this.resetSendingState();
            this.elements.messageInput.focus();
        }, 1200);
    }

    // Reset sending state
    resetSendingState() {
        this.state.resetSendingState();
        this.elements.typingIndicator.classList.remove('active');
        this.elements.messageInput.disabled = false;
        this.updateSendButton();
    }

    // Clear input
    clearInput() {
        this.elements.messageInput.value = '';
        this.autoResize();
        this.resetSendingState();
        this.elements.messageInput.focus();
    }

    // Focus input
    focusInput() {
        this.elements.messageInput.focus();
    }

    // Toggle window visibility
    toggleWindowVisibility() {
        if (window.chatInputAPI?.hideWindow) {
            window.chatInputAPI.hideWindow();
        } else {
            console.log('Chat Input: Hide window API not available');
        }

        // Visual feedback animation
        this.elements.hideShowButton.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
    }

    // Toggle main window
    toggleMainWindow() {
        if (window.chatInputAPI?.toggleMainWindow) {
            window.chatInputAPI.toggleMainWindow();
        } else {
            console.log('Chat Input: Toggle main window API not available');
        }

        // Visual feedback animation
        this.elements.toggleMainWindowButton.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], { duration: 150, easing: 'ease-out' });
    }
}
