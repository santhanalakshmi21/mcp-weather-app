// Optionally import demo logic for direct run
// import "../demo";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from "child_process";
import * as readline from "readline";
import { loadMCPConfig } from "./mcp-config";
import { TcpClientTransport } from "./tcp-transport";

interface Tool {
  name: string;
  description: string;
  inputSchema?: {
    properties?: Record<string, any>;
    required?: string[];
  };
}

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface ToolsListResponse {
  tools: Tool[];
}

class WeatherClient {
  private client: Client;
  private rl: readline.Interface;

  constructor() {
    this.client = new Client(
      {
        name: "mcp-weather-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async connect(): Promise<ChildProcess | undefined> {
    const config = loadMCPConfig();
    if (config.transport === "tcp") {
      const host = config.host || "127.0.0.1";
      const port = config.port || 3000;
      const tcpTransport = new TcpClientTransport(host, port);
      await this.client.connect({
        stdin: tcpTransport.getStream(),
        stdout: tcpTransport.getStream(),
      } as any);
      console.log(`✅ Connected to MCP Weather Server via TCP (${host}:${port})`);
      return undefined;
    } else if (process.env.MCP_WEATHER_NO_SPAWN) {
      // Use process.stdin and process.stdout for transport
      const transport = new StdioClientTransport({
        stdin: process.stdin,
        stdout: process.stdout,
      } as any);
      await this.client.connect(transport);
      console.log("✅ Connected to existing MCP Weather Server (no spawn)");
      return undefined;
    }
    // Otherwise, spawn the server process as before
    const serverProcess = spawn("node", ["dist/server/index.js"], {
      stdio: ["pipe", "pipe", "inherit"],
      cwd: process.cwd(),
    });
    const transport = new StdioClientTransport({
      stdin: serverProcess.stdin!,
      stdout: serverProcess.stdout!,
    } as any);
    await this.client.connect(transport);
    console.log("✅ Connected to MCP Weather Server");
    return serverProcess;
  }

  async listAvailableTools() {
    try {
      const response = await this.client.request(
        { method: "tools/list" },
        {} as any
      ) as ToolsListResponse;
      
      console.log("\n🛠️ Available Weather Tools:");
      response.tools.forEach((tool: Tool) => {
        console.log(`\n📋 ${tool.name}:`);
        console.log(`   ${tool.description}`);
        
        if (tool.inputSchema?.properties) {
          console.log("   Parameters:");
          Object.entries(tool.inputSchema.properties).forEach(([key, value]: [string, any]) => {
            const required = tool.inputSchema?.required?.includes(key) ? " (required)" : " (optional)";
            console.log(`   - ${key}: ${value.description}${required}`);
          });
        }
      });
      console.log("\n");
    } catch (error) {
      console.error("Error listing tools:", error);
    }
  }

  async getCurrentWeather(city: string, units: string = "metric") {
    try {
      const response = await this.client.request(
        { method: "tools/call" },
        {
          name: "get_weather",
          arguments: { city, units },
        } as any
      ) as ToolResponse;

      return response.content[0].text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return `❌ Error getting weather: ${errorMessage}`;
    }
  }

  async getWeatherForecast(city: string, units: string = "metric") {
    try {
      const response = await this.client.request(
        { method: "tools/call" },
        {
          name: "get_forecast",
          arguments: { city, units },
        } as any
      ) as ToolResponse;

      return response.content[0].text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return `❌ Error getting forecast: ${errorMessage}`;
    }
  }

  private question(prompt: string): Promise<string> {
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
      } catch (error) {
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
  let serverProcess: ChildProcess | undefined;
  try {
    serverProcess = await client.connect();
    await client.listAvailableTools();
    await client.startInteractiveSession();
  } catch (error) {
    console.error("Failed to start client:", error);
  } finally {
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

export default WeatherClient;
