// Global shortcuts, keyboard events, and IPC communication
export class GlobalShortcuts {
    constructor(elements, inputHandler) {
        this.elements = elements;
        this.inputHandler = inputHandler;
        this.init();
    }

    init() {
        this.setupGlobalShortcuts();
        this.setupIPCListeners();
        this.setupWindowEvents();
    }

    setupGlobalShortcuts() {
        // Auto-focus on keypress and global shortcuts
        document.addEventListener('keydown', (e) => {
            // Global shortcut for hide/show
            if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault();
                this.inputHandler.toggleWindowVisibility();
                return;
            }

            // Global shortcut for toggle main window
            if (e.key === 'm' && e.ctrlKey) {
                e.preventDefault();
                this.inputHandler.toggleMainWindow();
                return;
            }

            // Auto-focus on typing
            if (document.activeElement !== this.elements.messageInput &&
                !e.ctrlKey && !e.altKey && !e.metaKey &&
                e.key.length === 1 &&
                /^[a-zA-Z0-9\s]$/.test(e.key)) {
                this.inputHandler.focusInput();
            }
        });
    }

    setupIPCListeners() {
        // IPC listeners using the exposed API
        if (window.chatInputAPI) {
            window.chatInputAPI.onClearInput(() => {
                this.inputHandler.clearInput();
            });

            window.chatInputAPI.onFocusInput(() => {
                this.inputHandler.focusInput();
            });
        }
    }

    setupWindowEvents() {
        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            this.inputHandler.focusInput();
            this.inputHandler.autoResize();
            this.inputHandler.updateSendButton();
        });

        // Handle window focus
        window.addEventListener('focus', () => {
            this.inputHandler.focusInput();
        });
    }
}
