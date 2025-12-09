

export interface IDesktopCapturerService {
    getSources(options: Electron.SourcesOptions): Promise<Electron.DesktopCapturerSource[]>;
}
