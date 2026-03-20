const { app } = require('electron');

let SelectionHook = null;

try {
    SelectionHook = require('selection-hook');
    console.log('Text Selection Monitor: selection-hook module loaded successfully');
} catch (e) {
    const isPackaged = app ? app.isPackaged : false;
    console.error('Text Selection Monitor: selection-hook not available:', e.message);
    console.error('Text Selection Monitor: Error details:', {
        isPackaged,
        errorCode: e.code,
        errorStack: e.stack?.split('\n').slice(0, 3).join('\n')
    });
}

class TextSelectionMonitor {
    constructor() {
        this.isMonitoring = false;
        this.onSelectionCallbacks = [];
        this.lastSelection = null;
        this.lastSelectionTime = 0;
        this.selectionHook = null;
        this.debounceTimer = null;
        this.debounceDelay = 100;
        this.minTimeBetweenSameSelection = 500;
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        console.log('Text Selection Monitor: Starting text selection monitoring');

        if (!SelectionHook) {
            console.error('Text Selection Monitor: selection-hook module not available, cannot start monitoring');
            return;
        }

        this.isMonitoring = true;

        try {
            this.selectionHook = new SelectionHook();
            this.selectionHook.on('text-selection', (data) => {
                this.handleSelectionChange(data);
            });
            this.selectionHook.start();
            console.log('Text Selection Monitor: Successfully started');
        } catch (error) {
            console.error('Text Selection Monitor: Error starting monitor:', error);
            this.isMonitoring = false;
        }
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;

        console.log('Text Selection Monitor: Stopping text selection monitoring');
        this.isMonitoring = false;

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

    handleSelectionChange(selectionData) {
        if (!this.isMonitoring) return;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.processSelectionChange(selectionData);
            this.debounceTimer = null;
        }, this.debounceDelay);
    }

    processSelectionChange(selectionData) {
        try {
            if (!selectionData || typeof selectionData !== 'object') {
                return;
            }

            if (this.hasSelectionChanged(this.lastSelection, selectionData)) {
                console.log('Text Selection Monitor: Selection detected from', selectionData?.programName || 'unknown');
                this.lastSelection = selectionData;
                this.lastSelectionTime = Date.now();

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

    hasSelectionChanged(oldSelection, newSelection) {
        if (!oldSelection && !newSelection) return false;
        if (!oldSelection || !newSelection) return true;

        const oldText = oldSelection.text || '';
        const newText = newSelection.text || '';

        if (oldText !== newText && newText.trim().length > 0) {
            return true;
        }

        if (oldText === newText && newText.trim().length > 0) {
            const timeSinceLastSelection = Date.now() - this.lastSelectionTime;
            if (timeSinceLastSelection >= this.minTimeBetweenSameSelection) {
                return true;
            }
        }

        return false;
    }

    onSelection(callback) {
        if (typeof callback === 'function') {
            this.onSelectionCallbacks.push(callback);
        }
    }

    removeCallback(callback) {
        const index = this.onSelectionCallbacks.indexOf(callback);
        if (index > -1) {
            this.onSelectionCallbacks.splice(index, 1);
        }
    }

    isActive() {
        return this.isMonitoring;
    }
}

const textSelectionMonitor = new TextSelectionMonitor();
module.exports = { textSelectionMonitor };

