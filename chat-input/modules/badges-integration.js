import { addTextBadge } from './badges.js';

/**
 * Initialize badges integration with text selection and clipboard events
 */
export function initBadgesIntegration() {
    console.log('Badges Integration: Initializing');
    
    // NOTE: Text selection badges are now handled by text-selection-ui.js when user clicks "Add"
    // We don't automatically add badges on text-selection:detected anymore
    
    // NOTE: Clipboard badges are now handled by clipboard-ui.js when user clicks "Add"
    // We don't automatically add badges on clipboard:detected anymore
    
    // NOTE: Image badges are disabled - images only appear as attachments
    // Images are handled by the attachments system only
}

