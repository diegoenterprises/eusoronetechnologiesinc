import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Wind, Droplets, Eye, Gauge } from 'lucide-react';

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  location: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
}

// Mock weather data (in production, this would come from an API)
const getMockWeather = (): WeatherData => ({
  temp: 72,
  feelsLike: 70,
  condition: 'Clear',
  humidity: 65,
  windSpeed: 8,
  visibility: 10,
  pressure: 1013,
  location: 'Tampa, FL',
  forecast: [
    { day: 'Mon', high: 75, low: 62, condition: 'Sunny', precipitation: 0 },
    { day: 'Tue', high: 78, low: 64, condition: 'Partly Cloudy', precipitation: 10 },
    { day: 'Wed', high: 76, low: 63, condition: 'Cloudy', precipitation: 30 },
    { day: 'Thu', high: 72, low: 60, condition: 'Rain', precipitation: 80 },
    { day: 'Fri', high: 74, low: 61, condition: 'Sunny', precipitation: 5 },
  ]
});

const getWeatherIcon = (condition: string, size: string = "w-8 h-8") => {
  const iconClass = `${size} transition-all duration-500`;
  
  switch (condition.toLowerCase()) {
    case 'clear':
    case 'sunny':
      return <Sun className={`${iconClass} text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]`} />;
    case 'partly cloudy':
    case 'cloudy':
      return <Cloud className={`${iconClass} text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.4)]`} />;
    case 'rain':
    case 'rainy':
      return <CloudRain className={`${iconClass} text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${iconClass} text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]`} />;
    case 'snow':
      return <CloudSnow className={`${iconClass} text-blue-100 drop-shadow-[0_0_8px_rgba(219,234,254,0.5)]`} />;
    default:
      return <Cloud className={`${iconClass} text-gray-400`} />;
  }
};

const getBackgroundGradient = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'clear':
    case 'sunny':
      return 'from-amber-500/20 via-orange-500/10 to-yellow-500/20';
    case 'partly cloudy':
      return 'from-blue-500/15 via-gray-500/10 to-blue-400/15';
    case 'cloudy':
      return 'from-gray-500/20 via-slate-500/15 to-gray-400/20';
    case 'rain':
    case 'rainy':
      return 'from-blue-600/25 via-blue-500/15 to-cyan-500/20';
    case 'drizzle':
      return 'from-blue-400/20 via-cyan-400/10 to-blue-300/15';
    case 'snow':
      return 'from-blue-200/25 via-white/10 to-blue-100/20';
    default:
      return 'from-gray-500/15 via-slate-500/10 to-gray-400/15';
  }
};

interface PremiumWeatherProps {
  compact?: boolean;
  expanded?: boolean;
}

export default function PremiumWeather({ compact = false, expanded = false }: PremiumWeatherProps) {
  const [weather, setWeather] = useState<WeatherData>(getMockWeather());
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Subtle pulsing animation
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compact view - minimal info
  if (compact) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(weather.condition)} p-4 backdrop-blur-sm`}>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition, "w-10 h-10")}
            <div>
              <div className="text-3xl font-bold text-white drop-shadow-lg">
                {weather.temp}°F
              </div>
              <div className="text-xs text-white/80">{weather.condition}</div>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-all duration-1000 ${isAnimating ? 'scale-110' : 'scale-100'}`} />
      </div>
    );
  }

  // Expanded view - full 5-day forecast
  if (expanded) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(weather.condition)} backdrop-blur-sm`}>
        {/* Animated background */}
        <div className={`absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-3xl transition-all duration-2000 ${isAnimating ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}`} />
        <div className={`absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-2xl transition-all duration-2000 ${isAnimating ? 'scale-100 opacity-50' : 'scale-110 opacity-100'}`} />
        
        <div className="relative z-10 p-6 space-y-6">
          {/* Current Weather - Hero Section */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-white/70 font-medium mb-1">{weather.location}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-6xl font-bold text-white drop-shadow-2xl tracking-tight">
                  {weather.temp}°
                </div>
                <div className="text-lg text-white/60 mb-2">F</div>
              </div>
              <div className="text-lg text-white/90 font-medium mt-1">{weather.condition}</div>
              <div className="text-sm text-white/60 mt-1">Feels like {weather.feelsLike}°F</div>
            </div>
            <div className={`transition-transform duration-700 ${isAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}`}>
              {getWeatherIcon(weather.condition, "w-24 h-24")}
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <Droplets className="w-4 h-4 text-white/70 mb-1" />
              <div className="text-xs text-white/60">Humidity</div>
              <div className="text-lg font-bold text-white">{weather.humidity}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <Wind className="w-4 h-4 text-white/70 mb-1" />
              <div className="text-xs text-white/60">Wind</div>
              <div className="text-lg font-bold text-white">{weather.windSpeed} mph</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <Eye className="w-4 h-4 text-white/70 mb-1" />
              <div className="text-xs text-white/60">Visibility</div>
              <div className="text-lg font-bold text-white">{weather.visibility} mi</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <Gauge className="w-4 h-4 text-white/70 mb-1" />
              <div className="text-xs text-white/60">Pressure</div>
              <div className="text-lg font-bold text-white">{weather.pressure}</div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div>
            <div className="text-sm text-white/70 font-semibold mb-3 uppercase tracking-wide">5-Day Forecast</div>
            <div className="grid grid-cols-5 gap-2">
              {weather.forecast.map((day, index) => (
                <div
                  key={day.day}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-xs font-semibold text-white/80 mb-2 text-center">{day.day}</div>
                  <div className="flex justify-center mb-2">
                    {getWeatherIcon(day.condition, "w-8 h-8")}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">{day.high}°</div>
                    <div className="text-xs text-white/50">{day.low}°</div>
                  </div>
                  {day.precipitation > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-300" />
                      <span className="text-xs text-white/60">{day.precipitation}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - medium size
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(weather.condition)} p-5 backdrop-blur-sm`}>
      {/* Animated background elements */}
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl transition-all duration-1500 ${isAnimating ? 'scale-125 opacity-100' : 'scale-100 opacity-50'}`} />
      <div className={`absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/5 blur-xl transition-all duration-1500 ${isAnimating ? 'scale-100 opacity-50' : 'scale-110 opacity-100'}`} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-white/70 font-medium">{weather.location}</div>
            <div className="text-xs text-white/50 mt-0.5">{weather.condition}</div>
          </div>
          <div className={`transition-transform duration-700 ${isAnimating ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}`}>
            {getWeatherIcon(weather.condition, "w-12 h-12")}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline gap-1 mb-4">
          <div className="text-5xl font-bold text-white drop-shadow-2xl tracking-tight">
            {weather.temp}°
          </div>
          <div className="text-lg text-white/60">F</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-white/70" />
              <div>
                <div className="text-xs text-white/60">Humidity</div>
                <div className="text-sm font-bold text-white">{weather.humidity}%</div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-white/70" />
              <div>
                <div className="text-xs text-white/60">Wind</div>
                <div className="text-sm font-bold text-white">{weather.windSpeed} mph</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
