
import { } from 'electron';

export interface IWebContentsView {
    readonly webContents: Electron.WebContents;
    readonly nativeView: Electron.WebContentsView; // Expose native view for compatibility with other Electron APIs that expect it

    setBounds(bounds: Electron.Rectangle): void;
    setVisible(visible: boolean): void;
    setBackgroundColor(color: string): void;
    // Add other View methods as needed
}

export interface IWebContentsViewFactory {
    create(options?: Electron.WebContentsViewConstructorOptions): IWebContentsView;
}
