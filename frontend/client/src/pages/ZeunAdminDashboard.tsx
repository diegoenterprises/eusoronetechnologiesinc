/**
 * ZEUN Admin Dashboard - Platform-wide breakdown and provider analytics
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Wrench, AlertTriangle, Truck, TrendingUp, DollarSign, Users,
  Clock, CheckCircle, RefreshCw, Search, Download, BarChart3,
  Activity, MapPin, Star, Building2, Phone, Globe, Database, Loader2
} from "lucide-react";

export default function ZeunAdminDashboard() {
  const [providerSearch, setProviderSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLocation, setSearchLocation] = useState({ lat: 30.2672, lng: -97.7431 }); // fallback only if geolocation denied
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect user's actual location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setSearchLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // keep fallback
        { timeout: 5000 }
      );
    }
  }, []);

  // Debounce search input (500ms)
  const handleSearchChange = useCallback((value: string) => {
    setProviderSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 500);
  }, []);

  const { data: fleetBreakdowns, isLoading: breakdownsLoading, refetch } = (trpc as any).zeunMechanics.getFleetBreakdowns.useQuery({
    status: "ALL",
    limit: 100,
  });

  // Default nearby providers (when no search query)
  const { data: providers, isLoading: providersLoading } = (trpc as any).zeunMechanics.findProviders.useQuery({
    latitude: searchLocation.lat,
    longitude: searchLocation.lng,
    radiusMiles: 100,
    maxResults: 20,
  }, { enabled: !debouncedSearch });

  // Text search providers (location name, mechanic name, etc.)
  const { data: searchResults, isLoading: searchLoading } = (trpc as any).zeunMechanics.searchProviders.useQuery({
    query: debouncedSearch,
    latitude: searchLocation.lat,
    longitude: searchLocation.lng,
    radiusMiles: 100,
    maxResults: 20,
  }, { enabled: !!debouncedSearch });

  const activeProviders = debouncedSearch ? (searchResults?.providers || []) : (providers || []);
  const isSearching = debouncedSearch ? searchLoading : providersLoading;

  const { data: costAnalytics, isLoading: costLoading } = (trpc as any).zeunMechanics.getFleetCostAnalytics.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const openBreakdowns = fleetBreakdowns?.filter((b: { status: string }) => !["RESOLVED", "CANCELLED"].includes(b.status)) || [];
  const criticalBreakdowns = fleetBreakdowns?.filter((b: { severity: string; status: string }) => b.severity === "CRITICAL" && !["RESOLVED", "CANCELLED"].includes(b.status)) || [];
  const resolvedBreakdowns = fleetBreakdowns?.filter((b: { status: string }) => b.status === "RESOLVED") || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "default";
      case "MEDIUM": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            ZEUN Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform-wide breakdown management and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Breakdowns</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{fleetBreakdowns?.length || 0}</p>
                )}
              </div>
              <Activity className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical [ALERT]</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-red-600">{criticalBreakdowns.length}</p>
                )}
              </div>
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Issues</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-orange-600">{openBreakdowns.length}</p>
                )}
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">{resolvedBreakdowns.length}</p>
                )}
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost (30d)</p>
                {costLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold">${costAnalytics?.totalCost?.toLocaleString() || 0}</p>
                )}
              </div>
              <DollarSign className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Breakdowns */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Breakdowns [ALERT]
            </CardTitle>
            <CardDescription>Requires immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {breakdownsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : criticalBreakdowns.length > 0 ? (
              <div className="space-y-3">
                {criticalBreakdowns.map((b: { id: number; issueCategory: string; driverName: string | null; status: string; createdAt: string | null; canDrive: boolean | null }) => (
                  <div key={b.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">#{b.id} - {b.issueCategory.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">{b.driverName || "Unknown Driver"}</p>
                      </div>
                      <Badge variant="destructive">{b.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : "N/A"}
                      </span>
                      {b.canDrive === false && (
                        <span className="text-red-600 font-medium">Cannot drive - needs tow</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">No critical breakdowns [OK]</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cost Distribution (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : costAnalytics?.byCategory && Object.keys(costAnalytics.byCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(costAnalytics.byCategory)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 6)
                  .map(([category, cost]) => {
                    const percentage = costAnalytics.totalCost ? ((cost as number) / costAnalytics.totalCost) * 100 : 0;
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{category.replace(/_/g, " ")}</span>
                          <span className="font-medium">${(cost as number).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">No cost data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider Network — ESANG AI Powered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Provider Network
            <Badge className="ml-2 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] px-2">ESANG AI</Badge>
          </CardTitle>
          <CardDescription>AI-powered repair provider discovery — powered by ESANG AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by city, state, or mechanic name (e.g. 'Houston', 'Loves Travel')..."
                value={providerSearch}
                onChange={(e: any) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {searchLoading && debouncedSearch && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            {searchResults?.searchLocation && debouncedSearch && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>Showing results near <strong>{searchResults.searchLocation.displayName.split(',').slice(0, 2).join(',')}</strong></span>
              </div>
            )}
          </div>

          {isSearching ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Activity className="h-4 w-4 animate-pulse text-blue-500" />
                <span>{debouncedSearch ? `Searching for "${debouncedSearch}"...` : "ESANG AI is discovering providers in your area..."}</span>
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activeProviders.length > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                {activeProviders.length} provider{activeProviders.length !== 1 ? "s" : ""} found
                {debouncedSearch ? ` for "${debouncedSearch}"` : " near your area"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeProviders
                  .slice(0, 20)
                  .map((provider: { id: number | null; name: string; type: string; chainName: string | null; distance: number; rating: number | null; phone: string | null; available24x7: boolean | null; services: string[] | null; aiGenerated?: boolean; source?: string; website?: string | null; address?: string | null; city?: string | null; state?: string | null }) => (
                    <div key={provider.id || provider.name} className="p-4 border rounded-lg hover:border-blue-500/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.type.replace(/_/g, " ")}</p>
                          {provider.chainName && (
                            <Badge variant="outline" className="mt-1">{provider.chainName}</Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {provider.available24x7 && (
                            <Badge variant="secondary">24/7</Badge>
                          )}
                          {provider.source === "openstreetmap" && (
                            <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600"><Globe className="h-3 w-3 mr-1" />OSM</Badge>
                          )}
                          {provider.source === "database" && (
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500"><Database className="h-3 w-3 mr-1" />DB</Badge>
                          )}
                          {provider.aiGenerated && !provider.source && (
                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500">AI</Badge>
                          )}
                        </div>
                      </div>
                      {(provider.address || provider.city) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {[provider.address, provider.city, provider.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {provider.distance} mi
                        </span>
                        {provider.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {provider.rating.toFixed(1)}
                          </span>
                        )}
                        {provider.phone && (
                          <a href={`tel:${provider.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-4 w-4" />
                            Call
                          </a>
                        )}
                        {provider.website && (
                          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                      {provider.services && provider.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.services.slice(0, 4).map((service: any) => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {provider.services.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{provider.services.length - 4} more</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                {debouncedSearch ? `No providers found for "${debouncedSearch}"` : "No providers found in this area"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {debouncedSearch ? "Try a different city, state, or shop name" : "ESANG AI will automatically discover providers when available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Breakdowns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recent Breakdowns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : fleetBreakdowns && fleetBreakdowns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Driver</th>
                    <th className="text-left py-2 px-2">Issue</th>
                    <th className="text-left py-2 px-2">Severity</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Cost</th>
                    <th className="text-left py-2 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetBreakdowns.slice(0, 15).map((b: any) => (
                    <tr key={b.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-mono">#{b.id}</td>
                      <td className="py-2 px-2">{b.driverName || "Unknown"}</td>
                      <td className="py-2 px-2">{b.issueCategory.replace(/_/g, " ")}</td>
                      <td className="py-2 px-2">
                        <Badge variant={getSeverityColor(b.severity)} className="text-xs">{b.severity}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-xs">{b.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-2 px-2">{b.actualCost ? `$${b.actualCost.toLocaleString()}` : "-"}</td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">No breakdowns recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
