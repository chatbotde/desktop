
import {
    BaseWindow
} from 'electron';
import { IBaseWindow, IBaseWindowFactory } from './IBaseWindow';

export class ElectronBaseWindow implements IBaseWindow {
    private win: BaseWindow;

    constructor(optionsOrWindow?: Electron.BaseWindowConstructorOptions | BaseWindow) {
        if (optionsOrWindow instanceof BaseWindow) {
            this.win = optionsOrWindow;
        } else {
            this.win = new BaseWindow(optionsOrWindow);
        }
    }

    // Properties
    get id(): number { return this.win.id; }
    get contentView(): Electron.View { return this.win.contentView; }
    set contentView(view: Electron.View) { this.win.contentView = view as any; }
    get tabbingIdentifier(): string | undefined { return this.win.tabbingIdentifier; }
    get autoHideMenuBar(): boolean { return this.win.autoHideMenuBar; }
    set autoHideMenuBar(value: boolean) { this.win.autoHideMenuBar = value; }
    get simpleFullScreen(): boolean { return this.win.simpleFullScreen; }
    get fullScreen(): boolean { return this.win.fullScreen; }
    get focusable(): boolean { return this.win.focusable; }
    get visibleOnAllWorkspaces(): boolean { return this.win.visibleOnAllWorkspaces; }
    get shadow(): boolean { return this.win.shadow; }
    get menuBarVisible(): boolean { return this.win.menuBarVisible; }
    get kiosk(): boolean { return this.win.kiosk; }
    get documentEdited(): boolean { return this.win.documentEdited; }
    set documentEdited(value: boolean) { this.win.documentEdited = value; }
    get representedFilename(): string { return this.win.representedFilename; }
    set representedFilename(value: string) { this.win.representedFilename = value; }
    get title(): string { return this.win.title; }
    set title(value: string) { this.win.title = value; }
    get minimizable(): boolean { return this.win.minimizable; }
    get maximizable(): boolean { return this.win.maximizable; }
    get fullScreenable(): boolean { return this.win.fullScreenable; }
    get resizable(): boolean { return this.win.resizable; }
    get closable(): boolean { return this.win.closable; }
    get movable(): boolean { return this.win.movable; }
    get excludedFromShownWindowsMenu(): boolean { return this.win.excludedFromShownWindowsMenu; }
    set excludedFromShownWindowsMenu(value: boolean) { this.win.excludedFromShownWindowsMenu = value; }
    get accessibleTitle(): string { return this.win.accessibleTitle; }
    set accessibleTitle(value: string) { this.win.accessibleTitle = value; }
    get snapped(): boolean { return this.win.snapped; }

    // Instance Methods
    setContentView(view: Electron.View): void { this.win.setContentView(view as any); }
    getContentView(): Electron.View { return this.win.getContentView(); }
    destroy(): void { this.win.destroy(); }
    close(): void { this.win.close(); }
    focus(): void { this.win.focus(); }
    blur(): void { this.win.blur(); }
    isFocused(): boolean { return this.win.isFocused(); }
    isDestroyed(): boolean { return this.win.isDestroyed(); }
    show(): void { this.win.show(); }
    showInactive(): void { this.win.showInactive(); }
    hide(): void { this.win.hide(); }
    isVisible(): boolean { return this.win.isVisible(); }
    isModal(): boolean { return this.win.isModal(); }
    maximize(): void { this.win.maximize(); }
    unmaximize(): void { this.win.unmaximize(); }
    isMaximized(): boolean { return this.win.isMaximized(); }
    minimize(): void { this.win.minimize(); }
    restore(): void { this.win.restore(); }
    isMinimized(): boolean { return this.win.isMinimized(); }
    setFullScreen(flag: boolean): void { this.win.setFullScreen(flag); }
    isFullScreen(): boolean { return this.win.isFullScreen(); }
    setSimpleFullScreen(flag: boolean): void { this.win.setSimpleFullScreen(flag); }
    isSimpleFullScreen(): boolean { return this.win.isSimpleFullScreen(); }
    isNormal(): boolean { return this.win.isNormal(); }
    setAspectRatio(aspectRatio: number, extraSize?: Electron.Size): void { this.win.setAspectRatio(aspectRatio, extraSize); }
    setBackgroundColor(backgroundColor: string): void { this.win.setBackgroundColor(backgroundColor); }
    previewFile(path: string, displayName?: string): void { this.win.previewFile(path, displayName); }
    closeFilePreview(): void { this.win.closeFilePreview(); }
    setBounds(bounds: Partial<Electron.Rectangle>, animate?: boolean): void { this.win.setBounds(bounds, animate); }
    getBounds(): Electron.Rectangle { return this.win.getBounds(); }
    getBackgroundColor(): string { return this.win.getBackgroundColor(); }
    setContentBounds(bounds: Electron.Rectangle, animate?: boolean): void { this.win.setContentBounds(bounds, animate); }
    getContentBounds(): Electron.Rectangle { return this.win.getContentBounds(); }
    getNormalBounds(): Electron.Rectangle { return this.win.getNormalBounds(); }
    setEnabled(enable: boolean): void { this.win.setEnabled(enable); }
    isEnabled(): boolean { return this.win.isEnabled(); }
    setSize(width: number, height: number, animate?: boolean): void { this.win.setSize(width, height, animate); }
    getSize(): number[] { return this.win.getSize(); }
    setContentSize(width: number, height: number, animate?: boolean): void { this.win.setContentSize(width, height, animate); }
    getContentSize(): number[] { return this.win.getContentSize(); }
    setMinimumSize(width: number, height: number): void { this.win.setMinimumSize(width, height); }
    getMinimumSize(): number[] { return this.win.getMinimumSize(); }
    setMaximumSize(width: number, height: number): void { this.win.setMaximumSize(width, height); }
    getMaximumSize(): number[] { return this.win.getMaximumSize(); }
    setResizable(resizable: boolean): void { this.win.setResizable(resizable); }
    isResizable(): boolean { return this.win.isResizable(); }
    setMovable(movable: boolean): void { this.win.setMovable(movable); }
    isMovable(): boolean { return this.win.isMovable(); }
    setMinimizable(minimizable: boolean): void { this.win.setMinimizable(minimizable); }
    isMinimizable(): boolean { return this.win.isMinimizable(); }
    setMaximizable(maximizable: boolean): void { this.win.setMaximizable(maximizable); }
    isMaximizable(): boolean { return this.win.isMaximizable(); }
    setFullScreenable(fullscreenable: boolean): void { this.win.setFullScreenable(fullscreenable); }
    isFullScreenable(): boolean { return this.win.isFullScreenable(); }
    setClosable(closable: boolean): void { this.win.setClosable(closable); }
    isClosable(): boolean { return this.win.isClosable(); }
    setHiddenInMissionControl(hidden: boolean): void { this.win.setHiddenInMissionControl(hidden); }
    isHiddenInMissionControl(): boolean { return this.win.isHiddenInMissionControl(); }
    setAlwaysOnTop(flag: boolean, level?: any, relativeLevel?: number): void { this.win.setAlwaysOnTop(flag, level, relativeLevel); }
    isAlwaysOnTop(): boolean { return this.win.isAlwaysOnTop(); }
    moveAbove(mediaSourceId: string): void { this.win.moveAbove(mediaSourceId); }
    moveTop(): void { this.win.moveTop(); }
    center(): void { this.win.center(); }
    setPosition(x: number, y: number, animate?: boolean): void { this.win.setPosition(x, y, animate); }
    getPosition(): number[] { return this.win.getPosition(); }
    setTitle(title: string): void { this.win.setTitle(title); }
    getTitle(): string { return this.win.getTitle(); }
    setSheetOffset(offsetY: number, offsetX?: number): void { this.win.setSheetOffset(offsetY, offsetX); }
    flashFrame(flag: boolean): void { this.win.flashFrame(flag); }
    setSkipTaskbar(skip: boolean): void { this.win.setSkipTaskbar(skip); }
    setKiosk(flag: boolean): void { this.win.setKiosk(flag); }
    isKiosk(): boolean { return this.win.isKiosk(); }
    isTabletMode(): boolean { return this.win.isTabletMode(); }
    getMediaSourceId(): string { return this.win.getMediaSourceId(); }
    getNativeWindowHandle(): Buffer { return this.win.getNativeWindowHandle(); }
    hookWindowMessage(message: number, callback: (wParam: Buffer, lParam: Buffer) => void): void { this.win.hookWindowMessage(message, callback); }
    isWindowMessageHooked(message: number): boolean { return this.win.isWindowMessageHooked(message); }
    unhookWindowMessage(message: number): void { this.win.unhookWindowMessage(message); }
    unhookAllWindowMessages(): void { this.win.unhookAllWindowMessages(); }
    setRepresentedFilename(filename: string): void { this.win.setRepresentedFilename(filename); }
    getRepresentedFilename(): string { return this.win.getRepresentedFilename(); }
    setDocumentEdited(edited: boolean): void { this.win.setDocumentEdited(edited); }
    isDocumentEdited(): boolean { return this.win.isDocumentEdited(); }
    setMenu(menu: Electron.Menu | null): void { this.win.setMenu(menu); }
    removeMenu(): void { this.win.removeMenu(); }
    setProgressBar(progress: number, options?: { mode: any }): void { this.win.setProgressBar(progress, options); }
    setOverlayIcon(overlay: Electron.NativeImage | null, description: string): void { this.win.setOverlayIcon(overlay, description); }
    invalidateShadow(): void { this.win.invalidateShadow(); }
    setHasShadow(hasShadow: boolean): void { this.win.setHasShadow(hasShadow); }
    hasShadow(): boolean { return this.win.hasShadow(); }
    setOpacity(opacity: number): void { this.win.setOpacity(opacity); }
    getOpacity(): number { return this.win.getOpacity(); }
    setShape(rects: Electron.Rectangle[]): void { this.win.setShape(rects); }
    setThumbarButtons(buttons: Electron.ThumbarButton[]): boolean { return this.win.setThumbarButtons(buttons); }
    setThumbnailClip(region: Electron.Rectangle): void { this.win.setThumbnailClip(region); }
    setThumbnailToolTip(toolTip: string): void { this.win.setThumbnailToolTip(toolTip); }
    setAppDetails(options: { appId?: string; appIconPath?: string; appIconIndex?: number; relaunchCommand?: string; relaunchDisplayName?: string }): void { this.win.setAppDetails(options); }
    setAccentColor(accentColor: boolean | string | null): void { this.win.setAccentColor(accentColor as any); }
    getAccentColor(): string | boolean { return this.win.getAccentColor(); }
    setIcon(icon: Electron.NativeImage | string): void { this.win.setIcon(icon); }
    setWindowButtonVisibility(visible: boolean): void { this.win.setWindowButtonVisibility(visible); }
    setAutoHideMenuBar(hide: boolean): void { this.win.setAutoHideMenuBar(hide); }
    isMenuBarAutoHide(): boolean { return this.win.isMenuBarAutoHide(); }
    setMenuBarVisibility(visible: boolean): void { this.win.setMenuBarVisibility(visible); }
    isMenuBarVisible(): boolean { return this.win.isMenuBarVisible(); }
    isSnapped(): boolean { return this.win.isSnapped(); }
    setVisibleOnAllWorkspaces(visible: boolean, options?: { visibleOnFullScreen?: boolean; skipTransformProcessType?: boolean }): void { this.win.setVisibleOnAllWorkspaces(visible, options); }
    isVisibleOnAllWorkspaces(): boolean { return this.win.isVisibleOnAllWorkspaces(); }
    setIgnoreMouseEvents(ignore: boolean, options?: { forward?: boolean }): void { this.win.setIgnoreMouseEvents(ignore, options); }
    setContentProtection(enable: boolean): void { this.win.setContentProtection(enable); }
    isContentProtected(): boolean { return this.win.isContentProtected(); }
    setFocusable(focusable: boolean): void { this.win.setFocusable(focusable); }
    isFocusable(): boolean { return this.win.isFocusable(); }
    setParentWindow(parent: IBaseWindow | null): void {
        this.win.setParentWindow(parent ? (parent as ElectronBaseWindow).nativeWindow : null);
    }
    getParentWindow(): IBaseWindow | null {
        const parent = this.win.getParentWindow();
        return parent ? new ElectronBaseWindow(parent) : null;
    }
    getChildWindows(): IBaseWindow[] {
        return this.win.getChildWindows().map(w => new ElectronBaseWindow(w));
    }
    setAutoHideCursor(autoHide: boolean): void { this.win.setAutoHideCursor(autoHide); }
    selectPreviousTab(): void { this.win.selectPreviousTab(); }
    selectNextTab(): void { this.win.selectNextTab(); }
    showAllTabs(): void { this.win.showAllTabs(); }
    mergeAllWindows(): void { this.win.mergeAllWindows(); }
    moveTabToNewWindow(): void { this.win.moveTabToNewWindow(); }
    toggleTabBar(): void { this.win.toggleTabBar(); }
    addTabbedWindow(baseWindow: IBaseWindow): void {
        this.win.addTabbedWindow((baseWindow as ElectronBaseWindow).nativeWindow);
    }
    setVibrancy(type: string | null): void { this.win.setVibrancy(type as any); }
    setBackgroundMaterial(material: 'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed'): void { this.win.setBackgroundMaterial(material); }
    setWindowButtonPosition(position: Electron.Point | null): void { this.win.setWindowButtonPosition(position); }
    getWindowButtonPosition(): Electron.Point | null { return this.win.getWindowButtonPosition(); }
    setTouchBar(touchBar: Electron.TouchBar | null): void { this.win.setTouchBar(touchBar); }
    setTitleBarOverlay(options: { color?: string; symbolColor?: string; height?: number }): void { this.win.setTitleBarOverlay(options); }

    // Event Emitter
    on(event: string, listener: Function): void { this.win.on(event as any, listener as any); }
    once(event: string, listener: Function): void { this.win.once(event as any, listener as any); }
    removeListener(event: string, listener: Function): void { this.win.removeListener(event as any, listener as any); }
    removeAllListeners(event?: string): void { this.win.removeAllListeners(event as any); }

    // Internal getter for raw object (friend class usage)
    public get nativeWindow(): BaseWindow { return this.win; }
}

export class ElectronBaseWindowFactory implements IBaseWindowFactory {
    create(options?: Electron.BaseWindowConstructorOptions): IBaseWindow {
        return new ElectronBaseWindow(options);
    }

    getAllWindows(): IBaseWindow[] {
        return BaseWindow.getAllWindows().map(w => new ElectronBaseWindow(w));
    }

    getFocusedWindow(): IBaseWindow | null {
        const w = BaseWindow.getFocusedWindow();
        return w ? new ElectronBaseWindow(w) : null;
    }

    fromId(id: number): IBaseWindow | null {
        const w = BaseWindow.fromId(id);
        return w ? new ElectronBaseWindow(w) : null;
    }
}
