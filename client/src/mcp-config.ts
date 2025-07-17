import * as fs from "fs";
import * as path from "path";

export interface MCPConfig {
  transport: "stdio" | "tcp";
  port?: number;
  host?: string;
}

export function loadMCPConfig(): MCPConfig {
  const configPath = path.resolve(process.cwd(), "mcp.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  }
  return { transport: "stdio", port: 3000, host: "127.0.0.1" };
}
