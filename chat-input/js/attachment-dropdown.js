// Attachment dropdown menu functionality
export class AttachmentDropdown {
    constructor(elements, inputHandler) {
        this.elements = elements;
        this.inputHandler = inputHandler;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add button click
        this.elements.addButton.addEventListener('click', () => {
            this.handleAdd();
        });

        // Dropdown interactions
        this.elements.attachmentDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('.dropdown-item');
            if (!button) return;
            const action = button.getAttribute('data-action');
            if (action) {
                this.handleAttachmentAction(action);
            }
        });

        // Reposition on resize to stay anchored near the button
        window.addEventListener('resize', () => {
            if (this.elements.attachmentDropdown.classList.contains('open')) {
                this.positionAttachmentMenu();
                this.ensureDropdownVisibleByExpandingWindow();
            }
        });

        // Dismiss dropdown on outside click or Escape
        document.addEventListener('mousedown', (e) => {
            if (!this.elements.attachmentDropdown.classList.contains('open')) return;
            if (e.target === this.elements.addButton || this.elements.addButton.contains(e.target)) return;
            if (!this.elements.attachmentDropdown.contains(e.target)) {
                this.closeAttachmentMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.attachmentDropdown.classList.contains('open')) {
                this.closeAttachmentMenu();
                this.elements.addButton.focus();
            }
        });
    }

    // Add attachment handler with animation
    handleAdd() {
        // Visual feedback animation
        this.elements.addButton.animate([
            { transform: 'scale(1)', background: 'transparent' },
            { transform: 'scale(1.08)', background: '#303132' },
            { transform: 'scale(1)', background: 'transparent' }
        ], { duration: 160, easing: 'ease-out' });

        this.toggleAttachmentMenu();
    }

    // Dropdown helpers
    openAttachmentMenu() {
        if (!this.elements.attachmentDropdown) return;
        this.positionAttachmentMenu();
        this.elements.attachmentDropdown.classList.add('open');
        this.elements.attachmentDropdown.setAttribute('aria-hidden', 'false');
        this.elements.addButton.setAttribute('aria-expanded', 'true');
        
        // Expand window to reveal the full menu
        this.ensureDropdownVisibleByExpandingWindow();
        // Re-run after layout paints to be certain size is correct
        requestAnimationFrame(() => this.ensureDropdownVisibleByExpandingWindow());
        
        // Focus first item for accessibility
        const firstItem = this.elements.attachmentDropdown.querySelector('.dropdown-item:not([disabled])');
        if (firstItem) firstItem.focus({ preventScroll: true });
    }

    closeAttachmentMenu() {
        if (!this.elements.attachmentDropdown) return;
        this.elements.attachmentDropdown.classList.remove('open');
        this.elements.attachmentDropdown.setAttribute('aria-hidden', 'true');
        this.elements.addButton.setAttribute('aria-expanded', 'false');
        
        // Shrink window back down if extra space is no longer needed
        this.inputHandler.adjustWindowHeight();
    }

    toggleAttachmentMenu() {
        if (this.elements.attachmentDropdown.classList.contains('open')) {
            this.closeAttachmentMenu();
        } else {
            this.openAttachmentMenu();
        }
    }

    positionAttachmentMenu() {
        const rect = this.elements.addButton.getBoundingClientRect();
        // Default: slightly above and to the right side of the attach button
        const offsetX = 2; // slight side offset
        const offsetY = 8; // space from button
        this.elements.attachmentDropdown.style.left = (rect.left + offsetX) + 'px';
        this.elements.attachmentDropdown.style.top = (rect.top - offsetY) + 'px';

        // Prevent overflow to the right
        this.elements.attachmentDropdown.style.visibility = 'hidden';
        this.elements.attachmentDropdown.style.display = 'block';
        const menuRect = this.elements.attachmentDropdown.getBoundingClientRect();
        this.elements.attachmentDropdown.style.display = '';
        this.elements.attachmentDropdown.style.visibility = '';
        
        const overflowRight = (menuRect.right > window.innerWidth - 8);
        if (overflowRight) {
            const newLeft = Math.max(8, rect.right - menuRect.width);
            this.elements.attachmentDropdown.style.left = newLeft + 'px';
        }

        // If placed above would hide off-screen, place below
        const aboveTop = rect.top - menuRect.height - 6;
        if (aboveTop < 8) {
            const belowTop = Math.min(window.innerHeight - menuRect.height - 8, rect.bottom + 6);
            this.elements.attachmentDropdown.style.top = belowTop + 'px';
        } else {
            // Place above button by default (slightly above)
            this.elements.attachmentDropdown.style.top = (rect.top - menuRect.height - 6) + 'px';
        }
    }

    ensureDropdownVisibleByExpandingWindow() {
        if (!this.elements.attachmentDropdown || !this.elements.attachmentDropdown.classList.contains('open')) return;
        const menuRect = this.elements.attachmentDropdown.getBoundingClientRect();
        const overflow = Math.ceil(menuRect.bottom + 16 - window.innerHeight);
        if (overflow > 0 && window.chatInputAPI?.updateWindowHeight) {
            window.chatInputAPI.updateWindowHeight(window.innerHeight + overflow);
        }
    }

    // Item actions
    handleAttachmentAction(action) {
        switch (action) {
            case 'upload-document':
                if (window.chatInputAPI?.openAttachmentPicker) {
                    window.chatInputAPI.openAttachmentPicker();
                }
                break;
            case 'upload-image':
                if (window.chatInputAPI?.openAttachmentPicker) {
                    window.chatInputAPI.openAttachmentPicker('image');
                }
                break;
            case 'capture-image':
                if (window.chatInputAPI?.openScreenCapture) {
                    window.chatInputAPI.openScreenCapture();
                } else {
                    console.log('Screen capture not implemented');
                }
                break;
            case 'upload-video':
                if (window.chatInputAPI?.openAttachmentPicker) {
                    window.chatInputAPI.openAttachmentPicker('video');
                }
                break;
            case 'capture-video':
                if (window.chatInputAPI?.openScreenCapture) {
                    window.chatInputAPI.openScreenCapture('video');
                } else {
                    console.log('Video capture not implemented');
                }
                break;
            case 'upload-audio':
                if (window.chatInputAPI?.openAttachmentPicker) {
                    window.chatInputAPI.openAttachmentPicker('audio');
                }
                break;
            case 'capture-audio':
                if (window.chatInputAPI?.openAudioCapture) {
                    window.chatInputAPI.openAudioCapture();
                } else {
                    console.log('Audio capture not implemented');
                }
                break;
            case 'clear':
                this.inputHandler.clearInput();
                break;
        }
        this.closeAttachmentMenu();
        this.inputHandler.focusInput();
    }
}
