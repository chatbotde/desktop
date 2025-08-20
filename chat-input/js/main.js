// Main chat input application - imports and initializes all modules
import { ChatInputElements, ChatInputState } from './dom-elements.js';
import { InputHandler } from './input-handler.js';
import { AttachmentDropdown } from './attachment-dropdown.js';
import { DragHandler } from './drag-handler.js';
import { ButtonActions } from './button-actions.js';
import { GlobalShortcuts } from './global-shortcuts.js';

class ChatInputApp {
    constructor() {
        this.elements = new ChatInputElements();
        this.state = new ChatInputState();
        
        // Validate that all required elements exist
        if (!this.elements.validateElements()) {
            console.error('Chat Input: Failed to initialize - missing required elements');
            return;
        }

        this.init();
    }

    init() {
        try {
            // Initialize all modules
            this.inputHandler = new InputHandler(this.elements, this.state);
            this.attachmentDropdown = new AttachmentDropdown(this.elements, this.inputHandler);
            this.dragHandler = new DragHandler(this.elements, this.state);
            this.buttonActions = new ButtonActions(this.elements, this.state, this.inputHandler);
            this.globalShortcuts = new GlobalShortcuts(this.elements, this.inputHandler);

            console.log('Chat Input: Application initialized successfully');
        } catch (error) {
            console.error('Chat Input: Failed to initialize application:', error);
        }
    }
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatInputApp();
    });
} else {
    // DOM is already ready
    new ChatInputApp();
}
