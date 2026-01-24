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

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

interface WeatherProps {
  location?: string;
  compact?: boolean;
  expanded?: boolean; // Show 5-day forecast when expanded
}

export default function Weather({ location, compact = false, expanded = false }: WeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Detect if widget is expanded based on container size
  useEffect(() => {
    if (!containerRef) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsExpanded(entry.contentRect.height > 280);
      }
    });
    observer.observe(containerRef);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const WEATHER_API_KEY = "2b6bcedb6cba2356a4ea3706a846cfef";
      const GEO_API_KEY = "5ed712c5a70c46e78d0accde281edcc9";
      
      let lat: number = 27.9506; // Default Tampa
      let lon: number = -82.4572;
      let cityName: string = "Tampa, US";
      
      if (location) {
        // Use provided location - geocode it
        try {
          const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`
          );
          const geoData = await geoResponse.json();
          if (geoData.length > 0) {
            lat = geoData[0].lat;
            lon = geoData[0].lon;
            cityName = `${geoData[0].name}, ${geoData[0].country}`;
          }
        } catch (e) {
          console.log("Geocoding failed, using default location");
        }
      } else {
        // Get user's location via IP geolocation
        try {
          const ipGeoResponse = await fetch(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${GEO_API_KEY}`
          );
          if (ipGeoResponse.ok) {
            const ipGeoData = await ipGeoResponse.json();
            lat = parseFloat(ipGeoData.latitude);
            lon = parseFloat(ipGeoData.longitude);
            cityName = `${ipGeoData.city}, ${ipGeoData.country_code2}`;
          }
        } catch (e) {
          console.log("IP geolocation failed, using default location");
        }
      }
      
      // Fetch weather using coordinates
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const weatherData: WeatherData = {
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        visibility: Math.round((data.visibility || 10000) / 1609.34),
        pressure: data.main.pressure,
        icon: data.weather[0].icon,
        location: cityName || `${data.name}, ${data.sys.country}`
      };

      setWeather(weatherData);
      
      // Fetch 5-day forecast
      try {
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
        );
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          // Group by day and get daily highs/lows
          const dailyData: { [key: string]: { temps: number[], condition: string, icon: string } } = {};
          
          forecastData.list.forEach((item: any) => {
            const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayKey = new Date(item.dt * 1000).toDateString();
            
            if (!dailyData[dayKey]) {
              dailyData[dayKey] = { temps: [], condition: item.weather[0].main, icon: item.weather[0].icon };
            }
            dailyData[dayKey].temps.push(item.main.temp);
          });
          
          const forecastDays: ForecastDay[] = Object.entries(dailyData).slice(0, 5).map(([dateKey, data]) => {
            const date = new Date(dateKey);
            return {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
              high: Math.round(Math.max(...data.temps)),
              low: Math.round(Math.min(...data.temps)),
              condition: data.condition,
              icon: data.icon
            };
          });
          
          setForecast(forecastDays);
        }
      } catch (e) {
        console.log("Forecast fetch failed:", e);
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError("Weather unavailable");
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

  const getSmallWeatherIcon = (condition: string, iconCode: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rain")) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (lowerCondition.includes("snow")) return <CloudSnow className="w-6 h-6 text-cyan-300" />;
    if (lowerCondition.includes("cloud")) return <Cloud className="w-6 h-6 text-gray-400" />;
    return <Sun className="w-6 h-6 text-yellow-400" />;
  };

  return (
    <div ref={setContainerRef} className="h-full">
      <Card className="border-gray-800 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm p-6 h-full">
        <div className="space-y-4 h-full flex flex-col">
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

          {/* 5-Day Forecast - Shows when expanded */}
          {isExpanded && forecast.length > 0 && (
            <div className="pt-4 border-t border-gray-800 flex-1">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">5-Day Forecast</h4>
              <div className="grid grid-cols-5 gap-2">
                {forecast.map((day, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-xs font-semibold text-white">{day.dayName}</p>
                    <p className="text-xs text-gray-500">{day.date}</p>
                    <div className="my-2 flex justify-center">
                      {getSmallWeatherIcon(day.condition, day.icon)}
                    </div>
                    <p className="text-sm font-bold text-white">{day.high}°</p>
                    <p className="text-xs text-gray-500">{day.low}°</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
