import { app } from 'electron';


// Since selection-hook might not have types, we use require and any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SelectionHook: any = null;

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SelectionHook = require('selection-hook');
    console.log('Text Selection Monitor: selection-hook module loaded successfully');
} catch (e: any) {
    const isPackaged = app ? app.isPackaged : false;
    console.error('Text Selection Monitor: selection-hook not available:', e.message);
    console.error('Text Selection Monitor: Error details:', {
        isPackaged,
        errorCode: e.code,
        errorStack: e.stack?.split('\n').slice(0, 3).join('\n')
    });
}

export interface SelectionData {
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export type SelectionCallback = (data: SelectionData) => void;

/**
 * Text Selection Monitor
 * Monitors text selection changes across the system using OS-level APIs
 */
export class TextSelectionMonitor {
    private isMonitoring: boolean = false;
    private onSelectionCallbacks: SelectionCallback[] = [];
    private lastSelection: SelectionData | null = null;
    private lastSelectionTime: number = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private selectionHook: any = null;
    private debounceTimer: NodeJS.Timeout | null = null;
    private debounceDelay: number = 300; // milliseconds
    private minTimeBetweenSameSelection: number = 1000; // Allow same text to trigger again after 1 second

    constructor() {
        this.isMonitoring = false;
        this.onSelectionCallbacks = [];
        this.lastSelection = null;
        this.lastSelectionTime = 0;
        this.selectionHook = null;
        this.debounceTimer = null;
        this.debounceDelay = 300;
        this.minTimeBetweenSameSelection = 1000;
    }

    /**
     * Start monitoring text selection changes
     */
    public startMonitoring(): void {
        if (this.isMonitoring) return;

        console.log('Text Selection Monitor: Starting text selection monitoring');

        // Check if SelectionHook is available
        if (!SelectionHook) {
            const isPackaged = app ? app.isPackaged : false;
            console.error('Text Selection Monitor: selection-hook module not available, cannot start monitoring');
            console.error('Text Selection Monitor: This is likely a packaging issue. Check:');
            console.error('  1. Is selection-hook in package.json dependencies?');
            console.error('  2. Was the app rebuilt with: npm rebuild');
            console.error('  3. Is the native module unpacked from ASAR?');
            console.error(`  4. App is packaged: ${isPackaged}`);
            return;
        }

        this.isMonitoring = true;

        try {
            // Create a new instance of the selection hook
            this.selectionHook = new SelectionHook();

            // Listen for text selection changes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.selectionHook.on('text-selection', (data: any) => {
                this.handleSelectionChange(data);
            });

            // Start monitoring with default configuration
            this.selectionHook.start();

            console.log('Text Selection Monitor: Successfully started');
        } catch (error) {
            console.error('Text Selection Monitor: Error starting monitor:', error);
            this.isMonitoring = false;
        }
    }

    /**
     * Stop monitoring text selection changes
     */
    public stopMonitoring(): void {
        if (!this.isMonitoring) return;

        console.log('Text Selection Monitor: Stopping text selection monitoring');
        this.isMonitoring = false;

        // Clear any pending debounced events
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        try {
            if (this.selectionHook) {
                this.selectionHook.stop();
                this.selectionHook.cleanup();
                this.selectionHook = null;
            }
        } catch (error) {
            console.error('Text Selection Monitor: Error stopping monitor:', error);
        }
    }

    /**
     * Handle selection change events with debouncing
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleSelectionChange(selectionData: any): void {
        if (!this.isMonitoring) return;

        // Debounce rapid selection changes
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.processSelectionChange(selectionData);
            this.debounceTimer = null;
        }, this.debounceDelay);
    }

    /**
     * Process selection change events
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private processSelectionChange(selectionData: any): void {
        try {
            // Validate selection data
            if (!selectionData || typeof selectionData !== 'object') {
                console.log('Text Selection Monitor: Invalid selection data received');
                return;
            }

            // Check if selection has actually changed
            if (this.hasSelectionChanged(this.lastSelection, selectionData)) {
                console.log('Text Selection Monitor: Text selection changed', selectionData?.text?.substring(0, 50) + '...');
                this.lastSelection = selectionData;
                this.lastSelectionTime = Date.now(); // Update timestamp

                // Notify all callbacks
                this.onSelectionCallbacks.forEach(callback => {
                    try {
                        callback(selectionData);
                    } catch (error) {
                        console.error('Text Selection Monitor: Error in selection callback:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Text Selection Monitor: Error handling selection change:', error);
        }
    }

    /**
     * Check if selection has changed
     */
    private hasSelectionChanged(oldSelection: SelectionData | null, newSelection: SelectionData | null): boolean {
        if (!oldSelection && !newSelection) return false;
        if (!oldSelection || !newSelection) return true;

        // Compare text content
        const oldText = oldSelection.text || '';
        const newText = newSelection.text || '';

        // If text is different, it's definitely a change
        if (oldText !== newText && newText.trim().length > 0) {
            return true;
        }

        // If text is the same, allow it to trigger again if enough time has passed
        // This allows users to select the same text again after the UI disappears
        if (oldText === newText && newText.trim().length > 0) {
            const timeSinceLastSelection = Date.now() - this.lastSelectionTime;
            if (timeSinceLastSelection >= this.minTimeBetweenSameSelection) {
                return true; // Allow same text to trigger again after delay
            }
        }

        return false;
    }

    /**
     * Add a callback for selection changes
     */
    public onSelection(callback: SelectionCallback): void {
        if (typeof callback === 'function') {
            this.onSelectionCallbacks.push(callback);
        }
    }

    /**
     * Remove a callback
     */
    public removeCallback(callback: SelectionCallback): void {
        const index = this.onSelectionCallbacks.indexOf(callback);
        if (index > -1) {
            this.onSelectionCallbacks.splice(index, 1);
        }
    }

    /**
     * Get monitoring status
     */
    public isActive(): boolean {
        return this.isMonitoring;
    }

    /**
     * Get current selection
     */
    public getCurrentSelection(): SelectionData | null {
        if (this.selectionHook) {
            try {
                return this.selectionHook.getCurrentSelection();
            } catch (error) {
                console.error('Text Selection Monitor: Error getting current selection:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Set debounce delay
     */
    public setDebounceDelay(delay: number): void {
        this.debounceDelay = delay;
    }
}

// Create singleton instance
export const textSelectionMonitor = new TextSelectionMonitor();
