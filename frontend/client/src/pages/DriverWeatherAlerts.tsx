import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Sun,
  Thermometer,
  AlertTriangle,
  MapPin,
  RefreshCw,
  AlertCircle,
  Navigation,
  Clock,
  CloudLightning,
  Droplets,
  Eye,
  Bell,
  Settings,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DriverWeatherAlerts() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const {
    data: weatherDataRaw,
    isLoading,
    error,
    refetch,
  } = (trpc as any).drivers.getAll.useQuery({});

  const weatherData = weatherDataRaw as any;

  const updateAlertSettings = (trpc as any).drivers.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Alert settings updated");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "rain":
        return <CloudRain className="h-5 w-5" />;
      case "snow":
        return <CloudSnow className="h-5 w-5" />;
      case "wind":
        return <Wind className="h-5 w-5" />;
      case "storm":
        return <CloudLightning className="h-5 w-5" />;
      case "fog":
        return <Eye className="h-5 w-5" />;
      case "heat":
        return <Thermometer className="h-5 w-5" />;
      case "flood":
        return <Droplets className="h-5 w-5" />;
      default:
        return <Cloud className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "extreme":
        return <Badge className="bg-red-600 text-white">Extreme</Badge>;
      case "severe":
        return <Badge className="bg-orange-500 text-white">Severe</Badge>;
      case "moderate":
        return <Badge className="bg-yellow-500 text-white">Moderate</Badge>;
      case "minor":
        return <Badge className="bg-blue-500 text-white">Minor</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "extreme":
        return "border-red-500 bg-red-50";
      case "severe":
        return "border-orange-500 bg-orange-50";
      case "moderate":
        return "border-yellow-500 bg-yellow-50";
      case "minor":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-200";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Weather Data</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudRain className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Weather Alerts</h1>
                <p className="text-sky-100">Real-time weather conditions for your route</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_: any, i: number) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Alerts</p>
                    <p className="text-2xl font-bold">{weatherData?.summary?.activeAlerts || 0}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">On Route</p>
                    <p className="text-2xl font-bold">{weatherData?.summary?.onRouteAlerts || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Navigation className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Temp</p>
                    <p className="text-2xl font-bold">{weatherData?.currentConditions?.temperature || "--"}F</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Visibility</p>
                    <p className="text-2xl font-bold">{weatherData?.currentConditions?.visibility || "--"} mi</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {weatherData?.urgentAlerts?.length > 0 && (
          <Card className="border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Urgent Alerts on Your Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weatherData.urgentAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                          {getWeatherIcon(alert.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Until {new Date(alert.expiresAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    All Weather Alerts
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severity</SelectItem>
                        <SelectItem value="extreme">Extreme</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="rain">Rain</SelectItem>
                        <SelectItem value="snow">Snow</SelectItem>
                        <SelectItem value="wind">Wind</SelectItem>
                        <SelectItem value="storm">Storm</SelectItem>
                        <SelectItem value="fog">Fog</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_: any, i: number) => (
                      <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                  </div>
                ) : weatherData?.alerts?.length === 0 ? (
                  <div className="text-center py-12">
                    <Sun className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                    <p className="text-gray-500">Weather conditions are clear along your route</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {weatherData?.alerts?.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={`border-l-4 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              {getWeatherIcon(alert.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{alert.title}</h4>
                                {getSeverityBadge(alert.severity)}
                                {alert.onRoute && (
                                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                                    On Route
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {alert.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires: {new Date(alert.expiresAt).toLocaleString()}
                                </span>
                              </div>
                              {alert.recommendations && (
                                <div className="mt-3 p-2 bg-white/50 rounded">
                                  <p className="text-sm">
                                    <strong>Recommendations:</strong> {alert.recommendations}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Current Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 rounded-lg" />
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getWeatherIcon(weatherData?.currentConditions?.type || "clear")}
                        <span className="text-3xl font-bold">{weatherData?.currentConditions?.temperature || "--"}F</span>
                      </div>
                      <p className="text-gray-500 capitalize">{weatherData?.currentConditions?.description || "Loading..."}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Wind</p>
                        <p className="font-medium">{weatherData?.currentConditions?.windSpeed || "--"} mph</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Humidity</p>
                        <p className="font-medium">{weatherData?.currentConditions?.humidity || "--"}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Precipitation</p>
                        <p className="font-medium">{weatherData?.currentConditions?.precipitation || "0"}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">UV Index</p>
                        <p className="font-medium">{weatherData?.currentConditions?.uvIndex || "--"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_: any, i: number) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Extreme Weather</span>
                      <Switch defaultChecked={weatherData?.settings?.extremeAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Severe Weather</span>
                      <Switch defaultChecked={weatherData?.settings?.severeAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Moderate Weather</span>
                      <Switch defaultChecked={weatherData?.settings?.moderateAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Road Condition Updates</span>
                      <Switch defaultChecked={weatherData?.settings?.roadConditions} />
                    </div>
                    <Button variant="outline" className="w-full mt-2">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
