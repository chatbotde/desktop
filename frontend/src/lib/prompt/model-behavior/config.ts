/**
 * Model Behavior Configuration
 * 
 * Defines how models should behave for different actions and scenarios.
 * This allows fine-tuning model responses based on context.
 */

export interface ModelBehaviorConfig {
  /**
   * How the model should respond to ask actions
   */
  askBehavior?: {
    /**
     * Tone/style of response
     */
    tone?: 'conversational' | 'professional' | 'friendly' | 'technical'
    
    /**
     * Response length preference
     */
    length?: 'brief' | 'medium' | 'detailed'
    
    /**
     * Whether to ask follow-up questions
     */
    askFollowUps?: boolean
  }
  
  /**
   * How the model should respond to explain actions
   */
  explainBehavior?: {
    /**
     * Explanation depth
     */
    depth?: 'simple' | 'moderate' | 'comprehensive'
    
    /**
     * Target audience level
     */
    audience?: 'beginner' | 'intermediate' | 'advanced'
    
    /**
     * Include examples
     */
    includeExamples?: boolean
    
    /**
     * Include analogies
     */
    includeAnalogies?: boolean
  }
  
  /**
   * How the model should respond to change actions
   */
  changeBehavior?: {
    /**
     * Preservation level (how much of original to keep)
     */
    preservation?: 'minimal' | 'moderate' | 'maximum'
    
    /**
     * Improvement focus
     */
    focus?: 'clarity' | 'conciseness' | 'style' | 'grammar' | 'all'
    
    /**
     * Whether to explain changes
     */
    explainChanges?: boolean
  }
  
  /**
   * General model behavior
   */
  general?: {
    /**
     * Response style
     */
    style?: 'concise' | 'balanced' | 'detailed'
    
    /**
     * Use markdown formatting
     */
    useMarkdown?: boolean
    
    /**
     * Include code examples when relevant
     */
    includeCodeExamples?: boolean
  }
}

/**
 * Default model behavior configuration
 */
export const DEFAULT_MODEL_BEHAVIOR: ModelBehaviorConfig = {
  askBehavior: {
    tone: 'conversational',
    length: 'medium',
    askFollowUps: true,
  },
  explainBehavior: {
    depth: 'moderate',
    audience: 'intermediate',
    includeExamples: true,
    includeAnalogies: true,
  },
  changeBehavior: {
    preservation: 'moderate',
    focus: 'all',
    explainChanges: false,
  },
  general: {
    style: 'balanced',
    useMarkdown: true,
    includeCodeExamples: true,
  },
}

/**
 * Learning-focused model behavior
 */
export const LEARNING_MODEL_BEHAVIOR: ModelBehaviorConfig = {
  askBehavior: {
    tone: 'friendly',
    length: 'medium',
    askFollowUps: true,
  },
  explainBehavior: {
    depth: 'comprehensive',
    audience: 'beginner',
    includeExamples: true,
    includeAnalogies: true,
  },
  changeBehavior: {
    preservation: 'maximum',
    focus: 'clarity',
    explainChanges: true,
  },
  general: {
    style: 'balanced',
    useMarkdown: true,
    includeCodeExamples: true,
  },
}

/**
 * Code-focused model behavior
 */
export const CODE_MODEL_BEHAVIOR: ModelBehaviorConfig = {
  askBehavior: {
    tone: 'technical',
    length: 'detailed',
    askFollowUps: true,
  },
  explainBehavior: {
    depth: 'comprehensive',
    audience: 'intermediate',
    includeExamples: true,
    includeAnalogies: false,
  },
  changeBehavior: {
    preservation: 'minimal',
    focus: 'all',
    explainChanges: false,
  },
  general: {
    style: 'concise',
    useMarkdown: true,
    includeCodeExamples: true,
  },
}

/**
 * Get model behavior configuration by preset name
 */
export function getModelBehaviorPreset(
  preset: 'default' | 'learning' | 'code'
): ModelBehaviorConfig {
  switch (preset) {
    case 'learning':
      return LEARNING_MODEL_BEHAVIOR
    case 'code':
      return CODE_MODEL_BEHAVIOR
    default:
      return DEFAULT_MODEL_BEHAVIOR
  }
}

/**
 * Merge behavior configurations
 */
export function mergeModelBehavior(
  base: ModelBehaviorConfig,
  overrides: Partial<ModelBehaviorConfig>
): ModelBehaviorConfig {
  return {
    ...base,
    ...overrides,
    askBehavior: {
      ...base.askBehavior,
      ...overrides.askBehavior,
    },
    explainBehavior: {
      ...base.explainBehavior,
      ...overrides.explainBehavior,
    },
    changeBehavior: {
      ...base.changeBehavior,
      ...overrides.changeBehavior,
    },
    general: {
      ...base.general,
      ...overrides.general,
    },
  }
}

