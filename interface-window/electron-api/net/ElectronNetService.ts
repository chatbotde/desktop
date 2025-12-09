
import { net } from 'electron';
import { INetService } from './INetService';

export class ElectronNetService implements INetService {
    request(options: Electron.ClientRequestConstructorOptions | string): Electron.ClientRequest {
        return net.request(options);
    }

    fetch(input: string | GlobalRequest, init?: RequestInit & { bypassCustomProtocolHandlers?: boolean }): Promise<GlobalResponse> {
        return net.fetch(input, init);
    }

    isOnline(): boolean {
        return net.isOnline();
    }

    resolveHost(host: string, options?: {
        queryType?: 'A' | 'AAAA';
        source?: 'any' | 'system' | 'dns' | 'mdns' | 'localOnly';
        cacheUsage?: 'allowed' | 'staleAllowed' | 'disallowed';
        secureDnsPolicy?: 'allow' | 'disable';
    }): Promise<Electron.ResolvedHost> {
        return net.resolveHost(host, options);
    }

    get online(): boolean {
        return net.online;
    }
}
