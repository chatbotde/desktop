// DOM Elements and State Management
export class ChatInputElements {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.sendIcon = document.getElementById('sendIcon');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.addButton = document.getElementById('addButton');
        this.lightingButton = document.getElementById('lightingButton');
        this.hideShowButton = document.getElementById('hideShowButton');
        this.toggleMainWindowButton = document.getElementById('toggleMainWindowButton');
        this.promptInput = document.querySelector('.prompt-input');
        this.dragHandle = document.querySelector('.drag-handle');
        this.promptActions = document.querySelector('.prompt-actions');
        this.leftActions = document.querySelector('.left-actions');
        this.rightActions = document.querySelector('.right-actions');
        this.draggableArea = document.querySelector('.draggable-area');
        this.attachmentDropdown = document.getElementById('attachmentDropdown');
    }

    // Get all draggable elements
    getDraggableElements() {
        return [
            this.dragHandle,
            this.promptActions,
            this.leftActions,
            this.rightActions,
            this.draggableArea
        ].filter(Boolean);
    }

    // Validate that all required elements exist
    validateElements() {
        const requiredElements = [
            'messageInput',
            'sendButton',
            'sendIcon',
            'loadingSpinner',
            'typingIndicator',
            'addButton',
            'lightingButton',
            'hideShowButton',
            'toggleMainWindowButton',
            'promptInput',
            'dragHandle',
            'promptActions',
            'leftActions',
            'rightActions',
            'draggableArea',
            'attachmentDropdown'
        ];

        const missingElements = requiredElements.filter(id => !this[id]);
        
        if (missingElements.length > 0) {
            console.error('Chat Input: Missing required elements:', missingElements);
            return false;
        }
        
        return true;
    }
}

// State management
export class ChatInputState {
    constructor() {
        this.isSending = false;
        this.lastMessageSent = '';
        this.isTransparent = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        // Future: this.recording = false; // Voice recording state
    }

    resetSendingState() {
        this.isSending = false;
        this.lastMessageSent = '';
    }

    setSendingState(message) {
        this.isSending = true;
        this.lastMessageSent = message;
    }
}
