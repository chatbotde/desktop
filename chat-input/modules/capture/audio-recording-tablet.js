/**
 * Audio Recording Tablet Manager
 * Handles the audio recording tablet UI with start/stop/pause/send functionality
 * Supports microphone, system audio, and combined recording
 */

import { addMediaAttachment } from '../media/richmedia.js';

class AudioRecordingTablet {
    constructor() {
        this.tablet = null;
        this.recordingId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.isPreviewPlaying = false;
        this.timerInterval = null;
        this.pendingAudio = null;
        this.filePath = null;
        this.audioSource = 'microphone'; // 'microphone', 'system', 'both'
        this.rendererAPI = null;
    }

    /**
     * Get or create renderer capture API instance
     */
    getRendererAPI() {
        if (!this.rendererAPI && window.RendererCaptureAPI) {
            this.rendererAPI = new window.RendererCaptureAPI();
        }
        return this.rendererAPI || window.rendererCaptureAPI;
    }

    /**
     * Show the audio recording tablet
     */
    show() {
        this.tablet = document.getElementById('audioRecordingTablet');
        if (!this.tablet) {
            console.error('Audio recording tablet element not found');
            return;
        }

        this.tablet.style.display = 'block';
        this.resetState();
        this.bindEvents();
    }

    /**
     * Hide the audio recording tablet
     */
    hide() {
        // Stop preview if playing
        this.hidePreview();
        
        if (this.tablet) {
            this.tablet.style.display = 'none';
        }
        this.cleanup();
    }

    /**
     * Reset the tablet state
     */
    resetState() {
        this.recordingId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.isPreviewPlaying = false;
        this.pendingAudio = null;
        this.filePath = null;
        // Keep audioSource as last selected

        // Hide preview section
        this.hidePreview();

        // Reset UI
        this.tablet.classList.remove('recording', 'paused');
        this.updateTimer(0);
        this.showButton('start');
        
        // Show source selection
        const sourceSelection = document.getElementById('artSourceSelection');
        if (sourceSelection) {
            sourceSelection.style.display = 'flex';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const startBtn = document.getElementById('artStartBtn');
        const stopBtn = document.getElementById('artStopBtn');
        const pauseBtn = document.getElementById('artPauseBtn');
        const resumeBtn = document.getElementById('artResumeBtn');
        const sendBtn = document.getElementById('artSendBtn');
        const closeBtn = document.getElementById('artCloseBtn');

        // Source selection buttons
        const sourceBtns = document.querySelectorAll('.art-source-btn');
        sourceBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                this.selectSource(newBtn.getAttribute('data-source'));
            });
        });

        // Restore active state for source buttons
        this.updateSourceButtonStates();

        // Remove existing listeners by cloning
        if (startBtn) {
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            newStartBtn.addEventListener('click', () => this.startRecording());
        }

        if (stopBtn) {
            const newStopBtn = stopBtn.cloneNode(true);
            stopBtn.parentNode.replaceChild(newStopBtn, stopBtn);
            newStopBtn.addEventListener('click', () => this.stopRecording());
        }

        if (pauseBtn) {
            const newPauseBtn = pauseBtn.cloneNode(true);
            pauseBtn.parentNode.replaceChild(newPauseBtn, pauseBtn);
            newPauseBtn.addEventListener('click', () => this.pauseRecording());
        }

        if (resumeBtn) {
            const newResumeBtn = resumeBtn.cloneNode(true);
            resumeBtn.parentNode.replaceChild(newResumeBtn, resumeBtn);
            newResumeBtn.addEventListener('click', () => this.resumeRecording());
        }

        if (sendBtn) {
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            newSendBtn.addEventListener('click', () => this.sendRecording());
        }

        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => this.close());
        }

        // Preview controls
        const previewPlayBtn = document.getElementById('artPreviewPlayBtn');
        const rerecordBtn = document.getElementById('artRerecordBtn');
        const previewProgress = document.getElementById('artPreviewProgress');
        const previewAudio = document.getElementById('artPreviewAudio');

        if (previewPlayBtn) {
            const newPreviewPlayBtn = previewPlayBtn.cloneNode(true);
            previewPlayBtn.parentNode.replaceChild(newPreviewPlayBtn, previewPlayBtn);
            newPreviewPlayBtn.addEventListener('click', () => this.togglePreviewPlayback());
        }

        if (rerecordBtn) {
            const newRerecordBtn = rerecordBtn.cloneNode(true);
            rerecordBtn.parentNode.replaceChild(newRerecordBtn, rerecordBtn);
            newRerecordBtn.addEventListener('click', () => this.rerecord());
        }

        if (previewProgress) {
            previewProgress.addEventListener('click', (e) => this.seekPreview(e));
        }

        if (previewAudio) {
            previewAudio.addEventListener('timeupdate', () => this.updatePreviewProgress());
            previewAudio.addEventListener('ended', () => this.onPreviewEnded());
        }
    }

    /**
     * Select audio source
     */
    selectSource(source) {
        if (this.isRecording) return; // Can't change during recording
        
        this.audioSource = source;
        this.updateSourceButtonStates();
        console.log('Audio source selected:', source);
    }

    /**
     * Update source button visual states
     */
    updateSourceButtonStates() {
        const sourceBtns = document.querySelectorAll('.art-source-btn');
        sourceBtns.forEach(btn => {
            const btnSource = btn.getAttribute('data-source');
            if (btnSource === this.audioSource) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Get source display name
     */
    getSourceDisplayName() {
        switch (this.audioSource) {
            case 'microphone': return 'Microphone';
            case 'system': return 'System Audio';
            case 'both': return 'Mic + System';
            default: return 'Microphone';
        }
    }

    /**
     * Start audio recording
     */
    async startRecording() {
        try {
            // Store current source for attachment info
            this.currentSource = this.audioSource;

            const recordingOptions = {
                source: this.audioSource,
                echoCancellation: this.audioSource !== 'system',
                noiseSuppression: this.audioSource !== 'system',
                autoGainControl: this.audioSource !== 'system',
                processingEnabled: false,
                timesliceMs: 500
            };

            console.log('Starting audio recording with options:', recordingOptions);

            // Use direct browser APIs (not IPC to main process)
            let result;
            if (this.audioSource === 'microphone') {
                result = await this.startMicrophoneRecording(recordingOptions);
            } else if (this.audioSource === 'system') {
                result = await this.startSystemAudioRecording(null, recordingOptions);
            } else if (this.audioSource === 'both') {
                result = await this.startMixedAudioRecording(null, recordingOptions);
            } else {
                result = await this.startMicrophoneRecording(recordingOptions);
            }

            if (result.success) {
                this.recordingId = result.recordingId;
                this.isRecording = true;
                this.isPaused = false;
                this.startTime = Date.now();
                this.pausedTime = 0;

                // Update UI
                this.tablet.classList.add('recording');
                this.tablet.classList.remove('paused');
                this.showButton('stop', 'pause');
                this.startTimer();
                
                // Update source indicator
                const sourceIndicator = document.getElementById('artSourceName');
                if (sourceIndicator) {
                    sourceIndicator.textContent = this.getSourceDisplayName();
                }
                
                console.log('Audio recording started:', this.recordingId, 'Source:', this.audioSource);
            } else {
                console.error('Failed to start audio recording:', result.error);
                this.showError('Failed to start recording: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error starting audio recording:', error);
            this.showError('Error starting recording: ' + error.message);
        }
    }

    /**
     * Start microphone recording using direct browser APIs
     */
    async startMicrophoneRecording(options) {
        try {
            // Request microphone access directly
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                },
                video: false
            });

            // Store for cleanup
            this._micStream = stream;

            return this.createRecorderFromStream(stream, 'microphone');
        } catch (error) {
            console.error('Microphone recording error:', error);
            return { success: false, error: 'Microphone access denied: ' + error.message };
        }
    }

    /**
     * Start system audio recording
     */
    async startSystemAudioRecording(api, options) {
        try {
            // Get desktop sources for system audio
            const sources = await window.chatInputAPI?.getScreenshotSources?.(false);
            if (!sources?.success || !sources.sources?.length) {
                throw new Error('No screen sources available for system audio');
            }

            const screenSource = sources.sources.find(s => s.type === 'screen') || sources.sources[0];
            
            // Request system audio via desktop capturer
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: screenSource.id
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: screenSource.id,
                        maxWidth: 1,
                        maxHeight: 1
                    }
                }
            });

            // Remove video track, keep only audio
            stream.getVideoTracks().forEach(track => {
                track.stop();
                stream.removeTrack(track);
            });

            // Create recorder manually
            return this.createRecorderFromStream(stream, 'system');
        } catch (error) {
            console.error('System audio recording error:', error);
            return { success: false, error: 'System audio not available: ' + error.message };
        }
    }

    /**
     * Start mixed audio recording (mic + system)
     */
    async startMixedAudioRecording(api, options) {
        try {
            // Get microphone stream
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                },
                video: false
            });

            // Try to get system audio
            let systemStream = null;
            try {
                const sources = await window.chatInputAPI?.getScreenshotSources?.(false);
                if (sources?.success && sources.sources?.length) {
                    const screenSource = sources.sources.find(s => s.type === 'screen') || sources.sources[0];
                    
                    const sysStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: screenSource.id
                            }
                        },
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: screenSource.id,
                                maxWidth: 1,
                                maxHeight: 1
                            }
                        }
                    });

                    // Remove video track
                    sysStream.getVideoTracks().forEach(track => {
                        track.stop();
                        sysStream.removeTrack(track);
                    });
                    
                    systemStream = sysStream;
                }
            } catch (sysError) {
                console.warn('Could not capture system audio:', sysError.message);
            }

            // Mix streams using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();

            // Connect microphone
            const micSource = audioContext.createMediaStreamSource(micStream);
            const micGain = audioContext.createGain();
            micGain.gain.value = 1.0;
            micSource.connect(micGain);
            micGain.connect(destination);

            // Connect system audio if available
            if (systemStream && systemStream.getAudioTracks().length > 0) {
                const sysSource = audioContext.createMediaStreamSource(systemStream);
                const sysGain = audioContext.createGain();
                sysGain.gain.value = 0.8;
                sysSource.connect(sysGain);
                sysGain.connect(destination);
                console.log('Mixed audio: Recording both mic and system');
            } else {
                console.log('Mixed audio: Recording mic only (system unavailable)');
            }

            // Store for cleanup
            this._audioContext = audioContext;
            this._micStream = micStream;
            this._systemStream = systemStream;

            return this.createRecorderFromStream(destination.stream, 'both');
        } catch (error) {
            console.error('Mixed audio recording error:', error);
            return { success: false, error: 'Mixed audio recording failed: ' + error.message };
        }
    }

    /**
     * Create a MediaRecorder from a stream
     */
    createRecorderFromStream(stream, type) {
        const recordingId = `audio_tablet_${Date.now()}`;
        const recordedChunks = [];

        // Get supported MIME type
        const mimeType = this.getSupportedAudioMimeType();

        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            audioBitsPerSecond: 128000
        });

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        recorder.start(500);

        // Store recording data
        this._recorder = recorder;
        this._stream = stream;
        this._chunks = recordedChunks;
        this._mimeType = mimeType;

        return {
            success: true,
            recordingId: recordingId,
            message: `Audio recording started (${type})`
        };
    }

    /**
     * Get supported audio MIME type
     */
    getSupportedAudioMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    }

    /**
     * Stop audio recording
     */
    async stopRecording() {
        if (!this._recorder) return;

        // Store recording time before stopping
        if (this.startTime) {
            this.recordingTime = Date.now() - this.startTime;
        }

        try {
            return new Promise((resolve) => {
                this._recorder.onstop = async () => {
                    try {
                        // Create blob from chunks
                        const blob = new Blob(this._chunks, { type: this._mimeType });
                        
                        // Convert blob to base64 for storage/sending
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64Data = reader.result.split(',')[1];
                            
                            this.pendingAudio = {
                                data: base64Data,
                                mimeType: this._mimeType,
                                size: blob.size,
                                duration: this.recordingTime,
                                source: this.currentSource,
                                blob: blob // Keep blob for direct use if needed
                            };
                            
                            this.isRecording = false;
                            this.stopTimer();
                            
                            // Cleanup streams
                            this.cleanupStreams();

                            // Update UI - show send button
                            this.tablet.classList.remove('recording', 'paused');
                            this.showButton('send');

                            // Show preview
                            this.showPreview();

                            console.log('Audio recording stopped, ready to send');
                            resolve({ success: true, audio: this.pendingAudio });
                        };
                        reader.readAsDataURL(blob);
                    } catch (error) {
                        console.error('Error processing audio:', error);
                        this.showError('Error processing recording');
                        resolve({ success: false, error: error.message });
                    }
                };

                // Stop the recorder
                if (this._recorder.state !== 'inactive') {
                    this._recorder.stop();
                }
            });
        } catch (error) {
            console.error('Error stopping audio recording:', error);
            this.showError('Error stopping recording');
        }
    }

    /**
     * Cleanup media streams
     */
    cleanupStreams() {
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop());
            this._stream = null;
        }
        if (this._micStream) {
            this._micStream.getTracks().forEach(track => track.stop());
            this._micStream = null;
        }
        if (this._systemStream) {
            this._systemStream.getTracks().forEach(track => track.stop());
            this._systemStream = null;
        }
        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }
        this._recorder = null;
        this._chunks = [];
    }

    /**
     * Pause audio recording
     */
    async pauseRecording() {
        if (!this._recorder || !this.isRecording) return;

        try {
            if (this._recorder.state === 'recording') {
                this._recorder.pause();
                
                this.isPaused = true;
                this.pausedTime = Date.now() - this.startTime;

                // Update UI
                this.tablet.classList.add('paused');
                this.showButton('stop', 'resume');

                console.log('Audio recording paused');
                return { success: true };
            }
        } catch (error) {
            console.error('Error pausing audio recording:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Resume audio recording
     */
    async resumeRecording() {
        if (!this._recorder || !this.isPaused) return;

        try {
            if (this._recorder.state === 'paused') {
                this._recorder.resume();
                
                this.isPaused = false;
                this.startTime = Date.now() - this.pausedTime;

                // Update UI
                this.tablet.classList.remove('paused');
                this.showButton('stop', 'pause');

                console.log('Audio recording resumed');
                return { success: true };
            }
        } catch (error) {
            console.error('Error resuming audio recording:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send the recorded audio
     */
    async sendRecording() {
        if (!this.pendingAudio) {
            console.warn('No audio to send');
            return;
        }

        try {
            // Format for addMediaAttachment
            const audioAttachment = {
                name: `audio_recording_${Date.now()}.webm`,
                type: this.pendingAudio.mimeType || 'audio/webm',
                size: this.pendingAudio.size,
                data: `data:${this.pendingAudio.mimeType || 'audio/webm'};base64,${this.pendingAudio.data}`,
                mediaType: 'audio',
                source: `audio-${this.pendingAudio.source || 'microphone'}`,
                duration: this.pendingAudio.duration
            };

            // Add to attachments
            addMediaAttachment(audioAttachment);

            console.log('Audio attachment added');

            // Hide tablet and reset
            this.hide();
        } catch (error) {
            console.error('Error sending audio:', error);
            this.showError('Error sending audio');
        }
    }

    /**
     * Show the audio preview section
     */
    showPreview() {
        const preview = document.getElementById('artPreview');
        const previewAudio = document.getElementById('artPreviewAudio');
        const previewDuration = document.getElementById('artPreviewDuration');

        if (!preview || !previewAudio || !this.pendingAudio) return;

        // Set audio source
        const audioUrl = `data:${this.pendingAudio.mimeType || 'audio/webm'};base64,${this.pendingAudio.data}`;
        previewAudio.src = audioUrl;

        // Display duration
        if (previewDuration && this.pendingAudio.duration) {
            const seconds = Math.floor(this.pendingAudio.duration / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            previewDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        // Reset progress
        const progressBar = document.getElementById('artPreviewProgressBar');
        const previewTime = document.getElementById('artPreviewTime');
        if (progressBar) progressBar.style.width = '0%';
        if (previewTime) previewTime.textContent = '00:00';

        // Show preview section
        preview.style.display = 'block';
        this.isPreviewPlaying = false;
        this.updatePreviewPlayButton();
    }

    /**
     * Hide the audio preview section
     */
    hidePreview() {
        const preview = document.getElementById('artPreview');
        const previewAudio = document.getElementById('artPreviewAudio');

        if (previewAudio) {
            previewAudio.pause();
            previewAudio.currentTime = 0;
            previewAudio.src = '';
        }

        if (preview) {
            preview.style.display = 'none';
        }

        this.isPreviewPlaying = false;
    }

    /**
     * Toggle preview playback
     */
    togglePreviewPlayback() {
        const previewAudio = document.getElementById('artPreviewAudio');
        if (!previewAudio) return;

        if (this.isPreviewPlaying) {
            previewAudio.pause();
            this.isPreviewPlaying = false;
        } else {
            previewAudio.play();
            this.isPreviewPlaying = true;
        }

        this.updatePreviewPlayButton();
    }

    /**
     * Update the preview play button appearance
     */
    updatePreviewPlayButton() {
        const playBtn = document.getElementById('artPreviewPlayBtn');
        const playIcon = playBtn?.querySelector('.art-preview-play-icon');
        const pauseIcon = playBtn?.querySelector('.art-preview-pause-icon');

        if (playBtn) {
            playBtn.classList.toggle('playing', this.isPreviewPlaying);
        }

        if (playIcon && pauseIcon) {
            playIcon.style.display = this.isPreviewPlaying ? 'none' : 'block';
            pauseIcon.style.display = this.isPreviewPlaying ? 'block' : 'none';
        }
    }

    /**
     * Update preview progress bar
     */
    updatePreviewProgress() {
        const previewAudio = document.getElementById('artPreviewAudio');
        const progressBar = document.getElementById('artPreviewProgressBar');
        const previewTime = document.getElementById('artPreviewTime');

        if (!previewAudio || !progressBar) return;

        const percent = (previewAudio.currentTime / previewAudio.duration) * 100;
        progressBar.style.width = `${percent}%`;

        if (previewTime) {
            const seconds = Math.floor(previewAudio.currentTime);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            previewTime.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }

    /**
     * Seek preview to clicked position
     */
    seekPreview(event) {
        const previewAudio = document.getElementById('artPreviewAudio');
        const progressContainer = document.getElementById('artPreviewProgress');

        if (!previewAudio || !progressContainer) return;

        const rect = progressContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percent = clickX / rect.width;

        previewAudio.currentTime = percent * previewAudio.duration;
    }

    /**
     * Handle preview playback ended
     */
    onPreviewEnded() {
        this.isPreviewPlaying = false;
        this.updatePreviewPlayButton();

        // Reset progress
        const progressBar = document.getElementById('artPreviewProgressBar');
        const previewTime = document.getElementById('artPreviewTime');
        if (progressBar) progressBar.style.width = '0%';
        if (previewTime) previewTime.textContent = '00:00';
    }

    /**
     * Re-record: discard current and start fresh
     */
    rerecord() {
        // Stop preview if playing
        this.hidePreview();

        // Clear pending audio
        this.pendingAudio = null;

        // Reset UI to initial state
        this.tablet.classList.remove('recording', 'paused');
        this.showButton('start');

        // Reset timer display
        const timerEl = document.getElementById('artTimer');
        if (timerEl) timerEl.textContent = '00:00';

        // Show source selection again
        const sourceSelection = document.getElementById('artSourceSelection');
        if (sourceSelection) sourceSelection.style.display = '';

        console.log('Ready to re-record');
    }

    /**
     * Close the tablet (with confirmation if recording)
     */
    async close() {
        if (this.isRecording) {
            // Stop recording first
            await this.stopRecording();
        }

        // Stop preview if playing
        this.hidePreview();

        // Discard pending audio
        this.pendingAudio = null;
        this.hide();
    }

    /**
     * Show specific buttons
     */
    showButton(...buttons) {
        const allButtons = ['start', 'stop', 'pause', 'resume', 'send'];
        
        allButtons.forEach(btn => {
            const el = document.getElementById(`art${btn.charAt(0).toUpperCase() + btn.slice(1)}Btn`);
            if (el) {
                el.style.display = buttons.includes(btn) ? 'flex' : 'none';
            }
        });
    }

    /**
     * Start the timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            const elapsed = Date.now() - this.startTime;
            this.updateTimer(elapsed);
        }, 100);
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimer(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const timerEl = document.getElementById('artTimer');
        if (timerEl) {
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }

    /**
     * Update waveform visualization based on volume
     */
    updateWaveform(volume) {
        const bars = document.querySelectorAll('.art-wave-bar');
        if (!bars.length) return;

        bars.forEach((bar, index) => {
            const baseHeight = 8;
            const maxHeight = 32;
            const randomFactor = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
            const height = baseHeight + ((volume / 100) * (maxHeight - baseHeight) * randomFactor);
            bar.style.height = `${height}px`;
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        // Could implement a toast notification here
        console.error('Audio Recording Tablet Error:', message);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopTimer();
        this.cleanupStreams();
        this.recordingId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isRecording = false;
        this.pendingAudio = null;
        this.filePath = null;
        this.recordingTime = 0;
    }
}

// Singleton instance
export const audioRecordingTablet = new AudioRecordingTablet();

// Global function to show the tablet
export function showAudioRecordingTablet() {
    audioRecordingTablet.show();
}

// Global function to hide the tablet
export function hideAudioRecordingTablet() {
    audioRecordingTablet.hide();
}

// Expose globally for easy access
window.showAudioRecordingTablet = showAudioRecordingTablet;
window.hideAudioRecordingTablet = hideAudioRecordingTablet;
