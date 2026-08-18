import { ipcRenderer } from 'electron';

export function createSkillsAPI() {
    return {
        list: () => ipcRenderer.invoke('skills:list'),
        get: (idOrSlug: string) => ipcRenderer.invoke('skills:get', idOrSlug),
        save: (input: {
            id?: string;
            title: string;
            contentMd: string;
            domain?: string;
            tags?: string[];
        }) => ipcRenderer.invoke('skills:save', input),
        delete: (idOrSlug: string) => ipcRenderer.invoke('skills:delete', idOrSlug),
        recordUsage: (idOrSlug: string) => ipcRenderer.invoke('skills:record-usage', idOrSlug),
        getFolderPath: () => ipcRenderer.invoke('skills:get-folder-path'),
        openFolder: () => ipcRenderer.invoke('skills:open-folder'),
        openSkill: (idOrSlug: string) => ipcRenderer.invoke('skills:open-skill', idOrSlug),
    };
}
