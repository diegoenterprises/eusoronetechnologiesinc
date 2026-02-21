/**
 * ZEUN MECHANICS™ PROVIDER NETWORK
 * AI-powered repair provider discovery — find the right shop, instantly.
 * Theme-aware | Brand gradient | Premium UX | ESANG AI powered.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  MapPin, Phone, Star, Clock, Wrench, Navigation, Search,
  Building2, Truck, Zap, RefreshCw, ChevronRight, Shield,
  Filter, Activity, ExternalLink, Globe, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const PROVIDER_TYPES = [
  { value: "", label: "All Types", icon: Building2 },
  { value: "TRUCK_STOP", label: "Truck Stop", icon: Truck },
  { value: "DEALER", label: "Dealer", icon: Shield },
  { value: "INDEPENDENT", label: "Independent", icon: Wrench },
  { value: "MOBILE", label: "Mobile Repair", icon: Navigation },
  { value: "TOWING", label: "Towing", icon: Truck },
  { value: "TIRE_SHOP", label: "Tire Shop", icon: Activity },
] as const;

const RADIUS_OPTIONS = [25, 50, 100, 150, 200];

export default function ZeunProviderNetwork() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [providerType, setProviderType] = useState("");
  const [radius, setRadius] = useState(100);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationName, setLocationName] = useState("Detecting location...");

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 500);
  }, []);

  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName(`${pos.coords.latitude.toFixed(2)}°N, ${Math.abs(pos.coords.longitude).toFixed(2)}°W`);
          setLocating(false);
        },
        () => {
          // Fallback to Austin, TX if geolocation denied
          setCoords({ lat: 30.2672, lng: -97.7431 });
          setLocationName("Austin, TX (location unavailable)");
          setLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setCoords({ lat: 30.2672, lng: -97.7431 });
      setLocationName("Austin, TX (location unavailable)");
      setLocating(false);
    }
  };

  // Default: nearby geo-based search
  const { data: providers, isLoading, refetch } = (trpc as any).zeunMechanics.findProviders.useQuery(
    {
      latitude: coords?.lat || 30.2672,
      longitude: coords?.lng || -97.7431,
      radiusMiles: radius,
      providerType: providerType || undefined,
      maxResults: 20,
    },
    { enabled: !!coords && !debouncedSearch }
  );

  // Text search: location name, mechanic name, city, etc.
  const { data: searchResults, isLoading: searchLoading } = (trpc as any).zeunMechanics.searchProviders.useQuery(
    {
      query: debouncedSearch,
      latitude: coords?.lat || 30.2672,
      longitude: coords?.lng || -97.7431,
      radiusMiles: radius,
      maxResults: 20,
    },
    { enabled: !!debouncedSearch }
  );

  const activeProviders = debouncedSearch ? (searchResults?.providers || []) : (providers || []);
  const activeLoading = debouncedSearch ? searchLoading : isLoading;

  const filteredProviders = activeProviders.filter((p: any) =>
    !providerType || p.type === providerType || p.providerType === providerType
  );

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Provider Network</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">ESANG AI</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>AI-powered repair provider discovery across the continental US</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { detectLocation(); setTimeout(() => refetch(), 500); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* ── Location & Filters ── */}
      <Card className={cc}>
        <CardContent className="p-4 space-y-4">
          {/* Location bar */}
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", L ? "bg-blue-50" : "bg-blue-500/10")}>
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium uppercase tracking-wider", L ? "text-slate-400" : "text-slate-500")}>Your Location</p>
              <p className={cn("font-semibold text-sm truncate", L ? "text-slate-800" : "text-white")}>
                {locating ? "Detecting..." : locationName}
              </p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={detectLocation} disabled={locating}>
              <Navigation className="h-3 w-3 mr-1" />{locating ? "..." : "Relocate"}
            </Button>
          </div>

          {/* Search + Radius */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchText}
                onChange={(e: any) => handleSearchChange(e.target.value)}
                placeholder="Search by city, state, or mechanic name (e.g. 'Houston', 'Loves Travel')..."
                className={cn("pl-10 rounded-xl", L ? "" : "bg-white/[0.02] border-white/[0.06]")}
              />
              {searchLoading && debouncedSearch && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {RADIUS_OPTIONS.map((r) => (
                <button key={r} onClick={() => setRadius(r)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                    radius === r
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent"
                      : L ? "border-slate-200 text-slate-500 hover:border-blue-300" : "border-slate-700 text-slate-400 hover:border-blue-500/50"
                  )}>{r} mi</button>
              ))}
            </div>
          </div>

          {/* Geocoded location indicator */}
          {searchResults?.searchLocation && debouncedSearch && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className={cn("h-3 w-3", L ? "text-green-600" : "text-green-400")} />
              <span className={L ? "text-slate-500" : "text-slate-400"}>Showing results near <strong>{searchResults.searchLocation.displayName.split(',').slice(0, 2).join(',')}</strong></span>
            </div>
          )}

          {/* Provider type pills */}
          <div className="flex flex-wrap gap-2">
            {PROVIDER_TYPES.map((pt) => {
              const Icon = pt.icon;
              const sel = providerType === pt.value;
              return (
                <button key={pt.value} onClick={() => setProviderType(pt.value)}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                    sel
                      ? (L ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-blue-500/10 border-blue-500/30 text-blue-400")
                      : (L ? "border-slate-200 text-slate-500 hover:border-slate-300" : "border-white/[0.06] text-slate-400 hover:border-slate-600")
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  {pt.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Results Count ── */}
      {!activeLoading && (activeProviders.length > 0 || debouncedSearch) && (
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium", L ? "text-slate-600" : "text-slate-400")}>
            <span className="font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{filteredProviders.length}</span>
            {" "}provider{filteredProviders.length !== 1 ? "s" : ""} found
            {debouncedSearch ? ` for "${debouncedSearch}"` : ` within ${radius} mi`}
          </p>
          {filteredProviders.some((p: any) => p.aiGenerated || p.source === "openstreetmap") && (
            <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] border-0">
              <Zap className="w-3 h-3 mr-1" />{filteredProviders.some((p: any) => p.source === "openstreetmap") ? "Live Discovery" : "AI-Discovered"}
            </Badge>
          )}
        </div>
      )}

      {/* ── Provider Cards ── */}
      {activeLoading ? (
        <div className="space-y-3">
          <div className={cn("flex items-center gap-2 text-sm mb-1", L ? "text-slate-500" : "text-slate-400")}>
            <Activity className="h-4 w-4 animate-pulse text-blue-500" />
            <span>{debouncedSearch ? `Searching for "${debouncedSearch}"...` : "ESANG AI is discovering providers in your area..."}</span>
          </div>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProviders.map((provider: any, idx: number) => {
            const isTop = idx === 0;
            return (
              <Card key={provider.id || idx} className={cn(cc, isTop && "ring-1 ring-blue-500/30")}>
                <CardContent className="p-5">
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isTop && <Badge className="border-0 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[9px] font-bold px-2 py-0.5">TOP PICK</Badge>}
                        {provider.source === "openstreetmap" && <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-600 px-1.5 py-0.5"><Globe className="w-2.5 h-2.5 mr-0.5" />OSM</Badge>}
                      {provider.aiGenerated && !provider.source && <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-500 px-1.5 py-0.5">AI</Badge>}
                      </div>
                      <h3 className={cn("font-bold text-base mt-1 truncate", L ? "text-slate-800" : "text-white")}>{provider.name}</h3>
                      <p className={cn("text-xs mt-0.5", L ? "text-slate-500" : "text-slate-400")}>
                        {(provider.type || provider.providerType || "").replace(/_/g, " ")}
                        {provider.chainName && <> · <span className="font-medium">{provider.chainName}</span></>}
                      </p>
                    </div>

                    {/* Rating */}
                    {provider.rating && (
                      <div className={cn("flex flex-col items-center px-3 py-2 rounded-xl", L ? "bg-yellow-50" : "bg-yellow-500/10")}>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className={cn("text-lg font-bold", L ? "text-slate-800" : "text-white")}>{Number(provider.rating).toFixed(1)}</span>
                        </div>
                        {provider.reviewCount > 0 && <p className="text-[10px] text-slate-400">{provider.reviewCount} reviews</p>}
                      </div>
                    )}
                  </div>

                  {/* Info pills */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg", L ? "bg-slate-100 text-slate-600" : "bg-white/[0.04] text-slate-300")}>
                      <MapPin className="h-3 w-3" />{provider.distance} mi
                    </span>
                    {provider.available24x7 && (
                      <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg", L ? "bg-green-50 text-green-700" : "bg-green-500/10 text-green-400")}>
                        <Clock className="h-3 w-3" />24/7
                      </span>
                    )}
                    {provider.hasMobileService && (
                      <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg", L ? "bg-blue-50 text-blue-700" : "bg-blue-500/10 text-blue-400")}>
                        <Navigation className="h-3 w-3" />Mobile
                      </span>
                    )}
                    {provider.city && provider.state && (
                      <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{provider.city}, {provider.state}</span>
                    )}
                  </div>

                  {/* Services */}
                  {provider.services && provider.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {provider.services.slice(0, 5).map((svc: string) => (
                        <Badge key={svc} variant="outline" className={cn("text-[10px] font-medium rounded-lg", L ? "border-slate-200 text-slate-500" : "border-slate-700 text-slate-400")}>
                          {svc.replace(/_/g, " ")}
                        </Badge>
                      ))}
                      {provider.services.length > 5 && (
                        <Badge variant="outline" className={cn("text-[10px] rounded-lg", L ? "border-slate-200 text-slate-400" : "border-slate-700 text-slate-500")}>
                          +{provider.services.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {provider.phone && (
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl text-xs" asChild>
                        <a href={`tel:${provider.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" />Call</a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className={cn("flex-1 rounded-xl text-xs", L ? "" : "border-slate-700")}
                      onClick={() => {
                        const q = provider.address ? `${provider.address}, ${provider.city || ""} ${provider.state || ""}` : `${provider.name}`;
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, "_blank");
                      }}>
                      <Navigation className="h-3.5 w-3.5 mr-1.5" />Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className={cc}>
          <CardContent className="py-12 text-center">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", L ? "bg-slate-100" : "bg-white/[0.04]")}>
              <Building2 className={cn("w-8 h-8", L ? "text-slate-400" : "text-slate-500")} />
            </div>
            <p className={cn("font-semibold", L ? "text-slate-700" : "text-slate-300")}>No providers found</p>
            <p className={cn("text-sm mt-1", L ? "text-slate-400" : "text-slate-500")}>
              Try increasing the search radius or changing the provider type filter
            </p>
            <Button size="sm" variant="outline" className="rounded-xl mt-4" onClick={() => { setRadius(200); setProviderType(""); }}>
              Expand Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Network Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Building2, label: "Provider Network", value: "10,000+", sub: "Nationwide coverage", color: "blue" },
          { icon: Star, label: "Avg. Rating", value: "4.7", sub: "Verified reviews", color: "yellow" },
          { icon: Clock, label: "Emergency Support", value: "24/7", sub: "Always available", color: "green" },
        ].map((stat) => {
          const colors: Record<string, string> = {
            blue: L ? "bg-blue-50 text-blue-500" : "bg-blue-500/10 text-blue-400",
            yellow: L ? "bg-yellow-50 text-yellow-500" : "bg-yellow-500/10 text-yellow-400",
            green: L ? "bg-green-50 text-green-500" : "bg-green-500/10 text-green-400",
          };
          return (
            <Card key={stat.label} className={cc}>
              <CardContent className="p-4 text-center">
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", colors[stat.color])}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className={cn("text-2xl font-bold", L ? "text-slate-800" : "text-white")}>{stat.value}</p>
                <p className={cn("text-[10px] font-medium uppercase tracking-wider mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Hotline CTA ── */}
      <Card className={cn("rounded-2xl border overflow-hidden", L ? "border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50" : "border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5")}>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>24/7 Emergency Hotline</p>
            <p className={cn("text-xs mt-0.5", L ? "text-slate-500" : "text-slate-400")}>Need help now? Our dispatch team is always standing by.</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" asChild>
            <a href="tel:18449386435">1-844-ZEUN-HELP</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

