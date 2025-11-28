// Main UI Components Index
// Combines all UI components into a single export

import { floatingCardsHTML } from './floating-cards.js';
import { attachmentsHTML } from './attachments.js';
import { badgesHTML } from './badges.js';
import { controlsHTML } from './controls.js';
import { chatInputHTML } from './chat-input.js';
import { uploadDropdownHTML } from './dropdowns/upload-dropdown.js';
import { captureDropdownHTML } from './dropdowns/capture-dropdown.js';
import { plusActionsDropdownHTML } from './dropdowns/plus-actions-dropdown.js';
import { modelSelectDropdownHTML } from './dropdowns/model-select-dropdown.js';
import { contentCardTemplateHTML } from './templates/content-card-template.js';
import { floatingCardTemplateHTML } from './templates/floating-card-template.js';
import { mcpSettingsModalHTML } from './modals/mcp-settings-modal.js';
import { modelSettingsModalHTML } from './modals/model-settings-modal.js';
import { audioRecordingTabletHTML } from './audio-recording-tablet.js';

/**
 * Combines all UI components into a single HTML string
 * @returns {string} Complete UI HTML content
 */
export function getUIContent() {
    return `
        ${floatingCardsHTML}
        ${attachmentsHTML}
        ${badgesHTML}
        ${controlsHTML}
        ${chatInputHTML}
        ${uploadDropdownHTML}
        ${captureDropdownHTML}
        ${plusActionsDropdownHTML}
        ${modelSelectDropdownHTML}
        ${contentCardTemplateHTML}
        ${floatingCardTemplateHTML}
        ${mcpSettingsModalHTML}
        ${modelSettingsModalHTML}
        ${audioRecordingTabletHTML}
    `;
}

// Export individual components for selective use
export {
    floatingCardsHTML,
    attachmentsHTML,
    badgesHTML,
    controlsHTML,
    chatInputHTML,
    uploadDropdownHTML,
    captureDropdownHTML,
    plusActionsDropdownHTML,
    modelSelectDropdownHTML,
    contentCardTemplateHTML,
    floatingCardTemplateHTML,
    mcpSettingsModalHTML,
    modelSettingsModalHTML,
    audioRecordingTabletHTML
};

