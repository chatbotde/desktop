export const audioRecordingTabletHTML = `
    <!-- Audio Recording Tablet UI -->
    <div id="audioRecordingTablet" class="audio-recording-tablet" style="display: none;">
        <div class="art-content">
            <div class="art-header">
                <div class="art-indicator">
                    <span class="art-pulse"></span>
                    <span class="art-label">Recording</span>
                </div>
                <div class="art-timer" id="artTimer">00:00</div>
            </div>
            
            <!-- Audio Source Selection -->
            <div class="art-source-selection" id="artSourceSelection">
                <div class="art-source-label">Audio Source:</div>
                <div class="art-source-buttons">
                    <button class="art-source-btn active" data-source="microphone" title="Record from microphone">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z"/>
                            <path d="M19 10a7 7 0 0 1-14 0"/>
                            <path d="M12 17v6"/>
                            <path d="M8 23h8"/>
                        </svg>
                        <span>Mic</span>
                    </button>
                    <button class="art-source-btn" data-source="system" title="Record system audio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                            <path d="M6 10h.01"/>
                            <path d="M10 10h.01"/>
                            <path d="M14 10h4"/>
                        </svg>
                        <span>System</span>
                    </button>
                    <button class="art-source-btn" data-source="both" title="Record microphone and system audio">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v4"/>
                            <path d="M15 4v4a3 3 0 0 1-6 0"/>
                            <path d="M19 10a7 7 0 0 1-14 0"/>
                            <rect x="14" y="12" width="8" height="6" rx="1"/>
                            <path d="M18 12v-2"/>
                            <path d="M12 17v2"/>
                            <path d="M8 21h8"/>
                        </svg>
                        <span>Both</span>
                    </button>
                </div>
            </div>
            
            <!-- Source indicator shown during recording -->
            <div class="art-source-indicator" id="artSourceIndicator">
                Recording: <span id="artSourceName">Microphone</span>
            </div>
            
            <div class="art-waveform" id="artWaveform">
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
                <div class="art-wave-bar"></div>
            </div>
            
            <div class="art-controls">
                <button class="art-btn art-btn-start" id="artStartBtn" title="Start Recording">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10a7 7 0 0 1-14 0"/>
                        <path d="M12 17v6"/>
                        <path d="M8 23h8"/>
                    </svg>
                    <span>Start</span>
                </button>
                
                <button class="art-btn art-btn-stop" id="artStopBtn" title="Stop Recording" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="6" width="12" height="12" fill="currentColor"/>
                    </svg>
                    <span>Stop</span>
                </button>
                
                <button class="art-btn art-btn-pause" id="artPauseBtn" title="Pause Recording" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                        <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                    </svg>
                    <span>Pause</span>
                </button>
                
                <button class="art-btn art-btn-resume" id="artResumeBtn" title="Resume Recording" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                    </svg>
                    <span>Resume</span>
                </button>
                
                <button class="art-btn art-btn-send" id="artSendBtn" title="Send Recording" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    <span>Send</span>
                </button>
            </div>
            
            <!-- Audio Preview Section -->
            <div class="art-preview" id="artPreview" style="display: none;">
                <div class="art-preview-header">
                    <span class="art-preview-label">Preview Recording</span>
                    <span class="art-preview-duration" id="artPreviewDuration">00:00</span>
                </div>
                <div class="art-preview-controls">
                    <button class="art-preview-play" id="artPreviewPlayBtn" title="Play Preview">
                        <svg class="art-preview-play-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        <svg class="art-preview-pause-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                            <rect x="6" y="4" width="4" height="16"/>
                            <rect x="14" y="4" width="4" height="16"/>
                        </svg>
                    </button>
                    <div class="art-preview-progress-container">
                        <div class="art-preview-progress" id="artPreviewProgress">
                            <div class="art-preview-progress-bar" id="artPreviewProgressBar"></div>
                        </div>
                        <span class="art-preview-time" id="artPreviewTime">00:00</span>
                    </div>
                    <button class="art-preview-rerecord" id="artRerecordBtn" title="Re-record">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M3 21v-5h5"/>
                        </svg>
                    </button>
                </div>
                <audio id="artPreviewAudio" style="display: none;"></audio>
            </div>
            
            <button class="art-close" id="artCloseBtn" title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        </div>
    </div>
`;
