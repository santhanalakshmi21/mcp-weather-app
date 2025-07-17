import { ChildProcess } from "child_process";
declare class WeatherClient {
    private client;
    private rl;
    constructor();
    connect(): Promise<ChildProcess | undefined>;
    listAvailableTools(): Promise<void>;
    getCurrentWeather(city: string, units?: string): Promise<string>;
    getWeatherForecast(city: string, units?: string): Promise<string>;
    private question;
    startInteractiveSession(): Promise<void>;
    disconnect(): Promise<void>;
}
export default WeatherClient;
//# sourceMappingURL=index.d.ts.map