/**
 * AI SDK Unified Service
 * 
 * A complete replacement for the legacy unified-ai-service that uses
 * the Vercel AI SDK for all provider interactions.
 * 
 * Benefits:
 * - Single unified interface for all providers
 * - Consistent streaming behavior
 * - Easy to add new providers
 * - Built-in tool calling support
 * - Better error handling
 */

import { getSelectedModel } from '../model-config';
import type { MediaAttachment } from '../gemini';
import { getDefaultSystemPrompt, getSystemPromptById, type SystemPrompt } from '../system-prompts';
import { checkRateLimit, logUsage } from '../usage-tracker';

import {
    generateImages as replicateGenerateImages,
    generateVideos as replicateGenerateVideos
} from '../../image/replicate';
import {
    generateGoogleImages,
    isGeminiImageModel,
} from '../../image/google-image';
import {
    validateMessage,
    validateAttachments,
    getCapabilitySummary,
    getCapabilityBadges,
    getCapabilityIcons,
    formatValidationMessage,
    willAttachmentBeSupported,
    type CapabilityValidationResult,
    type CapabilitySummary,
} from '../capabilities';
import {
    ai,
    isProviderConfigured,
    type ProviderId,
} from './index';
import { getResponseLanguageSystemSuffix, mergeSystemPromptWithResponseLanguage } from '@/lib/settings/general-settings';

// ============================================================================
// Types
// ============================================================================

// Message type compatible with AI SDK
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string | URL }>;
}

interface ChatHistory {
    messages: Message[];
    systemPrompt: string | undefined;
}

// Map provider names from model-config to AI SDK provider IDs
function mapProviderToAISDK(provider: string): ProviderId {
    const providerMap: Record<string, ProviderId> = {
        'google': 'google',
        'openai': 'openai',
        'anthropic': 'anthropic',
        'openrouter': 'openrouter',
        'cerebras': 'cerebras',
        'deepseek': 'deepseek',
        'kimi': 'kimi',
        'xai': 'xai',
        'groq': 'groq',
        'together': 'together',
        'perplexity': 'perplexity',
        'fireworks': 'fireworks',
        'mistral': 'mistral',
        'ollama': 'ollama',
        'lmstudio': 'lmstudio',
    };
    return providerMap[provider.toLowerCase()] || provider.toLowerCase() as ProviderId;
}

// ============================================================================
// Unified AI Service (AI SDK Version)
// ============================================================================

export class AISDKUnifiedService {
    private chatHistory: Map<string, ChatHistory> = new Map();
    private currentSystemPrompt: SystemPrompt | null = null;
    private usageTrackingEnabled: boolean = true;
    /** Base system text from the selected prompt (without language suffix). */
    private baseSystemContext: string = '';
    private globalSystemContext: string = '';

    constructor() {
        // Initialize with default general assistant prompt
        this.setSystemPrompt('general');
    }

    // ============================================================================
    // Chat History Management
    // ============================================================================

    private refreshDerivedSystemContext(): void {
        const suffix = getResponseLanguageSystemSuffix();
        this.globalSystemContext = suffix
            ? `${this.baseSystemContext}\n\n${suffix}`
            : this.baseSystemContext;
        this.chatHistory.forEach((history) => {
            history.systemPrompt = this.globalSystemContext || undefined;
        });
    }

    private getOrCreateHistory(providerId: string): ChatHistory {
        if (!this.chatHistory.has(providerId)) {
            this.chatHistory.set(providerId, {
                messages: [],
                systemPrompt: this.globalSystemContext || undefined,
            });
        }
        return this.chatHistory.get(providerId)!;
    }

    private addToHistory(providerId: string, message: Message): void {
        const history = this.getOrCreateHistory(providerId);
        history.messages.push(message);

        // Keep history manageable (last 50 messages)
        if (history.messages.length > 50) {
            history.messages = history.messages.slice(-50);
        }
    }

    // ============================================================================
    // Media Conversion
    // ============================================================================

    private async convertAttachmentsToContent(
        message: string,
        attachments?: MediaAttachment[]
    ): Promise<Message> {
        // If no attachments, return simple text message
        if (!attachments?.length) {
            return { role: 'user', content: message };
        }

        // Build multipart content
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string | URL }> = [];

        // Add text first
        if (message.trim()) {
            content.push({ type: 'text', text: message });
        }

        // Add attachments
        for (const attachment of attachments) {
            if (attachment.mediaType === 'image') {
                let imageData = attachment.data;

                // Convert blob URLs to base64
                if (imageData.startsWith('blob:') || (imageData.startsWith('http') && !imageData.startsWith('data:'))) {
                    try {
                        const response = await fetch(imageData);
                        const blob = await response.blob();
                        imageData = await this.blobToBase64(blob);
                    } catch (error) {
                        console.error('Failed to convert blob to base64:', error);
                        continue;
                    }
                }

                content.push({ type: 'image', image: imageData });
            }
            // TODO: Handle audio and video attachments when needed
        }

        return { role: 'user', content };
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ============================================================================
    // Configuration & Settings
    // ============================================================================

    setUsageTracking(enabled: boolean): void {
        this.usageTrackingEnabled = enabled;
    }

    setSystemPrompt(promptId: string): void {
        const prompt = getSystemPromptById(promptId);
        if (!prompt) {
            console.warn(`System prompt '${promptId}' not found, using default`);
            this.currentSystemPrompt = getDefaultSystemPrompt();
        } else {
            this.currentSystemPrompt = prompt;
        }

        this.baseSystemContext = this.currentSystemPrompt.prompt;
        this.refreshDerivedSystemContext();

        console.log(`✅ System prompt set to: ${this.currentSystemPrompt.name}`);
    }

    setCustomSystemPrompt(prompt: string, name: string = 'Custom'): void {
        this.currentSystemPrompt = {
            id: 'custom',
            name,
            description: 'Custom system prompt',
            prompt,
        };

        this.baseSystemContext = prompt;
        this.refreshDerivedSystemContext();

        console.log(`✅ Custom system prompt applied: ${name}`);
    }

    getCurrentSystemPrompt(): SystemPrompt | null {
        return this.currentSystemPrompt;
    }

    addSystemContext(context: string): void {
        this.baseSystemContext = context;
        this.refreshDerivedSystemContext();
    }

    // ============================================================================
    // Validation & Capabilities
    // ============================================================================

    validateBeforeSend(message: string, attachments?: MediaAttachment[]): CapabilityValidationResult {
        return validateMessage(message, attachments);
    }

    getModelCapabilities(): CapabilitySummary {
        return getCapabilitySummary();
    }

    getCapabilityBadges(): string[] {
        return getCapabilityBadges();
    }

    getCapabilityIcons(): { icon: string; label: string; supported: boolean }[] {
        return getCapabilityIcons();
    }

    willAttachmentBeSupported(mediaType: 'image' | 'audio' | 'video'): { supported: boolean; message: string } {
        return willAttachmentBeSupported(mediaType);
    }

    formatValidationMessage(result: CapabilityValidationResult): {
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
        suggestions: string[];
    } {
        return formatValidationMessage(result);
    }

    // ============================================================================
    // Main Message Sending
    // ============================================================================

    async sendMessage(
        message: string,
        attachments?: MediaAttachment[],
        options?: { bypassHistory?: boolean; systemPromptOverride?: string }
    ): Promise<AsyncGenerator<string, void, unknown>> {
        const selectedModel = getSelectedModel();

        if (!selectedModel) {
            throw new Error('No AI model selected. Please select a model from the model selector.');
        }

        // Validate attachments against model capabilities
        const validation = validateAttachments(attachments, selectedModel);
        if (!validation.isValid) {
            const formatted = formatValidationMessage(validation);
            const errorDetails = validation.errors.map((e) => `• ${e.message}`).join('\n');
            const suggestion = formatted.suggestions.length > 0
                ? `\n\nSuggestion: ${formatted.suggestions[0]}`
                : '';
            throw new Error(`${formatted.title}\n\n${errorDetails}${suggestion}`);
        }

        const providerId = mapProviderToAISDK(selectedModel.provider);
        const modelName = selectedModel.name || selectedModel.id;

        // Check if provider is configured
        if (!isProviderConfigured(providerId)) {
            throw new Error(
                // `${selectedModel.provider} API key not configured. Please add VITE_${selectedModel.provider.toUpperCase()}_API_KEY to your .env file.`
                `SorryComing Soon!`
            );
        }

        // Check rate limit (use rough estimate for pre-request check)
        // Real token counts come from the API response after streaming
        if (this.usageTrackingEnabled) {
            // Rough estimate: ~4 chars per token for Latin text
            const roughEstimate = Math.ceil(message.length / 4);
            const rateLimitStatus = await checkRateLimit(roughEstimate);
            if (!rateLimitStatus.allowed) {
                throw new Error(
                    rateLimitStatus.error ||
                    `Rate limit exceeded. Please wait ${rateLimitStatus.resetIn} seconds before trying again.`
                );
            }
        }

        // Convert message and attachments to Message
        const userMessage = await this.convertAttachmentsToContent(message, attachments);

        // Re-read preferred response language from settings before each turn
        this.refreshDerivedSystemContext();

        // Add to history
        if (!options?.bypassHistory) {
            this.addToHistory(providerId, userMessage);
        }

        // Get full history for context
        const history = this.getOrCreateHistory(providerId);

        // Capture model settings before generator (to avoid closure issues)
        const modelTemperature = selectedModel.temperature;
        const modelMaxTokens = selectedModel.maxTokens;

        // Create tracked generator
        const self = this;
        async function* trackedGenerator(): AsyncGenerator<string, void, unknown> {
            let outputText = '';
            let usage: { inputTokens?: number; outputTokens?: number } | undefined;

            try {
                const result = await ai.stream(providerId, modelName, message, {
                    system: options?.systemPromptOverride ? mergeSystemPromptWithResponseLanguage(options.systemPromptOverride) : history.systemPrompt,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    messages: options?.bypassHistory ? [userMessage] as any : history.messages as any,
                    temperature: modelTemperature,
                    maxOutputTokens: modelMaxTokens,
                });

                for await (const chunk of result.textStream) {
                    outputText += chunk;
                    yield chunk;
                }

                // Get real token usage from AI SDK response
                const usageData = await result.usage;
                if (usageData) {
                    usage = {
                        inputTokens: usageData.inputTokens,
                        outputTokens: usageData.outputTokens,
                    };
                }

                // Add assistant response to history
                if (!options?.bypassHistory) {
                    self.addToHistory(providerId, { role: 'assistant', content: outputText });
                }
            } catch (error) {
                console.error(`[AISDKUnifiedService] ${providerId} error:`, error);
                throw error;
            } finally {
                // Log real usage from the API response
                if (self.usageTrackingEnabled && usage) {
                    logUsage({
                        model: modelName,
                        inputTokens: usage.inputTokens ?? 0,
                        outputTokens: usage.outputTokens ?? 0,
                        metadata: {
                            provider: providerId,
                            feature: 'chat',
                        },
                    }).catch((err) => {
                        console.warn('[AISDKUnifiedService] Failed to log usage:', err);
                    });
                }
            }
        }

        return trackedGenerator();
    }

    async sendMessageComplete(message: string, attachments?: MediaAttachment[], options?: { bypassHistory?: boolean; systemPromptOverride?: string }): Promise<string> {
        const stream = await this.sendMessage(message, attachments, options);
        let response = '';
        for await (const chunk of stream) {
            response += chunk;
        }
        return response;
    }

    // ============================================================================
    // Image Generation
    // ============================================================================

    /**
     * Generate images using the selected image provider.
     * @param prompt - The text prompt describing the image to generate
     * @param modelName - Optional model name
     * @returns Array of generated image URLs
     */
    async generateImages(prompt: string, modelName?: string): Promise<string[]> {
        try {
            console.log(`[AISDKUnifiedService] Generating images with prompt: "${prompt.slice(0, 50)}..."`);

            const selectedModel = getSelectedModel();
            const provider = selectedModel?.provider;
            const requestedModel = modelName || selectedModel?.name || selectedModel?.id;

            if (provider === 'google' || isGeminiImageModel(requestedModel)) {
                const result = await generateGoogleImages({
                    prompt,
                    model: isGeminiImageModel(requestedModel) ? requestedModel : undefined,
                });

                console.log(`[AISDKUnifiedService] Generated ${result.images.length} images using ${result.model}`);
                return result.images;
            }

            const result = await replicateGenerateImages({
                prompt,
                model: modelName as `${string}/${string}` | `${string}/${string}:${string}` | undefined,
            });

            console.log(`[AISDKUnifiedService] Generated ${result.images.length} images using ${result.model}`);

            return result.images;
        } catch (error) {
            console.error('[AISDKUnifiedService] Image generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate videos using Replicate API
     * @param prompt - The text prompt describing the video to generate
     * @param modelName - Optional model name
     * @returns Array of generated video URLs
     */
    async generateVideos(prompt: string, modelName?: string): Promise<string[]> {
        try {
            console.log(`[AISDKUnifiedService] Generating videos with prompt: "${prompt.slice(0, 50)}..."`);

            const result = await replicateGenerateVideos({
                prompt,
                model: modelName as `${string}/${string}` | `${string}/${string}:${string}` | undefined,
            });

            console.log(`[AISDKUnifiedService] Generated ${result.videos.length} videos using ${result.model}`);

            return result.videos;
        } catch (error) {
            console.error('[AISDKUnifiedService] Video generation failed:', error);
            throw error;
        }
    }


    // ============================================================================
    // History Management
    // ============================================================================

    clearHistory(): void {
        const selectedModel = getSelectedModel();
        if (!selectedModel) return;

        const providerId = mapProviderToAISDK(selectedModel.provider);
        this.chatHistory.delete(providerId);
    }

    clearAllHistory(): void {
        this.chatHistory.clear();
    }

    getHistory(): Message[] {
        const selectedModel = getSelectedModel();
        if (!selectedModel) return [];

        const providerId = mapProviderToAISDK(selectedModel.provider);
        return this.getOrCreateHistory(providerId).messages;
    }

    // ============================================================================
    // Model & Provider Info
    // ============================================================================

    getCurrentModelName(): string {
        const selectedModel = getSelectedModel();
        return selectedModel?.displayName || 'Unknown Model';
    }

    getCurrentProviderName(): string {
        const selectedModel = getSelectedModel();
        return selectedModel?.provider || 'Unknown Provider';
    }

    async isCurrentProviderConfigured(): Promise<boolean> {
        const selectedModel = getSelectedModel();
        if (!selectedModel) return false;

        const providerId = mapProviderToAISDK(selectedModel.provider);
        return isProviderConfigured(providerId);
    }

    async getCurrentProviderStatus(): Promise<{
        isConfigured: boolean;
        provider: string;
        model?: string;
        message: string;
    }> {
        const selectedModel = getSelectedModel();
        if (!selectedModel) {
            return {
                isConfigured: false,
                provider: 'None',
                message: 'No model selected',
            };
        }

        const isConfigured = await this.isCurrentProviderConfigured();

        return {
            isConfigured,
            provider: selectedModel.provider,
            model: selectedModel.displayName,
            message: isConfigured
                ? `${selectedModel.provider} API is configured and ready!`
                : `Sorry, I could not get a response right now. Coming Soon!`,
        };
    }

    // ============================================================================
    // Direct Provider Access (for advanced use cases)
    // ============================================================================

    /**
     * Stream directly from a specific provider/model (bypasses model selection)
     */
    async streamDirect(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        options?: {
            system?: string;
            temperature?: number;
            maxOutputTokens?: number;
        }
    ): Promise<AsyncGenerator<string, void, unknown>> {
        const result = await ai.stream(provider, modelId, prompt, {
            ...options,
            system: mergeSystemPromptWithResponseLanguage(options?.system),
        });

        async function* generator(): AsyncGenerator<string, void, unknown> {
            for await (const chunk of result.textStream) {
                yield chunk;
            }
        }

        return generator();
    }

    /**
     * Generate directly from a specific provider/model (bypasses model selection)
     */
    async generateDirect(
        provider: ProviderId,
        modelId: string,
        prompt: string,
        options?: {
            system?: string;
            temperature?: number;
            maxOutputTokens?: number;
        }
    ): Promise<string> {
        const result = await ai.generate(provider, modelId, prompt, {
            ...options,
            system: mergeSystemPromptWithResponseLanguage(options?.system),
        });
        return result.text;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const aiSDKUnifiedService = new AISDKUnifiedService();

// Convenience exports (matching legacy interface)
export const sendMessageAISDK = (message: string, attachments?: MediaAttachment[], options?: { bypassHistory?: boolean; systemPromptOverride?: string }) =>
    aiSDKUnifiedService.sendMessage(message, attachments, options);

export const sendMessageCompleteAISDK = (message: string, attachments?: MediaAttachment[], options?: { bypassHistory?: boolean; systemPromptOverride?: string }) =>
    aiSDKUnifiedService.sendMessageComplete(message, attachments, options);
