/**
 * WEATHER COMPONENT
 * Displays current weather conditions and forecast
 * Uses OpenWeatherMap API for real-time weather data
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, 
  Wind, Droplets, Eye, Gauge, Loader2 
} from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  icon: string;
  location: string;
}

interface WeatherProps {
  location?: string; // Optional location override
  compact?: boolean; // Compact view for smaller spaces
}

export default function Weather({ location, compact = false }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, use mock data
      // In production, integrate with OpenWeatherMap API:
      // const API_KEY = process.env.VITE_OPENWEATHER_API_KEY;
      // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location || 'Tampa,FL'}&appid=${API_KEY}&units=imperial`);
      
      // Mock weather data for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockWeather: WeatherData = {
        temp: 72,
        feelsLike: 70,
        condition: "Clear",
        description: "Clear sky",
        humidity: 65,
        windSpeed: 8,
        visibility: 10,
        pressure: 1013,
        icon: "01d",
        location: location || "Tampa, FL"
      };

      setWeather(mockWeather);
    } catch (err) {
      setError("Failed to load weather data");
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, iconCode: string) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes("rain") || iconCode.includes("09") || iconCode.includes("10")) {
      return <CloudRain className="w-12 h-12 text-blue-400" />;
    }
    if (lowerCondition.includes("snow") || iconCode.includes("13")) {
      return <CloudSnow className="w-12 h-12 text-cyan-300" />;
    }
    if (lowerCondition.includes("drizzle")) {
      return <CloudDrizzle className="w-12 h-12 text-blue-300" />;
    }
    if (lowerCondition.includes("cloud") || iconCode.includes("02") || iconCode.includes("03") || iconCode.includes("04")) {
      return <Cloud className="w-12 h-12 text-gray-400" />;
    }
    // Default to sunny
    return <Sun className="w-12 h-12 text-yellow-400" />;
  };

  if (loading) {
    return (
      <Card className="border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm p-6">
        <div className="text-center text-gray-400">
          <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error || "Weather unavailable"}</p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-gray-800 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition, weather.icon)}
            <div>
              <p className="text-3xl font-bold text-white">{Math.round(weather.temp)}°F</p>
              <p className="text-sm text-gray-400">{weather.condition}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">{weather.location}</p>
            <p className="text-xs text-gray-500">Feels like {Math.round(weather.feelsLike)}°F</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-gray-800 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Weather
            </h3>
            <p className="text-sm text-gray-400">{weather.location}</p>
          </div>
          {getWeatherIcon(weather.condition, weather.icon)}
        </div>

        {/* Temperature */}
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">{Math.round(weather.temp)}°F</span>
          <span className="text-gray-400">Feels like {Math.round(weather.feelsLike)}°F</span>
        </div>

        {/* Condition */}
        <div>
          <p className="text-lg text-white capitalize">{weather.condition}</p>
          <p className="text-sm text-gray-400 capitalize">{weather.description}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Humidity</p>
              <p className="text-sm font-semibold text-white">{weather.humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-xs text-gray-400">Wind</p>
              <p className="text-sm font-semibold text-white">{weather.windSpeed} mph</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Visibility</p>
              <p className="text-sm font-semibold text-white">{weather.visibility} mi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-xs text-gray-400">Pressure</p>
              <p className="text-sm font-semibold text-white">{weather.pressure} mb</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
