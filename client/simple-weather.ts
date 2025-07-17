import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

async function getCurrentWeather(city: string, units: string = "metric"): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY || "";
  const baseUrl = process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5";
  if (!apiKey) {
    return "❌ Error: OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env file";
  }
  try {
    const url = `${baseUrl}/weather`;
    const params = { q: city, appid: apiKey, units };
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
    return `Current Weather in ${weatherData.location}:
🌡️ Temperature: ${weatherData.temperature}${unitSymbol} (feels like ${weatherData.feelsLike}${unitSymbol})
☁️ Condition: ${weatherData.description}
💧 Humidity: ${weatherData.humidity}%
💨 Wind Speed: ${weatherData.windSpeed} ${speedUnit}`;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return `❌ Error: City "${city}" not found. Please check the spelling.`;
    } else if (error.response?.status === 401) {
      return `❌ Error: Invalid API key. Please check your OPENWEATHER_API_KEY in .env file.`;
    } else {
      return `❌ Error getting weather: ${error.message}`;
    }
  }
}

async function main() {
  const city = process.argv[2] || "London";
  const units = process.argv[3] || "metric";
  console.log(`\n🔍 Getting weather for ${city}...`);
  const weather = await getCurrentWeather(city, units);
  console.log(weather);
}

if (require.main === module) {
  main().catch(console.error);
}
