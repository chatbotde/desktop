
        // DOM Elements
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const expandButton = document.getElementById('expandButton');
        const collapseButton = document.getElementById('collapseButton');
        const sendIcon = document.getElementById('sendIcon');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const typingIndicator = document.getElementById('typingIndicator');
        const uploadButton = document.getElementById('uploadButton');
        const captureButton = document.getElementById('captureButton');
        const lightingButton = document.getElementById('lightingButton');
        const themeToggleButton = document.getElementById('themeToggleButton');
        const hideShowButton = document.getElementById('hideShowButton');
        const toggleMainWindowButton = document.getElementById('toggleMainWindowButton');
        const promptInput = document.querySelector('.prompt-input');
        const dragHandle = document.querySelector('.drag-handle');
        const promptActions = document.querySelector('.prompt-actions');
        const leftActions = document.querySelector('.left-actions');
        const rightActions = document.querySelector('.right-actions');
        const draggableArea = document.querySelector('.draggable-area');
        const uploadDropdown = document.getElementById('uploadDropdown');
        const captureDropdown = document.getElementById('captureDropdown');
        const modelSelectButton = document.getElementById('modelSelectButton');
        const modelSelectDropdown = document.getElementById('modelSelectDropdown');
        const chatInputContainer = document.querySelector('.chat-input-container');
        const contentProtectionButton = document.getElementById('contentProtectionButton');
        const plusButton = document.getElementById('plusButton');
        const expandedPlusButton = document.getElementById('expandedPlusButton');
        const plusActionsDropdown = document.getElementById('plusActionsDropdown');
        
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
        let isRecording = false;
        let currentRecordingType = null;
        let currentTheme = 'dark'; // 'dark' or 'paper'
        let contentProtectionEnabled = true; // Content protection state
        // let recording = false; // Future voice recording state
        
        // Drag state
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        // Container drag state
        let isContainerDragging = false;
        let containerDragOffset = { x: 0, y: 0 };
        
        // Image attachments state
        let imageAttachments = [];
        let attachmentIdCounter = 0;
        
        // Media attachments state (enhanced)
        let mediaAttachments = [];
        let recordingStartTime = 0;
        
        // Model selection state
        let selectedModel = 'gemini-2.5-flash'; // Default model
        let availableModels = {
            'gemini-2.0-flash-exp': {
                name: 'Gemini 2.0 Flash (Experimental)',
                description: 'Latest experimental model with improved performance',
                provider: 'Google',
                cost: '$0.075/1K tokens',
                features: ['📷 Images', '🎵 Audio', '🎬 Video']
            },
            'gemini-2.5-flash': {
                name: 'Gemini 2.5 Flash',
                description: 'Advanced flash model with enhanced capabilities',
                provider: 'Google',
                cost: '$0.075/1K tokens',
                features: ['📷 Images', '🎵 Audio', '🎬 Video']
            },
            'gemini-1.5-flash': {
                name: 'Gemini 1.5 Flash',
                description: 'Fast and efficient multimodal model',
                provider: 'Google',
                cost: '$0.075/1K tokens',
                features: ['📷 Images', '🎵 Audio', '🎬 Video']
            },
            'gemini-1.5-pro': {
                name: 'Gemini 1.5 Pro',
                description: 'Most capable multimodal model for complex reasoning',
                provider: 'Google',
                cost: '$3.50/1K tokens',
                features: ['📷 Images', '🎵 Audio', '🎬 Video']
            }
        };

        // === CONTENT PROTECTION MANAGEMENT ===
        
        function initializeContentProtection() {
            // Load initial content protection state
            if (window.chatInputAPI?.getContentProtection) {
                window.chatInputAPI.getContentProtection().then(enabled => {
                    contentProtectionEnabled = enabled;
                    updateContentProtectionButton();
                });
            }
            
            // Content protection button
            if (contentProtectionButton) {
                contentProtectionButton.addEventListener('click', () => {
                    toggleContentProtection();
                });
            }
        }
        
        function toggleContentProtection() {
            if (window.chatInputAPI?.toggleContentProtection) {
                window.chatInputAPI.toggleContentProtection().then(enabled => {
                    contentProtectionEnabled = enabled;
                    updateContentProtectionButton();
                    console.log(`Content protection ${enabled ? 'enabled' : 'disabled'}`);
                }).catch(error => {
                    console.error('Failed to toggle content protection:', error);
                });
            }
        }
        
        function updateContentProtectionButton() {
            if (contentProtectionButton) {
                if (contentProtectionEnabled) {
                    contentProtectionButton.classList.add('active');
                    contentProtectionButton.title = 'Content protection enabled - click to disable';
                } else {
                    contentProtectionButton.classList.remove('active');
                    contentProtectionButton.title = 'Content protection disabled - click to enable';
                }
            }
        }

        // === THEME MANAGEMENT ===
        
        // Toggle between dark and paper themes
        function toggleTheme() {
            currentTheme = currentTheme === 'dark' ? 'paper' : 'dark';
            
            if (currentTheme === 'paper') {
                document.documentElement.setAttribute('data-theme', 'paper');
                themeToggleButton.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                `;
                themeToggleButton.title = 'Switch to Dark Theme';
            } else {
                document.documentElement.removeAttribute('data-theme');
                themeToggleButton.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"/>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                `;
                themeToggleButton.title = 'Switch to Paper Theme';
            }
            
            // Save theme preference to localStorage
            localStorage.setItem('chatInputTheme', currentTheme);
        }

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
            
            // Delay height adjustment to allow DOM to settle
            setTimeout(() => {
                adjustWindowHeight();
            }, 100);
            
            return attachment;
        }
        
        // Remove image attachment
        function removeImageAttachment(attachmentId) {
            const index = imageAttachments.findIndex(att => att.id === attachmentId);
            if (index !== -1) {
                imageAttachments.splice(index, 1);
                
                // Remove from DOM with smooth transition
                const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
                if (element) {
                    element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    element.style.opacity = '0';
                    element.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        element.remove();
                        updateAttachmentsVisibility();
                        adjustWindowHeight();
                    }, 150);
                } else {
                    updateAttachmentsVisibility();
                    adjustWindowHeight();
                }
            }
        }
        
        // Clear all attachments
        function clearAllAttachments() {
            clearAllMediaAttachments();
        }
        
        // Render image attachment in the UI
        function renderImageAttachment(attachment) {
            const attachmentElement = document.createElement('div');
            attachmentElement.className = 'attachment-item';
            attachmentElement.setAttribute('data-attachment-id', attachment.id);
            
            // Start with invisible state for smooth entrance
            attachmentElement.style.opacity = '0';
            attachmentElement.style.transform = 'scale(0.8)';
            
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
            
            // Smooth entrance animation
            requestAnimationFrame(() => {
                attachmentElement.style.opacity = '1';
                attachmentElement.style.transform = 'scale(1)';
            });
        }
        
        // Show loading attachment placeholder
        function showAttachmentLoading() {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'attachment-loading';
            loadingElement.id = 'attachment-loading';
            loadingElement.style.opacity = '0';
            loadingElement.style.transform = 'scale(0.8)';
            
            attachmentsGrid.appendChild(loadingElement);
            updateAttachmentsVisibility();
            
            // Smooth entrance animation
            requestAnimationFrame(() => {
                loadingElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                loadingElement.style.opacity = '1';
                loadingElement.style.transform = 'scale(1)';
            });
            
            // Delay height adjustment to allow smooth transition
            setTimeout(() => {
                adjustWindowHeight();
            }, 100);
            
            return loadingElement;
        }
        
        // Remove loading placeholder
        function hideAttachmentLoading() {
            const loadingElement = document.getElementById('attachment-loading');
            if (loadingElement) {
                loadingElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                loadingElement.style.opacity = '0';
                loadingElement.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    loadingElement.remove();
                    updateAttachmentsVisibility();
                    adjustWindowHeight();
                }, 200);
            }
        }
        
        // Update attachments section visibility with smooth transition
        function updateAttachmentsVisibility() {
            const hasAttachments = imageAttachments.length > 0 || mediaAttachments.length > 0 || document.getElementById('attachment-loading');
            const promptInputContainer = document.querySelector('.prompt-input');
            const isExpanded = promptInputContainer.classList.contains('expanded');
            
            // Only show attachments if expanded or if there are attachments and we're not in compact mode
            if (hasAttachments && isExpanded) {
                if (attachmentsSection.style.display === 'none') {
                    attachmentsSection.style.display = 'block';
                    attachmentsSection.style.opacity = '0';
                    attachmentsSection.style.maxHeight = '0px';
                    
                    requestAnimationFrame(() => {
                        attachmentsSection.style.opacity = '1';
                        attachmentsSection.style.maxHeight = '300px'; // Max height for attachments
                    });
                }
            } else {
                attachmentsSection.style.opacity = '0';
                attachmentsSection.style.maxHeight = '0px';
                
                setTimeout(() => {
                    if (imageAttachments.length === 0 && mediaAttachments.length === 0 && !document.getElementById('attachment-loading')) {
                        attachmentsSection.style.display = 'none';
                    }
                }, 300); // Match CSS transition duration
            }
        }
        
        // Handle image file upload
        async function handleImageUpload() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.chatInputAPI.openFilePicker(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']);
                
                hideAttachmentLoading();
                
                if (result.success && result.files && result.files.length > 0) {
                    // Handle multiple files
                    for (const file of result.files) {
                        addImageAttachment({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: file.data,
                            source: 'upload'
                        });
                    }
                } else if (result.success && result.file) {
                    // Handle single file (legacy support)
                    addImageAttachment({
                        name: result.file.name,
                        type: result.file.type,
                        size: result.file.size,
                        data: result.file.data,
                        source: 'upload'
                    });
                } else if (!result.canceled) {
                    console.error('Failed to upload image:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error uploading image:', error);
            }
        }
        
        // Handle desktop capture (screenshot only)
        async function handleDesktopCapture() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.CaptureAPI.quickScreenshot();
                
                hideAttachmentLoading();
                
                if (result.success && result.screenshot) {
                    addImageAttachment({
                        name: result.screenshot.name,
                        type: result.screenshot.type,
                        size: result.screenshot.size,
                        data: result.screenshot.data,
                        source: 'screenshot'
                    });
                } else {
                    console.error('Failed to take screenshot:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error in desktop capture:', error);
            }
        }

        // Handle audio capture
        async function handleAudioCapture() {
            try {
                if (isRecording && currentRecordingType === 'audio') {
                    // Stop recording
                    const result = await stopCurrentRecording();
                    if (result.success) {
                        console.log('Audio recording stopped successfully');
                    }
                } else if (!isRecording) {
                    // Start recording
                    showRecordingState('audio');
                    
                    if (window.rendererCaptureAPI) {
                        const result = await window.rendererCaptureAPI.startAudioRecording({
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        });
                        
                        if (result.success) {
                            isRecording = true;
                            currentRecordingType = 'audio';
                            recordingStartTime = Date.now();
                            window.currentAudioRecordingId = result.recordingId;
                        } else {
                            hideRecordingState();
                            console.error('Failed to start audio recording:', result.error);
                        }
                    } else {
                        hideRecordingState();
                        console.error('Renderer capture API not available');
                    }
                }
            } catch (error) {
                hideRecordingState();
                console.error('Error in audio capture:', error);
            }
        }


        
        // Handle video file upload
        async function handleVideoUpload() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.chatInputAPI.openFilePicker(['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv', '3gp', 'm4v']);
                
                hideAttachmentLoading();
                
                if (result.success && result.files && result.files.length > 0) {
                    // Handle multiple files
                    for (const file of result.files) {
                        const mediaFile = {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: file.data,
                            mediaType: file.type.startsWith('video/') ? 'video' : 'audio',
                            source: 'upload',
                            timestamp: Date.now()
                        };
                        addMediaAttachment(mediaFile);
                    }
                } else if (!result.canceled) {
                    console.error('Failed to upload video:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error uploading video:', error);
            }
        }
        
        // Handle audio file upload
        async function handleAudioUpload() {
            try {
                const loading = showAttachmentLoading();
                
                const result = await window.chatInputAPI.openFilePicker(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus']);
                
                hideAttachmentLoading();
                
                if (result.success && result.files && result.files.length > 0) {
                    // Handle multiple files
                    for (const file of result.files) {
                        const mediaFile = {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: file.data,
                            mediaType: file.type.startsWith('audio/') ? 'audio' : 'video',
                            source: 'upload',
                            timestamp: Date.now()
                        };
                        addMediaAttachment(mediaFile);
                    }
                } else if (!result.canceled) {
                    console.error('Failed to upload audio:', result.error);
                }
            } catch (error) {
                hideAttachmentLoading();
                console.error('Error uploading audio:', error);
            }
        }
        
        // Handle video capture (webcam/screen recording)
        async function handleVideoCapture() {
            try {
                if (isRecording && currentRecordingType === 'video') {
                    // Stop recording
                    const result = await stopCurrentRecording();
                    if (result.success) {
                        console.log('Video recording stopped successfully');
                    }
                } else if (!isRecording) {
                    // Start recording
                    showRecordingState('video');
                    
                    if (window.rendererCaptureAPI) {
                        // For video capture, we can use screen recording or webcam
                        const result = await window.rendererCaptureAPI.startScreenRecording({
                            quality: 'medium',
                            includeAudio: true // Include audio for video recording
                        });
                        
                        if (result.success) {
                            isRecording = true;
                            currentRecordingType = 'video';
                            recordingStartTime = Date.now();
                            window.currentVideoRecordingId = result.recordingId;
                        } else {
                            hideRecordingState();
                            console.error('Failed to start video recording:', result.error);
                        }
                    } else {
                        hideRecordingState();
                        console.error('Renderer capture API not available');
                    }
                }
            } catch (error) {
                hideRecordingState();
                console.error('Error in video capture:', error);
            }
        }
        
        // === ENHANCED MEDIA ATTACHMENT FUNCTIONS ===
        
        // Add media attachment (handles all media types)
        function addMediaAttachment(mediaFile) {
            console.log('Adding media attachment:', {
                name: mediaFile.name,
                type: mediaFile.type,
                mediaType: mediaFile.mediaType,
                size: mediaFile.size
            });
            
            const attachment = {
                id: `media_${++attachmentIdCounter}`,
                name: mediaFile.name,
                type: mediaFile.type,
                size: mediaFile.size,
                data: mediaFile.data,
                mediaType: mediaFile.mediaType,
                source: mediaFile.source || 'upload',
                timestamp: Date.now(),
                duration: mediaFile.duration,
                dimensions: mediaFile.dimensions
            };
            
            // Debug video data URL immediately
            if (attachment.mediaType === window.MediaUtils.MediaType.VIDEO) {
                debugVideoDataUrl(attachment);
            }
            
            // Add to appropriate collection
            if (attachment.mediaType === window.MediaUtils.MediaType.IMAGE) {
                console.log('Adding as image attachment');
                imageAttachments.push(attachment);
                renderImageAttachment(attachment);
            } else {
                console.log('Adding as media attachment, type:', attachment.mediaType);
                mediaAttachments.push(attachment);
                renderMediaAttachment(attachment);
            }
            
            updateAttachmentsVisibility();
            
            // Delay height adjustment to allow DOM to settle
            setTimeout(() => {
                adjustWindowHeight();
            }, 100);
            
            return attachment;
        }
        
        // Debug function to test video data URL
        function debugVideoDataUrl(attachment) {
            console.log('🔍 Debugging video data URL for:', attachment.name);
            
            // Create a test video element to validate the data
            const testVideo = document.createElement('video');
            testVideo.style.display = 'none';
            testVideo.muted = true;
            
            testVideo.onloadedmetadata = () => {
                console.log('✅ Video data URL is valid:', {
                    width: testVideo.videoWidth,
                    height: testVideo.videoHeight,
                    duration: testVideo.duration,
                    readyState: testVideo.readyState
                });
                document.body.removeChild(testVideo);
            };
            
            testVideo.onerror = (error) => {
                console.error('❌ Video data URL validation failed:', {
                    error: testVideo.error,
                    networkState: testVideo.networkState,
                    readyState: testVideo.readyState
                });
                document.body.removeChild(testVideo);
            };
            
            document.body.appendChild(testVideo);
            testVideo.src = attachment.data;
        }
        
        // Render media attachment (audio/video) in the UI
        function renderMediaAttachment(attachment) {
            console.log('Rendering media attachment:', attachment);
            
            const attachmentElement = document.createElement('div');
            attachmentElement.className = 'attachment-item media-attachment';
            attachmentElement.setAttribute('data-attachment-id', attachment.id);
            
            // Start with invisible state for smooth entrance
            attachmentElement.style.opacity = '0';
            attachmentElement.style.transform = 'scale(0.8)';
            
            let mediaPreview = '';
            let mediaIcon = '';
            
            if (attachment.mediaType === window.MediaUtils.MediaType.AUDIO) {
                console.log('Rendering audio attachment');
                mediaIcon = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                `;
                mediaPreview = `
                    <div class="audio-preview">
                        <div class="media-icon">${mediaIcon}</div>
                        <audio controls preload="metadata" style="width: 100%;">
                            <source src="${attachment.data}" type="${attachment.type}">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                `;
            } else if (attachment.mediaType === window.MediaUtils.MediaType.VIDEO) {
                console.log('Rendering video attachment:', {
                    name: attachment.name,
                    type: attachment.type,
                    size: attachment.size,
                    dataLength: attachment.data?.length || 0,
                    dataPrefix: attachment.data?.substring(0, 50) || 'no data'
                });
                
                // Validate video data URL
                const isValidDataUrl = attachment.data && attachment.data.startsWith('data:') && attachment.data.includes('base64,');
                console.log('Video data URL validation:', {
                    isValid: isValidDataUrl,
                    startsWithData: attachment.data?.startsWith('data:'),
                    hasBase64: attachment.data?.includes('base64,'),
                    actualType: attachment.type
                });
                
                mediaIcon = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>
                        <path d="m22 7-6 4 6 4z"/>
                    </svg>
                `;
                
                const videoId = `video_${attachment.id}`;
                mediaPreview = `
                    <div class="video-preview" style="position: relative;">
                        <div class="media-icon">${mediaIcon}</div>
                        <video 
                            id="${videoId}"
                            controls 
                            preload="metadata"
                            muted
                            playsinline
                            webkit-playsinline
                            crossorigin="anonymous"
                            style="width: 100%; max-height: 200px; min-height: 120px; background: #000; display: block !important; visibility: visible !important; object-fit: contain; border-radius: 8px;" 
                            onloadstart="console.log('🎬 Video ${videoId} loadstart - src:', this.src?.substring(0, 50) + '...');"
                            onprogress="console.log('🎬 Video ${videoId} loading progress');"
                            onloadedmetadata="console.log('🎬 Video ${videoId} metadata loaded - Dimensions:', this.videoWidth + 'x' + this.videoHeight, 'Duration:', this.duration + 's', 'Ready state:', this.readyState); this.style.border = '2px solid green';"
                            onloadeddata="console.log('🎬 Video ${videoId} data loaded - Ready to play, buffered ranges:', this.buffered.length); this.style.background = '#111';"
                            oncanplay="console.log('🎬 Video ${videoId} can play - Ready state:', this.readyState); this.style.background = 'transparent'; this.style.border = '2px solid blue';"
                            oncanplaythrough="console.log('🎬 Video ${videoId} can play through completely'); this.style.border = '1px solid var(--border)';"
                            onplay="console.log('🎬 Video ${videoId} started playing');"
                            onwaiting="console.log('🎬 Video ${videoId} waiting for data');"
                            onerror="console.error('❌ Video ${videoId} error - Code:', this.error?.code, 'Message:', this.error?.message, 'Network state:', this.networkState, 'Ready state:', this.readyState); this.style.background = '#333'; this.style.border = '2px solid red'; document.getElementById('${videoId}_error').style.display = 'block';"
                            onstalled="console.warn('⚠️ Video ${videoId} stalled - Network state:', this.networkState);"
                            onsuspend="console.warn('⚠️ Video ${videoId} suspended');"
                            onabort="console.warn('⚠️ Video ${videoId} aborted');"
                            onemptied="console.warn('⚠️ Video ${videoId} emptied');"
                        >
                            <source src="${attachment.data}" type="${attachment.type}">
                            Your browser does not support the video element.
                        </video>
                        <div id="${videoId}_error" class="video-error" style="display: none; padding: 8px; background: #d32f2f; color: #fff; text-align: center; border-radius: 4px; margin-top: 4px; font-size: 11px;">
                            ❌ Video cannot be displayed. This may be due to codec incompatibility or corrupted data.
                        </div>
                        <div class="video-info" style="padding: 4px 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; position: absolute; bottom: 4px; left: 4px; border-radius: 3px;">
                            Video: ${attachment.type} • ${window.MediaUtils.formatFileSize(attachment.size)}
                        </div>
                        <div class="video-debug" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.8); color: #fff; font-size: 9px; padding: 2px 4px; border-radius: 2px; font-family: monospace;">
                            ${attachment.dimensions ? `${attachment.dimensions.width}×${attachment.dimensions.height}` : 'Unknown'}
                        </div>
                    </div>
                `;
            }
            
            const durationText = attachment.duration ? ` (${formatDuration(attachment.duration)})` : '';
            const sizeText = window.MediaUtils.formatFileSize(attachment.size);
            
            attachmentElement.innerHTML = `
                ${mediaPreview}
                <div class="attachment-info">
                    <div class="attachment-name">${attachment.name}</div>
                    <div class="attachment-meta">${sizeText}${durationText}</div>
                </div>
                <button class="attachment-remove" onclick="removeMediaAttachment('${attachment.id}')" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
            `;
            
            attachmentsGrid.appendChild(attachmentElement);
            
            // Smooth entrance animation
            requestAnimationFrame(() => {
                attachmentElement.style.opacity = '1';
                attachmentElement.style.transform = 'scale(1)';
            });
        }
        
        // Remove media attachment
        function removeMediaAttachment(attachmentId) {
            // Try to find in media attachments first
            let index = mediaAttachments.findIndex(att => att.id === attachmentId);
            if (index !== -1) {
                mediaAttachments.splice(index, 1);
            } else {
                // Fallback to image attachments
                index = imageAttachments.findIndex(att => att.id === attachmentId);
                if (index !== -1) {
                    imageAttachments.splice(index, 1);
                }
            }
            
            // Remove from DOM with smooth transition
            const element = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
            if (element) {
                element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                element.style.opacity = '0';
                element.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    element.remove();
                    updateAttachmentsVisibility();
                    adjustWindowHeight();
                }, 200);
            } else {
                updateAttachmentsVisibility();
                adjustWindowHeight();
            }
        }
        
        // Clear all media attachments
        function clearAllMediaAttachments() {
            imageAttachments = [];
            mediaAttachments = [];
            attachmentsGrid.innerHTML = '';
            updateAttachmentsVisibility();
            adjustWindowHeight();
        }
        
        // Format duration in MM:SS format
        function formatDuration(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        // === RECORDING CONTROL FUNCTIONS ===
        
        // Show recording state UI
        function showRecordingState(recordingType) {
            isRecording = true;
            currentRecordingType = recordingType;
            recordingStartTime = Date.now();
            
            // Add recording indicator to the UI
            addRecordingIndicator(recordingType);
            
            // Update button states
            updateRecordingButtons(true);
        }
        
        // Hide recording state UI
        function hideRecordingState() {
            isRecording = false;
            currentRecordingType = null;
            recordingStartTime = 0;
            
            // Remove recording indicator
            removeRecordingIndicator();
            
            // Update button states
            updateRecordingButtons(false);
        }
        
        // Add recording indicator to the UI
        function addRecordingIndicator(recordingType) {
            const existingIndicator = document.getElementById('recording-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            const indicator = document.createElement('div');
            indicator.id = 'recording-indicator';
            indicator.className = 'recording-indicator';
            
            const icon = recordingType === 'audio' ? '🎤' : '🎥';
            const typeText = recordingType === 'audio' ? 'Audio' : 'Video';
            
            indicator.innerHTML = `
                <div class="recording-content">
                    <span class="recording-icon">${icon}</span>
                    <span class="recording-text">${typeText} Recording</span>
                    <span class="recording-timer" id="recording-timer">00:00</span>
                    <button class="recording-stop" onclick="stopCurrentRecording()" title="Stop Recording">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Insert at the top of attachments section or before input
            const targetElement = attachmentsSection.style.display !== 'none' ? attachmentsSection : document.querySelector('.input-area');
            targetElement.parentNode.insertBefore(indicator, targetElement);
            
            // Start timer
            startRecordingTimer();
        }
        
        // Remove recording indicator
        function removeRecordingIndicator() {
            const indicator = document.getElementById('recording-indicator');
            if (indicator) {
                indicator.remove();
            }
            stopRecordingTimer();
        }
        
        // Start recording timer
        function startRecordingTimer() {
            const timerElement = document.getElementById('recording-timer');
            if (!timerElement) return;
            
            const updateTimer = () => {
                if (!isRecording) return;
                
                const elapsed = Date.now() - recordingStartTime;
                const seconds = Math.floor(elapsed / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
                
                setTimeout(updateTimer, 1000);
            };
            
            updateTimer();
        }
        
        // Stop recording timer
        function stopRecordingTimer() {
            // Timer will stop automatically when isRecording becomes false
        }
        
        // Update recording button states
        function updateRecordingButtons(recording) {
            const captureButton = document.getElementById('captureButton');
            if (captureButton) {
                captureButton.classList.toggle('recording', recording);
            }
        }
        
        // Stop current recording
        async function stopCurrentRecording() {
            try {
                let result = { success: false };
                
                if (window.rendererCaptureAPI) {
                    if (window.currentAudioRecordingId) {
                        console.log('Stopping audio recording...');
                        result = await window.rendererCaptureAPI.stopRecording(window.currentAudioRecordingId);
                        
                        if (result.success && result.audio) {
                            addMediaAttachment(result.audio);
                        }
                        window.currentAudioRecordingId = null;
                        
                    } else if (window.currentVideoRecordingId) {
                        console.log('Stopping video recording...');
                        result = await window.rendererCaptureAPI.stopRecording(window.currentVideoRecordingId);
                        
                        if (result.success && result.video) {
                            addMediaAttachment(result.video);
                        }
                        window.currentVideoRecordingId = null;
                    }
                }
                
                hideRecordingState();
                return result;
                
            } catch (error) {
                console.error('Error stopping recording:', error);
                hideRecordingState();
                return { success: false, error: error.message };
            }
        }
        
        // Update volume indicator for audio recording
        function updateVolumeIndicator(volume) {
            const indicator = document.getElementById('recording-indicator');
            if (indicator && currentRecordingType === 'audio') {
                // Add visual volume feedback
                indicator.style.opacity = 0.7 + (volume / 100) * 0.3;
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

        // ==================== ENHANCED EXPANSION/COLLAPSE SYSTEM ====================
        
        // State management for smooth UI transitions
        let isTransitioning = false;
        let expansionState = 'collapsed'; // 'collapsed', 'expanding', 'expanded', 'collapsing'
        let pendingHeightAdjustments = [];
        
        // Enhanced expand function with smooth transitions
        function expandUI() {
            if (isTransitioning || expansionState === 'expanded' || expansionState === 'expanding') {
                return;
            }
            
            isTransitioning = true;
            expansionState = 'expanding';
            
            const promptInputContainer = document.querySelector('.prompt-input');
            const chatInputContainer = document.querySelector('.chat-input-container');
            const attachmentsSection = document.getElementById('attachmentsSection');
            
            // Add expanded class with transition
            promptInputContainer.classList.add('expanded');
            chatInputContainer.classList.add('expanded');
            
            // Show attachments section smoothly if there are attachments
            if ((imageAttachments.length > 0 || mediaAttachments.length > 0)) {
                showAttachmentsSmoothly();
            }
            
            // Auto-resize the textarea when expanding
            autoResize();

            // Smooth window height adjustment with proper timing
            requestAnimationFrame(() => {
                adjustWindowHeightSmooth('expand');
            });
            
            // Update button states
            updateSendButton();
            
            // Mark transition complete after CSS transition duration
            setTimeout(() => {
                isTransitioning = false;
                expansionState = 'expanded';
            }, 300); // Match CSS transition duration
        }

        // Enhanced collapse function with smooth transitions
        function collapseUI() {
            if (isTransitioning || expansionState === 'collapsed' || expansionState === 'collapsing') {
                return;
            }
            
            isTransitioning = true;
            expansionState = 'collapsing';
            
            const promptInputContainer = document.querySelector('.prompt-input');
            const chatInputContainer = document.querySelector('.chat-input-container');
            const attachmentsSection = document.getElementById('attachmentsSection');
            
            // Clear the input content only if there's no text or attachments
            const hasText = messageInput.value.trim().length > 0;
            const hasAttachments = imageAttachments.length > 0 || mediaAttachments.length > 0;
            
            if (!hasText && !hasAttachments) {
                messageInput.value = '';
            }
            
            // Hide attachments section smoothly
            hideAttachmentsSmoothly();
            
            // Reset textarea height to single line with smooth transition
            messageInput.style.height = 'auto';
            const singleLineHeight = 44;
            messageInput.style.height = singleLineHeight + 'px';
            
            // Remove expanded class with transition
            promptInputContainer.classList.remove('expanded');
            chatInputContainer.classList.remove('expanded');
            
            // Smooth window height adjustment
            requestAnimationFrame(() => {
                adjustWindowHeightSmooth('collapse');
            });
            
            // Update button states
            updateSendButton();
            
            // Mark transition complete after CSS transition duration
            setTimeout(() => {
                isTransitioning = false;
                expansionState = 'collapsed';
            }, 300); // Match CSS transition duration
        }
        
        // Smooth attachments show/hide functions
        function showAttachmentsSmoothly() {
            const attachmentsSection = document.getElementById('attachmentsSection');
            if (!attachmentsSection) return;
            
            attachmentsSection.style.display = 'block';
                attachmentsSection.style.opacity = '0';
                attachmentsSection.style.maxHeight = '0px';
            attachmentsSection.style.overflow = 'hidden';
            
            // Force reflow
            attachmentsSection.offsetHeight;
            
            // Animate in
            attachmentsSection.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
            attachmentsSection.style.opacity = '1';
            attachmentsSection.style.maxHeight = '200px'; // Adjust based on content
            
            // Clean up after animation
            setTimeout(() => {
                attachmentsSection.style.transition = '';
                attachmentsSection.style.overflow = '';
                attachmentsSection.style.maxHeight = '';
            }, 300);
        }
        
        function hideAttachmentsSmoothly() {
            const attachmentsSection = document.getElementById('attachmentsSection');
            if (!attachmentsSection || attachmentsSection.style.display === 'none') return;
            
            attachmentsSection.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
            attachmentsSection.style.opacity = '0';
            attachmentsSection.style.maxHeight = '0px';
            attachmentsSection.style.overflow = 'hidden';
            
                setTimeout(() => {
                    attachmentsSection.style.display = 'none';
                attachmentsSection.style.transition = '';
                attachmentsSection.style.overflow = '';
                attachmentsSection.style.maxHeight = '';
                }, 300);
            }
            
        // ==================== DROPDOWN OVERLAY POSITIONING ====================
        
        // Enhanced dropdown positioning for small window - COMPLETELY INDEPENDENT
        function positionDropdownAsOverlay(dropdown, triggerButton) {
            if (!dropdown || !triggerButton) return;
            
            // Force dropdown to be visible first to get accurate measurements
            dropdown.style.visibility = 'hidden';
            dropdown.style.display = 'block';
            
            const buttonRect = triggerButton.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            
            // Get screen dimensions
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            const windowTop = window.screenY;
            const windowLeft = window.screenX;
            
            // Calculate position relative to screen, not window
            let top = windowTop + buttonRect.bottom + 8;
            let left = windowLeft + buttonRect.left;
            
            // Adjust if dropdown would go off screen
            if (top + dropdownRect.height > screenHeight - 20) {
                // Position above the button
                top = windowTop + buttonRect.top - dropdownRect.height - 8;
            }
            
            if (left + dropdownRect.width > screenWidth - 20) {
                // Align to right edge
                left = screenWidth - dropdownRect.width - 20;
            }
            
            if (left < 20) {
                left = 20;
            }
            
            // Apply positioning - use screen coordinates
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${top - windowTop}px`;
            dropdown.style.left = `${left - windowLeft}px`;
            dropdown.style.zIndex = '9999';
            dropdown.style.pointerEvents = 'auto';
            dropdown.style.visibility = 'visible';
            
            // Ensure dropdown doesn't affect window height
            dropdown.style.position = 'fixed';
            dropdown.style.transform = 'translateZ(0)'; // Hardware acceleration
        }
        
        // Enhanced dropdown show function - NO WINDOW HEIGHT CHANGES
        function showDropdown(dropdownId, triggerButton) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            
            // Hide other dropdowns first
            hideAllDropdowns();
            
            // Show the dropdown
            dropdown.style.display = 'block';
            dropdown.setAttribute('aria-hidden', 'false');
            
            // Position as overlay - this will NOT affect window height
            positionDropdownAsOverlay(dropdown, triggerButton);
            
            // Add click outside listener
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 10);
            
            // DO NOT call any window height adjustment functions
            // Dropdowns are completely independent overlays
        }
        
        // Enhanced dropdown hide function
        function hideDropdown(dropdownId) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            
            dropdown.style.display = 'none';
            dropdown.setAttribute('aria-hidden', 'true');
        }
        
        // Hide all dropdowns
        function hideAllDropdowns() {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                hideDropdown(dropdown.id);
            });
        }
        
        // Click outside handler
        function handleClickOutside(event) {
            const dropdowns = document.querySelectorAll('.dropdown-menu:not([aria-hidden="true"])');
            let clickedInsideDropdown = false;
            
            dropdowns.forEach(dropdown => {
                if (dropdown.contains(event.target)) {
                    clickedInsideDropdown = true;
                }
            });
            
            if (!clickedInsideDropdown) {
                hideAllDropdowns();
                document.removeEventListener('click', handleClickOutside);
            }
        }

        // Event listeners for expand/collapse
        messageInput.addEventListener('dblclick', () => {
            expandUI();
        });
        
        collapseButton.addEventListener('click', () => {
            collapseUI();
        });
        
        // Enhanced button event listeners with overlay dropdowns
        expandButton.addEventListener('click', () => {
            expandUI();
        });
        
        uploadButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showUploadDropdownAdvanced(uploadButton);
        });
        
        captureButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showCaptureDropdownAdvanced(captureButton);
        });
        
        modelSelectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showModelSelectorAdvanced(modelSelectButton);
        });
        
        // Plus button functionality - expand the UI
        plusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            expandUI();
        });
        
        // Expanded plus button functionality - show dropdown
        expandedPlusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showPlusActionsDropdown(expandedPlusButton);
        });

        // Plus actions dropdown item clicks
        plusActionsDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            e.stopPropagation();
            const action = button.getAttribute('data-action');
            
            // Hide dropdown first
            hideDropdown('plusActionsDropdown');
            
            // Execute the corresponding action
            switch (action) {
                case 'upload':
                    handleUpload();
                    break;
                case 'capture':
                    handleCapture();
                    break;
                case 'theme':
                    toggleTheme();
                    break;
                case 'lighting':
                    toggleLighting();
                    break;
                case 'hide':
                    toggleWindowVisibility();
                    break;
                case 'click-through':
                    toggleClickThrough();
                    break;
                case 'toggle-main':
                    toggleMainWindow();
                    break;
                case 'protection':
                    toggleContentProtection();
                    break;
                case 'collapse':
                    collapseUI();
                    break;
            }
        });
        
        // Add Enter key handling for sending message in collapsed state
        messageInput.addEventListener('keydown', (e) => {
            // In collapsed state, Enter sends the message
            const promptInputContainer = document.querySelector('.prompt-input');
            const isCollapsed = !promptInputContainer.classList.contains('expanded');
            
            if (isCollapsed && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
            
            // In expanded state, Shift+Enter sends the message
            if (!isCollapsed && e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // --- FINAL & CORRECTED CODE FOR "EXPAND ON NEW LINE" --- //

        const promptInputContainer = document.querySelector('.prompt-input');

        // This single event listener handles everything now - NO WINDOW HEIGHT CHANGES
        messageInput.addEventListener('input', () => {
            // Run the existing auto-resize function - but it won't adjust window height
            autoResize();

            // Check if the UI is currently in its compact state.
            const isCollapsed = !promptInputContainer.classList.contains('expanded');

            // Update send button state
            updateSendButton();

            // --- Expansion Logic ---
            // Only expand if we're in collapsed state and user explicitly requests expansion
            // (e.g., by pressing Enter or clicking expand button)
            // Do NOT auto-expand on text input in collapsed state

            // --- Collapse Logic ---
            // If the UI is currently expanded and text is cleared, we might want to collapse
            // But only if there are no attachments
            if (!isCollapsed && messageInput.value.trim() === '' && 
                imageAttachments.length === 0 && mediaAttachments.length === 0) {
                // Optionally collapse when text is cleared and no attachments
                // This is commented out to maintain current behavior
                // collapseUI();
            }
            
            // DO NOT call adjustWindowHeight or any height adjustment functions here
            // This prevents shaking when typing
        });   
        
            
        // ==================== ENHANCED GEOMETRY CONTROL SYSTEM ====================
        
        // Advanced geometry control for dropdowns and UI elements
        class GeometryController {
            constructor() {
                this.screenInfo = null;
                this.windowGeometry = null;
                this.animationQueue = [];
                this.isAnimating = false;
                this.init();
            }
            
            async init() {
                // Get initial screen and window information
                await this.updateScreenInfo();
                await this.updateWindowGeometry();
                
                // Listen for screen changes
                window.addEventListener('resize', () => this.updateWindowGeometry());
                screen.addEventListener('change', () => this.updateScreenInfo());
            }
            
            async updateScreenInfo() {
                try {
                    this.screenInfo = await window.chatInputAPI.getScreenInfo();
                } catch (error) {
                    console.error('Failed to get screen info:', error);
                }
            }
            
            async updateWindowGeometry() {
                try {
                    this.windowGeometry = await window.chatInputAPI.getWindowGeometry();
                } catch (error) {
                    console.error('Failed to get window geometry:', error);
                }
            }
            
            // Advanced dropdown positioning with multi-monitor support
            positionDropdownAdvanced(dropdown, triggerButton, options = {}) {
                if (!dropdown || !triggerButton || !this.screenInfo) return;
                
                const {
                    preferredPosition = 'below',
                    offset = 8,
                    margin = 20,
                    constrainToScreen = true,
                    preferAbove = false
                } = options;
                
                // Force visibility for measurements
                dropdown.style.visibility = 'hidden';
                dropdown.style.display = 'block';
                
                const buttonRect = triggerButton.getBoundingClientRect();
                const dropdownRect = dropdown.getBoundingClientRect();
                
                // Get current display info
                const currentDisplay = this.getCurrentDisplay();
                if (!currentDisplay) return;
                
                // Calculate screen-relative positions
                const windowTop = window.screenY;
                const windowLeft = window.screenX;
                
                let top, left;
                
                // Calculate preferred position
                if (preferredPosition === 'below' || (preferredPosition === 'auto' && !preferAbove)) {
                    top = windowTop + buttonRect.bottom + offset;
                    left = windowLeft + buttonRect.left;
                } else {
                    top = windowTop + buttonRect.top - dropdownRect.height - offset;
                    left = windowLeft + buttonRect.left;
                }
                
                // Constrain to screen bounds if requested
                if (constrainToScreen) {
                    const screenBounds = currentDisplay.workArea;
                    const screenWidth = screenBounds.width;
                    const screenHeight = screenBounds.height;
                    
                    // Adjust horizontal position
                    if (left + dropdownRect.width > screenWidth - margin) {
                        left = screenWidth - dropdownRect.width - margin;
                    }
                    if (left < margin) {
                        left = margin;
                    }
                    
                    // Adjust vertical position
                    if (top + dropdownRect.height > screenHeight - margin) {
                        if (preferredPosition === 'below' || preferredPosition === 'auto') {
                            // Try above the button
                            top = windowTop + buttonRect.top - dropdownRect.height - offset;
                        }
                    }
                    if (top < margin) {
                        top = margin;
                    }
                }
                
                // Apply positioning
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${top - windowTop}px`;
                dropdown.style.left = `${left - windowLeft}px`;
                dropdown.style.zIndex = '9999';
                dropdown.style.pointerEvents = 'auto';
                dropdown.style.visibility = 'visible';
                dropdown.style.transform = 'translateZ(0)';
                
                // Store positioning info for future reference
                dropdown._geometryInfo = {
                    position: { top, left },
                    size: { width: dropdownRect.width, height: dropdownRect.height },
                    triggerButton: triggerButton,
                    timestamp: Date.now()
                };
            }
            
            // Get current display information
            getCurrentDisplay() {
                if (!this.screenInfo) return null;
                
                const windowCenterX = window.screenX + window.innerWidth / 2;
                const windowCenterY = window.screenY + window.innerHeight / 2;
                
                // Find the display that contains the window center
                for (const display of this.screenInfo.all) {
                    const { x, y, width, height } = display.bounds;
                    if (windowCenterX >= x && windowCenterX <= x + width &&
                        windowCenterY >= y && windowCenterY <= y + height) {
                        return display;
                    }
                }
                
                // Fallback to primary display
                return this.screenInfo.primary;
            }
            
            // Smart window adjustment for UI elements
            async adjustWindowForElement(elementId, options = {}) {
                const {
                    expandDirection = 'down',
                    minHeight = 80,
                    maxHeight = 600,
                    padding = 20,
                    animate = true,
                    duration = 300
                } = options;
                
                try {
                    // Request element information from renderer
                    const elementInfo = await this.getElementInfo(elementId);
                    if (!elementInfo) return;
                    
                    const { height: elementHeight, width: elementWidth } = elementInfo;
                    const currentGeometry = await window.chatInputAPI.getWindowGeometry();
                    
                    if (!currentGeometry) return;
                    
                    // Calculate new window dimensions
                    let newHeight = currentGeometry.size.height;
                    let newWidth = currentGeometry.size.width;
                    
                    if (expandDirection === 'down') {
                        newHeight = Math.max(minHeight, Math.min(maxHeight, 
                            currentGeometry.size.height + elementHeight + padding));
                    } else if (expandDirection === 'right') {
                        newWidth = Math.max(200, Math.min(1400, 
                            currentGeometry.size.width + elementWidth + padding));
                    }
                    
                    // Apply changes
                    if (animate) {
                        const targetBounds = {
                            x: currentGeometry.bounds.x,
                            y: currentGeometry.bounds.y,
                            width: newWidth,
                            height: newHeight
                        };
                        
                        await window.chatInputAPI.animateWindowGeometry(targetBounds, duration);
                    } else {
                        await window.chatInputAPI.setWindowBounds({
                            x: currentGeometry.bounds.x,
                            y: currentGeometry.bounds.y,
                            width: newWidth,
                            height: newHeight
                        });
                    }
                    
                } catch (error) {
                    console.error('Failed to adjust window for element:', error);
                }
            }
            
            // Get element information (placeholder - would need renderer communication)
            async getElementInfo(elementId) {
                return new Promise((resolve) => {
                    const element = document.getElementById(elementId);
                    if (!element) {
                        resolve(null);
                        return;
                    }
                    
                    const rect = element.getBoundingClientRect();
                    resolve({
                        height: rect.height,
                        width: rect.width,
                        top: rect.top,
                        left: rect.left,
                        bottom: rect.bottom,
                        right: rect.right
                    });
                });
            }
            
            // Animate window geometry changes
            async animateWindowGeometry(targetBounds, duration = 300) {
                if (this.isAnimating) {
                    this.animationQueue.push({ targetBounds, duration });
                    return;
                }
                
                this.isAnimating = true;
                
                try {
                    await window.chatInputAPI.animateWindowGeometry(targetBounds, duration);
                } catch (error) {
                    console.error('Animation failed:', error);
                } finally {
                    this.isAnimating = false;
                    this.processAnimationQueue();
                }
            }
            
            processAnimationQueue() {
                if (this.animationQueue.length > 0) {
                    const next = this.animationQueue.shift();
                    this.animateWindowGeometry(next.targetBounds, next.duration);
                }
            }
            
            // Smart positioning for future UI elements
            positionElementSmart(element, referenceElement, options = {}) {
                const {
                    position = 'below',
                    offset = 8,
                    align = 'left',
                    constrainToViewport = true
                } = options;
                
                if (!element || !referenceElement) return;
                
                const refRect = referenceElement.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                let top, left;
                
                // Calculate position
                switch (position) {
                    case 'below':
                        top = refRect.bottom + offset;
                        break;
                    case 'above':
                        top = refRect.top - elementRect.height - offset;
                        break;
                    case 'right':
                        top = refRect.top;
                        left = refRect.right + offset;
                        break;
                    case 'left':
                        top = refRect.top;
                        left = refRect.left - elementRect.width - offset;
                        break;
                }
                
                // Calculate horizontal alignment
                if (position === 'below' || position === 'above') {
                    switch (align) {
                        case 'left':
                            left = refRect.left;
                            break;
                        case 'right':
                            left = refRect.right - elementRect.width;
                            break;
                        case 'center':
                            left = refRect.left + (refRect.width - elementRect.width) / 2;
                            break;
                    }
                }
                
                // Apply positioning
                element.style.position = 'fixed';
                element.style.top = `${top}px`;
                element.style.left = `${left}px`;
                element.style.zIndex = '9999';
                element.style.pointerEvents = 'auto';
            }
        }
        
        // Initialize geometry controller
        const geometryController = new GeometryController();
        
        // Listen for element info requests from main process
        if (window.chatInputAPI) {
            // This would be handled by the preload script
            // For now, we'll add a placeholder
            console.log('Geometry controller initialized with advanced positioning capabilities');
        }
        
        // ==================== CLICK-THROUGH CONTROL SYSTEM ====================
        
        // Click-through state management
        let isClickThroughEnabled = false;
        let clickThroughTimeout = null;
        
        // Enable click-through mode
        function enableClickThrough() {
            if (window.chatInputAPI?.enableClickThrough) {
                window.chatInputAPI.enableClickThrough();
                isClickThroughEnabled = true;
                console.log('Click-through enabled');
            }
        }
        
        // Disable click-through mode
        function disableClickThrough() {
            if (window.chatInputAPI?.disableClickThrough) {
                window.chatInputAPI.disableClickThrough();
                isClickThroughEnabled = false;
                console.log('Click-through disabled');
            }
        }
        
        // Toggle click-through mode
        function toggleClickThrough() {
            if (isClickThroughEnabled) {
                disableClickThrough();
            } else {
                enableClickThrough();
            }
        }
        
        // Smart click-through detection
        function handleSmartClickThrough(event) {
            // Clear any existing timeout
            if (clickThroughTimeout) {
                clearTimeout(clickThroughTimeout);
            }
            
            // Check if the click is on a UI element
            const target = event.target;
            const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input');
            
            if (isUIElement) {
                // Click is on UI element - disable click-through temporarily
                disableClickThrough();
                
                // Re-enable click-through after a short delay
                clickThroughTimeout = setTimeout(() => {
                    enableClickThrough();
                }, 1000); // 1 second delay
            } else {
                // Click is on empty area - enable click-through
                enableClickThrough();
            }
        }
        
        // Initialize click-through on window load
        function initializeClickThrough() {
            // Start with click-through enabled
            enableClickThrough();
            
            // Add click listener for smart detection
            document.addEventListener('click', handleSmartClickThrough);
            
            // Add mouse move listener for hover detection
            document.addEventListener('mousemove', (event) => {
                const target = event.target;
                const isUIElement = target.closest('.action-btn, #messageInput, .dropdown-menu, .attachments-section, .prompt-input');
                
                if (isUIElement && isClickThroughEnabled) {
                    // Mouse is over UI element - disable click-through
                    disableClickThrough();
                } else if (!isUIElement && !isClickThroughEnabled) {
                    // Mouse is over empty area - enable click-through
                    enableClickThrough();
                }
            });
            
            console.log('Click-through system initialized');
        }
        
        // Initialize click-through when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeClickThrough);
        } else {
            initializeClickThrough();
        }
        
        // Add click-through button event listener
        const clickThroughButton = document.getElementById('clickThroughButton');
        if (clickThroughButton) {
            clickThroughButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleClickThrough();
                updateClickThroughButton();
            });
        }
        
        // Update click-through button appearance
        function updateClickThroughButton() {
            if (clickThroughButton) {
                if (isClickThroughEnabled) {
                    clickThroughButton.classList.add('active');
                    clickThroughButton.title = 'Click-through enabled - Click to disable';
                } else {
                    clickThroughButton.classList.remove('active');
                    clickThroughButton.title = 'Click-through disabled - Click to enable';
                }
            }
        }
        
        // Keyboard shortcut for click-through (Ctrl+T)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                toggleClickThrough();
                updateClickThroughButton();
            }
        });
        
        // Enhanced dropdown positioning using geometry controller
        function positionDropdownAsOverlay(dropdown, triggerButton) {
            geometryController.positionDropdownAdvanced(dropdown, triggerButton, {
                preferredPosition: 'below',
                offset: 8,
                margin: 20,
                constrainToScreen: true
            });
        }
        
        // ==================== UTILITY FUNCTIONS FOR FUTURE UI ELEMENTS ====================
        
        // Smart positioning for any UI element
        function positionElementSmart(element, referenceElement, options = {}) {
            return geometryController.positionElementSmart(element, referenceElement, options);
        }
        
        // Adjust window for new UI element
        function adjustWindowForElement(elementId, options = {}) {
            return geometryController.adjustWindowForElement(elementId, options);
        }
        
        // Get current screen information
        function getScreenInfo() {
            return geometryController.screenInfo;
        }
        
        // Get current window geometry
        function getWindowGeometry() {
            return geometryController.windowGeometry;
        }
        
        // Animate window to new geometry
        function animateWindowGeometry(targetBounds, duration = 300) {
            return geometryController.animateWindowGeometry(targetBounds, duration);
        }
        
        // Smart dropdown positioning with advanced options
        function positionDropdownAdvanced(dropdown, triggerButton, options = {}) {
            return geometryController.positionDropdownAdvanced(dropdown, triggerButton, options);
        }
        
        // ==================== ENHANCED DROPDOWN MANAGEMENT ====================
        
        // Enhanced dropdown show function with geometry control
        function showDropdownAdvanced(dropdownId, triggerButton, options = {}) {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown || !triggerButton) return;
            
            // Hide other dropdowns first
            hideAllDropdowns();
            
            // Show the dropdown
            dropdown.style.display = 'block';
            dropdown.setAttribute('aria-hidden', 'false');
            
            // Position using advanced geometry control
            positionDropdownAdvanced(dropdown, triggerButton, {
                preferredPosition: options.position || 'below',
                offset: options.offset || 8,
                margin: options.margin || 20,
                constrainToScreen: options.constrainToScreen !== false,
                preferAbove: options.preferAbove || false
            });
            
            // Add click outside handler
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 10);
        }
        
        // Enhanced model selector with smart positioning
        function showModelSelectorAdvanced(triggerButton) {
            showDropdownAdvanced('modelDropdown', triggerButton, {
                position: 'below',
                offset: 8,
                margin: 20,
                constrainToScreen: true,
                preferAbove: false
            });
        }

        // Show plus actions dropdown
        function showPlusActionsDropdown(triggerButton) {
            showDropdownAdvanced('plusActionsDropdown', triggerButton, {
                position: 'below',
                offset: 8,
                margin: 20,
                constrainToScreen: true,
                preferAbove: false
            });
        }
        
        // Enhanced upload dropdown with smart positioning
        function showUploadDropdownAdvanced(triggerButton) {
            showDropdownAdvanced('uploadDropdown', triggerButton, {
                position: 'below',
                offset: 8,
                margin: 20,
                constrainToScreen: true,
                preferAbove: false
            });
        }
        
        // Enhanced capture dropdown with smart positioning
        function showCaptureDropdownAdvanced(triggerButton) {
            showDropdownAdvanced('captureDropdown', triggerButton, {
                position: 'below',
                offset: 8,
                margin: 20,
                constrainToScreen: true,
                preferAbove: false
            });
        }
        
        // Enhanced auto-resize textarea with smooth expansion
        function autoResize() {
            const promptInputContainer = document.querySelector('.prompt-input');
            const isCollapsed = !promptInputContainer.classList.contains('expanded');
            
            // In collapsed state, keep textarea as single line
            if (isCollapsed) {
                // Reset height to single line
                messageInput.style.height = 'auto';
                // Set a fixed height for single line display
                const singleLineHeight = 44; // Match the min-height from CSS
                messageInput.style.height = singleLineHeight + 'px';
                // Ensure full width
                messageInput.style.width = '100%';
            } else {
                // In expanded state, allow multi-line growth
                messageInput.style.height = 'auto';
                const maxHeight = 200;
                const newHeight = Math.min(messageInput.scrollHeight, maxHeight);
                messageInput.style.height = newHeight + 'px';
                // Ensure full width
                messageInput.style.width = '100%';
            }

            // ONLY adjust window height for expand/collapse, NOT for text input
            // This prevents shaking when typing or interacting with dropdowns
            if (expansionState === 'expanding' || expansionState === 'collapsing') {
                adjustWindowHeightSmooth(expansionState === 'expanding' ? 'expand' : 'collapse');
            }
            
            // Update button visibility
            updateSendButton();
        }

        // ==================== ENHANCED WINDOW HEIGHT MANAGEMENT ====================

        // Debounced window height adjustment to prevent shaking
        let adjustHeightTimeout = null;
        let lastTargetHeight = 0;
        let isHeightAdjusting = false;
        let heightAdjustmentQueue = [];
        
        // Enhanced smooth window height adjustment - ONLY for expand/collapse
        function adjustWindowHeightSmooth(action = 'auto') {
            // ONLY adjust window height for explicit expand/collapse actions
            // NOT for 'auto' or other triggers to prevent unwanted window changes
            if (action !== 'expand' && action !== 'collapse') {
                return;
            }
            
            if (isHeightAdjusting) {
                // Queue the adjustment if one is in progress
                heightAdjustmentQueue.push(action);
                return;
            }
            
            isHeightAdjusting = true;
            
            // Clear any pending adjustments
            if (adjustHeightTimeout) {
                clearTimeout(adjustHeightTimeout);
            }
            
            adjustHeightTimeout = setTimeout(() => {
                const container = document.querySelector('.chat-input-container');
                const promptInput = document.querySelector('.prompt-input');
                const attachmentsSection = document.getElementById('attachmentsSection');
                
                if (!promptInput) {
                    isHeightAdjusting = false;
                    processHeightQueue();
                    return;
                }
                
                // Calculate base height - ONLY from main content, NOT dropdowns
                let targetHeight = promptInput.offsetHeight + 20; // base height with padding
                
                // Add attachments section height if visible
                if (attachmentsSection && attachmentsSection.style.display !== 'none' && 
                    attachmentsSection.offsetHeight > 0) {
                    targetHeight += attachmentsSection.offsetHeight + 10;
                }
                
                // NO DROPDOWN HEIGHT CALCULATION - dropdowns are overlays
                // Dropdowns should NEVER affect window height
                
                // Apply minimum and maximum height constraints
                const minHeight = 80;
                const maxHeight = 600; // Reasonable max for small window
                targetHeight = Math.max(minHeight, Math.min(maxHeight, targetHeight));
                
                // Only update if height actually changed significantly (avoid micro-adjustments)
                if (Math.abs(targetHeight - lastTargetHeight) > 3) {
                    const previousHeight = lastTargetHeight;
                    lastTargetHeight = targetHeight;
                    
                    // Smooth height transition
                    if (action === 'expand' || action === 'collapse') {
                        // For expand/collapse, use smooth transition
                        requestAnimationFrame(() => {
                            if (window.chatInputAPI?.updateWindowHeight) {
                                window.chatInputAPI.updateWindowHeight(targetHeight);
                            }
                            
                            // For upward expansion, also adjust window position
                            if (action === 'expand' && window.chatInputAPI?.updateWindowPosition) {
                                // Move window up by the height difference to maintain bottom alignment
                                const heightDifference = targetHeight - previousHeight;
                                const currentY = window.screenY;
                                const newY = Math.max(0, currentY - heightDifference);
                                window.chatInputAPI.updateWindowPosition(window.screenX, newY);
                            }
                        });
                    } else {
                        // For other adjustments, use immediate update
                        if (window.chatInputAPI?.updateWindowHeight) {
                            window.chatInputAPI.updateWindowHeight(targetHeight);
                        }
                    }
                }
                
                isHeightAdjusting = false;
                processHeightQueue();
                
            }, action === 'expand' || action === 'collapse' ? 100 : 50); // Longer delay for smooth transitions
        }
        
        // Process queued height adjustments
        function processHeightQueue() {
            if (heightAdjustmentQueue.length > 0) {
                const nextAction = heightAdjustmentQueue.shift();
                setTimeout(() => adjustWindowHeightSmooth(nextAction), 50);
            }
        }
        
        // Legacy function for backward compatibility
        // This function now does nothing to prevent unwanted window changes
        // Only explicit expand/collapse actions should change window height
        function adjustWindowHeight() {
            // Do nothing - window height should only change for expand/collapse
            // This prevents unwanted window changes from dropdowns, attachments, etc.
            return;
        }

        // Update send button state
        function updateSendButton() {
            const hasText = messageInput.value.trim().length > 0;
            const hasAttachments = imageAttachments.length > 0;
            const promptInputContainer = document.querySelector('.prompt-input');
            const isExpanded = promptInputContainer.classList.contains('expanded');
            
            // In collapsed state, show expand button only when there's no text or attachments
            if (!isExpanded) {
                if (!hasText && !hasAttachments && !isSending) {
                    expandButton.style.display = 'flex';
                    sendButton.style.display = 'none';
                } else {
                    // Show send button when there's text or attachments
                    expandButton.style.display = 'none';
                    sendButton.style.display = 'flex';
                    sendButton.disabled = (!hasText && !hasAttachments) || isSending;
                }
            } else {
                // In expanded state, always show send button
                expandButton.style.display = 'none';
                sendButton.style.display = 'flex';
                sendButton.disabled = (!hasText && !hasAttachments) || isSending;
            }

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
            const hasImageAttachments = imageAttachments.length > 0;
            const hasMediaAttachments = mediaAttachments.length > 0;
            const hasAnyAttachments = hasImageAttachments || hasMediaAttachments;
            
            if ((!message && !hasAnyAttachments) || isSending) return;

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
                // Combine all attachments
                const allAttachments = [];
                
                // Add image attachments
                if (hasImageAttachments) {
                    allAttachments.push(...imageAttachments.map(att => ({
                        id: att.id,
                        name: att.name,
                        type: att.type,
                        size: att.size,
                        data: att.data,
                        source: att.source,
                        mediaType: 'image',
                        dimensions: att.dimensions
                    })));
                }
                
                // Add media attachments (video/audio)
                if (hasMediaAttachments) {
                    allAttachments.push(...mediaAttachments.map(att => ({
                        id: att.id,
                        name: att.name,
                        type: att.type,
                        size: att.size,
                        data: att.data,
                        source: att.source,
                        mediaType: att.mediaType,
                        dimensions: att.dimensions,
                        duration: att.duration
                    })));
                }
                
                const messageData = {
                    content: message,
                    timestamp: new Date().toISOString(),
                    id: Date.now().toString(),
                    type: hasAnyAttachments ? 'mixed' : 'text',
                    attachments: allAttachments
                };
                
                console.log('Sending message with attachments:', {
                    content: message,
                    attachmentCount: allAttachments.length,
                    attachmentTypes: allAttachments.map(att => att.mediaType)
                });
                
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

        // Upload handler with animation
        function handleUpload() {
            // Visual feedback animation
            uploadButton.animate([
                { transform: 'scale(1)', background: 'transparent' },
                { transform: 'scale(1.08)', background: '#303132' },
                { transform: 'scale(1)', background: 'transparent' }
            ], { duration: 160, easing: 'ease-out' });

            toggleUploadMenu();
        }

        // Capture handler with animation
        function handleCapture() {
            // Visual feedback animation
            captureButton.animate([
                { transform: 'scale(1)', background: 'transparent' },
                { transform: 'scale(1.08)', background: '#303132' },
                { transform: 'scale(1)', background: 'transparent' }
            ], { duration: 160, easing: 'ease-out' });

            toggleCaptureMenu();
        }

        // Upload dropdown helpers
        function openUploadMenu() {
            closeAllDropdowns(); // Close any open dropdown first
            if (!uploadDropdown) return;
            positionDropdownMenu(uploadDropdown, uploadButton);
            uploadDropdown.classList.add('open');
            uploadDropdown.setAttribute('aria-hidden', 'false');
            uploadButton.setAttribute('aria-expanded', 'true');
            
            // Single delayed window adjustment to prevent shaking (compact dropdown needs less space)
            setTimeout(() => {
                ensureDropdownVisibleByExpandingWindow(uploadDropdown);
            }, 100);
            
            // Focus first item for accessibility
            const firstItem = uploadDropdown.querySelector('.dropdown-item-compact:not([disabled])');
            if (firstItem) firstItem.focus({ preventScroll: true });
        }

        function closeUploadMenu() {
            if (!uploadDropdown) return;
            uploadDropdown.classList.remove('open');
            uploadDropdown.setAttribute('aria-hidden', 'true');
            uploadButton.setAttribute('aria-expanded', 'false');
            
            // Delay window adjustment to allow smooth menu close animation
            setTimeout(() => {
                adjustWindowHeight();
            }, 150);
        }

        function toggleUploadMenu() {
            if (uploadDropdown.classList.contains('open')) {
                closeUploadMenu();
            } else {
                openUploadMenu();
            }
        }

        // Capture dropdown helpers
        function openCaptureMenu() {
            closeAllDropdowns(); // Close any open dropdown first
            if (!captureDropdown) return;
            positionDropdownMenu(captureDropdown, captureButton);
            captureDropdown.classList.add('open');
            captureDropdown.setAttribute('aria-hidden', 'false');
            captureButton.setAttribute('aria-expanded', 'true');
            
            // Single delayed window adjustment to prevent shaking (compact dropdown needs less space)
            setTimeout(() => {
                ensureDropdownVisibleByExpandingWindow(captureDropdown);
            }, 100);
            
            // Focus first item for accessibility
            const firstItem = captureDropdown.querySelector('.dropdown-item-compact:not([disabled])');
            if (firstItem) firstItem.focus({ preventScroll: true });
        }

        function closeCaptureMenu() {
            if (!captureDropdown) return;
            captureDropdown.classList.remove('open');
            captureDropdown.setAttribute('aria-hidden', 'true');
            captureButton.setAttribute('aria-expanded', 'false');
            
            // Delay window adjustment to allow smooth menu close animation
            setTimeout(() => {
                adjustWindowHeight();
            }, 150);
        }

        function toggleCaptureMenu() {
            if (captureDropdown.classList.contains('open')) {
                closeCaptureMenu();
            } else {
                openCaptureMenu();
            }
        }

        // Model selection dropdown helpers
        function openModelSelectMenu() {
            closeAllDropdowns(); // Close any open dropdown first
            if (!modelSelectDropdown) return;
            positionDropdownMenu(modelSelectDropdown, modelSelectButton);
            modelSelectDropdown.classList.add('open');
            modelSelectDropdown.setAttribute('aria-hidden', 'false');
            modelSelectButton.setAttribute('aria-expanded', 'true');
            modelSelectButton.classList.add('active');
            
            // Update selected state in dropdown
            updateModelDropdownSelection();
            
            // Single delayed window adjustment to prevent shaking
            setTimeout(() => {
                ensureDropdownVisibleByExpandingWindow(modelSelectDropdown);
            }, 100);
            
            // Focus first enabled item for accessibility
            const firstItem = modelSelectDropdown.querySelector('.dropdown-item:not([disabled])');
            if (firstItem) firstItem.focus({ preventScroll: true });
        }

        function closeModelSelectMenu() {
            if (!modelSelectDropdown) return;
            modelSelectDropdown.classList.remove('open');
            modelSelectDropdown.setAttribute('aria-hidden', 'true');
            modelSelectButton.setAttribute('aria-expanded', 'false');
            modelSelectButton.classList.remove('active');
            
            // Delay window adjustment to allow smooth menu close animation
            setTimeout(() => {
                adjustWindowHeight();
            }, 150);
        }

        function toggleModelSelectMenu() {
            if (modelSelectDropdown.classList.contains('open')) {
                closeModelSelectMenu();
            } else {
                openModelSelectMenu();
            }
        }

        // Update model dropdown selection visual state
        function updateModelDropdownSelection() {
            const items = modelSelectDropdown.querySelectorAll('.dropdown-item');
            items.forEach(item => {
                const modelId = item.getAttribute('data-model');
                if (modelId === selectedModel) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        // Handle model selection
        function selectModel(modelId) {
            if (!availableModels[modelId]) {
                console.warn('Unknown model:', modelId);
                return;
            }
            
            selectedModel = modelId;
            
            // Save to localStorage
            localStorage.setItem('selectedAIModel', selectedModel);
            
            // Update UI
            updateModelDropdownSelection();
            updateModelButtonState();
            
            // Close dropdown
            closeModelSelectMenu();
            
            // Notify main window about model change
            if (window.chatInputAPI?.notifyModelChange) {
                window.chatInputAPI.notifyModelChange(selectedModel, availableModels[selectedModel]);
            }
            
            console.log('Model changed to:', availableModels[selectedModel].name);
        }

        // Update model button visual state
        function updateModelButtonState() {
            const currentModel = availableModels[selectedModel];
            if (currentModel) {
                // Update button title to show current model
                modelSelectButton.title = `Current: ${currentModel.name}`;
                
                // Add visual indicator that a model is selected
                modelSelectButton.classList.add('has-selection');
            }
        }

        // Initialize model selection from localStorage
        function initializeModelSelection() {
            const saved = localStorage.getItem('selectedAIModel');
            if (saved && availableModels[saved]) {
                selectedModel = saved;
            }
            updateModelButtonState();
            console.log('Initialized with model:', availableModels[selectedModel].name);
        }

        // Close all dropdowns
        function closeAllDropdowns() {
            closeUploadMenu();
            closeCaptureMenu();
            closeModelSelectMenu();
        }

        function positionDropdownMenu(dropdown, button) {
            const rect = button.getBoundingClientRect();
            // Default: slightly above and to the right side of the button
            const offsetX = 2; // slight side offset
            const offsetY = 6; // space from button (smaller for compact dropdowns)
            dropdown.style.left = (rect.left + offsetX) + 'px';
            dropdown.style.top = (rect.top - offsetY) + 'px';

            // Prevent overflow to the right
            dropdown.style.visibility = 'hidden';
            dropdown.style.display = 'block';
            const menuRect = dropdown.getBoundingClientRect();
            dropdown.style.display = '';
            dropdown.style.visibility = '';
            const overflowRight = (menuRect.right > window.innerWidth - 8);
            if (overflowRight) {
                const newLeft = Math.max(8, rect.right - menuRect.width);
                dropdown.style.left = newLeft + 'px';
            }

            // If placed above would hide off-screen, place below
            const aboveTop = rect.top - menuRect.height - 6;
            if (aboveTop < 8) {
                const belowTop = Math.min(window.innerHeight - menuRect.height - 8, rect.bottom + 6);
                dropdown.style.top = belowTop + 'px';
            } else {
                // Place above button by default (slightly above)
                dropdown.style.top = (rect.top - menuRect.height - 6) + 'px';
            }
        }

        function ensureDropdownVisibleByExpandingWindow(dropdown) {
            // This function now does nothing to prevent unwanted window height changes
            // Dropdowns should be positioned independently using the geometry controller
            // and should not affect the window size
            return;
        }

        // Item actions
        function handleAttachmentAction(action) {
            switch (action) {
                case 'upload-image':
                    handleImageUpload();
                    break;
                case 'upload-video':
                    handleVideoUpload();
                    break;
                case 'upload-audio':
                    handleAudioUpload();
                    break;
                case 'capture-desktop':
                case 'desktop-capture':
                    handleDesktopCapture();
                    break;
                case 'capture-audio':
                case 'audio-capture':
                    handleAudioCapture();
                    break;
                case 'capture-video':
                    handleVideoCapture();
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
            closeAllDropdowns();
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
            
            // Only auto-resize if not in collapsed state
            const promptInputContainer = document.querySelector('.prompt-input');
            const isCollapsed = !promptInputContainer.classList.contains('expanded');
            
            if (!isCollapsed) {
                autoResize();
            }
            
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

        // Button event listeners
        sendButton.addEventListener('click', sendMessage);
        uploadButton.addEventListener('click', handleUpload);
        captureButton.addEventListener('click', handleCapture);
        modelSelectButton.addEventListener('click', toggleModelSelectMenu);
        lightingButton.addEventListener('click', toggleLighting);
        themeToggleButton.addEventListener('click', toggleTheme);
        hideShowButton.addEventListener('click', toggleWindowVisibility);
        toggleMainWindowButton.addEventListener('click', toggleMainWindow);
        clearAllButton.addEventListener('click', clearAllAttachments);

        // Dropdown interactions
        uploadDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('.dropdown-item-compact');
            if (!button) return;
            const action = button.getAttribute('data-action');
            if (action) {
                handleAttachmentAction(action);
            }
        });

        captureDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('.dropdown-item-compact');
            if (!button) return;
            const action = button.getAttribute('data-action');
            if (action) {
                handleAttachmentAction(action);
            }
        });

        // Model selection dropdown interactions
        modelSelectDropdown.addEventListener('click', (e) => {
            const button = e.target.closest('.dropdown-item');
            if (!button || button.disabled) return;
            const modelId = button.getAttribute('data-model');
            if (modelId && availableModels[modelId]) {
                selectModel(modelId);
            }
        });

        // Reposition on resize to stay anchored near the button
        window.addEventListener('resize', () => {
            if (uploadDropdown.classList.contains('open')) {
                positionDropdownMenu(uploadDropdown, uploadButton);
                ensureDropdownVisibleByExpandingWindow(uploadDropdown);
            }
            if (captureDropdown.classList.contains('open')) {
                positionDropdownMenu(captureDropdown, captureButton);
                ensureDropdownVisibleByExpandingWindow(captureDropdown);
            }
            if (modelSelectDropdown.classList.contains('open')) {
                positionDropdownMenu(modelSelectDropdown, modelSelectButton);
                ensureDropdownVisibleByExpandingWindow(modelSelectDropdown);
            }
        });

        // Dismiss dropdown on outside click or Escape
        document.addEventListener('mousedown', (e) => {
            // Check upload dropdown
            if (uploadDropdown.classList.contains('open')) {
                if (e.target === uploadButton || uploadButton.contains(e.target)) return;
                if (!uploadDropdown.contains(e.target)) {
                    closeUploadMenu();
                }
            }
            
            // Check capture dropdown
            if (captureDropdown.classList.contains('open')) {
                if (e.target === captureButton || captureButton.contains(e.target)) return;
                if (!captureDropdown.contains(e.target)) {
                    closeCaptureMenu();
                }
            }
            
            // Check model selection dropdown
            if (modelSelectDropdown.classList.contains('open')) {
                if (e.target === modelSelectButton || modelSelectButton.contains(e.target)) return;
                if (!modelSelectDropdown.contains(e.target)) {
                    closeModelSelectMenu();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (uploadDropdown.classList.contains('open')) {
                    closeUploadMenu();
                    uploadButton.focus();
                } else if (captureDropdown.classList.contains('open')) {
                    closeCaptureMenu();
                    captureButton.focus();
                } else if (modelSelectDropdown.classList.contains('open')) {
                    closeModelSelectMenu();
                    modelSelectButton.focus();
                }
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
                
                // Only auto-resize if not in collapsed state
                const promptInputContainer = document.querySelector('.prompt-input');
                const isCollapsed = !promptInputContainer.classList.contains('expanded');
                
                if (!isCollapsed) {
                    autoResize();
                }
                resetSendingState();
                messageInput.focus();
            });

            window.chatInputAPI.onFocusInput(() => {
                messageInput.focus();
            });
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', () => {
            // Add fullscreen class to container for fullscreen mode
            if (chatInputContainer) {
                chatInputContainer.classList.add('fullscreen');
            }
            
            // Initialize content protection
            initializeContentProtection();
            
            // Initialize theme
            const savedTheme = localStorage.getItem('chatInputTheme');
            if (savedTheme === 'paper') {
                currentTheme = 'paper';
                document.documentElement.setAttribute('data-theme', 'paper');
                themeToggleButton.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                `;
                themeToggleButton.title = 'Switch to Dark Theme';
            }
            
            // Ensure initial state is collapsed
            const promptInputContainer = document.querySelector('.prompt-input');
            promptInputContainer.classList.remove('expanded');
            
            messageInput.focus();
            
            // Set initial button states
            updateSendButton();
            
            // Initialize model selection
            initializeModelSelection();
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

            // Global shortcut for theme toggle
            if (e.key === 't' && e.ctrlKey) {
                e.preventDefault();
                toggleTheme();
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
                // Only auto-resize if not in collapsed state
                const promptInputContainer = document.querySelector('.prompt-input');
                const isCollapsed = !promptInputContainer.classList.contains('expanded');
                
                if (!isCollapsed) {
                    autoResize();
                }
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
                // Only auto-resize if not in collapsed state
                const promptInputContainer = document.querySelector('.prompt-input');
                const isCollapsed = !promptInputContainer.classList.contains('expanded');
                
                if (!isCollapsed) {
                    autoResize();
                }
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

        // Container drag functionality
        function initContainerDragHandling() {
            if (!chatInputContainer) return;
            
            // Initialize container position to bottom center
            function initializePosition() {
                // Reset to CSS-based positioning (bottom: 20px, left: 50%, transform: translateX(-50%))
                chatInputContainer.style.left = '50%';
                chatInputContainer.style.top = 'auto';
                chatInputContainer.style.bottom = '20px';
                chatInputContainer.style.transform = 'translateX(-50%)';
            }
            
            // Initialize position on load
            initializePosition();
            
            // Re-initialize position on window resize
            window.addEventListener('resize', initializePosition);
            
            // Make the entire container draggable
            chatInputContainer.addEventListener('mousedown', (e) => {
                // Don't start drag if clicking on interactive elements
                if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('input')) {
                    return;
                }
                
                isContainerDragging = true;
                const rect = chatInputContainer.getBoundingClientRect();
                containerDragOffset.x = e.clientX - rect.left;
                containerDragOffset.y = e.clientY - rect.top;
                
                // Add dragging class and ensure proper positioning
                chatInputContainer.classList.add('dragging');
                chatInputContainer.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isContainerDragging) return;
                
                const newX = e.clientX - containerDragOffset.x;
                const newY = e.clientY - containerDragOffset.y;
                
                // Get container dimensions
                const containerWidth = chatInputContainer.offsetWidth;
                const containerHeight = chatInputContainer.offsetHeight;
                
                // Constrain to window bounds with proper margins
                const margin = 10; // Small margin from screen edges
                const minX = margin;
                const maxX = window.innerWidth - containerWidth - margin;
                const minY = margin;
                const maxY = window.innerHeight - containerHeight - margin;
                
                const constrainedX = Math.max(minX, Math.min(newX, maxX));
                const constrainedY = Math.max(minY, Math.min(newY, maxY));
                
                // Apply position - maintain bottom alignment when not dragging
                chatInputContainer.style.left = constrainedX + 'px';
                chatInputContainer.style.top = constrainedY + 'px';
                chatInputContainer.style.bottom = 'auto';
                chatInputContainer.style.transform = 'none';
                
                // Update dropdown positions when container is dragged
                updateDropdownPositions();
            });
            
            document.addEventListener('mouseup', () => {
                if (isContainerDragging) {
                    isContainerDragging = false;
                    chatInputContainer.classList.remove('dragging');
                    chatInputContainer.style.cursor = 'move';
                    document.body.style.userSelect = '';
                }
            });
            
            // Handle drag leaving window
            document.addEventListener('mouseleave', () => {
                if (isContainerDragging) {
                    isContainerDragging = false;
                    chatInputContainer.classList.remove('dragging');
                    chatInputContainer.style.cursor = 'move';
                    document.body.style.userSelect = '';
                }
            });
        }
        
        // Update dropdown positions when container is moved
        function updateDropdownPositions() {
            // Update upload dropdown position if it's open
            if (uploadDropdown && uploadDropdown.classList.contains('open')) {
                positionDropdownMenu(uploadDropdown, uploadButton);
            }
            
            // Update capture dropdown position if it's open
            if (captureDropdown && captureDropdown.classList.contains('open')) {
                positionDropdownMenu(captureDropdown, captureButton);
            }
            
            // Update plus actions dropdown position if it's open
            if (plusActionsDropdown && plusActionsDropdown.classList.contains('open')) {
                positionDropdownMenu(plusActionsDropdown, expandedPlusButton);
            }
            
            // Update model select dropdown position if it's open
            if (modelSelectDropdown && modelSelectDropdown.classList.contains('open')) {
                positionDropdownMenu(modelSelectDropdown, modelSelectButton);
            }
        }
        
        // Initialize close button functionality
        function initCloseButtons() {
            // Upload dropdown close button
            const closeUploadBtn = document.getElementById('closeUploadDropdown');
            if (closeUploadBtn) {
                closeUploadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeUploadMenu();
                });
            }
            
            // Capture dropdown close button
            const closeCaptureBtn = document.getElementById('closeCaptureDropdown');
            if (closeCaptureBtn) {
                closeCaptureBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeCaptureMenu();
                });
            }
            
            // Plus actions dropdown close button
            const closePlusActionsBtn = document.getElementById('closePlusActionsDropdown');
            if (closePlusActionsBtn) {
                closePlusActionsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closePlusActionsMenu();
                });
            }
            
            // Model select dropdown close button
            const closeModelSelectBtn = document.getElementById('closeModelSelectDropdown');
            if (closeModelSelectBtn) {
                closeModelSelectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeModelSelectMenu();
                });
            }
        }

        // Initialize drag handling
        initDragHandling();
        
        // Initialize container drag functionality
        initContainerDragHandling();
        
        // Initialize close button functionality
        initCloseButtons();
        
        // Initialize renderer capture API
        if (window.RendererCaptureAPI) {
            window.rendererCaptureAPI = new window.RendererCaptureAPI();
            
            // Set up volume callback for audio recording
            window.rendererCaptureAPI.setVolumeCallback((data) => {
                updateVolumeIndicator(data.volume);
            });
            
            console.log('Renderer capture API initialized successfully');
        } else {
            console.warn('RendererCaptureAPI not available, capture features may not work');
        }
        
        // Make removeImageAttachment available globally
        window.removeImageAttachment = removeImageAttachment;
        window.removeMediaAttachment = removeMediaAttachment;
        window.stopCurrentRecording = stopCurrentRecording;
        
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
                
                try {
                    // Validate the file using MediaUtils
                    const validation = window.MediaUtils.validateFile(file);
                    
                    if (validation.isValid) {
                        const loading = showAttachmentLoading();
                        
                        // Create media file
                        const mediaFile = await window.MediaUtils.createMediaFile(file, 'drag-drop');
                        
                        hideAttachmentLoading();
                        
                        // Add to appropriate collection
                        if (mediaFile.mediaType === window.MediaUtils.MediaType.IMAGE) {
                            addImageAttachment({
                                name: mediaFile.name,
                                type: mediaFile.type,
                                size: mediaFile.size,
                                data: mediaFile.data,
                                source: mediaFile.source
                            });
                        } else {
                            addMediaAttachment(mediaFile);
                        }
                    } else {
                        console.warn('Dropped file not supported:', file.name, validation.error);
                    }
                } catch (error) {
                    hideAttachmentLoading();
                    console.error('Error processing dropped file:', error);
                }
            }
        }
    
    