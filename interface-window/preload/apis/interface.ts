/**
 * Interface API
 * Provides window control operations (minimize, maximize, close, etc.)
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { InterfaceAPI, IgnoreMouseEventsOptions } from '../types';

export function createInterfaceAPI(): InterfaceAPI {
    const messageListeners = new Map<string, Map<(...args: any[]) => void, (event: IpcRendererEvent, ...args: any[]) => void>>();

    return {
        // Basic window controls
        minimize: () => ipcRenderer.send('interface-window:minimize'),
        maximize: () => ipcRenderer.send('interface-window:maximize'),
        close: () => ipcRenderer.send('interface-window:close'),

        // Native OS-level mouse click via robotjs
        clickAt: (x: number, y: number) => ipcRenderer.invoke('interface-window:click-at', x, y),

        // Double-click (for selecting text in fields)
        doubleClickAt: (x: number, y: number) => ipcRenderer.invoke('interface-window:double-click-at', x, y),

        // Right-click (for context menus)
        rightClickAt: (x: number, y: number) => ipcRenderer.invoke('interface-window:right-click-at', x, y),

        // Scroll at position (amount: positive = down, negative = up)
        scrollAt: (x: number, y: number, amount: number) => ipcRenderer.invoke('interface-window:scroll-at', x, y, amount),

        // Press a key with optional modifiers (e.g. 'tab', 'enter', ['control','a'])
        keyTap: (key: string, modifiers?: string[]) => ipcRenderer.invoke('interface-window:key-tap', key, modifiers),

        // Type a string via simulated keyboard input
        typeString: (text: string) => ipcRenderer.invoke('interface-window:type-string', text),

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
            const validChannels = ['interface-update', 'text-selection-changed', 'assistant-connect', 'show-prompt-input', 'toggle-voice-insert', 'show-rectangle-screenshot'];
            if (validChannels.includes(channel)) {
                const channelListeners = messageListeners.get(channel) ?? new Map();
                if (channelListeners.has(func)) return;

                // Deliberately strip event as it includes `sender`
                const wrappedListener = (_event: IpcRendererEvent, ...args: any[]) => func(...args);
                channelListeners.set(func, wrappedListener);
                messageListeners.set(channel, channelListeners);
                ipcRenderer.on(channel, wrappedListener);
            }
        },

        // Remove message listener
        removeMessageListener: (channel: string, func: (...args: any[]) => void) => {
            const validChannels = ['interface-update', 'text-selection-changed', 'assistant-connect', 'show-prompt-input', 'toggle-voice-insert', 'show-rectangle-screenshot'];
            if (validChannels.includes(channel)) {
                const channelListeners = messageListeners.get(channel);
                const wrappedListener = channelListeners?.get(func);
                if (!wrappedListener) return;

                ipcRenderer.removeListener(channel, wrappedListener);
                channelListeners.delete(func);
                if (channelListeners.size === 0) {
                    messageListeners.delete(channel);
                }
            }
        }
    };
}
