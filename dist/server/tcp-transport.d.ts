import { Duplex } from "stream";
export declare class TcpClientTransport {
    private host;
    private port;
    private socket;
    constructor(host: string, port: number);
    start(): Promise<void>;
    getStream(): Duplex;
    close(): Promise<void>;
}
export declare class TcpServerTransport {
    private port;
    private onConnection;
    private server;
    private socket;
    constructor(port: number, onConnection: (stream: Duplex) => void);
    start(): Promise<void>;
    getStream(): Duplex | null;
    close(): Promise<void>;
}
//# sourceMappingURL=tcp-transport.d.ts.map