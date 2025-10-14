# Capture API - Quick Reference (Optimized)

## 📸 Screenshots

### Quick Screenshot
```javascript
// Fastest way - captures primary screen
const result = await window.chatInputAPI.quickScreenshot();
console.log(result.screenshot.data); // base64 data URL
```

### Custom Screenshot
```javascript
// With options
const result = await window.chatInputAPI.takeScreenshot({
    quality: 1.0,
    format: 'png',
    name: 'my-screenshot.png'
});
```

### Window Screenshot
```javascript
// First, get available sources
const sources = await window.chatInputAPI.getScreenshotSources(true);
const windowId = sources.sources[0].id;

// Then capture specific window
const result = await window.chatInputAPI.takeWindowScreenshot(windowId);
```

## 🎥 Video Recording

### Start Recording
```javascript
// High quality with audio
const result = await window.chatInputAPI.startVideoRecording({
    quality: 'high',  // 'low', 'medium', 'high'
    includeAudio: true
});

const recordingId = result.recordingId;
```

### Control Recording
```javascript
// Pause
await window.chatInputAPI.pauseVideoRecording(recordingId);

// Resume
await window.chatInputAPI.resumeVideoRecording(recordingId);

// Stop and get video file
const result = await window.chatInputAPI.stopVideoRecording(recordingId);
console.log(result.video); // Video file with data URL
```

### Auto-Stop Recording
```javascript
// Record for 10 seconds then auto-stop
const result = await window.chatInputAPI.recordScreen(10);
// Returns immediately with recordingId
// Will stop automatically after 10 seconds
```

## 🎤 Audio Recording

### Start Recording
```javascript
// Microphone recording
const result = await window.chatInputAPI.startAudioRecording({
    source: 'microphone',  // 'microphone', 'system', 'both'
    quality: 'high',       // 'low', 'medium', 'high'
    echoCancellation: true,
    noiseSuppression: true
});

const recordingId = result.recordingId;
```

### With Volume Monitoring
```javascript
// Set up volume callback
window.chatInputAPI.onVolumeChange((data) => {
    console.log('Volume level:', data.volume); // 0-100
});

// Start recording
await window.chatInputAPI.startAudioRecording({
    source: 'microphone'
});
```

### Stop Recording
```javascript
const result = await window.chatInputAPI.stopAudioRecording(recordingId);
console.log(result.audio); // Audio file with data URL
```

## 📊 Status & Management

### Check Recording Status
```javascript
const status = await window.chatInputAPI.getRecordingStatus(recordingId);
console.log(status);
// {
//   exists: true,
//   type: 'video',
//   state: 'recording',
//   duration: 5.2,
//   chunksCount: 5
// }
```

### List Active Recordings
```javascript
const recordings = await window.chatInputAPI.getActiveRecordings();
console.log(recordings);
// [
//   { id: 'video_1', type: 'video', startTime: 1699999999, duration: 10.5 },
//   { id: 'audio_1', type: 'audio', startTime: 1699999998, duration: 15.2 }
// ]
```

### Stop All Recordings
```javascript
const results = await window.chatInputAPI.stopAllRecordings();
console.log(results);
// [
//   { recordingId: 'video_1', type: 'video', result: { success: true, video: {...} } },
//   { recordingId: 'audio_1', type: 'audio', result: { success: true, audio: {...} } }
// ]
```

## 🔧 Utility Methods

### Check Support
```javascript
const support = await window.chatInputAPI.checkCaptureSupport();
console.log(support);
// {
//   screenshot: true,
//   videoRecording: true,
//   audioRecording: true,
//   desktopCapturer: true
// }
```

### Get Supported Formats
```javascript
const formats = await window.chatInputAPI.getSupportedFormats();
console.log(formats);
// {
//   video: ['video/webm;codecs=vp9,opus', 'video/webm', ...],
//   audio: ['audio/webm;codecs=opus', 'audio/webm', ...],
//   image: ['image/png', 'image/jpeg', 'image/webp']
// }
```

## 🎬 Complete Examples

### Example 1: Screenshot Button
```javascript
document.getElementById('screenshot-btn').addEventListener('click', async () => {
    const result = await window.chatInputAPI.quickScreenshot();
    
    if (result.success) {
        // Display screenshot
        const img = document.createElement('img');
        img.src = result.screenshot.data;
        document.body.appendChild(img);
    } else {
        console.error('Screenshot failed:', result.error);
    }
});
```

### Example 2: Video Recording with UI
```javascript
let currentRecording = null;

// Start recording
async function startRecording() {
    const result = await window.chatInputAPI.startVideoRecording({
        quality: 'medium',
        includeAudio: true
    });
    
    if (result.success) {
        currentRecording = result.recordingId;
        updateUI('recording');
        startTimer();
    }
}

// Stop recording
async function stopRecording() {
    if (!currentRecording) return;
    
    const result = await window.chatInputAPI.stopVideoRecording(currentRecording);
    
    if (result.success) {
        // Video file available
        const video = document.createElement('video');
        video.src = result.video.data;
        video.controls = true;
        document.body.appendChild(video);
        
        updateUI('stopped');
        stopTimer();
        currentRecording = null;
    }
}
```

### Example 3: Audio Recording with Volume Meter
```javascript
let currentAudioRecording = null;
let volumeMeter = document.getElementById('volume-meter');

// Setup volume monitoring
window.chatInputAPI.onVolumeChange((data) => {
    volumeMeter.style.width = data.volume + '%';
});

// Start audio recording
async function startAudio() {
    const result = await window.chatInputAPI.startAudioRecording({
        source: 'microphone',
        quality: 'high'
    });
    
    if (result.success) {
        currentAudioRecording = result.recordingId;
    }
}

// Stop audio recording
async function stopAudio() {
    const result = await window.chatInputAPI.stopAudioRecording(currentAudioRecording);
    
    if (result.success) {
        // Play back the recorded audio
        const audio = new Audio(result.audio.data);
        audio.play();
    }
}
```

## 🎨 Result Objects

### Screenshot Result
```javascript
{
    success: true,
    screenshot: {
        name: 'screenshot-1699999999999.png',
        type: 'image/png',
        size: 152468,
        data: 'data:image/png;base64,...',
        source: 'screenshot',
        dimensions: { width: 1920, height: 1080 },
        timestamp: 1699999999999,
        sourceInfo: {
            id: 'screen:0:0',
            name: 'Entire Screen',
            displayId: '2779098405'
        }
    }
}
```

### Video Recording Result
```javascript
{
    success: true,
    video: {
        name: 'recording-1699999999999.webm',
        type: 'video/webm;codecs=vp9,opus',
        size: 5242880,
        data: 'data:video/webm;base64,... or blob:...',
        mediaType: 'video',
        source: 'recording',
        timestamp: 1699999999999,
        duration: 15.5,
        recordingInfo: {
            startTime: 1699999984500,
            endTime: 1699999999999,
            quality: 'medium',
            includeAudio: true
        }
    },
    metadata: {
        duration: 15.5,
        size: 5242880,
        quality: 'medium'
    }
}
```

### Audio Recording Result
```javascript
{
    success: true,
    audio: {
        name: 'audio-recording-1699999999999.webm',
        type: 'audio/webm;codecs=opus',
        size: 524288,
        data: 'data:audio/webm;base64,...',
        mediaType: 'audio',
        source: 'recording',
        timestamp: 1699999999999,
        duration: 10.2,
        recordingInfo: {
            startTime: 1699999989800,
            endTime: 1699999999999,
            source: 'microphone',
            quality: 'high',
            sampleRate: 48000,
            channelCount: 2
        }
    },
    metadata: {
        duration: 10.2,
        size: 524288,
        source: 'microphone',
        quality: 'high'
    }
}
```

## ⚠️ Error Handling

### Always Check Success
```javascript
const result = await window.chatInputAPI.quickScreenshot();

if (result.success) {
    // Use result.screenshot
} else {
    console.error('Error:', result.error);
    // Show error to user
}
```

### Common Errors
- `'No screen sources available'` - System issue
- `'Recording already in progress'` - Stop current before starting new
- `'No recording in progress'` - Recording doesn't exist or already stopped
- `'Microphone access denied'` - User denied permission

## 🔄 Cleanup

### Manual Cleanup
```javascript
// Stop all recordings when window closes
window.addEventListener('beforeunload', async () => {
    await window.chatInputAPI.stopAllRecordings();
});
```

### Memory Management
```javascript
// If using object URLs (video recordings), revoke them when done
if (result.video.isObjectUrl) {
    // Use the video...
    video.src = result.video.data;
    
    // Later, when no longer needed:
    URL.revokeObjectURL(result.video.data);
}
```

## 📌 Tips & Best Practices

1. **Screenshots**
   - Use `quickScreenshot()` for speed
   - PNG format for quality, JPEG for smaller size

2. **Video Recording**
   - 'medium' quality is good balance
   - Include audio for better recordings
   - Stop recording before window closes

3. **Audio Recording**
   - Use echo cancellation for microphone
   - Monitor volume to ensure audio is being captured
   - High quality for best results

4. **Performance**
   - Avoid multiple simultaneous high-quality recordings
   - Clean up recordings when done
   - Use appropriate quality settings

5. **Error Handling**
   - Always check `success` property
   - Handle permission denials gracefully
   - Provide user feedback

---

**All methods return promises** - use `async/await` or `.then()`  
**All capture operations are non-blocking** - UI stays responsive  
**Resource cleanup is automatic** - but manual cleanup recommended
