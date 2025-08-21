
        // DOM Elements
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const sendIcon = document.getElementById('sendIcon');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const typingIndicator = document.getElementById('typingIndicator');
        const addButton = document.getElementById('addButton');
        const lightingButton = document.getElementById('lightingButton');
        const hideShowButton = document.getElementById('hideShowButton');
        const toggleMainWindowButton = document.getElementById('toggleMainWindowButton');
        const promptInput = document.querySelector('.prompt-input');
        const dragHandle = document.querySelector('.drag-handle');
        const promptActions = document.querySelector('.prompt-actions');
        const leftActions = document.querySelector('.left-actions');
        const rightActions = document.querySelector('.right-actions');
        const draggableArea = document.querySelector('.draggable-area');
        const attachmentDropdown = document.getElementById('attachmentDropdown');

        // Future buttons (commented out)
        // const micButton = document.getElementById('micButton');
        // const searchButton = document.getElementById('searchButton');
        // const moreButton = document.getElementById('moreButton');

        // State management
        let isSending = false;
        let lastMessageSent = '';
        let isTransparent = false;
        // let recording = false; // Future voice recording state
        
        // Drag state
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        // Auto-resize textarea with smooth expansion
        function autoResize() {
            messageInput.style.height = 'auto';
            const maxHeight = 200;
            const newHeight = Math.min(messageInput.scrollHeight, maxHeight);
            messageInput.style.height = newHeight + 'px';

            // Adjust window height dynamically
            adjustWindowHeight();
        }

        // Adjust window height based on content
        function adjustWindowHeight() {
            const container = document.querySelector('.chat-input-container');
            const promptInput = document.querySelector('.prompt-input');
            const currentHeight = promptInput.offsetHeight;
            const dropdown = document.getElementById('attachmentDropdown');
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
        function updateSendButton() {
            const hasText = messageInput.value.trim().length > 0;
            sendButton.disabled = !hasText || isSending;

            if (isSending) {
                sendIcon.style.display = 'none';
                loadingSpinner.style.display = 'block';
            } else {
                sendIcon.style.display = 'block';
                loadingSpinner.style.display = 'none';
            }
        }

        // Send message function with enhanced feedback
        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isSending || message === lastMessageSent) return;

            if (!window.chatInputAPI) {
                console.error('Chat Input: chatInputAPI not available');
                return;
            }

            // Set loading state
            isSending = true;
            lastMessageSent = message;
            updateSendButton();
            typingIndicator.classList.add('active');
            messageInput.disabled = true;

            try {
                window.chatInputAPI.sendMessage({
                    content: message,
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString(),
                    type: 'text'
                });

                // Clear input immediately for better UX
                messageInput.value = '';
                autoResize();

            } catch (err) {
                console.error('Chat Input: Error sending message', err);
                resetSendingState();
            }

            // Reset state after delay
            setTimeout(() => {
                resetSendingState();
                messageInput.focus();
            }, 1200);
        }

        // Reset sending state
        function resetSendingState() {
            isSending = false;
            lastMessageSent = '';
            typingIndicator.classList.remove('active');
            messageInput.disabled = false;
            updateSendButton();
        }

        // Toggle transparency/lighting effect
        function toggleLighting() {
            isTransparent = !isTransparent;
            promptInput.classList.toggle('transparent', isTransparent);
            lightingButton.classList.toggle('active', isTransparent);
            lightingButton.setAttribute('aria-pressed', isTransparent.toString());

            // Visual feedback animation
            lightingButton.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.1)' },
                { transform: 'scale(1)' }
            ], { duration: 200, easing: 'ease-out' });
        }

        // Hide/Show window function
        function toggleWindowVisibility() {
            if (window.chatInputAPI?.hideWindow) {
                window.chatInputAPI.hideWindow();
            } else {
                console.log('Chat Input: Hide window API not available');
            }

            // Visual feedback animation
            hideShowButton.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(0.9)' },
                { transform: 'scale(1)' }
            ], { duration: 150, easing: 'ease-out' });
        }

        // Toggle main window function
        function toggleMainWindow() {
            if (window.chatInputAPI?.toggleMainWindow) {
                window.chatInputAPI.toggleMainWindow();
            } else {
                console.log('Chat Input: Toggle main window API not available');
            }

            // Visual feedback animation
            toggleMainWindowButton.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(0.9)' },
                { transform: 'scale(1)' }
            ], { duration: 150, easing: 'ease-out' });
        }

        // Future: Voice recording toggle (commented out)
        /*
        function toggleRecording() {
            recording = !recording;
            micButton.classList.toggle('mic-recording', recording);
            micButton.setAttribute('aria-pressed', recording.toString());

            if (recording) {
                typingIndicator.classList.add('active');
                // Future: Start actual voice recording
            } else {
                typingIndicator.classList.remove('active');
                // Future: Stop voice recording and process
            }
        }
        */

        // Add attachment handler with animation
        function handleAdd() {
            // Visual feedback animation
            addButton.animate([
                { transform: 'scale(1)', background: 'transparent' },
                { transform: 'scale(1.08)', background: '#303132' },
                { transform: 'scale(1)', background: 'transparent' }
            ], { duration: 160, easing: 'ease-out' });

            toggleAttachmentMenu();
        }

        // Dropdown helpers
        function openAttachmentMenu() {
            if (!attachmentDropdown) return;
            positionAttachmentMenu();
            attachmentDropdown.classList.add('open');
            attachmentDropdown.setAttribute('aria-hidden', 'false');
            addButton.setAttribute('aria-expanded', 'true');
            // Expand window to reveal the full menu
            ensureDropdownVisibleByExpandingWindow();
            // Re-run after layout paints to be certain size is correct
            requestAnimationFrame(() => ensureDropdownVisibleByExpandingWindow());
            // Focus first item for accessibility
            const firstItem = attachmentDropdown.querySelector('.dropdown-item:not([disabled])');
            if (firstItem) firstItem.focus({ preventScroll: true });
        }

        function closeAttachmentMenu() {
            if (!attachmentDropdown) return;
            attachmentDropdown.classList.remove('open');
            attachmentDropdown.setAttribute('aria-hidden', 'true');
            addButton.setAttribute('aria-expanded', 'false');
            // Shrink window back down if extra space is no longer needed
            adjustWindowHeight();
        }

        function toggleAttachmentMenu() {
            if (attachmentDropdown.classList.contains('open')) {
                closeAttachmentMenu();
            } else {
                openAttachmentMenu();
            }
        }

        function positionAttachmentMenu() {
            const rect = addButton.getBoundingClientRect();
            // Default: slightly above and to the right side of the attach button
            const offsetX = 2; // slight side offset
            const offsetY = 8; // space from button
            attachmentDropdown.style.left = (rect.left + offsetX) + 'px';
            attachmentDropdown.style.top = (rect.top - offsetY) + 'px';

            // Prevent overflow to the right
            attachmentDropdown.style.visibility = 'hidden';
            attachmentDropdown.style.display = 'block';
            const menuRect = attachmentDropdown.getBoundingClientRect();
            attachmentDropdown.style.display = '';
            attachmentDropdown.style.visibility = '';
            const overflowRight = (menuRect.right > window.innerWidth - 8);
            if (overflowRight) {
                const newLeft = Math.max(8, rect.right - menuRect.width);
                attachmentDropdown.style.left = newLeft + 'px';
            }

            // If placed above would hide off-screen, place below
            const aboveTop = rect.top - menuRect.height - 6;
            if (aboveTop < 8) {
                const belowTop = Math.min(window.innerHeight - menuRect.height - 8, rect.bottom + 6);
                attachmentDropdown.style.top = belowTop + 'px';
            } else {
                // Place above button by default (slightly above)
                attachmentDropdown.style.top = (rect.top - menuRect.height - 6) + 'px';
            }
        }

        function ensureDropdownVisibleByExpandingWindow() {
            if (!attachmentDropdown || !attachmentDropdown.classList.contains('open')) return;
            const menuRect = attachmentDropdown.getBoundingClientRect();
            const overflow = Math.ceil(menuRect.bottom + 16 - window.innerHeight);
            if (overflow > 0 && window.chatInputAPI?.updateWindowHeight) {
                window.chatInputAPI.updateWindowHeight(window.innerHeight + overflow);
            }
        }

        // Item actions
        function handleAttachmentAction(action) {
            switch (action) {
                case 'pick-file':
                    if (window.chatInputAPI?.openAttachmentPicker) {
                        window.chatInputAPI.openAttachmentPicker();
                    }
                    break;
                case 'paste':
                    handlePasteContent();
                    break;
                case 'screenshot':
                    if (window.chatInputAPI?.openScreenCapture) {
                        window.chatInputAPI.openScreenCapture();
                    } else {
                        console.log('Screen capture not implemented');
                    }
                    break;
                case 'clear':
                    messageInput.value = '';
                    autoResize();
                    updateSendButton();
                    break;
            }
            closeAttachmentMenu();
            messageInput.focus();
        }

        // Enhanced paste handler for different content types
        async function handlePasteContent() {
            try {
                // Check if we can read clipboard items (for rich content)
                if (navigator.clipboard?.read) {
                    const clipboardItems = await navigator.clipboard.read();
                    
                    for (const item of clipboardItems) {
                        // Handle text
                        if (item.types.includes('text/plain')) {
                            const textBlob = await item.getType('text/plain');
                            const text = await textBlob.text();
                            if (text) {
                                appendToInput(text);
                            }
                        }
                        
                        // Handle HTML content
                        if (item.types.includes('text/html')) {
                            const htmlBlob = await item.getType('text/html');
                            const html = await htmlBlob.text();
                            // Extract plain text from HTML
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = html;
                            const plainText = tempDiv.textContent || tempDiv.innerText || '';
                            if (plainText) {
                                appendToInput(plainText);
                            }
                        }
                        
                        // Handle image data
                        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                            const imageBlob = await item.getType(item.types.find(type => type.startsWith('image/')));
                            const imageUrl = URL.createObjectURL(imageBlob);
                            
                            // Add image reference to input (you can customize this format)
                            const imageText = `[Image: ${imageUrl}]`;
                            appendToInput(imageText);
                            
                            // Clean up the URL after a delay
                            setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
                        }
                    }
                } else if (navigator.clipboard?.readText) {
                    // Fallback to text-only for older browsers
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        appendToInput(text);
                    }
                }
            } catch (error) {
                console.log('Enhanced paste failed:', error);
                // Fallback to basic text paste
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        appendToInput(text);
                    }
                } catch (fallbackError) {
                    console.log('Fallback paste also failed:', fallbackError);
                }
            }
        }

        // Helper function to append content to input
        function appendToInput(content) {
            const hadText = messageInput.value.length > 0;
            messageInput.value += (hadText ? '\n' : '') + content;
            autoResize();
            updateSendButton();
        }

        // Future: Search handler (commented out)
        /*
        function handleSearch() {
            if (window.chatInputAPI?.openSearch) {
                window.chatInputAPI.openSearch();
            } else {
                // Visual feedback
                searchButton.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)' },
                    { transform: 'scale(1)' }
                ], { duration: 150, easing: 'ease-out' });
            }
        }
        */

        // Future: More actions handler (commented out)
        /*
        function handleMore() {
            if (window.chatInputAPI?.openMoreActions) {
                window.chatInputAPI.openMoreActions();
            } else {
                // Visual feedback
                moreButton.animate([
                    { transform: 'rotate(0deg)' },
                    { transform: 'rotate(90deg)' },
                    { transform: 'rotate(0deg)' }
                ], { duration: 200, easing: 'ease-out' });
            }
        }
        */

        // Event listeners
        messageInput.addEventListener('input', () => {
            autoResize();
            updateSendButton();
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            } else if (e.key === 'Escape') {
                messageInput.blur();
            } else if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault();
                toggleWindowVisibility();
            } else if (e.key === 'm' && e.ctrlKey) {
                e.preventDefault();
                toggleMainWindow();
            }
        });

        // Button event listeners
        sendButton.addEventListener('click', sendMessage);
        addButton.addEventListener('click', handleAdd);
        lightingButton.addEventListener('click', toggleLighting);
        hideShowButton.addEventListener('click', toggleWindowVisibility);
        toggleMainWindowButton.addEventListener('click', toggleMainWindow);

        // Dropdown interactions
        attachmentDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('.dropdown-item');
            if (!button) return;
            const action = button.getAttribute('data-action');
            if (action) {
                handleAttachmentAction(action);
            }
        });

        // Reposition on resize to stay anchored near the button
        window.addEventListener('resize', () => {
            if (attachmentDropdown.classList.contains('open')) {
                positionAttachmentMenu();
                ensureDropdownVisibleByExpandingWindow();
            }
        });

        // Dismiss dropdown on outside click or Escape
        document.addEventListener('mousedown', (e) => {
            if (!attachmentDropdown.classList.contains('open')) return;
            if (e.target === addButton || addButton.contains(e.target)) return;
            if (!attachmentDropdown.contains(e.target)) {
                closeAttachmentMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && attachmentDropdown.classList.contains('open')) {
                closeAttachmentMenu();
                addButton.focus();
            }
        });

        // Future button listeners (commented out)
        // micButton.addEventListener('click', toggleRecording);
        // searchButton.addEventListener('click', handleSearch);
        // moreButton.addEventListener('click', handleMore);

        // IPC listeners using the exposed API
        if (window.chatInputAPI) {
            window.chatInputAPI.onClearInput(() => {
                messageInput.value = '';
                autoResize();
                resetSendingState();
                messageInput.focus();
            });

            window.chatInputAPI.onFocusInput(() => {
                messageInput.focus();
            });
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            messageInput.focus();
            autoResize();
            updateSendButton();
        });

        // Handle window focus
        window.addEventListener('focus', () => {
            messageInput.focus();
        });

        // Auto-focus on keypress and global shortcuts
        document.addEventListener('keydown', (e) => {
            // Global shortcut for hide/show
            if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault();
                toggleWindowVisibility();
                return;
            }

            // Global shortcut for toggle main window
            if (e.key === 'm' && e.ctrlKey) {
                e.preventDefault();
                toggleMainWindow();
                return;
            }

            // Auto-focus on typing
            if (document.activeElement !== messageInput &&
                !e.ctrlKey && !e.altKey && !e.metaKey &&
                e.key.length === 1 &&
                /^[a-zA-Z0-9\s]$/.test(e.key)) {
                messageInput.focus();
            }
        });

        // Handle paste events
        messageInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                autoResize();
                updateSendButton();
            }, 0);
        });

        // Global paste event listener for Ctrl+V
        document.addEventListener('paste', (e) => {
            // Only handle paste if the input is focused or no specific element is focused
            if (document.activeElement === messageInput || document.activeElement === document.body) {
                e.preventDefault();
                handlePasteContent();
            }
        });

        // Enhanced paste event listener for the textarea
        messageInput.addEventListener('paste', (e) => {
            // Let the global handler take care of it
            setTimeout(() => {
                autoResize();
                updateSendButton();
            }, 0);
        });

        // Drag functionality
        function initDragHandling() {
            let startX, startY;
            let lastMoveTime = 0;
            let draggedElement = null;

            // Function to start dragging
            function startDrag(e, element) {
                // Don't start drag if clicking on buttons
                if (e.target.closest('.action-btn')) {
                    return false;
                }

                isDragging = true;
                draggedElement = element;
                startX = e.screenX;
                startY = e.screenY;
                
                element.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                return true;
            }

            // Add drag listeners to multiple elements
            const draggableElements = [dragHandle, promptActions, leftActions, rightActions, draggableArea];
            
            draggableElements.forEach(element => {
                if (element) {
                    element.addEventListener('mousedown', (e) => {
                        startDrag(e, element);
                    });
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging || !draggedElement) return;
                
                // Throttle move events for better performance
                const now = Date.now();
                if (now - lastMoveTime < 16) return; // ~60fps
                lastMoveTime = now;
                
                const deltaX = e.screenX - startX;
                const deltaY = e.screenY - startY;
                
                if (window.chatInputAPI?.setWindowPosition) {
                    window.chatInputAPI.setWindowPosition(deltaX, deltaY);
                }
                
                // Update start position for next move
                startX = e.screenX;
                startY = e.screenY;
                
                e.preventDefault();
            });

            document.addEventListener('mouseup', () => {
                if (isDragging && draggedElement) {
                    isDragging = false;
                    draggedElement.style.cursor = 'move';
                    document.body.style.userSelect = '';
                    draggedElement = null;
                }
            });

            // Handle drag leaving window
            document.addEventListener('mouseleave', () => {
                if (isDragging && draggedElement) {
                    isDragging = false;
                    draggedElement.style.cursor = 'move';
                    document.body.style.userSelect = '';
                    draggedElement = null;
                }
            });
        }

        // Initialize drag handling
        initDragHandling();
    