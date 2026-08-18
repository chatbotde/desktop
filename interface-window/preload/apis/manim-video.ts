import { ipcRenderer } from 'electron';
import type { ManimConcatRequest, ManimRenderRequest } from '../types';

export function createManimVideoAPI() {
    return {
        checkSupport: () => ipcRenderer.invoke('manim:check-support'),
        render: (request: ManimRenderRequest) => ipcRenderer.invoke('manim:render', request),
        concatSegments: (request: ManimConcatRequest) => ipcRenderer.invoke('manim:concat-segments', request),
    };
}
