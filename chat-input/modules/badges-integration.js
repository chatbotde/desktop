import { addTextBadge, addImageBadge } from './badges.js';
import { state } from './state.js';

/**
 * Initialize badges integration with text selection and clipboard events
 */
export function initBadgesIntegration() {
    console.log('Badges Integration: Initializing');
    
    // NOTE: Text selection badges are now handled by text-selection-ui.js when user clicks "Add"
    // We don't automatically add badges on text-selection:detected anymore
    
    // NOTE: Clipboard badges are now handled by clipboard-ui.js when user clicks "Add"
    // We don't automatically add badges on clipboard:detected anymore
    // 
    // However, we still handle image clipboard events for auto-adding image badges
    document.addEventListener('clipboard:detected', (e) => {
        console.log('Badges Integration: Received clipboard:detected event');
        const { payload, signature } = e.detail || {};
        
        if (!payload || !signature) return;
        
        // Check if this is a text selection by parsing signature
        let isTextSelection = false;
        try {
            const parsedSignature = JSON.parse(signature);
            isTextSelection = parsedSignature && parsedSignature.t === 'text-selection';
        } catch (error) {
            isTextSelection = signature.includes('"t":"text-selection"');
        }
        
        // Only handle image clipboard events (text is handled by clipboard-ui.js "Add" button)
        if (!isTextSelection) {
            // Handle image clipboard
            if (payload.type === 'image') {
                const dataUrl = payload.content || payload.data || '';
                if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
                    const existingBadge = state.badges.find(b => 
                        b.type === 'image' && 
                        b.data === dataUrl &&
                        Date.now() - b.timestamp < 2000
                    );
                    
                    if (!existingBadge) {
                        addImageBadge({
                            name: 'Image',
                            data: dataUrl
                        });
                    }
                }
            }
        }
    });
    
    // Listen for image attachments being added (from clipboard, screenshots, etc.)
    document.addEventListener('image-attachment:added', (e) => {
        console.log('Badges Integration: Received image-attachment:added event');
        const { imageData } = e.detail || {};
        
        if (imageData && imageData.data) {
            // Check if badge already exists for this image (within 2 seconds)
            const existingBadge = state.badges.find(b => 
                b.type === 'image' && 
                b.data === imageData.data &&
                Date.now() - b.timestamp < 2000
            );
            
            if (!existingBadge) {
                addImageBadge({
                    name: imageData.name || 'Image',
                    data: imageData.data
                });
            }
        }
    });
}

