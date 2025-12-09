
import { globalShortcut } from 'electron';
import { IGlobalShortcutService } from './IGlobalShortcutService';

export class ElectronGlobalShortcutService implements IGlobalShortcutService {
    public register(accelerator: string, callback: () => void): boolean {
        return globalShortcut.register(accelerator as any, callback as any) as unknown as boolean;
    }

    public registerAll(accelerators: string[], callback: () => void): void {
        globalShortcut.registerAll(accelerators as any, callback as any);
    }

    public isRegistered(accelerator: string): boolean {
        return globalShortcut.isRegistered(accelerator as any);
    }

    public unregister(accelerator: string): void {
        globalShortcut.unregister(accelerator as any);
    }

    public unregisterAll(): void {
        globalShortcut.unregisterAll();
    }
}
