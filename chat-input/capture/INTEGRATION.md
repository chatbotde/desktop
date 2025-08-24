# Capture API Integration Guide

This guide shows how to integrate the new Capture API with your chat input window.

## Quick Start

The capture API is already integrated into the chat input window. You can use it directly from the renderer process:

### Taking Screenshots

```javascript
// Quick screenshot
const result = await window.chatInputAPI.quickScreenshot();
if (result.success) {
    addImageAttachment(result.screenshot);
}

// Screenshot with options
const result = await window.chatInputAPI.takeScreenshot({
    format: 'png',
    quality: 1.0,
    name: 'custom-screenshot.png'
});

// Get available sources first
const sources = await window.chatInputAPI.getScreenshotSources(true);
// Then take screenshot of specific source
const result = await window.chatInputAPI.takeWindowScreenshot(sources[0].id);
```

### Video Recording

```javascript
// Start recording
const startResult = await window.chatInputAPI.startVideoRecording({
    quality: 'high',
    includeAudio: true
});

if (startResult.success) {
    const recordingId = startResult.recordingId;
    
    // Stop recording after some time
    setTimeout(async () => {
        const stopResult = await window.chatInputAPI.stopVideoRecording(recordingId);
        if (stopResult.success) {
            addMediaAttachment(stopResult.video);
        }
    }, 10000); // 10 seconds
}

// Pause/Resume recording
await window.chatInputAPI.pauseVideoRecording(recordingId);
await window.chatInputAPI.resumeVideoRecording(recordingId);
```

### Audio Recording

```javascript
// Start audio recording
const startResult = await window.chatInputAPI.startAudioRecording({
    source: 'microphone', // 'microphone', 'system', 'both'
    quality: 'medium'
});

if (startResult.success) {
    const recordingId = startResult.recordingId;
    
    // Stop recording
    const stopResult = await window.chatInputAPI.stopAudioRecording(recordingId);
    if (stopResult.success) {
        addMediaAttachment(stopResult.audio);
    }
}
```

## Integration with Chat Input UI

### Updating Handler Functions

Update your existing capture handler functions in `chat-input.js`:

```javascript
// Updated desktop capture function
async function handleDesktopCapture() {
    try {
        // Option 1: Quick screenshot
        const result = await window.chatInputAPI.quickScreenshot();
        if (result.success) {
            addImageAttachment(result.screenshot);
        }
    } catch (error) {
        console.error('Desktop capture failed:', error);
    }
}

// Updated audio capture function
async function handleAudioCapture() {
    try {
        if (isRecording && currentRecordingType === 'audio') {
            // Stop current recording
            if (window.currentAudioRecordingId) {
                const result = await window.chatInputAPI.stopAudioRecording(window.currentAudioRecordingId);
                if (result.success) {
                    addMediaAttachment(result.audio);
                }
                window.currentAudioRecordingId = null;
            }
            hideRecordingState();
        } else {
            // Start new recording
            showRecordingState('audio');
            const result = await window.chatInputAPI.startAudioRecording({
                source: 'microphone',
                quality: 'medium'
            });
            
            if (result.success) {
                window.currentAudioRecordingId = result.recordingId;
                isRecording = true;
                currentRecordingType = 'audio';
            } else {
                hideRecordingState();
                console.error('Failed to start audio recording:', result.error);
            }
        }
    } catch (error) {
        hideRecordingState();
        console.error('Audio capture error:', error);
    }
}

// Video capture function
async function handleVideoCapture() {
    try {
        if (isRecording && currentRecordingType === 'video') {
            // Stop current recording
            if (window.currentVideoRecordingId) {
                const result = await window.chatInputAPI.stopVideoRecording(window.currentVideoRecordingId);
                if (result.success) {
                    addMediaAttachment(result.video);
                }
                window.currentVideoRecordingId = null;
            }
            hideRecordingState();
        } else {
            // Start new recording
            showRecordingState('video');
            const result = await window.chatInputAPI.startVideoRecording({
                quality: 'medium',
                includeAudio: true
            });
            
            if (result.success) {
                window.currentVideoRecordingId = result.recordingId;
                isRecording = true;
                currentRecordingType = 'video';
            } else {
                hideRecordingState();
                console.error('Failed to start video recording:', result.error);
            }
        }
    } catch (error) {
        hideRecordingState();
        console.error('Video capture error:', error);
    }
}
```

### Event Listeners for Recording Progress

```javascript
// Listen for recording progress
window.chatInputAPI.onRecordingProgress((data) => {
    console.log('Recording progress:', data);
    updateRecordingUI(data);
});

// Listen for volume changes during audio recording
window.chatInputAPI.onVolumeChange((data) => {
    console.log('Volume level:', data.volume);
    updateVolumeIndicator(data.volume);
});

// Listen for recording errors
window.chatInputAPI.onRecordingError((data) => {
    console.error('Recording error:', data);
    hideRecordingState();
});
```

## Advanced Usage

### Custom Recording Options

```javascript
// High-quality video recording with custom settings
const result = await window.chatInputAPI.startVideoRecording({
    quality: 'high',
    includeAudio: true,
    videoBitsPerSecond: 4000000, // 4 Mbps
    audioBitsPerSecond: 192000   // 192 kbps
});

// Audio recording with volume monitoring
const result = await window.chatInputAPI.startAudioRecording({
    source: 'microphone',
    quality: 'high',
    sampleRate: 48000,
    channelCount: 2,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
});
```

### Managing Multiple Recordings

```javascript
// Get all active recordings
const activeRecordings = await window.chatInputAPI.getActiveRecordings();
console.log('Active recordings:', activeRecordings);

// Stop all recordings
const results = await window.chatInputAPI.stopAllRecordings();
console.log('Stop results:', results);

// Check specific recording status
const status = await window.chatInputAPI.getRecordingStatus(recordingId);
console.log('Recording status:', status);
```

### Checking Support and Capabilities

```javascript
// Check what capture features are supported
const support = await window.chatInputAPI.checkCaptureSupport();
console.log('Capture support:', support);

// Get supported formats
const formats = await window.chatInputAPI.getSupportedFormats();
console.log('Supported formats:', formats);
```

## Error Handling

Always implement proper error handling:

```javascript
async function safeCaptureOperation() {
    try {
        const result = await window.chatInputAPI.quickScreenshot();
        
        if (result.success) {
            // Success
            handleSuccess(result.screenshot);
        } else {
            // API returned error
            console.error('Capture failed:', result.error);
            showUserError('Screenshot capture failed: ' + result.error);
        }
    } catch (error) {
        // Exception thrown
        console.error('Capture exception:', error);
        showUserError('An unexpected error occurred during capture');
    }
}
```

## Cleanup

The capture API automatically cleans up resources when the window is closed, but you can also manually clean up:

```javascript
// Stop all recordings before closing
window.addEventListener('beforeunload', async () => {
    await window.chatInputAPI.stopAllRecordings();
});
```

## Migration from Old API

If you're migrating from the old capture implementation:

### Old Code:
```javascript
const result = await window.chatInputAPI.captureDesktop();
```

### New Code:
```javascript
const result = await window.chatInputAPI.quickScreenshot();
```

The old `captureDesktop` method is still available for backward compatibility, but it's recommended to use the new methods for better functionality and error handling.
