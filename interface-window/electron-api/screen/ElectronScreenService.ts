
import { screen, BrowserWindow } from 'electron';
import { IScreenService } from './IScreenService';

export class ElectronScreenService implements IScreenService {
    public getCursorScreenPoint(): Electron.Point {
        return screen.getCursorScreenPoint();
    }

    public getPrimaryDisplay(): Electron.Display {
        return screen.getPrimaryDisplay();
    }

    public getAllDisplays(): Electron.Display[] {
        return screen.getAllDisplays();
    }

    public getDisplayNearestPoint(point: Electron.Point): Electron.Display {
        return screen.getDisplayNearestPoint(point);
    }

    public getDisplayMatching(rect: Electron.Rectangle): Electron.Display {
        return screen.getDisplayMatching(rect);
    }

    public screenToDipPoint(point: Electron.Point): Electron.Point {
        return screen.screenToDipPoint(point);
    }

    public dipToScreenPoint(point: Electron.Point): Electron.Point {
        return screen.dipToScreenPoint(point);
    }

    public screenToDipRect(window: BrowserWindow | null, rect: Electron.Rectangle): Electron.Rectangle {
        return screen.screenToDipRect(window, rect);
    }

    public dipToScreenRect(window: BrowserWindow | null, rect: Electron.Rectangle): Electron.Rectangle {
        return screen.dipToScreenRect(window, rect);
    }

    public on(event: string, listener: Function): void {
        screen.on(event as any, listener as any);
    }

    public once(event: string, listener: Function): void {
        screen.once(event as any, listener as any);
    }

    public removeListener(event: string, listener: Function): void {
        screen.removeListener(event as any, listener as any);
    }

    public removeAllListeners(event?: string): void {
        screen.removeAllListeners(event as any);
    }
}
