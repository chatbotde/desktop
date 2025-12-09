
import { desktopCapturer } from 'electron';
import { IDesktopCapturerService } from './IDesktopCapturerService';

export class ElectronDesktopCapturerService implements IDesktopCapturerService {
    public getSources(options: Electron.SourcesOptions): Promise<Electron.DesktopCapturerSource[]> {
        return desktopCapturer.getSources(options);
    }
}
