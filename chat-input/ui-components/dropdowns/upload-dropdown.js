export const uploadDropdownHTML = `
    <!-- Upload dropdown (opened from + button) -->
    <div id="uploadDropdown" class="dropdown-menu compact" role="menu" aria-hidden="true">
        <div class="dropdown-header">
            <span class="dropdown-title">Upload</span>
            <button class="dropdown-close-btn" id="closeUploadDropdown" aria-label="Close dropdown" title="Close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="dropdown-content" role="none">
            <button class="dropdown-item-compact" data-action="upload-image" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                <span>Image</span>
            </button>
            <button class="dropdown-item-compact" data-action="upload-video" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/><path d="m22 7-6 4 6 4z"/></svg>
                <span>Video</span>
            </button>
            <button class="dropdown-item-compact" data-action="upload-audio" role="menuitem" tabindex="-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <span>Audio</span>
            </button>
            
        </div>
    </div>
`;

