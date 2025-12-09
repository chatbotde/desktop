
import { } from 'electron';

export interface IShareMenu {
    popup(options?: Electron.PopupOptions): void;
    closePopup(browserWindow?: Electron.BrowserWindow): void;
}

export interface IShareMenuFactory {
    create(sharingItem: Electron.SharingItem): IShareMenu;
}
