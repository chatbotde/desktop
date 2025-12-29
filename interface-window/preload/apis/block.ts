/**
 * Block API
 * Provides application blocking functionality
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { BlockAPI } from '../types';

export function createBlockAPI(): BlockAPI {
    return {
        /**
         * Add an application to the block list
         * @param processName - Process name (e.g., "Cursor.exe")
         * @returns Promise with success status
         */
        addApp: (processName: string) => ipcRenderer.invoke('block:add-app', processName),

        /**
         * Remove an application from the block list
         * @param processName - Process name
         * @returns Promise with success status
         */
        removeApp: (processName: string) => ipcRenderer.invoke('block:remove-app', processName),

        /**
         * Get all blocked applications
         * @returns Promise with apps list
         */
        getApps: () => ipcRenderer.invoke('block:get-apps'),

        /**
         * Get current lock status
         * @returns Promise with lock status
         */
        getStatus: () => ipcRenderer.invoke('block:get-status'),

        /**
         * Set lock enabled/disabled
         * @param enabled - Enable or disable lock feature
         * @returns Promise with success status
         */
        setEnabled: (enabled: boolean) => ipcRenderer.invoke('block:set-enabled', enabled),

        /**
         * Listen to lock status changes
         * @param callback - Callback function receiving lock status
         * @returns Unsubscribe function
         */
        onLockChanged: (callback: (status: any) => void) => {
            const handler = (_event: IpcRendererEvent, status: any) => callback(status);
            ipcRenderer.on('block:lock-changed', handler);
            return () => ipcRenderer.removeListener('block:lock-changed', handler);
        }
    };
}
