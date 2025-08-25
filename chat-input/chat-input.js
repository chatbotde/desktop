
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
        // let recording = false; // Future voice recording state
        
        // Drag state
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        // Image attachments state
        let imageAttachments = [];
        let attachmentIdCounter = 0;
        
        // Media attachments state (enhanced)
        let mediaAttachments = [];
        let recordingStartTime = 0;

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
                    }, 200);
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

        // Expand/Collapse UI functions
        function expandUI() {
            const promptInputContainer = document.querySelector('.prompt-input');
            promptInputContainer.classList.add('expanded');
            
            // Show attachments section if there are attachments
            if ((imageAttachments.length > 0 || mediaAttachments.length > 0) && attachmentsSection.style.display === 'none') {
                updateAttachmentsVisibility();
            }
            
            requestAnimationFrame(() => {
                adjustWindowHeight();
            });
        }

        function collapseUI() {
            const promptInputContainer = document.querySelector('.prompt-input');
            promptInputContainer.classList.remove('expanded');
            
            // Clear the input content
            messageInput.value = '';
            
            // Hide attachments section in compact mode
            if (attachmentsSection.style.display !== 'none') {
                attachmentsSection.style.opacity = '0';
                attachmentsSection.style.maxHeight = '0px';
                setTimeout(() => {
                    attachmentsSection.style.display = 'none';
                }, 300);
            }
            
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
        
        expandButton.addEventListener('click', () => {
            expandUI();
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

            // 5. Update send/expand button visibility
            updateSendButton();

            // --- Expansion Logic ---
            // If the height grew AND the UI is currently collapsed, then expand.
            if (newHeight > oldHeight && isCollapsed) {
                promptInputContainer.classList.add('expanded');
                // Show attachments section if there are attachments
                if ((imageAttachments.length > 0 || mediaAttachments.length > 0) && attachmentsSection.style.display === 'none') {
                    updateAttachmentsVisibility();
                }
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

        // Debounced window height adjustment to prevent shaking
        let adjustHeightTimeout = null;
        let lastTargetHeight = 0;
        
        function adjustWindowHeight() {
            // Clear any pending adjustments
            if (adjustHeightTimeout) {
                clearTimeout(adjustHeightTimeout);
            }
            
            adjustHeightTimeout = setTimeout(() => {
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
                
                // Only update if height actually changed significantly (avoid micro-adjustments)
                if (Math.abs(targetHeight - lastTargetHeight) > 5) {
                    lastTargetHeight = targetHeight;
                    
                    // Notify main process about height change for window resizing
                    if (window.chatInputAPI?.updateWindowHeight) {
                        window.chatInputAPI.updateWindowHeight(targetHeight);
                    }
                }
            }, 50); // 50ms debounce to prevent rapid adjustments
        }

        // Update send button state
        function updateSendButton() {
            const hasText = messageInput.value.trim().length > 0;
            const hasAttachments = imageAttachments.length > 0;
            const promptInputContainer = document.querySelector('.prompt-input');
            const isExpanded = promptInputContainer.classList.contains('expanded');
            
            // Show expand button when in compact mode and no text
            if (!isExpanded && !hasText && !hasAttachments && !isSending) {
                expandButton.style.display = 'block';
                sendButton.style.display = 'none';
            } else {
                expandButton.style.display = 'none';
                sendButton.style.display = 'block';
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

        // Close all dropdowns
        function closeAllDropdowns() {
            closeUploadMenu();
            closeCaptureMenu();
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
            if (!dropdown || !dropdown.classList.contains('open')) return;
            const menuRect = dropdown.getBoundingClientRect();
            const overflow = Math.ceil(menuRect.bottom + 12 - window.innerHeight); // Reduced padding for compact dropdowns
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
        uploadButton.addEventListener('click', handleUpload);
        captureButton.addEventListener('click', handleCapture);
        lightingButton.addEventListener('click', toggleLighting);
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
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (uploadDropdown.classList.contains('open')) {
                    closeUploadMenu();
                    uploadButton.focus();
                } else if (captureDropdown.classList.contains('open')) {
                    closeCaptureMenu();
                    captureButton.focus();
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
    
    