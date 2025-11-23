export const captureDropdownHTML = `
    <!-- Capture dropdown (opened from camera button) -->
    <div id="captureDropdown" class="dropdown-menu compact" role="menu" aria-hidden="true">
        <div class="dropdown-header">
            <span class="dropdown-title">Capture</span>
            <button class="dropdown-close-btn" id="closeCaptureDropdown" aria-label="Close dropdown" title="Close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="dropdown-content" role="none">
            <button class="dropdown-item-compact" data-action="desktop-capture" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Screenshot</span>
            </button>
            <button class="dropdown-item-compact" data-action="area-screenshot" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="2 2" opacity="0.5"/>
                </svg>
                <span>Area Screenshot</span>
            </button>
            <button class="dropdown-item-compact" data-action="audio-capture" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 17v6"/><path d="M8 23h8"/></svg>
                <span>Audio Capture</span>
            </button>
            <button class="dropdown-item-compact" data-action="capture-video" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-5 3v4l5 3V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span>Video</span>
            </button>
        </div>
    </div>
`;

