
import 'electron';

export interface IProcessService {
    // Properties
    readonly defaultApp?: boolean;
    readonly isMainFrame?: boolean;
    readonly mas?: boolean;
    noAsar: boolean;
    noDeprecation: boolean;
    readonly resourcesPath: string;
    readonly sandboxed?: boolean;
    readonly contextIsolated?: boolean;
    throwDeprecation: boolean;
    traceDeprecation: boolean;
    traceProcessWarnings: boolean;
    readonly type: string;
    readonly chromeVersion: string;
    readonly electronVersion: string;
    readonly windowsStore?: boolean;
    readonly contextId?: string;

    // Methods
    crash(): void;
    getCreationTime(): number | null;
    getCPUUsage(): Electron.CPUUsage;
    getHeapStatistics(): Electron.HeapStatistics;
    getBlinkMemoryInfo(): Electron.BlinkMemoryInfo;
    getProcessMemoryInfo(): Promise<Electron.ProcessMemoryInfo>;
    getSystemMemoryInfo(): Electron.SystemMemoryInfo;
    getSystemVersion(): string;
    takeHeapSnapshot(filePath: string): boolean;
    hang(): void;
    setFdLimit(maxDescriptors: number): void;
}
