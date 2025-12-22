import { globalShortcut } from 'electron';
import { spawn } from 'child_process';
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

    public async simulatePaste(): Promise<void> {
        return new Promise((resolve, reject) => {
            const ps = spawn('powershell', [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('^v')"
            ]);

            ps.on('error', (err) => {
                console.error('Failed to simulate paste:', err);
                reject(err);
            });

            ps.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`PowerShell process exited with code ${code}`));
                }
            });
        });
    }
}
