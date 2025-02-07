declare module 'node-nmap' {
    class NmapScan {
        constructor(range: string | string[], args?: string | string[]);
        startScan(): void;
        cancelScan(): void;
        on(event: 'complete' | 'error', callback: (data: any) => void): void;
    }

    class QuickScan extends NmapScan {}
    class OsAndPortScan extends NmapScan {}
    class NetworkScan extends NmapScan {}

    const nodeNmap: {
        NmapScan: typeof NmapScan;
        QuickScan: typeof QuickScan;
        OsAndPortScan: typeof OsAndPortScan;
        NetworkScan: typeof NetworkScan;
    };

    export default nodeNmap;
}