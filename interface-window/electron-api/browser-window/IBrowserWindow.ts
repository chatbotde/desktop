
import { IBaseWindow } from '../base-window/IBaseWindow';

export interface IBrowserWindow extends IBaseWindow {
    // Additional Properties
    readonly webContents: Electron.WebContents;

    // Override/Additional Instance Methods
    loadURL(url: string, options?: Electron.LoadURLOptions): Promise<void>;
    loadFile(filePath: string, options?: Electron.LoadFileOptions): Promise<void>;
    reload(): void;
    focusOnWebView(): void;
    blurWebView(): void;
    capturePage(rect?: Electron.Rectangle, opts?: { stayHidden?: boolean; stayAwake?: boolean }): Promise<Electron.NativeImage>;
    showDefinitionForSelection(): void;
}

export interface IBrowserWindowFactory {
    create(options?: Electron.BrowserWindowConstructorOptions): IBrowserWindow;
    getAllWindows(): IBrowserWindow[];
    getFocusedWindow(): IBrowserWindow | null;
    fromId(id: number): IBrowserWindow | null;
    fromWebContents(webContents: Electron.WebContents): IBrowserWindow | null;
}
