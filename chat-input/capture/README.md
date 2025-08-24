# Screen Capture API

A comprehensive screen capture system for Buddy's chat input window, providing screenshot, video recording, and audio recording capabilities using Electron's `desktopCapturer` API.

## Features

- **Screenshot Capture**: High-quality desktop and window screenshots
- **Video Recording**: Screen recording with audio support
- **Audio Recording**: System and microphone audio capture
- **Media Management**: File validation, optimization, and format handling
- **Error Handling**: Comprehensive error handling and user feedback

## Architecture

```
capture/
├── README.md                 # This documentation
├── index.js                  # Main API entry point
├── utils/
│   ├── media-utils.js        # Media file handling utilities
│   ├── capture-base.js       # Base capture functionality
│   └── format-converter.js   # Media format conversion
├── handlers/
│   ├── screenshot.js         # Screenshot capture
│   ├── video-recorder.js     # Video recording
│   └── audio-recorder.js     # Audio recording
└── preload/
    └── capture-preload.js    # Preload script for renderer
```

## Usage

### Main Process (Node.js)

```javascript
const CaptureAPI = require('./capture');

// Create capture API instance
const captureAPI = new CaptureAPI();

// Take screenshot
const result = await captureAPI.takeScreenshot();

// Start video recording
const videoResult = await captureAPI.startVideoRecording({
    quality: 'medium',
    includeAudio: true
});

// Start audio recording
const audioResult = await captureAPI.startAudioRecording({
    source: 'microphone',
    quality: 'high'
});
```

### Renderer Process (Browser)

```javascript
// Quick screenshot
const result = await window.chatInputAPI.quickScreenshot();

// Start video recording
const recording = await window.chatInputAPI.startVideoRecording({
    quality: 'high',
    includeAudio: true
});

// Start audio recording  
const audioRecording = await window.chatInputAPI.startAudioRecording({
    source: 'microphone'
});

// Stop recording
const stopResult = await window.chatInputAPI.stopVideoRecording(recording.recordingId);
```

## Integration

The capture API is designed to integrate seamlessly with the chat input window's existing UI and provides IPC handlers for renderer process communication.
