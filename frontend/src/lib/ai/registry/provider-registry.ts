/**
 * Provider Registry - Central registry for all AI providers
 * This allows easy extension and management of multiple providers
 */

import type { IAIProvider, AIModel } from '../types';
import { geminiProvider } from '../providers/gemini-provider';
import { openaiProvider } from '../providers/openai-provider';
import { anthropicProvider } from '../providers/anthropic-provider';
import { openrouterProvider } from '../providers/openrouter-provider';

export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

/**
 * Provider Registry Class
 * Manages all available AI providers and their configurations
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, IAIProvider> = new Map();
  private currentProviderName: ProviderName = 'gemini';

  private constructor() {
    this.registerDefaultProviders();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    this.registerProvider('gemini', geminiProvider);
    this.registerProvider('openai', openaiProvider);
    this.registerProvider('anthropic', anthropicProvider);
    this.registerProvider('openrouter', openrouterProvider);
  }

  /**
   * Register a new AI provider
   */
  registerProvider(name: string, provider: IAIProvider): void {
    this.providers.set(name, provider);
    console.log(`✅ Registered AI provider: ${name}`);
  }

  /**
   * Unregister an AI provider
   */
  unregisterProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): IAIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): IAIProvider {
    const provider = this.providers.get(this.currentProviderName);
    if (!provider) {
      throw new Error(`Provider "${this.currentProviderName}" not found`);
    }
    return provider;
  }

  /**
   * Get the current provider name
   */
  getCurrentProviderName(): ProviderName {
    return this.currentProviderName;
  }

  /**
   * Set the current active provider
   */
  setCurrentProvider(name: ProviderName): boolean {
    if (this.providers.has(name)) {
      this.currentProviderName = name;
      // Save to localStorage
      localStorage.setItem('current-ai-provider', name);
      console.log(`🔄 Switched to provider: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Map<string, IAIProvider> {
    return this.providers;
  }

  /**
   * Get all available (configured) providers
   */
  getAvailableProviders(): Map<string, IAIProvider> {
    const available = new Map<string, IAIProvider>();
    this.providers.forEach((provider, name) => {
      if (provider.isConfigured()) {
        available.set(name, provider);
      }
    });
    return available;
  }

  /**
   * Get all available provider names
   */
  getAvailableProviderNames(): string[] {
    const names: string[] = [];
    this.providers.forEach((provider, name) => {
      if (provider.isConfigured()) {
        names.push(name);
      }
    });
    return names;
  }

  /**
   * Get all available models from all providers
   */
  getAllAvailableModels(): AIModel[] {
    const models: AIModel[] = [];
    this.providers.forEach((provider) => {
      if (provider.isConfigured()) {
        models.push(...provider.getAvailableModels());
      }
    });
    return models;
  }

  /**
   * Get models from a specific provider
   */
  getModelsFromProvider(providerName: string): AIModel[] {
    const provider = this.providers.get(providerName);
    if (provider && provider.isConfigured()) {
      return provider.getAvailableModels();
    }
    return [];
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Record<string, { configured: boolean; name: string; capabilities: any }> {
    const status: Record<string, { configured: boolean; name: string; capabilities: any }> = {};
    this.providers.forEach((provider, name) => {
      status[name] = {
        configured: provider.isConfigured(),
        name: provider.name,
        capabilities: provider.capabilities,
      };
    });
    return status;
  }

  /**
   * Initialize from localStorage
   */
  initializeFromStorage(): void {
    const savedProvider = localStorage.getItem('current-ai-provider') as ProviderName;
    if (savedProvider && this.providers.has(savedProvider)) {
      this.currentProviderName = savedProvider;
      console.log(`📂 Loaded provider from storage: ${savedProvider}`);
    }
  }

  /**
   * Find provider by model ID
   */
  findProviderByModel(modelId: string): IAIProvider | undefined {
    for (const [, provider] of this.providers) {
      const models = provider.getAvailableModels();
      if (models.some(m => m.id === modelId)) {
        return provider;
      }
    }
    return undefined;
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry.getInstance();

// Initialize from storage on import
providerRegistry.initializeFromStorage();

// Export utility functions
export const getCurrentProvider = () => providerRegistry.getCurrentProvider();
export const setCurrentProvider = (name: ProviderName) => providerRegistry.setCurrentProvider(name);
export const getProvider = (name: string) => providerRegistry.getProvider(name);
export const getAllAvailableModels = () => providerRegistry.getAllAvailableModels();
export const getProviderStatus = () => providerRegistry.getProviderStatus();
