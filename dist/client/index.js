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
// Optionally import demo logic for direct run
// import "../demo";
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const child_process_1 = require("child_process");
const readline = __importStar(require("readline"));
const mcp_config_1 = require("./mcp-config");
const tcp_transport_1 = require("./tcp-transport");
class WeatherClient {
    constructor() {
        this.client = new index_js_1.Client({
            name: "mcp-weather-client",
            version: "1.0.0",
        }, {
            capabilities: {},
        });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    async connect() {
        const config = (0, mcp_config_1.loadMCPConfig)();
        if (config.transport === "tcp") {
            const host = config.host || "127.0.0.1";
            const port = config.port || 3000;
            const tcpTransport = new tcp_transport_1.TcpClientTransport(host, port);
            await this.client.connect({
                stdin: tcpTransport.getStream(),
                stdout: tcpTransport.getStream(),
            });
            console.log(`✅ Connected to MCP Weather Server via TCP (${host}:${port})`);
            return undefined;
        }
        else if (process.env.MCP_WEATHER_NO_SPAWN) {
            // Use process.stdin and process.stdout for transport
            const transport = new stdio_js_1.StdioClientTransport({
                stdin: process.stdin,
                stdout: process.stdout,
            });
            await this.client.connect(transport);
            console.log("✅ Connected to existing MCP Weather Server (no spawn)");
            return undefined;
        }
        // Otherwise, spawn the server process as before
        const serverProcess = (0, child_process_1.spawn)("node", ["dist/server/index.js"], {
            stdio: ["pipe", "pipe", "inherit"],
            cwd: process.cwd(),
        });
        const transport = new stdio_js_1.StdioClientTransport({
            stdin: serverProcess.stdin,
            stdout: serverProcess.stdout,
        });
        await this.client.connect(transport);
        console.log("✅ Connected to MCP Weather Server");
        return serverProcess;
    }
    async listAvailableTools() {
        try {
            const response = await this.client.request({ method: "tools/list" }, {});
            console.log("\n🛠️ Available Weather Tools:");
            response.tools.forEach((tool) => {
                console.log(`\n📋 ${tool.name}:`);
                console.log(`   ${tool.description}`);
                if (tool.inputSchema?.properties) {
                    console.log("   Parameters:");
                    Object.entries(tool.inputSchema.properties).forEach(([key, value]) => {
                        const required = tool.inputSchema?.required?.includes(key) ? " (required)" : " (optional)";
                        console.log(`   - ${key}: ${value.description}${required}`);
                    });
                }
            });
            console.log("\n");
        }
        catch (error) {
            console.error("Error listing tools:", error);
        }
    }
    async getCurrentWeather(city, units = "metric") {
        try {
            const response = await this.client.request({ method: "tools/call" }, {
                name: "get_weather",
                arguments: { city, units },
            });
            return response.content[0].text;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return `❌ Error getting weather: ${errorMessage}`;
        }
    }
    async getWeatherForecast(city, units = "metric") {
        try {
            const response = await this.client.request({ method: "tools/call" }, {
                name: "get_forecast",
                arguments: { city, units },
            });
            return response.content[0].text;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return `❌ Error getting forecast: ${errorMessage}`;
        }
    }
    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
    async startInteractiveSession() {
        console.log("\n🌤️ Welcome to MCP Weather App!");
        console.log("Commands:");
        console.log("- 'weather <city>' - Get current weather");
        console.log("- 'forecast <city>' - Get 5-day forecast");
        console.log("- 'tools' - List available tools");
        console.log("- 'quit' or 'exit' - Exit the application");
        console.log("- Add 'imperial' or 'kelvin' at the end for different units (default: metric)");
        console.log("\nExample: weather London imperial\n");
        while (true) {
            try {
                const input = await this.question("🌍 Enter command: ");
                const parts = input.trim().split(" ");
                const command = parts[0].toLowerCase();
                if (command === "quit" || command === "exit") {
                    break;
                }
                if (command === "tools") {
                    await this.listAvailableTools();
                    continue;
                }
                if (command === "weather" && parts.length >= 2) {
                    const city = parts.slice(1, -1).join(" ") || parts[1];
                    const units = parts[parts.length - 1];
                    const validUnits = ["metric", "imperial", "kelvin"];
                    const weatherUnits = validUnits.includes(units) ? units : "metric";
                    const actualCity = validUnits.includes(units) ? parts.slice(1, -1).join(" ") : parts.slice(1).join(" ");
                    console.log(`\n🔍 Getting weather for ${actualCity}...`);
                    const result = await this.getCurrentWeather(actualCity, weatherUnits);
                    console.log(`\n${result}\n`);
                    continue;
                }
                if (command === "forecast" && parts.length >= 2) {
                    const city = parts.slice(1, -1).join(" ") || parts[1];
                    const units = parts[parts.length - 1];
                    const validUnits = ["metric", "imperial", "kelvin"];
                    const weatherUnits = validUnits.includes(units) ? units : "metric";
                    const actualCity = validUnits.includes(units) ? parts.slice(1, -1).join(" ") : parts.slice(1).join(" ");
                    console.log(`\n🔍 Getting forecast for ${actualCity}...`);
                    const result = await this.getWeatherForecast(actualCity, weatherUnits);
                    console.log(`\n${result}\n`);
                    continue;
                }
                console.log("❌ Invalid command. Type 'tools' to see available commands.");
            }
            catch (error) {
                console.error("Error:", error);
            }
        }
    }
    async disconnect() {
        this.rl.close();
        await this.client.close();
        console.log("👋 Disconnected from MCP Weather Server");
    }
}
// Main function
async function main() {
    const client = new WeatherClient();
    let serverProcess;
    try {
        serverProcess = await client.connect();
        await client.listAvailableTools();
        await client.startInteractiveSession();
    }
    catch (error) {
        console.error("Failed to start client:", error);
    }
    finally {
        await client.disconnect();
        if (serverProcess) {
            serverProcess.kill();
        }
        process.exit(0);
    }
}
// Handle process termination
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    process.exit(0);
});
// Start the client
main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
});
exports.default = WeatherClient;
//# sourceMappingURL=index.js.map