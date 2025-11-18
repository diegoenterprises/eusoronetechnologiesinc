/**
 * DASHBOARD ANALYTICS COMPONENT
 * Real-time analytics, charts, and weather integration
 * Displays role-specific metrics and KPIs
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Cloud, CloudRain, Sun, Wind, Zap, CheckCircle, Users, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";

interface AnalyticsData {
  label: string;
  value: number;
  trend: number;
  trendUp: boolean;
}

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: "sun" | "cloud" | "rain";
}

export default function DashboardAnalytics() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData>({
    temp: 72,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    icon: "cloud",
  });

  const [analytics, setAnalytics] = useState<AnalyticsData[]>([
    { label: "Active Shipments", value: 12, trend: 8, trendUp: true },
    { label: "On-Time Delivery", value: 98.5, trend: 2.3, trendUp: true },
    { label: "Revenue (This Month)", value: 45320, trend: 12, trendUp: true },
    { label: "Compliance Score", value: 99.2, trend: 0.5, trendUp: true },
  ]);

  const userRole = (user?.role || "user") as string;

  useEffect(() => {
    // Simulate real-time weather data
    const weatherOptions = [
      { temp: 72, condition: "Sunny", humidity: 55, windSpeed: 8, icon: "sun" as const },
      { temp: 68, condition: "Cloudy", humidity: 65, windSpeed: 12, icon: "cloud" as const },
      { temp: 65, condition: "Rainy", humidity: 85, windSpeed: 18, icon: "rain" as const },
    ];

    const randomWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    setWeather(randomWeather);
  }, []);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <Sun size={32} className="text-yellow-400" />;
      case "cloud":
        return <Cloud size={32} className="text-gray-400" />;
      case "rain":
        return <CloudRain size={32} className="text-blue-400" />;
      default:
        return <Sun size={32} className="text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Weather Widget */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-2">Current Weather</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{weather.temp}°F</span>
              <span className="text-gray-400">{weather.condition}</span>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Humidity</p>
                <p className="text-white font-semibold">{weather.humidity}%</p>
              </div>
              <div className="flex items-center gap-2">
                <Wind size={16} className="text-blue-400" />
                <div>
                  <p className="text-gray-500">Wind</p>
                  <p className="text-white font-semibold">{weather.windSpeed} mph</p>
                </div>
              </div>
            </div>
          </div>
          <div>{getWeatherIcon(weather.icon)}</div>
        </div>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics.map((item, idx) => (
          <Card key={idx} className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">{item.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {typeof item.value === "number" && item.value > 100
                    ? `$${(item.value / 1000).toFixed(1)}K`
                    : item.value}
                  {item.label.includes("Delivery") || item.label.includes("Compliance") ? "%" : ""}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  item.trendUp ? "bg-green-900/30" : "bg-red-900/30"
                }`}
              >
                {item.trendUp ? (
                  <TrendingUp className="text-green-400" size={20} />
                ) : (
                  <TrendingDown className="text-red-400" size={20} />
                )}
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  item.trendUp ? "text-green-400" : "text-red-400"
                }`}
              >
                {item.trendUp ? "+" : "-"}{Math.abs(item.trend)}%
              </span>
              <span className="text-gray-500 text-sm">vs last period</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(item.value, 100)}%` }}
              ></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-6">Performance Trend</h3>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          {[
            { label: "Week 1", value: 65, color: "from-blue-600" },
            { label: "Week 2", value: 78, color: "from-blue-600" },
            { label: "Week 3", value: 82, color: "from-blue-600" },
            { label: "Week 4", value: 91, color: "from-purple-600" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-16">
                <p className="text-sm text-gray-400">{item.label}</p>
              </div>
              <div className="flex-1 bg-slate-700 rounded-full h-8 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${item.color} to-purple-600 h-full flex items-center justify-end pr-3 transition-all duration-500`}
                  style={{ width: `${item.value}%` }}
                >
                  <span className="text-xs font-bold text-white">{item.value}%</span>
                </div>
              </div>
            </div>          ))}
        </div>
      </Card>

      {/* KPI Summary */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Key Performance Indicators</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Response", value: "2.3s", icon: <Zap size={24} className="text-yellow-400" /> },
            { label: "Uptime", value: "99.9%", icon: <CheckCircle size={24} className="text-green-400" /> },
            { label: "Users Online", value: "1,234", icon: <Users size={24} className="text-blue-400" /> },
            { label: "Transactions", value: "5.2K", icon: <CreditCard size={24} className="text-purple-400" /> },
          ].map((kpi, idx) => (
            <div key={idx} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
              <div className="flex items-center justify-center mb-2">{kpi.icon}</div>
              <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
              <p className="text-white font-bold text-lg">{kpi.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

