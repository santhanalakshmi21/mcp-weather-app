import { Duplex } from "stream";
import * as net from "net";


export class TcpClientTransport {
  private socket: net.Socket;
  constructor(private host: string, private port: number) {
    this.socket = new net.Socket();
  }
  async start() {
    return new Promise<void>((resolve, reject) => {
      this.socket.connect(this.port, this.host, () => resolve());
      this.socket.on('error', reject);
    });
  }
  getStream(): Duplex {
    return this.socket;
  }
  async close() {
    this.socket.end();
  }
}


export class TcpServerTransport {
  private server: net.Server;
  private socket: net.Socket | null = null;
  constructor(private port: number, private onConnection: (stream: Duplex) => void) {
    this.server = net.createServer((socket) => {
      this.socket = socket;
      this.onConnection(socket);
    });
  }
  async start() {
    return new Promise<void>((resolve, reject) => {
      this.server.listen(this.port, () => resolve());
      this.server.on('error', reject);
    });
  }
  getStream(): Duplex | null {
    return this.socket;
  }
  async close() {
    if (this.socket) this.socket.end();
    this.server.close();
  }
}
