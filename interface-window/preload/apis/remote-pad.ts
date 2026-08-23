import { ipcRenderer, type IpcRendererEvent } from 'electron';

export type FileTransferProgressEvent = {
    transferId: string;
    filename: string;
    direction: 'sending' | 'receiving';
    percent: number;
    current: number;
    total: number;
    elapsedMs: number;
    etaMs?: number | null;
    cancellable?: boolean;
} | null;

export type IncomingShareItem = {
    id: string;
    filename: string;
    mime: string;
    createdAt: number;
    kind: 'image' | 'file';
};

export function createRemotePadAPI() {
    return {
        getStatus: () => ipcRenderer.invoke('remote-pad:get-status'),
        getQrCode: () => ipcRenderer.invoke('remote-pad:get-qr-code'),
        openPairingWindow: () => ipcRenderer.invoke('remote-pad:open-pairing-window'),
        setEnabled: (enabled: boolean) => ipcRenderer.invoke('remote-pad:set-enabled', enabled),
        setConfig: (partial: { port?: number; allowScreenView?: boolean; lanFallbackEnabled?: boolean; clipboardSyncEnabled?: boolean; meshHostOverride?: string }) =>
            ipcRenderer.invoke('remote-pad:set-config', partial),
        regeneratePin: () => ipcRenderer.invoke('remote-pad:regenerate-pin'),
        disconnectClients: () => ipcRenderer.invoke('remote-pad:disconnect-clients'),
        sendFileToPhone: (input: {
            filePath?: string;
            data?: ArrayBuffer | Uint8Array;
            filename?: string;
            mime?: string;
        }) => ipcRenderer.invoke('remote-pad:send-file-to-phone', input),
        cancelFileTransfer: (transferId?: string) =>
            ipcRenderer.invoke('remote-pad:cancel-file-transfer', transferId ?? ''),
        listIncomingShares: () => ipcRenderer.invoke('remote-pad:list-incoming-shares'),
        incomingSharePreview: (id: string) =>
            ipcRenderer.invoke('remote-pad:incoming-share-preview', id),
        saveIncomingShare: (id: string) =>
            ipcRenderer.invoke('remote-pad:save-incoming-share', id),
        copyIncomingShare: (id: string) =>
            ipcRenderer.invoke('remote-pad:copy-incoming-share', id),
        pasteIncomingShare: (id: string) =>
            ipcRenderer.invoke('remote-pad:paste-incoming-share', id),
        startPhoneCamera: (options?: { facing?: 'front' | 'back'; virtualWebcam?: boolean }) =>
            ipcRenderer.invoke('remote-pad:start-phone-camera', options ?? {}),
        stopPhoneCamera: () => ipcRenderer.invoke('remote-pad:stop-phone-camera'),
        openFirewallSetup: () => ipcRenderer.invoke('remote-pad:open-firewall-setup'),
        sendPhoneCamSignal: (message: {
            type: string;
            sdp?: string;
            facing?: string;
            candidate?: {
                candidate?: string;
                sdpMid?: string | null;
                sdpMLineIndex?: number | null;
            };
        }) => ipcRenderer.invoke('remote-pad:send-phone-cam-signal', message),
        onPhoneCamSignal: (callback: (message: {
            type: string;
            sdp?: string;
            facing?: string;
            candidate?: {
                candidate?: string;
                sdpMid?: string | null;
                sdpMLineIndex?: number | null;
            };
        }) => void) => {
            const handler = (_event: IpcRendererEvent, message: {
                type: string;
                sdp?: string;
                facing?: string;
                candidate?: {
                    candidate?: string;
                    sdpMid?: string | null;
                    sdpMLineIndex?: number | null;
                };
            }) => {
                callback(message);
            };
            ipcRenderer.on('remote-pad:phone-cam-signal', handler);
            return () => {
                ipcRenderer.removeListener('remote-pad:phone-cam-signal', handler);
            };
        },
        onPhoneCamPreviewUpdate: (callback: (payload: {
            previewDataUrl?: string;
            connected?: boolean;
            virtualWebcamConnected?: boolean;
            error?: string;
        }) => void) => {
            const handler = (_event: IpcRendererEvent, payload: {
                previewDataUrl?: string;
                connected?: boolean;
                virtualWebcamConnected?: boolean;
                error?: string;
            }) => {
                callback(payload);
            };
            ipcRenderer.on('remote-pad:phone-cam-preview-update', handler);
            return () => {
                ipcRenderer.removeListener('remote-pad:phone-cam-preview-update', handler);
            };
        },
        onFileTransferProgress: (callback: (progress: FileTransferProgressEvent) => void) => {
            const handler = (_event: IpcRendererEvent, progress: FileTransferProgressEvent) => {
                callback(progress);
            };
            ipcRenderer.on('remote-pad:file-transfer-progress', handler);
            return () => {
                ipcRenderer.removeListener('remote-pad:file-transfer-progress', handler);
            };
        },
        onIncomingShare: (callback: (items: IncomingShareItem[]) => void) => {
            const handler = (_event: IpcRendererEvent, items: IncomingShareItem[]) => {
                callback(items);
            };
            ipcRenderer.on('remote-pad:incoming-share', handler);
            return () => {
                ipcRenderer.removeListener('remote-pad:incoming-share', handler);
            };
        },
    };
}
