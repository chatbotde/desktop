export const attachmentsHTML = `
    <!-- Attachments Container - separate from chat input -->
    <div class="attachments-container" id="attachmentsContainer" style="display: none;">
        <div class="attachments-section" id="attachmentsSection">
            <div class="attachments-header">
                <span class="attachments-title">Attachments</span>
                <button class="clear-all-btn" id="clearAllAttachments" title="Clear all attachments">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/>
                        <path d="M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="attachments-grid" id="attachmentsGrid">
                <!-- Image previews will be added here dynamically -->
            </div>
        </div>
    </div>
`;

