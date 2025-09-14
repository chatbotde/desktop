// Centralized state shared across modules
export const state = {
    isSending: false,
    lastMessageSent: '',
    isTransparent: false,
    isRecording: false,
    currentRecordingType: null, // 'audio' | 'video' | null
    currentTheme: 'dark',
    contentProtectionEnabled: true,
    // Drag flags
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    // Container drag
    isContainerDragging: false,
    containerDragOffset: { x: 0, y: 0 },
    // Attachments
    imageAttachments: [],
    mediaAttachments: [],
    attachmentIdCounter: 0,
    // Recording
    recordingStartTime: 0,
    // Model selection
    selectedModel: 'gemini-2.5-flash',
    availableModels: {
        'gemini-2.0-flash-exp': {
            name: 'Gemini 2.0 Flash (Experimental)',
            description: 'Latest experimental model with improved performance',
            provider: 'Google',
            cost: '$0.075/1K tokens',
            features: ['📷 Images', '🎵 Audio', '🎬 Video']
        },
        'gemini-2.5-flash': {
            name: 'Gemini 2.5 Flash',
            description: 'Advanced flash model with enhanced capabilities',
            provider: 'Google',
            cost: '$0.075/1K tokens',
            features: ['📷 Images', '🎵 Audio', '🎬 Video']
        },
        'gemini-1.5-flash': {
            name: 'Gemini 1.5 Flash',
            description: 'Fast and efficient multimodal model',
            provider: 'Google',
            cost: '$0.075/1K tokens',
            features: ['📷 Images', '🎵 Audio', '🎬 Video']
        },
        'gemini-1.5-pro': {
            name: 'Gemini 1.5 Pro',
            description: 'Most capable multimodal model for complex reasoning',
            provider: 'Google',
            cost: '$3.50/1K tokens',
            features: ['📷 Images', '🎵 Audio', '🎬 Video']
        }
    },
    // UI expansion state
    isTransitioning: false,
    expansionState: 'collapsed', // 'collapsed' | 'expanding' | 'expanded' | 'collapsing'
    // Window height mgmt
    adjustHeightTimeout: null,
    lastTargetHeight: 0,
    isHeightAdjusting: false,
    heightAdjustmentQueue: [],
};

export const getNextAttachmentId = () => `attachment_${++state.attachmentIdCounter}`;


