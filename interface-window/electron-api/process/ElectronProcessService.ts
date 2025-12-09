
import { IProcessService } from './IProcessService';

export class ElectronProcessService implements IProcessService {
    // Properties
    get defaultApp(): boolean | undefined { return (process as any).defaultApp; }
    get isMainFrame(): boolean | undefined { return (process as any).isMainFrame; }
    get mas(): boolean | undefined { return (process as any).mas; }
    get noAsar(): boolean { return (process as any).noAsar; }
    set noAsar(value: boolean) { (process as any).noAsar = value; }
    get noDeprecation(): boolean { return (process as any).noDeprecation; }
    set noDeprecation(value: boolean) { (process as any).noDeprecation = value; }
    get resourcesPath(): string { return (process as any).resourcesPath; }
    get sandboxed(): boolean | undefined { return (process as any).sandboxed; }
    get contextIsolated(): boolean | undefined { return (process as any).contextIsolated; }
    get throwDeprecation(): boolean { return (process as any).throwDeprecation; }
    set throwDeprecation(value: boolean) { (process as any).throwDeprecation = value; }
    get traceDeprecation(): boolean { return (process as any).traceDeprecation; }
    set traceDeprecation(value: boolean) { (process as any).traceDeprecation = value; }
    get traceProcessWarnings(): boolean { return (process as any).traceProcessWarnings; }
    set traceProcessWarnings(value: boolean) { (process as any).traceProcessWarnings = value; }
    get type(): string { return (process as any).type; }
    get chromeVersion(): string { return process.versions.chrome || ''; }
    get electronVersion(): string { return process.versions.electron || ''; }
    get windowsStore(): boolean | undefined { return (process as any).windowsStore; }
    get contextId(): string | undefined { return (process as any).contextId; }

    // Methods
    crash(): void { (process as any).crash(); }
    getCreationTime(): number | null { return (process as any).getCreationTime(); }
    getCPUUsage(): Electron.CPUUsage { return (process as any).getCPUUsage(); }
    getHeapStatistics(): Electron.HeapStatistics { return (process as any).getHeapStatistics(); }
    getBlinkMemoryInfo(): Electron.BlinkMemoryInfo { return (process as any).getBlinkMemoryInfo(); }
    getProcessMemoryInfo(): Promise<Electron.ProcessMemoryInfo> { return (process as any).getProcessMemoryInfo(); }
    getSystemMemoryInfo(): Electron.SystemMemoryInfo { return (process as any).getSystemMemoryInfo(); }
    getSystemVersion(): string { return (process as any).getSystemVersion(); }
    takeHeapSnapshot(filePath: string): boolean { return (process as any).takeHeapSnapshot(filePath); }
    hang(): void { (process as any).hang(); }
    setFdLimit(maxDescriptors: number): void { (process as any).setFdLimit(maxDescriptors); }
}
