# MCP Weather App

A simple weather application with TypeScript that demonstrates MCP (Model Context Protocol) concepts for getting weather reports.

## Features

- 🌤️ Current weather information
- 📅 5-day weather forecast
- 🌡️ Multiple temperature units (Celsius, Fahrenheit, Kelvin)
- 🔧 Interactive command-line interface
- ⚡ Built with TypeScript
- ✅ Working demo with real weather data

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Weather API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key
4. Update your `.env` file with your API key:

```bash
OPENWEATHER_API_KEY=your_actual_api_key_here
```

### 3. Run the Application

```bash
# Run the interactive weather app
npm start

# Or run the demo with sample cities
npm run demo
```

## Available Commands

### Interactive Weather App (`npm start`)

- `weather <city>` - Get current weather for a city
- `forecast <city>` - Get 5-day forecast for a city
- `quit` or `exit` - Exit the application

### Temperature Units

Add unit type at the end of your command:
- `weather London` - Default (Celsius)
- `weather London imperial` - Fahrenheit
- `weather London kelvin` - Kelvin

### Examples

```
🌍 Enter command: weather London
🌍 Enter command: forecast Tokyo imperial
🌍 Enter command: weather "New York" 
```

## Project Structure

```
mcp-weather-app/
├── simple-weather.ts    # Main interactive weather app
├── demo.ts             # Demo script with sample cities
├── client/             # MCP client (in development)
├── server/             # MCP server (in development)
├── .env               # Your API configuration
├── .env.example       # Environment template
├── package.json       # Project configuration
└── README.md          # This file
```

## How it Works

The application uses the OpenWeatherMap API to fetch real-time weather data:

1. **Current Weather**: Returns temperature, conditions, humidity, and wind speed
2. **5-Day Forecast**: Shows daily forecasts with temperature and conditions
3. **Multiple Units**: Supports Celsius, Fahrenheit, and Kelvin
4. **Error Handling**: Graceful handling of API errors and invalid cities

## Available Scripts

- `npm start` - Run the interactive weather app (compiles and runs)
- `npm run demo` - Run demo with sample cities (compiles and runs)
- `npm run build` - Build all TypeScript files (server, client, and simple apps)
- `npm run start:compiled` - Run pre-compiled weather app (faster)
- `npm run demo:compiled` - Run pre-compiled demo (faster)
- `npm run start:client` - Run the full MCP client/server
- `npm install` - Install dependencies

## API Configuration

The app uses these environment variables:

- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (required)
- `OPENWEATHER_BASE_URL`: API base URL (optional)

## Error Handling

The application handles:
- ❌ Missing API key
- ❌ Invalid city names  
- ❌ Network errors
- ❌ API rate limits
- ❌ Invalid commands

## Sample Output

```
🌤️ Welcome to Simple Weather App!

🌍 Enter command: weather London

🔍 Getting weather for London...

Current Weather in London, GB:
🌡️ Temperature: 15°C (feels like 14°C)
☁️ Condition: light rain
💧 Humidity: 82%
💨 Wind Speed: 3.6 m/s
```

## License

ISC
