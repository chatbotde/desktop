/**
 * Auth API
 * Provides authentication functionality
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';
import { AuthAPI } from '../types';

export function createAuthAPI(): AuthAPI {
    return {
        // LOGIN / SIGNUP / LOGOUT
        login: (options = {}) => {
            ipcRenderer.send('auth:login', options);
        },
        signup: (options = {}) => {
            ipcRenderer.send('auth:signup', options);
        },
        logout: () => {
            ipcRenderer.send('auth:logout');
        },

        // SESSION & USER INFO
        isAuthenticated: () => {
            return ipcRenderer.invoke('auth:is-authenticated');
        },
        getUser: () => {
            return ipcRenderer.invoke('auth:get-user');
        },
        getToken: () => {
            return ipcRenderer.invoke('auth:get-token');
        },
        validateSession: () => {
            return ipcRenderer.invoke('auth:validate-session');
        },
        refreshTokens: () => {
            return ipcRenderer.invoke('auth:refresh-tokens');
        },
        submitManualToken: (token: string) => {
            return ipcRenderer.invoke('auth:submit-manual-token', token);
        },
        getConfig: () => {
            return ipcRenderer.invoke('auth:get-config');
        },
        clearTokens: () => {
            return ipcRenderer.invoke('auth:clear-tokens');
        },

        // EVENT LISTENERS
        subscribe: () => {
            ipcRenderer.send('auth:subscribe');
        },
        unsubscribe: () => {
            ipcRenderer.send('auth:unsubscribe');
        },
        onAuthSuccess: (callback: (user: any) => void) => {
            const handler = (_event: IpcRendererEvent, user: any) => callback(user);
            ipcRenderer.on('auth:success', handler);
            return () => ipcRenderer.removeListener('auth:success', handler);
        },
        onAuthError: (callback: (error: any) => void) => {
            const handler = (_event: IpcRendererEvent, error: any) => callback(error);
            ipcRenderer.on('auth:error', handler);
            return () => ipcRenderer.removeListener('auth:error', handler);
        },
        onLogout: (callback: () => void) => {
            const handler = () => callback();
            ipcRenderer.on('auth:logout-complete', handler);
            return () => ipcRenderer.removeListener('auth:logout-complete', handler);
        },
        onSessionExpired: (callback: () => void) => {
            const handler = () => callback();
            ipcRenderer.on('auth:session-expired', handler);
            return () => ipcRenderer.removeListener('auth:session-expired', handler);
        },
        onStateChange: (callback: (state: { isAuthenticated: boolean; user: any }) => void) => {
            const handler = (_event: IpcRendererEvent, state: { isAuthenticated: boolean; user: any }) => callback(state);
            ipcRenderer.on('auth:state-changed', handler);
            return () => ipcRenderer.removeListener('auth:state-changed', handler);
        },
        onAuthRequired: (callback: () => void) => {
            const handler = () => callback();
            ipcRenderer.on('auth:required', handler);
            return () => ipcRenderer.removeListener('auth:required', handler);
        },
        onSessionRestored: (callback: (user: any) => void) => {
            const handler = (_event: IpcRendererEvent, user: any) => callback(user);
            ipcRenderer.on('auth:restored', handler);
            return () => ipcRenderer.removeListener('auth:restored', handler);
        }
    };
}
