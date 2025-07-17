declare class WeatherServer {
    private server;
    private apiKey;
    private baseUrl;
    constructor();
    private setupToolHandlers;
    private getCurrentWeather;
    private getWeatherForecast;
    run(): Promise<void>;
}
export default WeatherServer;
//# sourceMappingURL=index.d.ts.map