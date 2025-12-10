import { clipboard, NativeImage } from 'electron';

export interface ClipboardContent {
    type: 'text' | 'html' | 'rtf' | 'image' | 'bookmark';
    content: string | NativeImage;
    formats: string[];
}

export type ChangeCallback = (content: ClipboardContent) => void;

/**
 * Clipboard Monitor
 * Monitors clipboard changes and notifies when content is updated
 */
export class ClipboardMonitor {
    private isMonitoring: boolean = false;
    private lastContent: ClipboardContent | null = null;
    private checkInterval: NodeJS.Timeout | null = null;
    private onChangeCallbacks: ChangeCallback[] = [];
    private checkIntervalMs: number = 500; // Check every 500ms

    constructor() {
        this.isMonitoring = false;
        this.lastContent = null;
        this.checkInterval = null;
        this.onChangeCallbacks = [];
        this.checkIntervalMs = 500;
    }

    /**
     * Start monitoring clipboard changes
     */
    public startMonitoring(): void {
        if (this.isMonitoring) return;

        console.log('Clipboard Monitor: Starting clipboard monitoring');
        this.isMonitoring = true;

        // Get initial clipboard content
        this.lastContent = this.getCurrentClipboardContent();

        // Start periodic checking
        this.checkInterval = setInterval(() => {
            this.checkForChanges();
        }, this.checkIntervalMs);
    }

    /**
     * Stop monitoring clipboard changes
     */
    public stopMonitoring(): void {
        if (!this.isMonitoring) return;

        console.log('Clipboard Monitor: Stopping clipboard monitoring');
        this.isMonitoring = false;

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check if clipboard content has changed
     */
    private checkForChanges(): void {
        if (!this.isMonitoring) return;

        try {
            const currentContent = this.getCurrentClipboardContent();

            if (this.hasContentChanged(this.lastContent, currentContent)) {
                console.log('Clipboard Monitor: Clipboard content changed');
                this.lastContent = currentContent;

                // Notify all callbacks
                this.onChangeCallbacks.forEach(callback => {
                    try {
                        callback(currentContent!);
                    } catch (error) {
                        console.error('Clipboard Monitor: Error in change callback:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Clipboard Monitor: Error checking clipboard changes:', error);
        }
    }

    /**
     * Get current clipboard content
     */
    public getCurrentClipboardContent(): ClipboardContent | null {
        try {
            const formats = clipboard.availableFormats();

            // Check for different content types in order of preference
            if (formats.includes('text/plain') || formats.includes('public.utf8-plain-text')) {
                return {
                    type: 'text',
                    content: clipboard.readText(),
                    formats: formats
                };
            }

            if (formats.includes('text/html')) {
                return {
                    type: 'html',
                    content: clipboard.readHTML(),
                    formats: formats
                };
            }

            if (formats.includes('text/rtf')) {
                return {
                    type: 'rtf',
                    content: clipboard.readRTF(),
                    formats: formats
                };
            }

            if (formats.some(format => format.includes('image/'))) {
                try {
                    const image = clipboard.readImage();
                    if (!image.isEmpty()) {
                        return {
                            type: 'image',
                            content: image,
                            formats: formats
                        };
                    }
                } catch (error) {
                    console.error('Clipboard Monitor: Error reading image:', error);
                }
            }

            // Check for bookmark/URL
            if (formats.includes('text/uri-list') || formats.includes('public.url')) {
                try {
                    const text = clipboard.readText();
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                        return {
                            type: 'bookmark',
                            content: text,
                            formats: formats
                        };
                    }
                } catch (error) {
                    console.error('Clipboard Monitor: Error reading bookmark:', error);
                }
            }

            // Fallback to any available text
            try {
                const text = clipboard.readText();
                if (text) {
                    return {
                        type: 'text',
                        content: text,
                        formats: formats
                    };
                }
            } catch (error) {
                console.error('Clipboard Monitor: Error reading text fallback:', error);
            }

            return null;
        } catch (error) {
            console.error('Clipboard Monitor: Error getting clipboard content:', error);
            return null;
        }
    }

    /**
     * Check if clipboard content has changed
     */
    private hasContentChanged(oldContent: ClipboardContent | null, newContent: ClipboardContent | null): boolean {
        if (!oldContent && !newContent) return false;
        if (!oldContent || !newContent) return true;

        // Compare types
        if (oldContent!.type !== newContent!.type) return true;

        // Compare content based on type
        switch (oldContent!.type) {
            case 'text':
            case 'html':
            case 'rtf':
            case 'bookmark':
                return oldContent!.content !== newContent!.content;

            case 'image':
                // For images, compare basic properties
                try {
                    const oldImg = oldContent!.content as NativeImage;
                    const newImg = newContent!.content as NativeImage;
                    const oldSize = oldImg.getSize();
                    const newSize = newImg.getSize();
                    return oldSize.width !== newSize.width || oldSize.height !== newSize.height;
                } catch (error) {
                    return true; // Assume changed if we can't compare
                }

            default:
                return true; // Assume changed for unknown types
        }
    }

    /**
     * Add a callback for clipboard changes
     */
    public onChange(callback: ChangeCallback): void {
        if (typeof callback === 'function') {
            this.onChangeCallbacks.push(callback);
        }
    }

    /**
     * Remove a callback
     */
    public removeCallback(callback: ChangeCallback): void {
        const index = this.onChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.onChangeCallbacks.splice(index, 1);
        }
    }

    /**
     * Get monitoring status
     */
    public isActive(): boolean {
        return this.isMonitoring;
    }

    /**
     * Set check interval (in milliseconds)
     */
    public setCheckInterval(intervalMs: number): void {
        this.checkIntervalMs = Math.max(100, intervalMs); // Minimum 100ms

        if (this.isMonitoring) {
            // Restart monitoring with new interval
            this.stopMonitoring();
            this.startMonitoring();
        }
    }
}

// Create singleton instance
export const clipboardMonitor = new ClipboardMonitor();
