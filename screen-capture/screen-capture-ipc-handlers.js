const { ipcMain, desktopCapturer, screen } = require('electron');
const { ScreenCaptureWindowManager } = require('./screen-capture-window-manager');
const { saveDebugAudio, analyzeAudioBuffer, AudioRecordingSession } = require('./audio-utils');

class ScreenCaptureIpcHandlers {
    constructor() {
        this.windowManager = null;
        this.audioSession = null;
        this.handlersRegistered = false;
    }

    setWindowManager(windowManager) {
        this.windowManager = windowManager;
    }

    registerHandlers() {
        if (this.handlersRegistered) {
            console.log('Screen Capture: IPC handlers already registered');
            return;
        }

        try {
            // Window management handlers
            this.registerWindowHandlers();
            
            // Screen source handlers
            this.registerScreenSourceHandlers();
            
            // Recording control handlers
            this.registerRecordingHandlers();
            
            // Audio utility handlers
            this.registerAudioHandlers();
            
            // Security and logging handlers
            this.registerSecurityHandlers();

            this.handlersRegistered = true;
            console.log('Screen Capture: All IPC handlers registered successfully');
        } catch (error) {
            console.error('Screen Capture: Failed to register IPC handlers:', error);
        }
    }

    registerWindowHandlers() {
        // Create or show screen capture window
        ipcMain.handle('screen-capture-create-window', () => {
            try {
                if (!this.windowManager) {
                    this.windowManager = new ScreenCaptureWindowManager();
                }
                return this.windowManager.createScreenCaptureWindow();
            } catch (error) {
                console.error('Screen Capture: Failed to create window:', error);
                return null;
            }
        });

        // Close screen capture window
        ipcMain.handle('screen-capture-close-window', () => {
            try {
                if (this.windowManager) {
                    this.windowManager.closeWindow();
                }
                return true;
            } catch (error) {
                console.error('Screen Capture: Failed to close window:', error);
                return false;
            }
        });

        // Minimize screen capture window
        ipcMain.handle('screen-capture-minimize-window', () => {
            try {
                if (this.windowManager && this.windowManager.getCurrentWindow()) {
                    this.windowManager.getCurrentWindow().minimize();
                }
                return true;
            } catch (error) {
                console.error('Screen Capture: Failed to minimize window:', error);
                return false;
            }
        });

        // Show screen capture window
        ipcMain.handle('screen-capture-show-window', () => {
            try {
                if (this.windowManager) {
                    this.windowManager.showWindow();
                }
                return true;
            } catch (error) {
                console.error('Screen Capture: Failed to show window:', error);
                return false;
            }
        });

        // Hide screen capture window
        ipcMain.handle('screen-capture-hide-window', () => {
            try {
                if (this.windowManager) {
                    this.windowManager.hideWindow();
                }
                return true;
            } catch (error) {
                console.error('Screen Capture: Failed to hide window:', error);
                return false;
            }
        });
    }

    registerScreenSourceHandlers() {
        // Get available screen sources
        ipcMain.handle('screen-capture-get-sources', async () => {
            try {
                const sources = await desktopCapturer.getSources({
                    types: ['window', 'screen'],
                    thumbnailSize: { width: 320, height: 240 },
                    fetchWindowIcons: true
                });
                
                return sources.map(source => ({
                    id: source.id,
                    name: source.name,
                    thumbnail: source.thumbnail.toDataURL(),
                    appIcon: source.appIcon ? source.appIcon.toDataURL() : null
                }));
            } catch (error) {
                console.error('Screen Capture: Failed to get screen sources:', error);
                return [];
            }
        });

        // Get screen information
        ipcMain.handle('screen-capture-get-screen-info', () => {
            try {
                const displays = screen.getAllDisplays();
                const primaryDisplay = screen.getPrimaryDisplay();
                
                return {
                    displays: displays.map(display => ({
                        id: display.id,
                        bounds: display.bounds,
                        workArea: display.workArea,
                        scaleFactor: display.scaleFactor,
                        rotation: display.rotation,
                        internal: display.internal
                    })),
                    primary: {
                        id: primaryDisplay.id,
                        bounds: primaryDisplay.bounds,
                        workArea: primaryDisplay.workArea,
                        scaleFactor: primaryDisplay.scaleFactor
                    }
                };
            } catch (error) {
                console.error('Screen Capture: Failed to get screen info:', error);
                return null;
            }
        });
    }

    registerRecordingHandlers() {
        // Start recording
        ipcMain.handle('screen-capture-start-recording', (event, type, sourceId = null) => {
            try {
                if (!this.windowManager) {
                    console.error('Screen Capture: Window manager not available');
                    return false;
                }

                // Initialize audio session for audio recording
                if (type === 'audio') {
                    this.audioSession = new AudioRecordingSession({
                        sampleRate: 24000,
                        channels: 1,
                        bitDepth: 16
                    });
                    this.audioSession.startSession();
                }

                const success = this.windowManager.startRecording(type, sourceId);
                
                if (success) {
                    console.log(`Screen Capture: Started ${type} recording${sourceId ? ` from source: ${sourceId}` : ''}`);
                    
                    // Log security event
                    this.logSecurityEvent('RECORDING_STARTED', {
                        type,
                        sourceId,
                        timestamp: Date.now(),
                        sessionId: this.audioSession ? this.audioSession.sessionId : null
                    });
                }
                
                return success;
            } catch (error) {
                console.error('Screen Capture: Failed to start recording:', error);
                return false;
            }
        });

        // Stop recording
        ipcMain.handle('screen-capture-stop-recording', () => {
            try {
                if (!this.windowManager) {
                    console.error('Screen Capture: Window manager not available');
                    return false;
                }

                const success = this.windowManager.stopRecording();
                
                // Stop audio session if active
                if (this.audioSession && this.audioSession.isRecording) {
                    const sessionData = this.audioSession.stopSession();
                    console.log('Screen Capture: Audio session stopped:', sessionData.sessionId);
                    this.audioSession = null;
                }
                
                if (success) {
                    console.log('Screen Capture: Recording stopped');
                    
                    // Log security event
                    this.logSecurityEvent('RECORDING_STOPPED', {
                        timestamp: Date.now()
                    });
                }
                
                return success;
            } catch (error) {
                console.error('Screen Capture: Failed to stop recording:', error);
                return false;
            }
        });

        // Get recording status
        ipcMain.handle('screen-capture-get-recording-status', () => {
            try {
                if (!this.windowManager) {
                    return { isRecording: false, type: null };
                }

                return {
                    isRecording: this.windowManager.isRecording,
                    type: this.windowManager.recordingType,
                    audioSessionActive: this.audioSession ? this.audioSession.isRecording : false,
                    audioSessionId: this.audioSession ? this.audioSession.sessionId : null
                };
            } catch (error) {
                console.error('Screen Capture: Failed to get recording status:', error);
                return { isRecording: false, type: null };
            }
        });
    }

    registerAudioHandlers() {
        // Save debug audio
        ipcMain.handle('screen-capture-save-debug-audio', (event, buffer, type) => {
            try {
                const bufferData = Buffer.from(buffer);
                const result = saveDebugAudio(bufferData, type);
                console.log('Screen Capture: Debug audio saved:', result.wavPath);
                return result;
            } catch (error) {
                console.error('Screen Capture: Failed to save debug audio:', error);
                return null;
            }
        });

        // Analyze audio buffer
        ipcMain.handle('screen-capture-analyze-audio', (event, buffer, label) => {
            try {
                const bufferData = Buffer.from(buffer);
                const analysis = analyzeAudioBuffer(bufferData, label);
                return analysis;
            } catch (error) {
                console.error('Screen Capture: Failed to analyze audio buffer:', error);
                return null;
            }
        });

        // Add audio chunk to current session
        ipcMain.handle('screen-capture-add-audio-chunk', (event, buffer) => {
            try {
                if (!this.audioSession || !this.audioSession.isRecording) {
                    console.warn('Screen Capture: No active audio session to add chunk to');
                    return false;
                }

                const bufferData = Buffer.from(buffer);
                return this.audioSession.addAudioChunk(bufferData);
            } catch (error) {
                console.error('Screen Capture: Failed to add audio chunk:', error);
                return false;
            }
        });

        // Get audio session info
        ipcMain.handle('screen-capture-get-audio-session-info', () => {
            try {
                if (!this.audioSession) {
                    return null;
                }

                return {
                    sessionId: this.audioSession.sessionId,
                    isRecording: this.audioSession.isRecording,
                    startTime: this.audioSession.startTime,
                    sampleRate: this.audioSession.sampleRate,
                    channels: this.audioSession.channels,
                    bitDepth: this.audioSession.bitDepth,
                    chunkCount: this.audioSession.audioChunks.length
                };
            } catch (error) {
                console.error('Screen Capture: Failed to get audio session info:', error);
                return null;
            }
        });
    }

    registerSecurityHandlers() {
        // Log security events
        ipcMain.handle('screen-capture-log-security', (event, eventType, data) => {
            this.logSecurityEvent(eventType, data);
            return true;
        });

        // Get content protection status
        ipcMain.handle('screen-capture-get-content-protection', () => {
            try {
                if (this.windowManager && this.windowManager.getCurrentWindow()) {
                    return this.windowManager.contentProtectionEnabled;
                }
                return false;
            } catch (error) {
                console.error('Screen Capture: Failed to get content protection status:', error);
                return false;
            }
        });

        // Force content protection refresh
        ipcMain.handle('screen-capture-refresh-protection', () => {
            try {
                if (this.windowManager) {
                    this.windowManager.applyMaximumContentProtection();
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Screen Capture: Failed to refresh content protection:', error);
                return false;
            }
        });

        // Get security status
        ipcMain.handle('screen-capture-get-security-status', () => {
            try {
                const window = this.windowManager ? this.windowManager.getCurrentWindow() : null;
                
                return {
                    windowExists: !!window,
                    contentProtectionEnabled: this.windowManager ? this.windowManager.contentProtectionEnabled : false,
                    alwaysOnTop: window ? window.isAlwaysOnTop() : false,
                    isVisible: window ? window.isVisible() : false,
                    isFocused: window ? window.isFocused() : false,
                    bounds: window ? window.getBounds() : null
                };
            } catch (error) {
                console.error('Screen Capture: Failed to get security status:', error);
                return null;
            }
        });
    }

    logSecurityEvent(eventType, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            event: eventType,
            module: 'SCREEN_CAPTURE',
            data: data || {}
        };

        console.log(`Screen Capture Security: [${timestamp}] ${eventType}:`, data);
        
        // In a production environment, you might want to send this to a secure logging service
        // or write to a secure log file
    }

    // Cleanup method
    cleanup() {
        try {
            // Stop any active recording
            if (this.windowManager && this.windowManager.isRecording) {
                this.windowManager.stopRecording();
            }

            // Stop audio session
            if (this.audioSession && this.audioSession.isRecording) {
                this.audioSession.stopSession();
                this.audioSession = null;
            }

            // Close window
            if (this.windowManager) {
                this.windowManager.closeWindow();
                this.windowManager = null;
            }

            console.log('Screen Capture: Cleanup completed');
        } catch (error) {
            console.error('Screen Capture: Error during cleanup:', error);
        }
    }
}

// Export singleton instance
const screenCaptureIpcHandlers = new ScreenCaptureIpcHandlers();

module.exports = { screenCaptureIpcHandlers, ScreenCaptureIpcHandlers };

