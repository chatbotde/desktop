/**
 * Model Capability Validator for Chat Input
 * 
 * Validates attachments against model capabilities before sending.
 * Shows user-friendly warnings if model doesn't support certain media types.
 */

import { state } from '../core/state.js';
import { dom } from '../core/dom.js';

// ============================================================================
// TYPES / CONSTANTS
// ============================================================================

/**
 * Error codes for capability validation
 */
export const CapabilityErrorCode = {
    IMAGE_NOT_SUPPORTED: 'IMAGE_NOT_SUPPORTED',
    AUDIO_NOT_SUPPORTED: 'AUDIO_NOT_SUPPORTED',
    VIDEO_NOT_SUPPORTED: 'VIDEO_NOT_SUPPORTED',
    NO_MODEL_SELECTED: 'NO_MODEL_SELECTED',
    NO_CONTENT: 'NO_CONTENT'
};

/**
 * Model capability info from available models cache
 */
let modelsCapabilityCache = new Map();

// ============================================================================
// CAPABILITY HELPERS
// ============================================================================

/**
 * Update model capabilities cache when models are fetched
 * @param {Array} models - Array of model objects
 */
export function updateCapabilitiesCache(models) {
    modelsCapabilityCache.clear();
    if (!models || !Array.isArray(models)) return;
    
    models.forEach(model => {
        modelsCapabilityCache.set(model.id, {
            id: model.id,
            name: model.displayName || model.name,
            supportsImages: model.supportsImages || false,
            supportsAudio: model.supportsAudio || false,
            supportsVideo: model.supportsVideo || false,
            capabilities: model.capabilities || ['text'],
            provider: model.provider,
            category: model.category
        });
    });
    
    console.log(`✅ Capability cache updated with ${modelsCapabilityCache.size} models`);
}

/**
 * Get capabilities for the currently selected model
 */
export function getCurrentModelCapabilities() {
    const modelId = state.selectedModel;
    
    // Try to get from cache first
    if (modelsCapabilityCache.has(modelId)) {
        return modelsCapabilityCache.get(modelId);
    }
    
    // Fallback to state.availableModels
    const modelInfo = state.availableModels[modelId];
    if (modelInfo) {
        return {
            id: modelId,
            name: modelInfo.name,
            supportsImages: modelInfo.features?.some(f => f.includes('Images')) || false,
            supportsAudio: modelInfo.features?.some(f => f.includes('Audio')) || false,
            supportsVideo: modelInfo.features?.some(f => f.includes('Video')) || false,
            capabilities: ['text'],
            provider: modelInfo.provider,
            category: modelInfo.category
        };
    }
    
    // Default to text-only
    return {
        id: modelId,
        name: modelId,
        supportsImages: false,
        supportsAudio: false,
        supportsVideo: false,
        capabilities: ['text'],
        provider: 'unknown',
        category: 'text'
    };
}

/**
 * Get a summary of model capabilities for display
 */
export function getCapabilitySummary(modelId = null) {
    const id = modelId || state.selectedModel;
    const caps = modelsCapabilityCache.get(id) || getCurrentModelCapabilities();
    
    return {
        modelName: caps.name,
        provider: caps.provider,
        supports: {
            text: true,
            images: caps.supportsImages,
            audio: caps.supportsAudio,
            video: caps.supportsVideo
        }
    };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate attachments against current model capabilities
 * @param {Array} imageAttachments - Array of image attachments
 * @param {Array} mediaAttachments - Array of media attachments (audio/video)
 * @returns {Object} Validation result
 */
export function validateAttachments(imageAttachments = [], mediaAttachments = []) {
    const caps = getCurrentModelCapabilities();
    const errors = [];
    const warnings = [];
    const unsupportedAttachments = [];
    const supportedAttachments = [];
    
    // Validate image attachments
    imageAttachments.forEach(att => {
        if (!caps.supportsImages) {
            errors.push({
                code: CapabilityErrorCode.IMAGE_NOT_SUPPORTED,
                message: `${caps.name} does not support image inputs`,
                attachment: att,
                suggestion: getImageSupportSuggestion()
            });
            unsupportedAttachments.push(att);
        } else {
            supportedAttachments.push(att);
        }
    });
    
    // Validate media attachments (audio/video)
    mediaAttachments.forEach(att => {
        const mediaType = att.mediaType || getMediaTypeFromMime(att.type);
        
        if (mediaType === 'audio' && !caps.supportsAudio) {
            errors.push({
                code: CapabilityErrorCode.AUDIO_NOT_SUPPORTED,
                message: `${caps.name} does not support audio inputs`,
                attachment: att,
                suggestion: getAudioSupportSuggestion()
            });
            unsupportedAttachments.push(att);
        } else if (mediaType === 'video' && !caps.supportsVideo) {
            errors.push({
                code: CapabilityErrorCode.VIDEO_NOT_SUPPORTED,
                message: `${caps.name} does not support video inputs`,
                attachment: att,
                suggestion: getVideoSupportSuggestion()
            });
            unsupportedAttachments.push(att);
        } else if (mediaType === 'image' && !caps.supportsImages) {
            errors.push({
                code: CapabilityErrorCode.IMAGE_NOT_SUPPORTED,
                message: `${caps.name} does not support image inputs`,
                attachment: att,
                suggestion: getImageSupportSuggestion()
            });
            unsupportedAttachments.push(att);
        } else {
            supportedAttachments.push(att);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        unsupportedAttachments,
        supportedAttachments,
        modelName: caps.name
    };
}

/**
 * Validate message content before sending
 * @param {string} message - Message text
 * @param {Array} imageAttachments - Image attachments
 * @param {Array} mediaAttachments - Media attachments
 * @returns {Object} Validation result
 */
export function validateBeforeSend(message, imageAttachments = [], mediaAttachments = []) {
    const result = validateAttachments(imageAttachments, mediaAttachments);
    
    // Check if there's any content
    const hasText = message && message.trim().length > 0;
    const hasAttachments = imageAttachments.length > 0 || mediaAttachments.length > 0;
    
    if (!hasText && !hasAttachments) {
        result.isValid = false;
        result.errors.push({
            code: CapabilityErrorCode.NO_CONTENT,
            message: 'Please provide a message or attach media',
            suggestion: 'Type a message or add an image, audio, or video file.'
        });
    }
    
    return result;
}

/**
 * Check if a specific attachment type will be supported
 * @param {'image' | 'audio' | 'video'} mediaType - Media type to check
 * @returns {Object} Support status and message
 */
export function willAttachmentBeSupported(mediaType) {
    const caps = getCurrentModelCapabilities();
    
    switch (mediaType) {
        case 'image':
            return {
                supported: caps.supportsImages,
                message: caps.supportsImages
                    ? `${caps.name} supports images`
                    : `${caps.name} doesn't support images. ${getImageSupportSuggestion()}`
            };
        case 'audio':
            return {
                supported: caps.supportsAudio,
                message: caps.supportsAudio
                    ? `${caps.name} supports audio`
                    : `${caps.name} doesn't support audio. ${getAudioSupportSuggestion()}`
            };
        case 'video':
            return {
                supported: caps.supportsVideo,
                message: caps.supportsVideo
                    ? `${caps.name} supports video`
                    : `${caps.name} doesn't support video. ${getVideoSupportSuggestion()}`
            };
        default:
            return {
                supported: false,
                message: 'Unknown media type'
            };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMediaTypeFromMime(mimeType) {
    if (!mimeType) return 'unknown';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
}

function getImageSupportSuggestion() {
    return 'Try Gemini 2.5 Pro, GPT-4o, Claude 3.5 Sonnet, or Grok 2 Vision for image support.';
}

function getAudioSupportSuggestion() {
    return 'Try Gemini 2.5 Pro, Gemini 2.0 Flash, or GPT-4o for audio support.';
}

function getVideoSupportSuggestion() {
    return 'Try Gemini models (2.5 Pro, 2.0 Flash, 1.5 Pro) for video support.';
}

// ============================================================================
// UI NOTIFICATIONS
// ============================================================================

let notificationTimeout = null;

/**
 * Show capability warning notification
 * @param {Object} validationResult - Validation result from validateAttachments
 */
export function showCapabilityWarning(validationResult) {
    if (validationResult.isValid) return;
    
    // Build notification message
    const uniqueErrors = new Map();
    validationResult.errors.forEach(err => {
        if (!uniqueErrors.has(err.code)) {
            uniqueErrors.set(err.code, err);
        }
    });
    
    const messages = Array.from(uniqueErrors.values()).map(err => err.message);
    const suggestions = Array.from(uniqueErrors.values())
        .map(err => err.suggestion)
        .filter((v, i, a) => a.indexOf(v) === i); // unique
    
    showNotification({
        type: 'warning',
        title: 'Unsupported Attachments',
        message: messages.join('\n'),
        suggestions: suggestions,
        duration: 8000
    });
}

/**
 * Show a notification toast
 * @param {Object} options - Notification options
 */
export function showNotification({ type = 'info', title, message, suggestions = [], duration = 5000 }) {
    // Clear any existing notification
    hideNotification();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'capability-notification';
    notification.className = `capability-notification capability-notification--${type}`;
    
    // Build content
    let html = `
        <div class="capability-notification__header">
            <span class="capability-notification__icon">${getNotificationIcon(type)}</span>
            <span class="capability-notification__title">${escapeHtml(title)}</span>
            <button class="capability-notification__close" onclick="window.__hideCapabilityNotification?.()">×</button>
        </div>
        <div class="capability-notification__body">
            <p class="capability-notification__message">${escapeHtml(message)}</p>
    `;
    
    if (suggestions.length > 0) {
        html += `<p class="capability-notification__suggestion">💡 ${escapeHtml(suggestions[0])}</p>`;
    }
    
    html += '</div>';
    notification.innerHTML = html;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('capability-notification--visible');
    });
    
    // Auto-hide after duration
    notificationTimeout = setTimeout(() => {
        hideNotification();
    }, duration);
    
    // Expose hide function globally for close button
    window.__hideCapabilityNotification = hideNotification;
}

/**
 * Hide the notification
 */
export function hideNotification() {
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    
    const notification = document.getElementById('capability-notification');
    if (notification) {
        notification.classList.remove('capability-notification--visible');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'success': return '✅';
        default: return 'ℹ️';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// CAPABILITY INDICATOR UI
// ============================================================================

/**
 * Update the capability indicators in the UI
 * Call this when model selection changes
 */
export function updateCapabilityIndicators() {
    const caps = getCurrentModelCapabilities();
    
    // Update capability indicator if it exists
    const indicator = document.getElementById('model-capabilities-indicator');
    if (indicator) {
        indicator.innerHTML = getCapabilityIconsHTML(caps);
        indicator.title = getCapabilityTooltip(caps);
    }
    
    // Also dispatch event for other components
    window.dispatchEvent(new CustomEvent('modelCapabilitiesChanged', {
        detail: caps
    }));
}

/**
 * Get HTML for capability icons
 * @param {Object} caps - Capabilities object
 * @returns {string} HTML string
 */
export function getCapabilityIconsHTML(caps = null) {
    const capabilities = caps || getCurrentModelCapabilities();
    
    const icons = [];
    
    // Always show text support
    icons.push(`<span class="cap-icon cap-icon--supported" title="Text">📝</span>`);
    
    // Image support
    icons.push(capabilities.supportsImages
        ? `<span class="cap-icon cap-icon--supported" title="Images supported">🖼️</span>`
        : `<span class="cap-icon cap-icon--unsupported" title="Images not supported">🖼️</span>`
    );
    
    // Audio support
    icons.push(capabilities.supportsAudio
        ? `<span class="cap-icon cap-icon--supported" title="Audio supported">🎵</span>`
        : `<span class="cap-icon cap-icon--unsupported" title="Audio not supported">🎵</span>`
    );
    
    // Video support
    icons.push(capabilities.supportsVideo
        ? `<span class="cap-icon cap-icon--supported" title="Video supported">🎬</span>`
        : `<span class="cap-icon cap-icon--unsupported" title="Video not supported">🎬</span>`
    );
    
    return icons.join('');
}

/**
 * Get tooltip text for capabilities
 * @param {Object} caps - Capabilities object
 * @returns {string} Tooltip text
 */
function getCapabilityTooltip(caps) {
    const supported = [];
    const notSupported = [];
    
    supported.push('Text');
    
    if (caps.supportsImages) supported.push('Images');
    else notSupported.push('Images');
    
    if (caps.supportsAudio) supported.push('Audio');
    else notSupported.push('Audio');
    
    if (caps.supportsVideo) supported.push('Video');
    else notSupported.push('Video');
    
    let tooltip = `${caps.name}\n✓ Supports: ${supported.join(', ')}`;
    if (notSupported.length > 0) {
        tooltip += `\n✗ Not supported: ${notSupported.join(', ')}`;
    }
    
    return tooltip;
}

// ============================================================================
// CSS STYLES (inject on load)
// ============================================================================

function injectStyles() {
    if (document.getElementById('capability-validator-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'capability-validator-styles';
    styles.textContent = `
        /* Capability Notification */
        .capability-notification {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            min-width: 320px;
            max-width: 480px;
            background: var(--bg-elevated, #1a1a2e);
            border: 1px solid var(--border-color, #333);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            overflow: hidden;
        }
        
        .capability-notification--visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        .capability-notification--warning {
            border-color: #ff9800;
        }
        
        .capability-notification--error {
            border-color: #f44336;
        }
        
        .capability-notification__header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: rgba(255, 152, 0, 0.1);
            border-bottom: 1px solid var(--border-color, #333);
        }
        
        .capability-notification--error .capability-notification__header {
            background: rgba(244, 67, 54, 0.1);
        }
        
        .capability-notification__icon {
            font-size: 18px;
        }
        
        .capability-notification__title {
            flex: 1;
            font-weight: 600;
            color: var(--text-primary, #fff);
            font-size: 14px;
        }
        
        .capability-notification__close {
            background: transparent;
            border: none;
            color: var(--text-secondary, #888);
            font-size: 20px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
        }
        
        .capability-notification__close:hover {
            color: var(--text-primary, #fff);
        }
        
        .capability-notification__body {
            padding: 12px 16px;
        }
        
        .capability-notification__message {
            color: var(--text-primary, #fff);
            font-size: 13px;
            margin: 0 0 8px;
            white-space: pre-line;
        }
        
        .capability-notification__suggestion {
            color: var(--text-secondary, #888);
            font-size: 12px;
            margin: 0;
            padding-top: 8px;
            border-top: 1px solid var(--border-color, #333);
        }
        
        /* Capability Icons */
        .cap-icon {
            display: inline-block;
            font-size: 12px;
            margin: 0 2px;
            transition: opacity 0.2s;
        }
        
        .cap-icon--supported {
            opacity: 1;
        }
        
        .cap-icon--unsupported {
            opacity: 0.3;
            filter: grayscale(1);
        }
        
        /* Model capabilities indicator container */
        #model-capabilities-indicator {
            display: flex;
            align-items: center;
            gap: 2px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            cursor: help;
        }
    `;
    
    document.head.appendChild(styles);
}

// Inject styles on import
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the capability validator
 * Should be called after model selection is initialized
 */
export async function initializeCapabilityValidator() {
    console.log('🔍 Initializing capability validator...');
    
    // Try to get models and update cache
    try {
        const models = await window.chatInputAPI?.getAllAIModels?.();
        if (models) {
            updateCapabilitiesCache(models);
        }
    } catch (e) {
        console.warn('Could not fetch models for capability cache:', e);
    }
    
    // Update indicators
    updateCapabilityIndicators();
    
    // Listen for model changes
    window.addEventListener('modelSettingsChanged', () => {
        updateCapabilityIndicators();
    });
    
    console.log('✅ Capability validator initialized');
}
