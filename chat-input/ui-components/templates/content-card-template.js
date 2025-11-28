export const contentCardTemplateHTML = `
    <!-- Content Card Template for Speed Dial -->
    <template id="contentCardTemplate">
        <div class="content-card" style="display: none;">
            <div class="content-card-header">
                <span class="content-card-title">Available Actions</span>
                <div class="content-card-actions">
                    <button class="content-card-close" aria-label="Close content card" title="Close">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="content-card-body">
                <div class="content-card-content">
                    <!-- Upload Actions -->
                    <div class="action-group">
                        <h4 class="action-group-title">Upload</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="upload-image">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="m21 15-5-5L5 21"/>
                                </svg>
                                <span>Upload Image</span>
                            </button>
                            <!--
                            <button class="action-item" data-action="upload-video">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="6" width="14" height="12" rx="2" ry="2"/>
                                    <path d="m22 7-6 4 6 4z"/>
                                </svg>
                                <span>Upload Video</span>
                            </button>
                            <button class="action-item" data-action="upload-audio">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 18V5l12-2v13"/>
                                    <circle cx="6" cy="18" r="3"/>
                                    <circle cx="18" cy="16" r="3"/>
                                </svg>
                                <span>Upload Audio</span>
                            </button>
                            -->
                        </div>
                    </div>

                    <!-- Capture Actions -->
                    <div class="action-group">
                        <h4 class="action-group-title">Capture</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="desktop-capture">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                <span>Add screen</span>
                            </button>
                            <button class="action-item toggle-item" data-action="auto-screen" aria-pressed="false" aria-label="Auto Screen">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                    <circle cx="12" cy="10" r="3" stroke-dasharray="2 1"/>
                                </svg>
                                <span>Auto Screen</span>
                                <span class="toggle-status">(OFF)</span>
                            </button>
                            <button class="action-item" data-action="area-screenshot">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-icon lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>
                                <span>Circle to Ask</span>
                            </button>
                            <button class="action-item" data-action="audio-record">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z"/>
                                    <path d="M19 10a7 7 0 0 1-14 0"/>
                                    <path d="M12 17v6"/>
                                    <path d="M8 23h8"/>
                                </svg>
                                <span>Record Audio</span>
                            </button>
                            <!--
                            <button class="action-item" data-action="audio-capture">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3Z"/>
                                    <path d="M19 10a7 7 0 0 1-14 0"/>
                                    <path d="M12 17v6"/>
                                    <path d="M8 23h8"/>
                                </svg>
                                <span>Record Audio</span>
                            </button>
                            <button class="action-item" data-action="capture-video">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M23 7l-5 3v4l5 3V7z"/>
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                                </svg>
                                <span>Record Video</span>
                            </button>
                            -->
                        </div>
                    </div>

                    <!-- Settings Actions -->
                    <div class="action-group">
                        <h4 class="action-group-title">Settings</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="theme">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="5"/>
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                                </svg>
                                <span>Light Theme</span>
                            </button>
                            <button class="action-item" data-action="lighting">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                                </svg>
                                <span>Lighting Effect</span>
                            </button>
                            <!--
                            <button class="action-item" data-action="click-through">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2v20"/>
                                    <path d="M5 9l7-7 7 7"/>
                                    <path d="M5 15l7 7 7-7"/>
                                </svg>
                                <span>Click-through Mode</span>
                            </button>
                            -->
                            <button class="action-item" data-action="protection" aria-pressed="false" aria-label="Invisible Mode">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <circle cx="12" cy="16" r="1"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <span>Invisible Mode</span>
                            </button>
                        </div>
                    </div>

                    <!-- Account Actions -->
                    <div class="action-group">
                        <h4 class="action-group-title">Account</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="sign-out" style="color: #f87171;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>

                    <!-- Web View Actions -->
                    <div class="action-group">
                        <h4 class="action-group-title">Web View</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="toggle-webview">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                                <span>Toggle Web View</span>
                            </button>
                        </div>
                    </div>

                    <!-- MCP Actions -->
                    <!--
                    <div class="action-group">
                        <h4 class="action-group-title">MCP (Model Context Protocol)</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="mcp-settings">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                <span>MCP Settings</span>
                            </button>
                            <button class="action-item" data-action="mcp-servers">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="9" cy="9" r="2"/>
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                </svg>
                                <span>MCP Servers</span>
                            </button>
                            <button class="action-item" data-action="mcp-connections">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                    <path d="M12 11h4"/>
                                    <path d="M12 16h4"/>
                                    <path d="M8 11h.01"/>
                                    <path d="M8 16h.01"/>
                                </svg>
                                <span>MCP Connections</span>
                            </button>
                        </div>
                    </div>

                    <!-- Window Actions -->
                    <!--
                    <div class="action-group">
                        <h4 class="action-group-title">Window</h4>
                        <div class="action-buttons">
                            <button class="action-item" data-action="collapse">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m18 15-6-6-6 6"/>
                                </svg>
                                <span>Collapse</span>
                            </button>
                        </div>
                    </div>
                    -->
                </div>
            </div>
        </div>
    </template>
`;

