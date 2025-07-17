export interface MCPConfig {
    transport: "stdio" | "tcp";
    port?: number;
    host?: string;
}
export declare function loadMCPConfig(): MCPConfig;
//# sourceMappingURL=mcp-config.d.ts.map