
import { autoUpdater } from 'electron';
import { IAutoUpdaterService } from './IAutoUpdaterService';

export class ElectronAutoUpdaterService implements IAutoUpdaterService {
    public setFeedURL(options: Electron.FeedURLOptions): void {
        autoUpdater.setFeedURL(options);
    }

    public getFeedURL(): string {
        return autoUpdater.getFeedURL();
    }

    public checkForUpdates(): void {
        autoUpdater.checkForUpdates();
    }

    public quitAndInstall(): void {
        autoUpdater.quitAndInstall();
    }

    public on(event: string, listener: Function): void {
        autoUpdater.on(event as any, listener as any);
    }

    public once(event: string, listener: Function): void {
        autoUpdater.once(event as any, listener as any);
    }

    public removeListener(event: string, listener: Function): void {
        autoUpdater.removeListener(event as any, listener as any);
    }

    public removeAllListeners(event?: string): void {
        autoUpdater.removeAllListeners(event as any);
    }
}
