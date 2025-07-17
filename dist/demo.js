"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleWeatherClient = void 0;
const axios_1 = require("axios");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
class SimpleWeatherClient {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY || "";
        this.baseUrl = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
    }
    async getCurrentWeather(city, units = "metric") {
        if (!this.apiKey) {
            return "❌ Error: OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file";
        }
        try {
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
            return `Current Weather in ${weatherData.location}:
🌡️ Temperature: ${weatherData.temperature}${unitSymbol} (feels like ${weatherData.feelsLike}${unitSymbol})
☁️ Condition: ${weatherData.description}
💧 Humidity: ${weatherData.humidity}%
💨 Wind Speed: ${weatherData.windSpeed} ${speedUnit}`;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return `❌ Error: City "${city}" not found. Please check the spelling.`;
            }
            else if (error.response?.status === 401) {
                return `❌ Error: Invalid API key. Please check your OPENWEATHER_API_KEY in .env file.`;
            }
            else {
                return `❌ Error getting weather: ${error.message}`;
            }
        }
    }
    async getWeatherForecast(city, units = "metric") {
        if (!this.apiKey) {
            return "❌ Error: OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file";
        }
        try {
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
            return forecastReport;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return `❌ Error: City "${city}" not found. Please check the spelling.`;
            }
            else if (error.response?.status === 401) {
                return `❌ Error: Invalid API key. Please check your OPENWEATHER_API_KEY in .env file.`;
            }
            else {
                return `❌ Error getting forecast: ${error.message}`;
            }
        }
    }
}
exports.SimpleWeatherClient = SimpleWeatherClient;
// Demo function
async function demo() {
    console.log("🌤️ MCP Weather App Demo\n");
    const client = new SimpleWeatherClient();
    // Test with a few cities
    const cities = ["London", "New York", "Tokyo"];
    for (const city of cities) {
        console.log(`\n🔍 Getting weather for ${city}...`);
        const weather = await client.getCurrentWeather(city);
        console.log(weather);
        console.log(`\n📅 Getting forecast for ${city}...`);
        const forecast = await client.getWeatherForecast(city);
        console.log(forecast);
        console.log("─".repeat(60));
    }
    console.log("\n✅ Demo completed!");
    console.log("\n💡 To use the full MCP server/client:");
    console.log("1. Set your OPENWEATHER_API_KEY in .env file");
    console.log("2. Run: npm run build");
    console.log("3. Run: npm run start:client");
}
// Run demo
demo().catch(console.error);
