/**
 * Modern Recording Control Panel
 * Provides a floating, feature-rich UI for controlling audio/video recordings
 */

import { addMediaAttachment } from './richmedia.js';

class RecordingControlPanel {
    constructor() {
        this.panel = null;
        this.recordingId = null;
        this.recordingType = null;
        this.startTime = null;
        this.isPaused = false;
        this.timerInterval = null;
        this.canvasCtx = null;
        this.animationId = null;
        this.analyser = null;
        this.dataArray = null;
        this.chunkCount = 0;
        this.totalSize = 0;
        this.filePath = null;
    }

    async show(recordingType, recordingId, options = {}) {
        this.recordingType = recordingType;
        this.recordingId = recordingId;
        this.startTime = Date.now();
        this.isPaused = false;
        this.chunkCount = 0;
        this.totalSize = 0;

        this.createPanel();
        this.startTimer();
        
        if (recordingType === 'audio') {
            this.setupAudioVisualization();
        } else if (recordingType === 'video') {
            this.setupVideoPreview();
        }

        // Open file stream for continuous writing
        const result = await window.electron.invoke('media:open', options.filePath);
        if (result.success) {
            this.filePath = result.filePath;
        }
    }

    createPanel() {
        // Remove existing panel if any
        this.hide();

        const panel = document.createElement('div');
        panel.className = 'recording-control-panel';
        panel.id = 'recordingControlPanel';

        const icon = this.recordingType === 'audio' ? '🎤' : '🎥';

        panel.innerHTML = `
            <div class="rcp-content">
                <div class="rcp-timer" id="rcpDuration">00:00</div>
                <div class="rcp-controls">
                    <button class="rcp-btn rcp-btn-pause" id="rcpPause" title="Pause">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                    </button>
                    <button class="rcp-btn rcp-btn-stop" id="rcpStop" title="Stop">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="6" width="12" height="12"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        // Add event listeners
        const pauseBtn = document.getElementById('rcpPause');
        const stopBtn = document.getElementById('rcpStop');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
    }

    makeDraggable() {
        // Removed - panel is now fixed position
    }

    setupAudioVisualization() {
        // Removed - no visualization needed
    }

    drawWaveform() {
        // Removed - no visualization needed
    }

    setupVideoPreview() {
        // Removed - no preview needed
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;

            const durationEl = document.getElementById('rcpDuration');
            if (durationEl) {
                durationEl.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
        }, 100);
    }

    updateStats(chunk) {
        this.chunkCount++;
        this.totalSize += chunk.size;
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    async togglePause() {
        if (!this.recordingId) return;

        const pauseBtn = document.getElementById('rcpPause');

        try {
            if (this.isPaused) {
                // Resume
                let result;
                if (this.recordingType === 'audio') {
                    result = await window.chatInputAPI.resumeAudioRecording(this.recordingId);
                } else {
                    result = await window.chatInputAPI.resumeVideoRecording(this.recordingId);
                }
                
                if (result && result.success) {
                    this.isPaused = false;
                    if (pauseBtn) {
                        pauseBtn.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                            </svg>
                        `;
                    }
                    this.panel.classList.remove('paused');
                }
            } else {
                // Pause
                let result;
                if (this.recordingType === 'audio') {
                    result = await window.chatInputAPI.pauseAudioRecording(this.recordingId);
                } else {
                    result = await window.chatInputAPI.pauseVideoRecording(this.recordingId);
                }
                
                if (result && result.success) {
                    this.isPaused = true;
                    if (pauseBtn) {
                        pauseBtn.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                        `;
                    }
                    this.panel.classList.add('paused');
                }
            }
        } catch (error) {
            console.error('Error toggling pause:', error);
        }
    }

    async stop() {
        if (!this.recordingId) return;

        // Close file stream
        if (this.filePath) {
            await window.electron.invoke('media:close', this.filePath);
        }

        try {
            let result;
            if (this.recordingType === 'audio') {
                result = await window.chatInputAPI.stopAudioRecording(this.recordingId);
            } else {
                result = await window.chatInputAPI.stopVideoRecording(this.recordingId);
            }
            
            if (result && result.success) {
                const media = this.recordingType === 'audio' ? result.audio : result.video;
                if (media) {
                    addMediaAttachment(media);
                }
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
        }

        this.hide();
    }

    minimize() {
        // Removed - no minimize functionality
    }

    hide() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }

        this.recordingId = null;
        this.recordingType = null;
        this.startTime = null;
        this.isPaused = false;
        this.canvasCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.chunkCount = 0;
        this.totalSize = 0;
        this.filePath = null;
    }
}

// Singleton instance
export const recordingControlPanel = new RecordingControlPanel();
