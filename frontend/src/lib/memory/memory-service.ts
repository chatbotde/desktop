export interface Memory {
    id: string;
    content: string;
    timestamp: number;
}

const STORAGE_KEY = 'assistant_memories';

export const MemoryService = {
    getMemories: (): Memory[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load memories:', error);
            return [];
        }
    },

    addMemory: (content: string): Memory => {
        const memories = MemoryService.getMemories();
        const newMemory: Memory = {
            id: crypto.randomUUID(),
            content,
            timestamp: Date.now(),
        };
        memories.push(newMemory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
        return newMemory;
    },

    removeMemory: (idOrContent: string): boolean => {
        // Try to remove by ID first, then by matching content
        let memories = MemoryService.getMemories();
        const initialLength = memories.length;

        memories = memories.filter(m => m.id !== idOrContent && m.content !== idOrContent);

        if (memories.length !== initialLength) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
            return true;
        }
        return false;
    },

    clearMemories: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
