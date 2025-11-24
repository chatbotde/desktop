export const floatingCardTemplateHTML = `
    <!-- Floating Card Template for Dynamic Cards -->
    <template id="floatingCardTemplate">
        <div class="floating-card" style="display: flex;">
            <!-- Resize Handles (8-directional Windows-style) -->
            <div class="resize-handle resize-nw"></div>
            <div class="resize-handle resize-n"></div>
            <div class="resize-handle resize-ne"></div>
            <div class="resize-handle resize-e"></div>
            <div class="resize-handle resize-se"></div>
            <div class="resize-handle resize-s"></div>
            <div class="resize-handle resize-sw"></div>
            <div class="resize-handle resize-w"></div>
            
            <div class="floating-card-header">
                <span class="floating-card-title"> </span>
                <div style="display: flex; align-items: center; gap: 4px; position: relative;">
                    <!-- New Chat Button -->
                    <button class="floating-card-new-chat-btn" aria-label="New Chat" title="New Chat (Clear conversation)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            <path d="M12 7v6M9 10h6"/>
                        </svg>
                    </button>
                    <!-- Card Settings (color & appearance) -->
                    <button class="floating-card-settings-btn" aria-label="Card settings" title="Card settings">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <div class="floating-card-menu" role="menu" aria-hidden="true" hidden>
                        <button class="floating-card-menu-item" data-action="toggle-neutral" role="menuitem">No color (neutral)</button>
                        <button class="floating-card-menu-item" data-action="next-color" role="menuitem">Next color</button>
                    </div>
                    <!-- Controls: Create New, Show/Hide Content, Expand, Close 
                    <button class="floating-card-create-btn" aria-label="Create new card" title="Create New Card (Ctrl+N)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </button>
                    -->
                    <button class="floating-card-iframe-toggle-btn" aria-label="Toggle content visibility" title="Show/Hide Content">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <!--
                    <button class="floating-card-expand-btn" aria-label="Toggle size" title="Expand/Collapse (Double-click header)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                    </button>
                     -->
                    <button class="floating-card-hide-btn" aria-label="Hide card" title="Hide Card">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg> 
                    </button>
                    <button class="floating-card-close" aria-label="Close card" title="Close (Esc)" data-hide-for-card="1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 6 6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- iframe content -->
            <iframe 
                src="about:blank"
                data-default-src="http://localhost:5173"
                width="100%" 
                height="100%" 
                frameborder="0"
                style="border: none; flex: 1; padding: 0 16px;"
                title="Display Card Content">
            </iframe>
        </div>
    </template>
`;

