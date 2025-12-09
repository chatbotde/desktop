
import { BrowserWindow } from 'electron';

export interface IScreenService {
    getCursorScreenPoint(): Electron.Point;
    getPrimaryDisplay(): Electron.Display;
    getAllDisplays(): Electron.Display[];
    getDisplayNearestPoint(point: Electron.Point): Electron.Display;
    getDisplayMatching(rect: Electron.Rectangle): Electron.Display;
    screenToDipPoint(point: Electron.Point): Electron.Point;
    dipToScreenPoint(point: Electron.Point): Electron.Point;
    screenToDipRect(window: BrowserWindow | null, rect: Electron.Rectangle): Electron.Rectangle;
    dipToScreenRect(window: BrowserWindow | null, rect: Electron.Rectangle): Electron.Rectangle;

    // Event Emitter methods
    on(event: string, listener: Function): void;
    once(event: string, listener: Function): void;
    removeListener(event: string, listener: Function): void;
    removeAllListeners(event?: string): void;
}
