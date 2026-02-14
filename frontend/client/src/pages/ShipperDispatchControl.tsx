/**
 * SHIPPER DISPATCH CONTROL — Full operational control for shipper loads
 * Theme-aware | Brand gradient
 *
 * Capabilities:
 * - View all active/assigned/in-transit loads
 * - Modify pickup location (origin)
 * - Modify delivery location (destination)
 * - Add/remove intermediate stops (multi-drop)
 * - Change pickup/delivery windows and times
 * - Update delivery instructions & dispatch notes
 * - Send change notifications to catalyst/driver
 * - Cancel or redirect loads
 * - View catalyst/driver assignment
 *
 * Uses loads.update tRPC mutation for all changes
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Truck, ArrowLeft, ChevronRight, Clock, Building2,
  Plus, Trash2, AlertTriangle, CheckCircle, Navigation,
  Send, Edit3, Package, RefreshCw, X, Search,
  Calendar, Phone, User, FileText, Zap, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import AddressAutocomplete, { type ParsedAddress } from "@/components/AddressAutocomplete";

interface Stop {
  id: string;
  type: "pickup" | "delivery" | "intermediate";
  address: string;
  city: string;
  state: string;
  time: string;
  instructions: string;
}

export default function ShipperDispatchControl() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Edit fields
  const [pickupAddr, setPickupAddr] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [delivAddr, setDelivAddr] = useState("");
  const [delivCity, setDelivCity] = useState("");
  const [delivState, setDelivState] = useState("");
  const [delivDate, setDelivDate] = useState("");
  const [delivTime, setDelivTime] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);

  // Fetch shipper's loads
  const loadsQuery = (trpc as any).loads?.list?.useQuery?.({ limit: 100 }) || { data: [], isLoading: false };
  const allLoads: any[] = loadsQuery.data || [];
  const activeLoads = allLoads.filter((l: any) => ["posted", "assigned", "in_transit", "picked_up"].includes(l.status));

  // Live tracking data (merged from Track Shipments)
  const trackingQuery = (trpc as any).loads?.getTrackedLoads?.useQuery?.({ search: undefined }, { refetchInterval: 15000 }) || { data: [], isLoading: false };
  const trackedLoads: any[] = trackingQuery.data || [];
  const inTransitCount = allLoads.filter((l: any) => l.status === "in_transit").length;

  // Selected load detail
  const detailQuery = (trpc as any).loads?.getById?.useQuery?.(
    { id: selectedLoadId! },
    { enabled: !!selectedLoadId }
  ) || { data: null, isLoading: false };
  const load = detailQuery.data;

  // Update mutation
  const updateMut = (trpc as any).loads?.update?.useMutation?.({
    onSuccess: () => {
      toast.success("Load updated — catalyst notified");
      setEditMode(false);
      detailQuery.refetch?.();
      loadsQuery.refetch?.();
    },
    onError: (e: any) => toast.error("Update failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  // Populate edit fields from load data
  const enterEditMode = () => {
    if (!load) return;
    setPickupAddr(load.origin?.address || load.pickupLocation?.address || "");
    setPickupCity(load.origin?.city || load.pickupLocation?.city || "");
    setPickupState(load.origin?.state || load.pickupLocation?.state || "");
    setPickupDate(load.pickupDate ? new Date(load.pickupDate).toISOString().split("T")[0] : "");
    setPickupTime(load.pickupDate ? new Date(load.pickupDate).toISOString().split("T")[1]?.slice(0, 5) || "" : "");
    setDelivAddr(load.destination?.address || load.deliveryLocation?.address || "");
    setDelivCity(load.destination?.city || load.deliveryLocation?.city || "");
    setDelivState(load.destination?.state || load.deliveryLocation?.state || "");
    setDelivDate(load.deliveryDate ? new Date(load.deliveryDate).toISOString().split("T")[0] : "");
    setDelivTime(load.deliveryDate ? new Date(load.deliveryDate).toISOString().split("T")[1]?.slice(0, 5) || "" : "");
    setDispatchNotes("");
    setStops([]);
    setEditMode(true);
  };

  const saveChanges = () => {
    if (!selectedLoadId) return;
    const data: any = {};
    if (pickupCity || pickupAddr) {
      data.pickupLocation = { address: pickupAddr, city: pickupCity, state: pickupState, zipCode: "", lat: 0, lng: 0 };
    }
    if (delivCity || delivAddr) {
      data.deliveryLocation = { address: delivAddr, city: delivCity, state: delivState, zipCode: "", lat: 0, lng: 0 };
    }
    if (pickupDate) data.pickupDate = pickupTime ? `${pickupDate}T${pickupTime}:00` : pickupDate;
    if (delivDate) data.deliveryDate = delivTime ? `${delivDate}T${delivTime}:00` : delivDate;
    if (stops.length > 0) data.stops = stops;
    if (dispatchNotes.trim()) data.dispatchNotes = dispatchNotes.trim();
    updateMut.mutate({ id: selectedLoadId, data });
  };

  const addStop = () => setStops([...stops, { id: `s-${Date.now()}`, type: "intermediate", address: "", city: "", state: "", time: "", instructions: "" }]);
  const updateStop = (id: string, field: keyof Stop, value: string) => setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeStop = (id: string) => setStops(stops.filter(s => s.id !== id));

  const filtered = activeLoads.filter((l: any) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return [l.loadNumber, l.origin?.city, l.destination?.city, l.pickupLocation?.city, l.deliveryLocation?.city, l.status]
      .some(v => v?.toLowerCase?.()?.includes?.(q));
  });

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const ic = cn("rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");
  const lb = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-600" : "text-slate-400");
  const tc = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");

  const statusColor = (s: string) => {
    switch (s) {
      case "posted": return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
      case "assigned": return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "in_transit": case "picked_up": return "bg-cyan-500/15 text-cyan-500 border-cyan-500/30";
      case "delivered": return "bg-green-500/15 text-green-500 border-green-500/30";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")} onClick={() => setLocation("/loads")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Dispatch Control</h1>
          <p className={mt}>Modify routes, stops, and coordinate with catalysts in real-time</p>
        </div>
        {inTransitCount > 0 && (
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/15 border-blue-500/30")}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className={cn("text-sm font-medium", isLight ? "text-blue-600" : "text-blue-400")}>In Transit</span>
            <span className={cn("font-bold", isLight ? "text-blue-700" : "text-blue-400")}>{inTransitCount}</span>
          </div>
        )}
        <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => { loadsQuery.refetch?.(); trackingQuery.refetch?.(); }}>
          <RefreshCw className="w-4 h-4 mr-1" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Load List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search loads..." className={cn("pl-10", ic)} />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loadsQuery.isLoading ? (
              [1, 2, 3].map(i => <div key={i} className={cn("h-20 rounded-xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />)
            ) : filtered.length === 0 ? (
              <div className={cn("p-8 text-center rounded-xl", cl)}>
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className={cn("text-sm font-medium", vl)}>No active loads</p>
                <p className="text-xs text-slate-400">Create a load to start dispatching</p>
              </div>
            ) : (
              filtered.map((l: any) => (
                <button key={l.id} onClick={() => { setSelectedLoadId(l.id); setEditMode(false); }}
                  className={cn("w-full p-3 rounded-xl border text-left transition-all",
                    selectedLoadId === l.id
                      ? "border-[#1473FF] bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 shadow-md"
                      : isLight ? "border-slate-200 bg-white hover:border-slate-300" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"
                  )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={cn("font-bold text-xs", vl)}>#{l.loadNumber}</p>
                    <Badge className={cn("border text-[10px]", statusColor(l.status))}>{l.status?.replace(/_/g, " ").toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{l.origin?.city || l.pickupLocation?.city || "Origin"}, {l.origin?.state || l.pickupLocation?.state || ""}</span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{l.destination?.city || l.deliveryLocation?.city || "Dest"}, {l.destination?.state || l.deliveryLocation?.state || ""}</span>
                  </div>
                  {l.rate && <p className="text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">${parseFloat(l.rate).toLocaleString()}</p>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Detail & Edit Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedLoadId ? (
            <Card className={cc}>
              <CardContent className="py-20 text-center">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className={cn("font-bold text-lg mb-1", vl)}>Select a load to manage</p>
                <p className={cn("text-sm", mt)}>Choose a load from the list to modify its route, stops, and dispatch instructions.</p>
              </CardContent>
            </Card>
          ) : detailQuery.isLoading ? (
            <div className={cn("h-64 rounded-2xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />
          ) : !load ? (
            <Card className={cc}><CardContent className="py-12 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><p className={vl}>Load not found</p></CardContent></Card>
          ) : (
            <>
              {/* Load Header */}
              <div className={cn("flex items-center justify-between p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 border-slate-700")}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={cn("font-bold", vl)}>#{load.loadNumber}</p>
                    <Badge className={cn("border text-[10px]", statusColor(load.status))}>{load.status?.replace(/_/g, " ").toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{load.commodity || load.cargoType || "General"} · {load.rate ? `$${parseFloat(load.rate).toLocaleString()}` : "No rate"}</p>
                </div>
                <div className="flex gap-2">
                  {!editMode ? (
                    <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs h-9" onClick={enterEditMode}>
                      <Edit3 className="w-3.5 h-3.5 mr-1" />Modify Route
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className={cn("rounded-xl text-xs h-9", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setEditMode(false)}>
                        <X className="w-3.5 h-3.5 mr-1" />Cancel
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs h-9" disabled={updateMut.isPending} onClick={saveChanges}>
                        {updateMut.isPending ? <><Clock className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</> : <><Send className="w-3.5 h-3.5 mr-1" />Save & Notify</>}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Current Route (view mode) */}
              {!editMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className={cc}>
                    <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-green-500" /></div>Pickup</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <p className={vl}>{load.origin?.address || load.pickupLocation?.city || "Not set"}{load.origin?.state ? `, ${load.origin.state}` : ""}</p>
                      {load.pickupDate && <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(load.pickupDate).toLocaleString()}</p>}
                    </CardContent>
                  </Card>
                  <Card className={cc}>
                    <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-red-500" /></div>Delivery</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <p className={vl}>{load.destination?.address || load.deliveryLocation?.city || "Not set"}{load.destination?.state ? `, ${load.destination.state}` : ""}</p>
                      {load.deliveryDate && <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(load.deliveryDate).toLocaleString()}</p>}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Catalyst/Driver info */}
              {!editMode && (load.catalystName || load.driverName) && (
                <Card className={cc}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center"><Truck className="w-5 h-5 text-blue-500" /></div>
                      <div className="flex-1">
                        {load.catalystName && <p className={cn("font-bold text-sm", vl)}>{load.catalystName} {load.catalystCompanyName ? `· ${load.catalystCompanyName}` : ""}</p>}
                        {load.driverName && <p className="text-xs text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{load.driverName}{load.driverPhone ? <span className="flex items-center gap-1 ml-2"><Phone className="w-3 h-3" />{load.driverPhone}</span> : null}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Shipment Tracking (merged from Track Shipments) ── */}
              {!editMode && (() => {
                const tracked = trackedLoads.find((t: any) => t.id === load.id || t.loadNumber === load.loadNumber);
                const isLive = ["in_transit", "picked_up", "en_route_pickup"].includes(load.status);
                return (
                  <Card className={cc}>
                    <CardHeader className="pb-2">
                      <CardTitle className={cn("flex items-center gap-2 text-sm", tc)}>
                        <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center"><Navigation className="w-3.5 h-3.5 text-blue-500" /></div>
                        Shipment Tracking
                        {isLive && (
                          <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-xs text-blue-400 font-medium">Live</span>
                          </div>
                        )}
                        {!isLive && (
                          <Badge className={cn("ml-auto border text-[10px]", statusColor(load.status))}>{load.status === "posted" ? "Awaiting Catalyst" : load.status?.replace(/_/g, " ").toUpperCase()}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Route Visualization */}
                      <div className={cl}>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#1473FF] to-[#BE01FF]" />
                            <div className={cn("w-0.5 h-8", isLight ? "bg-slate-200" : "bg-slate-600")} />
                            {tracked?.currentLocation && (
                              <>
                                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                <div className={cn("w-0.5 h-8", isLight ? "bg-slate-200" : "bg-slate-600")} />
                              </>
                            )}
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#BE01FF] to-[#1473FF]" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={vl}>{load.origin?.city || load.pickupLocation?.city}{load.origin?.state ? `, ${load.origin.state}` : ""}</p>
                                <p className="text-xs text-slate-400">{load.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : "Pickup"}</p>
                              </div>
                              {["in_transit", "picked_up", "delivered", "assigned"].includes(load.status) && <CheckCircle className="w-4 h-4 text-green-400" />}
                            </div>
                            {tracked?.currentLocation && (
                              <div>
                                <p className="text-cyan-400 text-sm font-medium">Current: {tracked.currentLocation.city}{tracked.currentLocation.state ? `, ${tracked.currentLocation.state}` : ""}</p>
                                {tracked.lastUpdate && <p className="text-xs text-slate-400">Updated: {tracked.lastUpdate}</p>}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={vl}>{load.destination?.city || load.deliveryLocation?.city}{load.destination?.state ? `, ${load.destination.state}` : ""}</p>
                                <p className="text-xs text-slate-400">{load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : "Delivery"}</p>
                              </div>
                              {load.status === "delivered" && <CheckCircle className="w-4 h-4 text-green-400" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {tracked?.progress !== undefined ? (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className={mt}>Progress</span>
                            <span className={cn("font-bold", vl)}>{tracked.progress}%</span>
                          </div>
                          <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all rounded-full" style={{ width: `${tracked.progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className={mt}>Progress</span>
                            <span className={cn("text-xs font-medium", mt)}>{load.status === "posted" ? "Waiting for catalyst assignment" : "Tracking will start when load is picked up"}</span>
                          </div>
                          <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
                            <div className="h-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 rounded-full" style={{ width: "0%" }} />
                          </div>
                        </div>
                      )}

                      {/* ETA */}
                      {tracked?.eta && (
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-medium", mt)}>Estimated Arrival</span>
                          <span className={cn("text-sm font-bold", vl)}>{tracked.eta}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Special Instructions */}
              {!editMode && load.notes && (
                <Card className={cc}>
                  <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><FileText className="w-4 h-4 text-blue-500" />Instructions & Notes</CardTitle></CardHeader>
                  <CardContent><pre className={cn("text-xs whitespace-pre-wrap leading-relaxed p-3 rounded-xl font-mono max-h-[200px] overflow-y-auto", cl)}>{load.notes}</pre></CardContent>
                </Card>
              )}

              {/* ── EDIT MODE ── */}
              {editMode && (
                <div className="space-y-4">
                  {/* Pickup */}
                  <Card className={cc}>
                    <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-green-500" /></div>Pickup Location</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div><label className={lb}>Address</label><AddressAutocomplete value={pickupAddr} onChange={setPickupAddr} onSelect={(p: ParsedAddress) => { setPickupAddr(p.address); setPickupCity(p.city); setPickupState(p.state); }} placeholder="Search pickup address..." className={ic} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={lb}>City</label><Input value={pickupCity} onChange={(e: any) => setPickupCity(e.target.value)} placeholder="City" className={ic} /></div>
                        <div><label className={lb}>State</label><Input value={pickupState} onChange={(e: any) => setPickupState(e.target.value)} placeholder="ST" className={ic} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={lb}>Date</label><Input type="date" value={pickupDate} onChange={(e: any) => setPickupDate(e.target.value)} className={ic} /></div>
                          <div><label className={lb}>Time</label><Input type="time" value={pickupTime} onChange={(e: any) => setPickupTime(e.target.value)} className={ic} /></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intermediate Stops */}
                  {stops.length > 0 && stops.map((s, idx) => (
                    <Card key={s.id} className={cc}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className={cn("flex items-center gap-2 text-sm", tc)}>
                            <div className="w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-purple-500">{idx + 1}</div>
                            Stop
                          </CardTitle>
                          <Button size="sm" variant="ghost" onClick={() => removeStop(s.id)} className="h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          <div><label className={lb}>Address</label><Input value={s.address} onChange={(e: any) => updateStop(s.id, "address", e.target.value)} placeholder="Address" className={ic} /></div>
                          <div><label className={lb}>City</label><Input value={s.city} onChange={(e: any) => updateStop(s.id, "city", e.target.value)} placeholder="City" className={ic} /></div>
                          <div><label className={lb}>State</label><Input value={s.state} onChange={(e: any) => updateStop(s.id, "state", e.target.value)} placeholder="ST" className={ic} /></div>
                          <div><label className={lb}>Time</label><Input type="time" value={s.time} onChange={(e: any) => updateStop(s.id, "time", e.target.value)} className={ic} /></div>
                        </div>
                        <div><label className={lb}>Instructions</label><Input value={s.instructions} onChange={(e: any) => updateStop(s.id, "instructions", e.target.value)} placeholder="Stop-specific instructions" className={ic} /></div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" onClick={addStop} className={cn("w-full rounded-xl", isLight ? "border-slate-200" : "border-slate-700")}>
                    <Plus className="w-4 h-4 mr-2" />Add Intermediate Stop
                  </Button>

                  {/* Delivery */}
                  <Card className={cc}>
                    <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-red-500" /></div>Delivery Location</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div><label className={lb}>Address</label><AddressAutocomplete value={delivAddr} onChange={setDelivAddr} onSelect={(p: ParsedAddress) => { setDelivAddr(p.address); setDelivCity(p.city); setDelivState(p.state); }} placeholder="Search delivery address..." className={ic} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={lb}>City</label><Input value={delivCity} onChange={(e: any) => setDelivCity(e.target.value)} placeholder="City" className={ic} /></div>
                        <div><label className={lb}>State</label><Input value={delivState} onChange={(e: any) => setDelivState(e.target.value)} placeholder="ST" className={ic} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={lb}>Date</label><Input type="date" value={delivDate} onChange={(e: any) => setDelivDate(e.target.value)} className={ic} /></div>
                          <div><label className={lb}>Time</label><Input type="time" value={delivTime} onChange={(e: any) => setDelivTime(e.target.value)} className={ic} /></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dispatch Notes */}
                  <Card className={cc}>
                    <CardHeader className="pb-2"><CardTitle className={cn("flex items-center gap-2 text-sm", tc)}><Send className="w-4 h-4 text-blue-500" />Dispatch Notes to Catalyst</CardTitle></CardHeader>
                    <CardContent>
                      <textarea value={dispatchNotes} onChange={e => setDispatchNotes(e.target.value)} rows={3} placeholder="Message to catalyst/driver about this change (e.g. 'New delivery location per customer request — GPS coords updated')" className={cn("w-full p-3 text-sm", ic)} />
                      <p className="text-[10px] text-slate-400 mt-1.5">This note will be appended to load instructions and timestamped for audit trail.</p>
                    </CardContent>
                  </Card>

                  {/* Save bar */}
                  <div className={cn("p-4 rounded-xl border flex items-center justify-between", isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/5 border-yellow-500/30")}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <p className={cn("text-xs font-medium", vl)}>Changes will be sent to the assigned catalyst immediately.</p>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-xs h-9" disabled={updateMut.isPending} onClick={saveChanges}>
                      {updateMut.isPending ? <><Clock className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</> : <><Zap className="w-3.5 h-3.5 mr-1" />Save & Dispatch</>}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
