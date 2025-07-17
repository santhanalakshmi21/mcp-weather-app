import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadMCPConfig } from "./mcp-config";
import { TcpServerTransport } from "./tcp-transport";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

interface ToolArgs {
  city: string;
  units?: string;
}

class WeatherServer {
  private server: Server;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || "";
    this.baseUrl = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
    
    this.server = new Server(
      {
        name: "mcp-weather-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_weather",
            description: "Get current weather information for a specified city",
            inputSchema: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "The city name to get weather for",
                },
                units: {
                  type: "string",
                  enum: ["metric", "imperial", "kelvin"],
                  description: "Temperature units (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)",
                  default: "metric",
                },
              },
              required: ["city"],
            },
          } as Tool,
          {
            name: "get_forecast",
            description: "Get 5-day weather forecast for a specified city",
            inputSchema: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "The city name to get forecast for",
                },
                units: {
                  type: "string",
                  enum: ["metric", "imperial", "kelvin"],
                  description: "Temperature units (metric=Celsius, imperial=Fahrenheit, kelvin=Kelvin)",
                  default: "metric",
                },
              },
              required: ["city"],
            },
          } as Tool,
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args || typeof args !== 'object') {
        throw new Error("Invalid arguments provided");
      }

      const toolArgs = args as unknown as ToolArgs;

      try {
        switch (name) {
          case "get_weather":
            return await this.getCurrentWeather(toolArgs.city, toolArgs.units || "metric");
          
          case "get_forecast":
            return await this.getWeatherForecast(toolArgs.city, toolArgs.units || "metric");

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async getCurrentWeather(city: string, units: string = "metric") {
    if (!this.apiKey) {
      throw new Error("OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file");
    }

    const url = `${this.baseUrl}/weather`;
    const params = {
      q: city,
      appid: this.apiKey,
      units: units,
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    const weatherData: WeatherData = {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      feelsLike: Math.round(data.main.feels_like),
    };

    const unitSymbol = units === "imperial" ? "°F" : units === "kelvin" ? "K" : "°C";
    const speedUnit = units === "imperial" ? "mph" : "m/s";

    const weatherReport = `Current Weather in ${weatherData.location}:
🌡️ Temperature: ${weatherData.temperature}${unitSymbol} (feels like ${weatherData.feelsLike}${unitSymbol})
☁️ Condition: ${weatherData.description}
💧 Humidity: ${weatherData.humidity}%
💨 Wind Speed: ${weatherData.windSpeed} ${speedUnit}`;

    return {
      content: [
        {
          type: "text",
          text: weatherReport,
        },
      ],
    };
  }

  private async getWeatherForecast(city: string, units: string = "metric") {
    if (!this.apiKey) {
      throw new Error("OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file");
    }

    const url = `${this.baseUrl}/forecast`;
    const params = {
      q: city,
      appid: this.apiKey,
      units: units,
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    const unitSymbol = units === "imperial" ? "°F" : units === "kelvin" ? "K" : "°C";
    
    let forecastReport = `5-Day Weather Forecast for ${data.city.name}, ${data.city.country}:\n\n`;

    // Group forecasts by day
    const dailyForecasts = new Map();
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toDateString();
      
      if (!dailyForecasts.has(dateStr)) {
        dailyForecasts.set(dateStr, []);
      }
      dailyForecasts.get(dateStr).push(item);
    });

    // Take first 5 days
    let dayCount = 0;
    for (const [dateStr, forecasts] of dailyForecasts) {
      if (dayCount >= 5) break;
      
      const dayForecast = forecasts[0]; // Take first forecast of the day
      const temp = Math.round(dayForecast.main.temp);
      const description = dayForecast.weather[0].description;
      
      forecastReport += `📅 ${dateStr}:\n`;
      forecastReport += `   🌡️ ${temp}${unitSymbol} - ${description}\n\n`;
      
      dayCount++;
    }

    return {
      content: [
        {
          type: "text",
          text: forecastReport,
        },
      ],
    };
  }

  async run() {
    const config = loadMCPConfig();
    if (config.transport === "tcp") {
      const port = config.port || 3000;
      const tcpTransport = new TcpServerTransport(port, async (stream) => {
        await this.server.connect({
          stdin: stream,
          stdout: stream,
        } as any);
        console.error(`MCP Weather Server running on TCP port ${port}`);
      });
    } else {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("MCP Weather Server running on stdio");
    }
  }
}

// Start the server
const server = new WeatherServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default WeatherServer;
