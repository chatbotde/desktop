/**
 * Interface API
 * Provides window control operations (minimize, maximize, close, etc.)
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { InterfaceAPI, IgnoreMouseEventsOptions } from '../types';

export function createInterfaceAPI(): InterfaceAPI {
    return {
        // Basic window controls
        minimize: () => ipcRenderer.send('interface-window:minimize'),
        maximize: () => ipcRenderer.send('interface-window:maximize'),
        close: () => ipcRenderer.send('interface-window:close'),

        setIgnoreMouseEvents: (ignore: boolean, options?: IgnoreMouseEventsOptions) => {
            if (typeof ignore !== 'boolean') {
                return;
            }

            let sanitizedOptions: IgnoreMouseEventsOptions | undefined;
            if (options && typeof options === 'object') {
                sanitizedOptions = {};
                if ('forward' in options) {
                    sanitizedOptions.forward = !!options.forward;
                }

                if (Object.keys(sanitizedOptions).length === 0) {
                    sanitizedOptions = undefined;
                }
            }

            ipcRenderer.send('interface-window:set-ignore-mouse-events', ignore, sanitizedOptions);
        },

        setContentProtection: (enabled: boolean) => {
            if (typeof enabled !== 'boolean') {
                return;
            }
            ipcRenderer.send('interface-window:set-content-protection', enabled);
        },

        // Send message to main process
        sendMessage: (channel: string, data: any) => {
            const validChannels = ['interface-action'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },

        // Receive message from main process
        onMessage: (channel: string, func: (...args: any[]) => void) => {
            const validChannels = ['interface-update', 'text-selection-changed'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args));
            }
        },

        // Remove message listener
        removeMessageListener: (channel: string, func: (...args: any[]) => void) => {
            const validChannels = ['interface-update', 'text-selection-changed'];
            if (validChannels.includes(channel)) {
                ipcRenderer.removeListener(channel, func);
            }
        }
    };
}
