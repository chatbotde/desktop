
export interface IGlobalShortcutService {
    register(accelerator: string, callback: () => void): boolean;
    registerAll(accelerators: string[], callback: () => void): void;
    isRegistered(accelerator: string): boolean;
    unregister(accelerator: string): void;
    unregisterAll(): void;
}
