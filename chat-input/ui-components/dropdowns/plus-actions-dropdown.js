export const plusActionsDropdownHTML = `
    <!-- Plus Button Actions Dropdown -->
    <div id="plusActionsDropdown" class="dropdown-menu compact" role="menu" aria-hidden="true">
        <div class="dropdown-header">
            <span class="dropdown-title">Actions</span>
            <button class="dropdown-close-btn" id="closePlusActionsDropdown" aria-label="Close dropdown" title="Close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="dropdown-content" role="none">
            <button class="dropdown-item-compact" data-action="upload" role="menuitem" tabindex="-1" title="Upload">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Upload</span>
            </button>
            <button class="dropdown-item-compact" data-action="capture" role="menuitem" tabindex="-1" title="Capture">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Capture</span>
            </button>
            <button class="dropdown-item-compact" data-action="theme" role="menuitem" tabindex="-1" title="Theme">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                <span>Theme</span>
            </button>
            <button class="dropdown-item-compact" data-action="lighting" role="menuitem" tabindex="-1" title="Lighting">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                </svg>
                <span>Lighting</span>
            </button>
            <button class="dropdown-item-compact" data-action="hide" role="menuitem" tabindex="-1" title="Hide">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18l-2-2H5l-2 2z"/>
                    <path d="M21 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>
                    <path d="m8 10 4 4 4-4"/>
                </svg>
                <span>Hide</span>
            </button>
            <button class="dropdown-item-compact" data-action="click-through" role="menuitem" tabindex="-1" title="Click-through">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20"/>
                    <path d="M5 9l7-7 7 7"/>
                    <path d="M5 15l7 7 7-7"/>
                </svg>
                <span>Click-through</span>
            </button>
            <button class="dropdown-item-compact" data-action="toggle-main" role="menuitem" tabindex="-1" title="Toggle Main">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <path d="M9 9h.01"/>
                    <path d="M15 9h.01"/>
                    <path d="M9 15h.01"/>
                    <path d="M15 15h.01"/>
                </svg>
                <span>Toggle Main</span>
            </button>
            <button class="dropdown-item-compact" data-action="protection" role="menuitem" tabindex="-1" title="Invisible Mode">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Invisible Mode</span>
            </button>
            <button class="dropdown-item-compact" data-action="collapse" role="menuitem" tabindex="-1" title="Collapse">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m18 15-6-6-6 6"/>
                </svg>
                <span>Collapse</span>
            </button>
        </div>
    </div>
`;

