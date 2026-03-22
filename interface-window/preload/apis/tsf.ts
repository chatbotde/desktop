/**
 * TSF API (Text Services Framework)
 * Provides text insertion functionality for any application
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { TsfAPI, TsfInsertOptions } from '../types';

export function createTsfAPI(): TsfAPI {
    return {
        /**
         * Initialize TSF system
         */
        initialize: () => ipcRenderer.invoke('tsf:initialize'),

        /**
         * Insert text into focused application
         * @param text - Text to insert
         * @param options - Insertion options
         * @returns Success status
         */
        insertText: (text: string, options?: TsfInsertOptions) => ipcRenderer.invoke('tsf:insert-text', text, options),

        /**
         * Insert text using clipboard fallback method
         * @param text - Text to insert
         * @returns Success status
         */
        insertTextFallback: (text: string) => ipcRenderer.invoke('tsf:insert-text-fallback', text),

        /**
         * Get information about focused window
         * @returns Focus info
         */
        getFocusInfo: () => ipcRenderer.invoke('tsf:get-focus-info'),

        /**
         * Check if TSF is available for current window
         * @returns Availability status
         */
        isTsfAvailable: () => ipcRenderer.invoke('tsf:is-tsf-available'),

        /**
         * Check if focused window is editable
         * @returns Editable status
         */
        isEditableWindow: () => ipcRenderer.invoke('tsf:is-editable-window'),

        /**
         * Enable or disable text insertion
         * @param enabled - Enable status
         */
        setEnabled: (enabled: boolean) => ipcRenderer.send('tsf:set-enabled', enabled),

        /**
         * Check if TSF is enabled
         * @returns Enabled status
         */
        isEnabled: () => ipcRenderer.invoke('tsf:is-enabled'),

        // Event listeners
        onFocusChanged: (callback: (focusInfo: any) => void) => {
            ipcRenderer.on('tsf:focus-changed', (_event: IpcRendererEvent, focusInfo: any) => callback(focusInfo));
        },

        onTextInserted: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:text-inserted', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        onInsertFailed: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:insert-failed', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        onWarning: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:warning', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        onTextReplaced: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:text-replaced', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        onReplaceFailed: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:replace-failed', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        onSelectionDeleted: (callback: (data: any) => void) => {
            ipcRenderer.on('tsf:selection-deleted', (_event: IpcRendererEvent, data: any) => callback(data));
        },

        /**
         * Get last external (non-Electron) focused application
         * @returns Last external focus info
         */
        getLastExternalFocus: () => ipcRenderer.invoke('tsf:get-last-external-focus'),

        /**
         * Get last focused window from native tracker
         * @returns Last focused window info
         */
        getLastFocusedWindow: () => ipcRenderer.invoke('tsf:get-last-focused-window'),

        /**
         * Focus the last tracked external application
         * @returns Success status
         */
        focusLastWindow: () => ipcRenderer.invoke('tsf:focus-last-window'),

        /**
         * Focus last window and insert text at caret position
         * Perfect for button that sends AI response back to where user was typing
         * @param text - Text to insert
         * @returns Success status
         */
        focusAndInsertText: (text: string) => ipcRenderer.invoke('tsf:focus-and-insert-text', text),

        /**
         * Focus last window, move cursor right to unselect, and insert text at end
         * @param text - Text to insert
         * @returns Success status
         */
        focusAndInsertAtEnd: (text: string) => ipcRenderer.invoke('tsf:focus-and-insert-at-end', text),

        /**
         * Focus last window and insert rich content (HTML, images, RTF, etc.)
         * Uses clipboard + paste method (bypasses TSF, as TSF only supports plain text)
         * @param content - Rich content data (text, HTML, image, RTF, or combination)
         * @returns Success status
         */
        focusAndInsertRichContent: (content: any) => ipcRenderer.invoke('tsf:focus-and-insert-rich-content', content),

        /**
         * Get selected text from focused application using TSF
         * @returns Selected text (empty string if none)
         */
        getSelectedText: () => ipcRenderer.invoke('tsf:get-selected-text'),

        /**
         * Replace selected text in focused application
         * @param text - The replacement text
         * @returns Success status
         */
        replaceSelectedText: (text: string) => ipcRenderer.invoke('tsf:replace-selected-text', text),

        /**
         * Focus last window and replace selected text
         * Perfect for "Change" button that replaces user's selected text with AI response
         * @param text - The replacement text
         * @returns Success status
         */
        focusAndReplaceText: (text: string) => ipcRenderer.invoke('tsf:focus-and-replace-text', text),

        /**
         * Delete selected text in focused application
         * @returns Success status
         */
        deleteSelection: () => ipcRenderer.invoke('tsf:delete-selection'),

        // Event for external app focus changes
        onExternalFocusChanged: (callback: (focusInfo: any) => void) => {
            ipcRenderer.on('tsf:external-focus-changed', (_event: IpcRendererEvent, focusInfo: any) => callback(focusInfo));
        }
    };
}
