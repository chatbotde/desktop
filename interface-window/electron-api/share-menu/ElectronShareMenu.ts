
import { ShareMenu } from 'electron';
import { IShareMenu, IShareMenuFactory } from './IShareMenu';

export class ElectronShareMenu implements IShareMenu {
    private shareMenu: ShareMenu;

    constructor(sharingItem: Electron.SharingItem) {
        this.shareMenu = new ShareMenu(sharingItem);
    }

    popup(options?: Electron.PopupOptions): void {
        this.shareMenu.popup(options);
    }

    closePopup(browserWindow?: Electron.BrowserWindow): void {
        this.shareMenu.closePopup(browserWindow);
    }
}

export class ElectronShareMenuFactory implements IShareMenuFactory {
    create(sharingItem: Electron.SharingItem): IShareMenu {
        return new ElectronShareMenu(sharingItem);
    }
}
