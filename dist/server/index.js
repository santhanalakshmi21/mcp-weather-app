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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const mcp_config_1 = require("./mcp-config");
const tcp_transport_1 = require("./tcp-transport");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
class WeatherServer {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY || "";
        this.baseUrl = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
        this.server = new index_js_1.Server({
            name: "mcp-weather-server",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
    }
    setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
                    },
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
                    },
                ],
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            if (!args || typeof args !== 'object') {
                throw new Error("Invalid arguments provided");
            }
            const toolArgs = args;
            try {
                switch (name) {
                    case "get_weather":
                        return await this.getCurrentWeather(toolArgs.city, toolArgs.units || "metric");
                    case "get_forecast":
                        return await this.getWeatherForecast(toolArgs.city, toolArgs.units || "metric");
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
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
    async getCurrentWeather(city, units = "metric") {
        if (!this.apiKey) {
            throw new Error("OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file");
        }
        const url = `${this.baseUrl}/weather`;
        const params = {
            q: city,
            appid: this.apiKey,
            units: units,
        };
        const response = await axios_1.default.get(url, { params });
        const data = response.data;
        const weatherData = {
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
    async getWeatherForecast(city, units = "metric") {
        if (!this.apiKey) {
            throw new Error("OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file");
        }
        const url = `${this.baseUrl}/forecast`;
        const params = {
            q: city,
            appid: this.apiKey,
            units: units,
        };
        const response = await axios_1.default.get(url, { params });
        const data = response.data;
        const unitSymbol = units === "imperial" ? "°F" : units === "kelvin" ? "K" : "°C";
        let forecastReport = `5-Day Weather Forecast for ${data.city.name}, ${data.city.country}:\n\n`;
        // Group forecasts by day
        const dailyForecasts = new Map();
        data.list.forEach((item) => {
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
            if (dayCount >= 5)
                break;
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
        const config = (0, mcp_config_1.loadMCPConfig)();
        if (config.transport === "tcp") {
            const port = config.port || 3000;
            const tcpTransport = new tcp_transport_1.TcpServerTransport(port, async (stream) => {
                await this.server.connect({
                    stdin: stream,
                    stdout: stream,
                });
                console.error(`MCP Weather Server running on TCP port ${port}`);
            });
        }
        else {
            const transport = new stdio_js_1.StdioServerTransport();
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
exports.default = WeatherServer;
//# sourceMappingURL=index.js.map