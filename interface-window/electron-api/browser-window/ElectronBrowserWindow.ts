
import { BrowserWindow } from 'electron';
import { IBrowserWindow, IBrowserWindowFactory } from './IBrowserWindow';
import { ElectronBaseWindow } from '../base-window/ElectronBaseWindow';

export class ElectronBrowserWindow extends ElectronBaseWindow implements IBrowserWindow {
    private browserWin: BrowserWindow;

    constructor(optionsOrWindow?: Electron.BrowserWindowConstructorOptions | BrowserWindow) {
        super(optionsOrWindow instanceof BrowserWindow ? optionsOrWindow : new BrowserWindow(optionsOrWindow));
        this.browserWin = this.nativeWindow as BrowserWindow;
    }

    // Additional Properties
    get webContents(): Electron.WebContents { return this.browserWin.webContents; }

    // Additional Instance Methods
    loadURL(url: string, options?: Electron.LoadURLOptions): Promise<void> {
        return this.browserWin.loadURL(url, options);
    }

    loadFile(filePath: string, options?: Electron.LoadFileOptions): Promise<void> {
        return this.browserWin.loadFile(filePath, options);
    }

    reload(): void {
        this.browserWin.reload();
    }

    focusOnWebView(): void {
        this.browserWin.focusOnWebView();
    }

    blurWebView(): void {
        this.browserWin.blurWebView();
    }

    capturePage(rect?: Electron.Rectangle, opts?: { stayHidden?: boolean; stayAwake?: boolean }): Promise<Electron.NativeImage> {
        return this.browserWin.capturePage(rect, opts);
    }

    showDefinitionForSelection(): void {
        this.browserWin.showDefinitionForSelection();
    }
}

export class ElectronBrowserWindowFactory implements IBrowserWindowFactory {
    create(options?: Electron.BrowserWindowConstructorOptions): IBrowserWindow {
        return new ElectronBrowserWindow(options);
    }

    getAllWindows(): IBrowserWindow[] {
        return BrowserWindow.getAllWindows().map(w => new ElectronBrowserWindow(w));
    }

    getFocusedWindow(): IBrowserWindow | null {
        const w = BrowserWindow.getFocusedWindow();
        return w ? new ElectronBrowserWindow(w) : null;
    }

    fromId(id: number): IBrowserWindow | null {
        const w = BrowserWindow.fromId(id);
        return w ? new ElectronBrowserWindow(w) : null;
    }

    fromWebContents(webContents: Electron.WebContents): IBrowserWindow | null {
        const w = BrowserWindow.fromWebContents(webContents);
        return w ? new ElectronBrowserWindow(w) : null;
    }
}
