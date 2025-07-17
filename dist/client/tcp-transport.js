"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerTransport = exports.TcpClientTransport = void 0;
const net = __importStar(require("net"));
class TcpClientTransport {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = new net.Socket();
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.socket.connect(this.port, this.host, () => resolve());
            this.socket.on('error', reject);
        });
    }
    getStream() {
        return this.socket;
    }
    async close() {
        this.socket.end();
    }
}
exports.TcpClientTransport = TcpClientTransport;
class TcpServerTransport {
    constructor(port, onConnection) {
        this.port = port;
        this.onConnection = onConnection;
        this.socket = null;
        this.server = net.createServer((socket) => {
            this.socket = socket;
            this.onConnection(socket);
        });
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, () => resolve());
            this.server.on('error', reject);
        });
    }
    getStream() {
        return this.socket;
    }
    async close() {
        if (this.socket)
            this.socket.end();
        this.server.close();
    }
}
exports.TcpServerTransport = TcpServerTransport;
//# sourceMappingURL=tcp-transport.js.map