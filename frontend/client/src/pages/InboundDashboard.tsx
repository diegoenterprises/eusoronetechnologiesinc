import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Truck, MapPin, Clock, Shield, AlertTriangle, CheckCircle,
  RefreshCw, Eye, List, BarChart3, Fuel, Timer, Users,
  ChevronDown, Navigation, Loader2, Radio,
} from "lucide-react";

export default function InboundDashboard() {
  const [facilityId, setFacilityId] = useState<number>(0);
  const [view, setView] = useState<"list" | "forecast">("list");
  const [forecastHours, setForecastHours] = useState<"24" | "48" | "72">("24");

  const { data: myFacilities } = trpc.facilityIntelligence.listMyFacilities.useQuery();

  const activeFacilityId = facilityId || (myFacilities && myFacilities.length > 0 ? (myFacilities[0] as any).id : 0);

  const { data: approaching, isLoading: loadingTrucks, refetch: refetchTrucks } = trpc.facilityIntelligence.getApproachingTrucks.useQuery(
    { facilityId: activeFacilityId },
    { enabled: activeFacilityId > 0, refetchInterval: 30000 },
  );

  const { data: forecast } = trpc.facilityIntelligence.getDemandForecast.useQuery(
    { facilityId: activeFacilityId, hours: forecastHours },
    { enabled: activeFacilityId > 0 && view === "forecast" },
  );

  const activeFacility = myFacilities?.find((f: any) => f.id === activeFacilityId) as any;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-400" />
            Inbound Visibility
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeFacility ? activeFacility.facilityName : "Real-time approaching trucks"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Facility selector */}
          {myFacilities && myFacilities.length > 1 && (
            <select
              value={activeFacilityId}
              onChange={(e) => setFacilityId(parseInt(e.target.value))}
              className="bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/40"
            >
              {(myFacilities as any[]).map((f: any) => (
                <option key={f.id} value={f.id} className="bg-slate-900">{f.facilityName}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetchTrucks()}
            className="p-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">LIVE</span>
          <span className="text-[10px] text-slate-600">Updates every 30s</span>
        </div>
        <div className="flex gap-1 bg-white/[0.02] border border-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${view === "list" ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            <List className="w-3 h-3" /> Trucks
          </button>
          <button
            onClick={() => setView("forecast")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-colors ${view === "forecast" ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            <BarChart3 className="w-3 h-3" /> Forecast
          </button>
        </div>
      </div>

      {/* No facility selected */}
      {!activeFacilityId && (
        <div className="text-center py-20">
          <Radio className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No facility selected</p>
          <p className="text-xs text-slate-600 mt-1">Claim a facility in Facility Intelligence to enable inbound visibility</p>
        </div>
      )}

      {/* Approaching Trucks List */}
      {view === "list" && activeFacilityId > 0 && (
        <div>
          {loadingTrucks && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="ml-2 text-sm text-slate-400">Scanning inbound trucks...</span>
            </div>
          )}

          {approaching && approaching.length > 0 && (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-0.5">Inbound Trucks</p>
                  <p className="text-xl font-semibold text-white">{approaching.length}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-0.5">Next Arrival</p>
                  <p className="text-xl font-semibold text-blue-400">
                    {approaching[0]?.etaLabel || "---"}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-0.5">Compliance Clear</p>
                  <p className="text-xl font-semibold text-emerald-400">
                    {approaching.filter((t: any) => t.complianceStatus === "CLEAR").length}/{approaching.length}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-0.5">Closest</p>
                  <p className="text-xl font-semibold text-white">
                    {approaching[0]?.distanceMiles || 0} mi
                  </p>
                </div>
              </div>

              {/* Truck cards */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  <div className="col-span-1">ETA</div>
                  <div className="col-span-3">Driver / Carrier</div>
                  <div className="col-span-2">Product</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Compliance</div>
                  <div className="col-span-2">Distance</div>
                </div>

                {(approaching as any[]).map((truck: any, i: number) => (
                  <div
                    key={truck.loadId}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-xl border transition-colors ${
                      truck.distanceMiles <= 5
                        ? "bg-blue-500/5 border-blue-500/20"
                        : "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <span className={`text-sm font-semibold ${truck.distanceMiles <= 5 ? "text-blue-400" : "text-white"}`}>
                        {truck.etaLabel}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">Load #{truck.loadNumber}</p>
                        <p className="text-[10px] text-slate-500 truncate">Driver ID: {truck.driverId || "---"}</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="text-xs text-white">{truck.product || "---"}</p>
                        {truck.unNumber && <p className="text-[10px] text-slate-500">{truck.unNumber}</p>}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center text-xs text-white">
                      {truck.quantity}
                    </div>
                    <div className="col-span-2 flex items-center">
                      {truck.complianceStatus === "CLEAR" ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Clear
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> {truck.complianceStatus}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center text-xs text-slate-400">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" /> {truck.distanceMiles} mi
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {approaching && approaching.length === 0 && !loadingTrucks && (
            <div className="text-center py-16">
              <Truck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No inbound trucks detected</p>
              <p className="text-xs text-slate-600 mt-1">Trucks will appear here when they are en route to this facility</p>
            </div>
          )}
        </div>
      )}

      {/* Demand Forecast */}
      {view === "forecast" && activeFacilityId > 0 && (
        <div>
          <div className="flex gap-1 mb-4">
            {(["24", "48", "72"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setForecastHours(h)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${forecastHours === h ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.04] text-slate-500 border border-white/[0.04] hover:text-slate-300"}`}
              >
                {h}h
              </button>
            ))}
          </div>

          {forecast && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 mb-0.5">Total Volume ({forecastHours}h)</p>
                  <p className="text-2xl font-semibold text-white">{(forecast as any).totalVolume?.toLocaleString() || 0} gal</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                  <p className="text-[10px] text-slate-500 mb-0.5">Scheduled Loads</p>
                  <p className="text-2xl font-semibold text-white">{(forecast as any).loadCount || 0}</p>
                </div>
              </div>

              {/* By product */}
              {(forecast as any).byProduct?.length > 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                  <h3 className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">Volume by Product</h3>
                  <div className="space-y-3">
                    {((forecast as any).byProduct as any[]).map((p: any, i: number) => {
                      const maxVol = Math.max(...((forecast as any).byProduct as any[]).map((x: any) => x.volume));
                      const pct = maxVol > 0 ? (p.volume / maxVol) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white flex items-center gap-1.5">
                              <Fuel className="w-3 h-3 text-blue-400" /> {p.product}
                            </span>
                            <span className="text-slate-400">{p.volume.toLocaleString()} {p.volumeUnit} ({p.loadCount} loads)</span>
                          </div>
                          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1473FF] to-[#0A5FE0] rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No scheduled demand for next {forecastHours} hours</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
