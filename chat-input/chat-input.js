
        // DOM Elements
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const collapseButton = document.getElementById('collapseButton');
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
        
        // Image attachment elements
        const attachmentsSection = document.getElementById('attachmentsSection');
        const attachmentsGrid = document.getElementById('attachmentsGrid');
        const clearAllButton = document.getElementById('clearAllAttachments');

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
        
        // Image attachments state
        let imageAttachments = [];
        let attachmentIdCounter = 0;

        // === IMAGE ATTACHMENT FUNCTIONS ===
        
        // Add image attachment to state and UI
        function addImageAttachment(imageData) {
            const attachment = {
                id: `attachment_${++attachmentIdCounter}`,
                name: imageData.name,
                type: imageData.type,
                size: imageData.size,
                data: imageData.data,
                source: imageData.source || 'upload',
                timestamp: Date.now()
            };
            
            imageAttachments.push(attachment);
            renderImageAttachment(attachment);
            updateAttachmentsVisibility();
            adjustWindowHeight();
            
            return attachment;
        }
        
        // Remove image attachment
        function removeImageAttachment(attachmentId) {
            const index = imageAttachments.findIndex(att => att.id === attachmentId);
            if (index !== -1) {
                imageAttachments.splice(index, 1);
                
                // Remove from DOM
                const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
                if (element) {
                    element.remove();
                }
                
                updateAttachmentsVisibility();
                adjustWindowHeight();
            }
        }
        
        // Clear all attachments
        function clearAllAttachments() {
            imageAttachments = [];
            attachmentsGrid.innerHTML = '';
            updateAttachmentsVisibility();
            adjustWindowHeight();
        }
        
        // Render image attachment in the UI
        function renderImageAttachment(attachment) {
            const attachmentElement = document.createElement('div');
            attachmentElement.className = 'attachment-item';
            attachmentElement.setAttribute('data-attachment-id', attachment.id);
            
            attachmentElement.innerHTML = `
                <img src="${attachment.data}" alt="${attachment.name}" class="attachment-preview" />
                <div class="attachment-info">${attachment.name}</div>
                <button class="attachment-remove" onclick="removeImageAttachment('${attachment.id}')" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
            `;
            
            attachmentsGrid.appendChild(attachmentElement);
        }
        
        // Show loading attachment placeholder
        function showAttachmentLoading() {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'attachment-loading';
            loadingElement.id = 'attachment-loading';
            attachmentsGrid.appendChild(loadingElement);
            updateAttachmentsVisibility();
            adjustWindowHeight();
            return loadingElement;
        }
        
        // Remove loading placeholder
        function hideAttachmentLoading() {
            const loadingElement = document.getElementById('attachment-loading');
            if (loadingElement) {
                loadingElement.remove();
                updateAttachmentsVisibility();
                adjustWindowHeight();
            }
        }
        
        // Update attachments section visibility
        function updateAttachmentsVisibility() {
            const hasAttachments = imageAttachments.length > 0 || document.getElementById('attachment-loading');
            attachmentsSection.style.display = hasAttachments ? 'block' : 'none';
        }
        
        // Handle file upload
        async function handleImageUpload() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.chatInputAPI.openImagePicker();
                
                hideAttachmentLoading();
                
                if (result.success && result.file) {
                    addImageAttachment(result.file);
                } else if (!result.canceled) {
                    console.error('Failed to upload image:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error uploading image:', error);
            }
        }
        
        // Handle desktop capture
        async function handleDesktopCapture() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.chatInputAPI.captureDesktop();
                
                hideAttachmentLoading();
                
                if (result.success && result.image) {
                    addImageAttachment(result.image);
                } else {
                    console.error('Failed to capture desktop:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error capturing desktop:', error);
            }
        }
        
        // Handle paste image from clipboard
        async function handleImagePaste(items) {
            for (const item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    try {
                        const loading = showAttachmentLoading();
                        
                        const imageType = item.types.find(type => type.startsWith('image/'));
                        const imageBlob = await item.getType(imageType);
                        
                        // Convert blob to base64
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            hideAttachmentLoading();
                            
                            const imageData = {
                                name: `pasted-image-${Date.now()}.${imageType.split('/')[1]}`,
                                type: imageType,
                                size: imageBlob.size,
                                data: e.target.result,
                                source: 'paste'
                            };
                            
                            addImageAttachment(imageData);
                        };
                        reader.readAsDataURL(imageBlob);
                        
                    } catch (error) {
                        hideAttachmentLoading();
                        console.error('Error processing pasted image:', error);
                    }
                }
            }
        }

        // Expand/Collapse UI functions
        function expandUI() {
            const promptInputContainer = document.querySelector('.prompt-input');
            promptInputContainer.classList.add('expanded');
            requestAnimationFrame(() => {
                adjustWindowHeight();
            });
        }

        function collapseUI() {
            const promptInputContainer = document.querySelector('.prompt-input');
            promptInputContainer.classList.remove('expanded');
            
            // Clear the input content
            messageInput.value = '';
            
            // Reset textarea height to single line
            messageInput.style.height = 'auto';
            const singleLineHeight = messageInput.scrollHeight;
            messageInput.style.height = singleLineHeight + 'px';
            
            // Update send button state since input is now empty
            updateSendButton();
            
            requestAnimationFrame(() => {
                adjustWindowHeight();
            });
        }

        // Event listeners for expand/collapse
        messageInput.addEventListener('dblclick', () => {
            expandUI();
        });
        
        collapseButton.addEventListener('click', () => {
            collapseUI();
        });
        
        
        // --- FINAL & CORRECTED CODE FOR "EXPAND ON NEW LINE" --- //

        const promptInputContainer = document.querySelector('.prompt-input');

        // This single event listener handles everything now.
        messageInput.addEventListener('input', () => {
            // 1. Get the height of the textarea *before* we ask it to resize.
            const oldHeight = messageInput.clientHeight;

            // 2. Run the existing auto-resize function. This is crucial as it will
            //    calculate if a new line is needed and adjust the element's height property.
            autoResize();

            // 3. Get the height *after* the resize has been calculated.
            const newHeight = messageInput.clientHeight;

            // 4. Check if the UI is currently in its compact state.
            const isCollapsed = !promptInputContainer.classList.contains('expanded');


            // --- Expansion Logic ---
            // If the height grew AND the UI is currently collapsed, then expand.
            if (newHeight > oldHeight && isCollapsed) {
                promptInputContainer.classList.add('expanded');
                requestAnimationFrame(() => {
                    adjustWindowHeight();
                });
            }

            // --- Collapse Logic ---
            // If the height shrank AND the UI is currently expanded, then collapse.
            // This happens when the user deletes text, going from two lines back to one.
            
        });   
        
            
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
            const hasAttachments = imageAttachments.length > 0;
            sendButton.disabled = (!hasText && !hasAttachments) || isSending;

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
            const hasAttachments = imageAttachments.length > 0;
            
            if ((!message && !hasAttachments) || isSending) return;

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
                const messageData = {
                    content: message,
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString(),
                    type: hasAttachments ? 'mixed' : 'text',
                    attachments: imageAttachments.map(att => ({
                        id: att.id,
                        name: att.name,
                        type: att.type,
                        size: att.size,
                        data: att.data,
                        source: att.source
                    }))
                };
                
                window.chatInputAPI.sendMessage(messageData);

                // Clear input and attachments immediately for better UX
                messageInput.value = '';
                clearAllAttachments();
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
                case 'upload-image':
                    handleImageUpload();
                    break;
                case 'capture-desktop':
                    handleDesktopCapture();
                    break;
                case 'paste':
                    handlePasteContent();
                    break;
                case 'clear':
                    messageInput.value = '';
                    clearAllAttachments();
                    autoResize();
                    updateSendButton();
                    break;
                default:
                    console.log(`Action not implemented: ${action}`);
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
                    
                    // First handle images
                    await handleImagePaste(clipboardItems);
                    
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
        clearAllButton.addEventListener('click', clearAllAttachments);

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
        
        // Make removeImageAttachment available globally
        window.removeImageAttachment = removeImageAttachment;
        
        // === DRAG & DROP IMAGE FUNCTIONALITY ===
        let dragCounter = 0;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            promptInput.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            promptInput.addEventListener(eventName, handleDragEnter, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            promptInput.addEventListener(eventName, handleDragLeave, false);
        });
        
        // Handle dropped files
        promptInput.addEventListener('drop', handleDrop, false);
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function handleDragEnter(e) {
            dragCounter++;
            if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                promptInput.classList.add('drag-over');
            }
        }
        
        function handleDragLeave(e) {
            dragCounter--;
            if (dragCounter <= 0) {
                promptInput.classList.remove('drag-over');
                dragCounter = 0;
            }
        }
        
        async function handleDrop(e) {
            dragCounter = 0;
            promptInput.classList.remove('drag-over');
            
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                await handleDroppedFiles(files);
            }
        }
        
        async function handleDroppedFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Check if it's an image
                if (file.type.startsWith('image/')) {
                    try {
                        const loading = showAttachmentLoading();
                        
                        // Read file as base64
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            hideAttachmentLoading();
                            
                            const imageData = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: e.target.result,
                                source: 'drag-drop'
                            };
                            
                            addImageAttachment(imageData);
                        };
                        reader.readAsDataURL(file);
                        
                    } catch (error) {
                        hideAttachmentLoading();
                        console.error('Error processing dropped file:', error);
                    }
                }
            }
        }
    