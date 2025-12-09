
export interface INetService {
    request(options: Electron.ClientRequestConstructorOptions | string): Electron.ClientRequest;
    fetch(input: string | GlobalRequest, init?: RequestInit & { bypassCustomProtocolHandlers?: boolean }): Promise<GlobalResponse>;
    isOnline(): boolean;
    resolveHost(host: string, options?: {
        queryType?: 'A' | 'AAAA';
        source?: 'any' | 'system' | 'dns' | 'mdns' | 'localOnly';
        cacheUsage?: 'allowed' | 'staleAllowed' | 'disallowed';
        secureDnsPolicy?: 'allow' | 'disable';
    }): Promise<Electron.ResolvedHost>;

    readonly online: boolean;
}
