
export interface IAutoUpdaterService {
    setFeedURL(options: Electron.FeedURLOptions): void;
    getFeedURL(): string;
    checkForUpdates(): void;
    quitAndInstall(): void;

    // Event Emitter methods
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}
