
import { WebContentsView } from 'electron';
import { IWebContentsView, IWebContentsViewFactory } from './IWebContentsView';

export class ElectronWebContentsView implements IWebContentsView {
    private view: Electron.WebContentsView;

    constructor(options?: Electron.WebContentsViewConstructorOptions) {
        this.view = new WebContentsView(options);
    }

    get webContents(): Electron.WebContents { return this.view.webContents; }
    get nativeView(): Electron.WebContentsView { return this.view; }

    setBounds(bounds: Electron.Rectangle): void {
        this.view.setBounds(bounds);
    }

    setVisible(visible: boolean): void {
        this.view.setVisible(visible);
    }

    setBackgroundColor(color: string): void {
        this.view.setBackgroundColor(color);
    }
}

export class ElectronWebContentsViewFactory implements IWebContentsViewFactory {
    create(options?: Electron.WebContentsViewConstructorOptions): IWebContentsView {
        return new ElectronWebContentsView(options);
    }
}
