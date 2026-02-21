/**
 * WEATHER ALERTS PAGE
 * 100% Dynamic — Uses browser geolocation + NWS (National Weather Service) API
 * Real alerts, real forecast, real wind speed based on your actual location
 * Cross-references active loads with alert zones for impacted loads
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CloudRain, AlertTriangle, Wind, Thermometer, MapPin,
  Search, RefreshCw, Clock, Sun, Cloud, CloudSnow,
  CloudLightning, CloudDrizzle, Locate, Navigation, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface NWSAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  description: string;
  area: string;
  expires: string;
  onset: string;
  certainty: string;
  urgency: string;
}

interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  isDaytime: boolean;
  icon: string;
}

interface ForecastDay {
  dayName: string;
  high: number;
  low: number;
  condition: string;
  windSpeed: string;
  icon: string;
}

const NWS_HEADERS = { "User-Agent": "(EusoTrip, support@eusotrip.com)", Accept: "application/geo+json" };

function mapSeverity(s: string): string {
  switch (s?.toLowerCase()) {
    case "extreme": return "extreme";
    case "severe": return "severe";
    case "moderate": return "moderate";
    case "minor": return "minor";
    default: return "unknown";
  }
}

function getWeatherIcon(forecast: string) {
  const f = forecast?.toLowerCase() || "";
  if (f.includes("thunder") || f.includes("lightning")) return <CloudLightning className="w-8 h-8 text-yellow-400" />;
  if (f.includes("snow") || f.includes("blizzard") || f.includes("ice") || f.includes("sleet")) return <CloudSnow className="w-8 h-8 text-blue-300" />;
  if (f.includes("rain") || f.includes("shower")) return <CloudRain className="w-8 h-8 text-cyan-400" />;
  if (f.includes("drizzle")) return <CloudDrizzle className="w-8 h-8 text-cyan-300" />;
  if (f.includes("cloud") || f.includes("overcast")) return <Cloud className="w-8 h-8 text-slate-400" />;
  if (f.includes("sun") || f.includes("clear") || f.includes("fair")) return <Sun className="w-8 h-8 text-yellow-400" />;
  if (f.includes("wind")) return <Wind className="w-8 h-8 text-cyan-400" />;
  return <Cloud className="w-8 h-8 text-slate-400" />;
}

function parseWindMph(windStr: string): number {
  const match = windStr?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export default function WeatherAlerts() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [currentWind, setCurrentWind] = useState("");
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentCondition, setCurrentCondition] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's active loads to cross-reference with alert zones
  const loadsQuery = (trpc as any).loads?.getMyLoads?.useQuery?.({ status: "in_transit" }) || { data: null };
  const activeLoads: any[] = (() => {
    const d = loadsQuery.data;
    return Array.isArray(d) ? d : Array.isArray(d?.loads) ? d.loads : [];
  })();

  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  // Get browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Fallback to Houston, TX if geolocation denied
          setLocation({ lat: 29.7604, lng: -95.3698 });
          setLocationName("Houston, TX (default)");
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      setLocation({ lat: 29.7604, lng: -95.3698 });
      setLocationName("Houston, TX (default)");
    }
  }, []);

  const fetchWeatherData = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Get NWS point metadata (forecast office, grid)
      const pointRes = await fetch(`https://api.weather.gov/points/${location.lat.toFixed(4)},${location.lng.toFixed(4)}`, { headers: NWS_HEADERS });
      if (!pointRes.ok) throw new Error("Failed to get NWS point data");
      const pointData = await pointRes.json();
      const forecastUrl = pointData.properties?.forecast;
      const city = pointData.properties?.relativeLocation?.properties?.city || "";
      const state = pointData.properties?.relativeLocation?.properties?.state || "";
      if (city && state) setLocationName(`${city}, ${state}`);

      // 2) Fetch active alerts for this location
      const alertsRes = await fetch(`https://api.weather.gov/alerts/active?point=${location.lat.toFixed(4)},${location.lng.toFixed(4)}`, { headers: NWS_HEADERS });
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        const parsed: NWSAlert[] = (alertsData.features || []).map((f: any, idx: number) => ({
          id: f.properties?.id || `alert-${idx}`,
          event: f.properties?.event || "Unknown",
          severity: mapSeverity(f.properties?.severity),
          headline: f.properties?.headline || "",
          description: (f.properties?.description || "").slice(0, 300),
          area: f.properties?.areaDesc || "",
          expires: f.properties?.expires ? new Date(f.properties.expires).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "",
          onset: f.properties?.onset || "",
          certainty: f.properties?.certainty || "",
          urgency: f.properties?.urgency || "",
        }));
        setAlerts(parsed);
      }

      // 3) Fetch 7-day forecast
      if (forecastUrl) {
        const fcRes = await fetch(forecastUrl, { headers: NWS_HEADERS });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          const periods: ForecastPeriod[] = fcData.properties?.periods || [];

          // Current conditions from first period
          if (periods.length > 0) {
            setCurrentTemp(periods[0].temperature);
            setCurrentWind(periods[0].windSpeed);
            setCurrentCondition(periods[0].shortForecast);
          }

          // Group periods into days (NWS returns day/night pairs)
          const days: ForecastDay[] = [];
          for (let i = 0; i < periods.length && days.length < 5; i++) {
            const p = periods[i];
            if (p.isDaytime) {
              const nightP = periods[i + 1];
              days.push({
                dayName: p.name,
                high: p.temperature,
                low: nightP?.temperature ?? p.temperature - 15,
                condition: p.shortForecast,
                windSpeed: p.windSpeed,
                icon: p.icon,
              });
            }
          }
          // If we didn't get enough days (e.g., started at night), fill from what we have
          if (days.length === 0) {
            for (let i = 0; i < Math.min(5, periods.length); i++) {
              days.push({
                dayName: periods[i].name,
                high: periods[i].temperature,
                low: periods[i].temperature - 10,
                condition: periods[i].shortForecast,
                windSpeed: periods[i].windSpeed,
                icon: periods[i].icon,
              });
            }
          }
          setForecast(days);
        }
      }
    } catch (err: any) {
      console.error("[WeatherAlerts] fetch error:", err);
      setError(err?.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { fetchWeatherData(); }, [fetchWeatherData]);

  // Cross-reference active loads with alert areas
  const impactedLoads = activeLoads.filter((load: any) => {
    if (alerts.length === 0) return false;
    const loadArea = `${load.pickupCity || ""} ${load.pickupState || ""} ${load.deliveryCity || ""} ${load.deliveryState || ""}`.toLowerCase();
    return alerts.some(a => {
      const alertArea = a.area.toLowerCase();
      return loadArea.split(/\s+/).some(w => w.length > 2 && alertArea.includes(w));
    });
  });

  const severeCount = alerts.filter(a => a.severity === "extreme" || a.severity === "severe").length;
  const avgWind = currentWind ? parseWindMph(currentWind) : 0;

  // Geocode a city/state name and update weather data
  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&countrycodes=us&format=json&limit=1`, {
        headers: { "User-Agent": "EusoTrip/1.0" }
      });
      if (!res.ok) throw new Error("Geocoding failed");
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const parts = display_name.split(",").map((s: string) => s.trim());
        const shortName = parts.length >= 3 ? `${parts[0]}, ${parts[parts.length - 2]}` : parts[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setLocationName(shortName);
        setSearchTerm("");
      } else {
        setError(`No results found for "${query}". Try a city and state (e.g. "Dallas, TX")`);
      }
    } catch (err: any) {
      console.error("[WeatherAlerts] geocode error:", err);
      setError("Failed to search location. Try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && locationSearch.trim()) {
      searchLocation(locationSearch);
    }
  };

  const filteredAlerts = alerts.filter(a =>
    !searchTerm || a.area.toLowerCase().includes(searchTerm.toLowerCase()) || a.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "extreme": return <Badge className="bg-red-500/20 text-red-400 border-0">Extreme</Badge>;
      case "severe": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Severe</Badge>;
      case "moderate": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
      case "minor": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Minor</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Weather Alerts
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Locate className="w-3.5 h-3.5 text-purple-400" />
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>{locationName} — live conditions from NWS</p>
          </div>
        </div>
        <Button variant="outline" className={cn("rounded-xl", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={fetchWeatherData}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Current Conditions Banner */}
      {!loading && currentTemp !== null && (
        <div className={cn("rounded-xl p-4 flex items-center gap-6 flex-wrap", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-slate-700/50")}>
          <div className="flex items-center gap-3">
            <Thermometer className="w-6 h-6 text-orange-400" />
            <div>
              <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{currentTemp}°F</p>
              <p className="text-xs text-slate-400">Current Temp</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wind className="w-6 h-6 text-cyan-400" />
            <div>
              <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>{currentWind || "Calm"}</p>
              <p className="text-xs text-slate-400">Wind</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getWeatherIcon(currentCondition)}
            <div>
              <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{currentCondition}</p>
              <p className="text-xs text-slate-400">Conditions</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{severeCount}</p>}
                <p className="text-xs text-slate-400">Severe Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><CloudRain className="w-6 h-6 text-yellow-400" /></div>
              <div>
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{alerts.length}</p>}
                <p className="text-xs text-slate-400">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Truck className="w-6 h-6 text-blue-400" /></div>
              <div>
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{impactedLoads.length}</p>}
                <p className="text-xs text-slate-400">Impacted Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Wind className="w-6 h-6 text-cyan-400" /></div>
              <div>
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{avgWind} mph</p>}
                <p className="text-xs text-slate-400">Wind Speed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className={cn("p-3 rounded-xl border text-sm", isLight ? "bg-red-50 border-red-200 text-red-600" : "bg-red-500/10 border-red-500/30 text-red-400")}>
          <AlertTriangle className="w-4 h-4 inline mr-2" />{error}
        </div>
      )}

      {/* Location Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
          <Input
            value={locationSearch}
            onChange={(e: any) => setLocationSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search location (e.g. Dallas, TX)..."
            className={cn("pl-9 pr-20 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}
          />
          <Button
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-xs font-bold px-3"
            disabled={isSearching || !locationSearch.trim()}
            onClick={() => searchLocation(locationSearch)}
          >
            {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
            {isSearching ? "" : "Go"}
          </Button>
        </div>
        {alerts.length > 0 && (
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Filter alerts..." className={cn("pl-9 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <AlertTriangle className="w-5 h-5 text-red-400" />Active Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className={cn("p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                  <Sun className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-slate-400 font-medium">All clear!</p>
                <p className="text-xs text-slate-500 mt-1">No active weather alerts for {locationName}</p>
              </div>
            ) : (
              <div className={cn("divide-y max-h-96 overflow-y-auto", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                {filteredAlerts.map(alert => (
                  <div key={alert.id} className={cn("p-4", alert.severity === "extreme" && "bg-red-500/5 border-l-2 border-red-500", alert.severity === "severe" && "bg-orange-500/5 border-l-2 border-orange-500")}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>{alert.event}</p>
                        {getSeverityBadge(alert.severity)}
                        {alert.urgency === "Immediate" && <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">Immediate</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">{alert.headline}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.area.length > 60 ? alert.area.slice(0, 60) + "..." : alert.area}</span>
                      {alert.expires && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Until {alert.expires}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impacted Loads */}
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Truck className="w-5 h-5 text-blue-400" />Impacted Loads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : impactedLoads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium">No impacted loads</p>
                <p className="text-xs text-slate-500 mt-1">{alerts.length > 0 ? "None of your active loads overlap with alert zones" : "No active alerts to match against"}</p>
              </div>
            ) : (
              <div className={cn("divide-y max-h-96 overflow-y-auto", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                {impactedLoads.map((load: any) => (
                  <div key={load.id} className={cn("p-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>#{load.loadNumber || `LOAD-${load.id}`}</p>
                        <p className="text-sm text-slate-400">{load.pickupCity}, {load.pickupState} → {load.deliveryCity}, {load.deliveryState}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Weather Alert</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5-Day Forecast */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Navigation className="w-5 h-5 text-purple-400" />
            {forecast.length}-Day Forecast — {locationName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : forecast.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Forecast data unavailable</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, i) => (
                <div key={i} className={cn("p-4 rounded-xl text-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                  <p className="text-slate-400 text-sm mb-2 font-medium">{day.dayName}</p>
                  <div className="mx-auto mb-2 flex justify-center">{getWeatherIcon(day.condition)}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>{day.high}°</span>
                    <span className="text-slate-500">{day.low}°</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{day.condition}</p>
                  {day.windSpeed && <p className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-center gap-1"><Wind className="w-2.5 h-2.5" />{day.windSpeed}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
