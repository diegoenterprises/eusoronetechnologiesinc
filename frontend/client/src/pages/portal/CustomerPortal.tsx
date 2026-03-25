import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Package, MapPin, Settings, RefreshCw, ChevronDown, ChevronUp,
  Truck, Clock, CheckCircle, AlertTriangle, Navigation,
  Download, ExternalLink, Shield, Eye,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  SCHEDULED: { color: "text-blue-400", bg: "bg-blue-500/20", label: "Scheduled" },
  PICKED_UP: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Picked Up" },
  IN_TRANSIT: { color: "text-orange-400", bg: "bg-orange-500/20", label: "In Transit" },
  DELIVERED: { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Delivered" },
  DELAYED: { color: "text-red-400", bg: "bg-red-500/20", label: "Delayed" },
  pending: { color: "text-blue-400", bg: "bg-blue-500/20", label: "Pending" },
  assigned: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Assigned" },
  in_transit: { color: "text-orange-400", bg: "bg-orange-500/20", label: "In Transit" },
  delivered: { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Delivered" },
  completed: { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Completed" },
};

export default function CustomerPortal() {
  const [tab, setTab] = useState<"loads" | "map" | "settings">("loads");
  const [expandedLoad, setExpandedLoad] = useState<number | null>(null);

  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("token") || "";

  const validateQuery = (trpc as any).customerPortal.validatePortalToken.useQuery(
    { accessToken },
    { enabled: !!accessToken, retry: false }
  );

  const loadsQuery = (trpc as any).customerPortal.portalGetLoads.useQuery(
    { accessToken },
    { enabled: !!accessToken && validateQuery.data?.valid, refetchInterval: 30000 }
  );

  const mapQuery = (trpc as any).customerPortal.portalGetMap.useQuery(
    { accessToken },
    { enabled: !!accessToken && validateQuery.data?.valid && tab === "map", refetchInterval: 30000 }
  );

  const portalLoads: any[] = loadsQuery.data?.loads || [];
  const customerName = loadsQuery.data?.customerName || validateQuery.data?.customerName || "Customer";
  const positions: any[] = mapQuery.data?.positions || [];

  // Detail query for expanded load
  const detailQuery = (trpc as any).customerPortal.portalGetLoadDetail.useQuery(
    { accessToken, loadId: expandedLoad! },
    { enabled: !!expandedLoad && !!accessToken }
  );

  const handleExport = () => {
    const headers = ["Load #", "Pickup", "Delivery", "Cargo", "Status", "Pickup Date", "Delivery Date"];
    const csvLines = [headers.join(",")];
    for (const l of portalLoads) {
      csvLines.push([l.loadNumber, `"${l.pickupLocation || ""}"`, `"${l.deliveryLocation || ""}"`, l.cargoType || "", l.status || "", l.pickupDate || "", l.deliveryDate || ""].join(","));
    }
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "portal_loads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Invalid / no token state
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-white/[0.08] p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Access Token Required</h2>
          <p className="text-sm text-slate-400">Please use the portal link provided by your carrier to access load tracking.</p>
        </Card>
      </div>
    );
  }

  if (validateQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!validateQuery.data?.valid) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900 border-white/[0.08] p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400">This portal link is invalid or expired. Contact your carrier for a new link.</p>
        </Card>
      </div>
    );
  }

  const statusOf = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG["pending"];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold">Load Tracking Portal</h1>
              <p className="text-xs text-slate-400">Welcome, {customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["loads", "map", "settings"] as const).map(t => (
              <Button key={t} variant="ghost" size="sm"
                className={cn("h-8 px-3 text-xs capitalize", tab === t ? "bg-blue-600/20 text-blue-400" : "text-slate-400")}
                onClick={() => setTab(t)}>
                {t === "loads" && <Package className="w-3.5 h-3.5 mr-1" />}
                {t === "map" && <MapPin className="w-3.5 h-3.5 mr-1" />}
                {t === "settings" && <Settings className="w-3.5 h-3.5 mr-1" />}
                {t}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Tab: Loads */}
        {tab === "loads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{portalLoads.length} Load{portalLoads.length !== 1 ? "s" : ""}</h2>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400" onClick={() => loadsQuery.refetch()}>
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1", loadsQuery.isFetching && "animate-spin")} />Refresh
              </Button>
            </div>

            {loadsQuery.isLoading ? (
              <div className="text-center py-12 text-slate-500">Loading loads...</div>
            ) : portalLoads.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />No loads linked to your portal
              </div>
            ) : (
              /* Desktop table */
              <div className="hidden md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06]">
                      <th className="px-3 py-2 text-left">Load #</th>
                      <th className="px-3 py-2 text-left">Pickup</th>
                      <th className="px-3 py-2 text-left">Delivery</th>
                      <th className="px-3 py-2 text-left">Cargo</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Pickup Date</th>
                      <th className="px-3 py-2 text-left">Delivery Date</th>
                      <th className="px-3 py-2 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalLoads.map((l: any) => {
                      const st = statusOf(l.status);
                      const isExpanded = expandedLoad === l.loadId;
                      return (
                        <>
                          <tr key={l.loadId} className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandedLoad(isExpanded ? null : l.loadId)}>
                            <td className="px-3 py-2 font-mono font-medium text-white">{l.loadNumber || `#${l.loadId}`}</td>
                            <td className="px-3 py-2 text-slate-300">{l.pickupLocation || "—"}</td>
                            <td className="px-3 py-2 text-slate-300">{l.deliveryLocation || "—"}</td>
                            <td className="px-3 py-2">{l.cargoType ? <Badge className="bg-amber-500/10 text-amber-400 border-0 text-xs">{l.cargoType}</Badge> : "—"}</td>
                            <td className="px-3 py-2"><Badge className={cn(st.bg, st.color, "border-0 text-xs")}>{st.label}</Badge></td>
                            <td className="px-3 py-2 text-slate-300">{l.pickupDate || "—"}</td>
                            <td className="px-3 py-2 text-slate-300">{l.deliveryDate || "—"}</td>
                            <td className="px-3 py-2 text-center">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 inline" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 inline" />}
                            </td>
                          </tr>
                          {isExpanded && detailQuery.data && (
                            <tr key={`${l.loadId}-detail`}>
                              <td colSpan={8} className="px-4 py-3 bg-white/[0.02]">
                                <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                                  <div><span className="text-slate-500">Weight:</span> <span className="text-white">{detailQuery.data.weight || "—"}</span></div>
                                  <div><span className="text-slate-500">Distance:</span> <span className="text-white">{detailQuery.data.distance || "—"} mi</span></div>
                                  <div><span className="text-slate-500">Special:</span> <span className="text-white">{detailQuery.data.specialInstructions || "None"}</span></div>
                                </div>
                                {detailQuery.data.timeline?.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="text-xs text-slate-500 uppercase font-semibold">Timeline</div>
                                    {detailQuery.data.timeline.map((t: any, i: number) => (
                                      <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <span className="text-slate-400 w-32">{t.timestamp ? new Date(t.timestamp).toLocaleString() : ""}</span>
                                        <span className="text-white">{t.event || t.status}</span>
                                        {t.location && <span className="text-slate-500">— {t.location}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(!detailQuery.data.timeline || detailQuery.data.timeline.length === 0) && (
                                  <div className="text-xs text-slate-500">No timeline events yet</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {portalLoads.map((l: any) => {
                const st = statusOf(l.status);
                return (
                  <Card key={l.loadId} className="bg-white/[0.02] border-white/[0.06] p-3 space-y-2" onClick={() => setExpandedLoad(expandedLoad === l.loadId ? null : l.loadId)}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-sm text-white">{l.loadNumber || `#${l.loadId}`}</span>
                      <Badge className={cn(st.bg, st.color, "border-0 text-xs")}>{st.label}</Badge>
                    </div>
                    <div className="text-xs text-slate-300">{l.pickupLocation} → {l.deliveryLocation}</div>
                    <div className="text-xs text-slate-500">{l.cargoType} · {l.pickupDate}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Map */}
        {tab === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Live Map (2-min delay)</h2>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400" onClick={() => mapQuery.refetch()}>
                <RefreshCw className={cn("w-3.5 h-3.5 mr-1", mapQuery.isFetching && "animate-spin")} />Refresh
              </Button>
            </div>
            {positions.length === 0 ? (
              <Card className="bg-white/[0.02] border-white/[0.06] p-12 text-center">
                <Navigation className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-500">No GPS positions available for your loads</p>
                <p className="text-xs text-slate-600 mt-1">Positions appear when loads are in transit</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {positions.map((p: any, i: number) => {
                  const st = statusOf(p.status);
                  return (
                    <Card key={i} className="bg-white/[0.02] border-white/[0.06] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-white">Load #{p.loadId}</span>
                        <Badge className={cn(st.bg, st.color, "border-0 text-xs")}>{st.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-500">Lat:</span> <span className="text-white">{Number(p.latitude).toFixed(4)}</span></div>
                        <div><span className="text-slate-500">Lng:</span> <span className="text-white">{Number(p.longitude).toFixed(4)}</span></div>
                        <div><span className="text-slate-500">Speed:</span> <span className="text-white">{p.speed || 0} mph</span></div>
                        <div><span className="text-slate-500">Heading:</span> <span className="text-white">{p.heading || 0}°</span></div>
                      </div>
                      <div className="text-xs text-slate-500">Last update: {p.lastUpdate ? new Date(p.lastUpdate).toLocaleString() : "—"}</div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Settings */}
        {tab === "settings" && (
          <div className="max-w-md space-y-4">
            <Card className="bg-white/[0.02] border-white/[0.06] p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" />Portal Access</h3>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="text-white">{customerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Permissions:</span><span className="text-slate-300">Loads, Map, Timeline (read-only)</span></div>
              </div>
            </Card>
            <Card className="bg-white/[0.02] border-white/[0.06] p-4 space-y-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <p className="text-xs text-slate-400">Contact your carrier support team to modify notification preferences.</p>
            </Card>
            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1" />Export Load Data (CSV)
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 border-t border-white/[0.06] px-6 py-2 text-center text-xs text-slate-500 backdrop-blur">
        Powered by EusoTrip · GPS data delayed 2 minutes for operational security
      </div>
    </div>
  );
}
