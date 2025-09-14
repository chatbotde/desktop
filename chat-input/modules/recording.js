import { state } from './state.js';
import { addMediaAttachment } from './richmedia.js';

export function showRecordingState(recordingType) {
    state.isRecording = true;
    state.currentRecordingType = recordingType;
    state.recordingStartTime = Date.now();
    addRecordingIndicator(recordingType);
    updateRecordingButtons(true);
}

export function hideRecordingState() {
    state.isRecording = false;
    state.currentRecordingType = null;
    state.recordingStartTime = 0;
    removeRecordingIndicator();
    updateRecordingButtons(false);
}

function addRecordingIndicator(recordingType) {
    const existing = document.getElementById('recording-indicator');
    if (existing) existing.remove();
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
            <button class="recording-stop" onclick="window.stopCurrentRecording()" title="Stop Recording">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="6" width="12" height="12"/>
                </svg>
            </button>
        </div>
    `;
    const attachmentsSection = document.getElementById('attachmentsSection');
    const target = (attachmentsSection && attachmentsSection.style.display !== 'none') ? attachmentsSection : document.querySelector('.input-area');
    target.parentNode.insertBefore(indicator, target);
    startRecordingTimer();
}

function removeRecordingIndicator() {
    const indicator = document.getElementById('recording-indicator');
    if (indicator) indicator.remove();
}

function startRecordingTimer() {
    const timer = document.getElementById('recording-timer');
    if (!timer) return;
    const tick = () => {
        if (!state.isRecording) return;
        const elapsed = Date.now() - state.recordingStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
        setTimeout(tick, 1000);
    };
    tick();
}

function updateRecordingButtons(recording) {
    const captureButton = document.getElementById('captureButton');
    if (captureButton) captureButton.classList.toggle('recording', recording);
}

export async function stopCurrentRecording() {
    try {
        let result = { success: false };
        if (window.rendererCaptureAPI) {
            if (window.currentAudioRecordingId) {
                result = await window.rendererCaptureAPI.stopRecording(window.currentAudioRecordingId);
                if (result.success && result.audio) addMediaAttachment(result.audio);
                window.currentAudioRecordingId = null;
            } else if (window.currentVideoRecordingId) {
                result = await window.rendererCaptureAPI.stopRecording(window.currentVideoRecordingId);
                if (result.success && result.video) addMediaAttachment(result.video);
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

export function updateVolumeIndicator(volume) {
    const indicator = document.getElementById('recording-indicator');
    if (indicator && state.currentRecordingType === 'audio') {
        indicator.style.opacity = 0.7 + (volume / 100) * 0.3;
    }
}


