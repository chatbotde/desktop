/**
 * Prompt Action Registry
 * Allows dynamic registration of prompt builders without modifying core files.
 */

export interface PromptAction {
    id: string
    label: string
    description?: string
    builder: (content: string, context?: any) => string
}

class PromptActionRegistry {
    private actions = new Map<string, PromptAction>()

    /**
     * Register a new prompt action
     */
    register(action: PromptAction) {
        if (this.actions.has(action.id)) {
            console.warn(`Action "${action.id}" is already registered. Overwriting.`)
        }
        this.actions.set(action.id, action)
    }

    /**
     * Get an action by ID
     */
    get(id: string): PromptAction | undefined {
        return this.actions.get(id)
    }

    /**
     * Get all registered actions
     */
    getAll(): PromptAction[] {
        return Array.from(this.actions.values())
    }

    /**
     * Build prompt using a specific action
     */
    build(id: string, content: string, context?: any): string {
        const action = this.actions.get(id)
        if (!action) {
            throw new Error(`Action "${id}" not found in registry.`)
        }
        return action.builder(content, context)
    }
}

export const promptActionRegistry = new PromptActionRegistry()
