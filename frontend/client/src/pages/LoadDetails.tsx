/**
 * LOAD DETAILS PAGE
 * 100% Dynamic - No mock data
 * Theme-aware | Brand gradient | Carrier Place Bid CTA | Shipper design standard
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, Calendar, ArrowLeft,
  Phone, Navigation, Clock, User, AlertTriangle, CheckCircle, Shield,
  Building2, Gavel, Droplets, FlaskConical, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";
import { useAuth } from "@/_core/hooks/useAuth";

const SPECTRA_CARGO_TYPES = ["hazmat", "liquid", "gas", "chemicals", "petroleum"];
const SPECTRA_KEYWORDS = ["crude", "oil", "petroleum", "condensate", "bitumen", "naphtha", "diesel", "gasoline", "kerosene", "fuel", "lpg", "propane", "butane", "ethanol", "methanol"];
function isSpectraQualified(cargoType?: string, commodity?: string, hazmatClass?: string): boolean {
  // Primary check: cargoType from DB must be a qualifying type
  if (cargoType && SPECTRA_CARGO_TYPES.includes(cargoType)) return true;
  // Secondary: hazmat class 2 (gases) or 3 (flammable liquids)
  if (["2", "3"].includes(hazmatClass || "")) return true;
  // Tertiary: commodity keyword match (only if cargoType isn't explicitly non-qualifying)
  if (cargoType && ["refrigerated", "oversized", "general"].includes(cargoType)) return false;
  const c = (commodity || "").toLowerCase();
  if (SPECTRA_KEYWORDS.some(k => c.includes(k))) return true;
  return false;
}

export default function LoadDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const loadId = (params.loadId || params.id) as string;

  const { user: authUser } = useAuth();
  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId });
  const load = loadQuery.data;
  // Hide Place Bid if current user is the load owner (shipper)
  const isLoadOwner = load?.shipperId && authUser?.id && Number(load.shipperId) === Number(authUser.id);
  const userRole = (authUser?.role || "").toUpperCase();
  const isShipper = isLoadOwner || userRole === "SHIPPER";
  const canBid = !isLoadOwner && ["CARRIER", "BROKER", "CATALYST"].includes(userRole);

  // Fetch bids for this load (shipper view)
  const bidsQuery = (trpc as any).loads.getForLoad.useQuery(
    { loadId: Number(loadId) },
    { enabled: !!loadId && isShipper }
  );
  const bids = (bidsQuery.data as any[]) || [];
  const pendingBids = bids.filter((b: any) => b.status === "pending");

  const acceptBidMutation = (trpc as any).loads.updateStatus.useMutation({
    onSuccess: () => { bidsQuery.refetch(); loadQuery.refetch(); },
  });
  const rejectBidMutation = (trpc as any).loads.updateStatus.useMutation({
    onSuccess: () => { bidsQuery.refetch(); },
  });

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      posted: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      assigned: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      in_transit: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
      delivered: "bg-green-500/15 text-green-500 border-green-500/30",
    };
    const label = status?.replace("_", " ").toUpperCase() || "UNKNOWN";
    return <Badge className={cn("border text-xs font-bold", m[status] || "bg-slate-500/15 text-slate-400 border-slate-500/30")}>{label}</Badge>;
  };

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
        <Skeleton className={cn("h-10 w-64 rounded-xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-4 w-96 rounded-xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-28 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className={cn("h-64 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
          <Skeleton className={cn("h-64 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
        <div className={cn("text-center py-16 rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-800" : "text-white")}>Load not found</p>
          <p className="text-sm text-slate-400 mt-1">This load may have been removed or is no longer available.</p>
          <Button className="mt-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />Go Back
          </Button>
        </div>
      </div>
    );
  }

  const originCity = load.origin?.city || load.pickupLocation?.city || "Origin";
  const originState = load.origin?.state || load.pickupLocation?.state || "";
  const destCity = load.destination?.city || load.deliveryLocation?.city || "Destination";
  const destState = load.destination?.state || load.deliveryLocation?.state || "";
  const distance = Number(load.distance) || 0;
  const rate = Number(load.rate) || 0;
  const ratePerMile = distance > 0 && rate > 0 ? (rate / distance).toFixed(2) : "0.00";

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800")} onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {load.loadNumber || `Load #${String(load.id).slice(0, 8)}`}
              </h1>
              {getStatusBadge(load.status)}
            </div>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
              {originCity} → {destCity} · {distance} mi
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" className={cn("rounded-xl text-sm", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700")} onClick={() => setLocation("/messages")}>
            <Phone className="w-4 h-4 mr-2" />Contact
          </Button>
          {load.status === "posted" && (isLoadOwner || userRole === "SHIPPER") && (
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation(`/loads/${loadId}/bids`)}>
              <Gavel className="w-4 h-4 mr-2" />Review Bids
            </Button>
          )}
          {load.status === "posted" && canBid && (
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation(`/bids/submit/${loadId}`)}>
              <Gavel className="w-4 h-4 mr-2" />Place Bid
            </Button>
          )}
          {(load.status === "assigned" || load.status === "in_transit") && (
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-xl text-white text-sm" onClick={() => setLocation("/tracking")}>
              <Navigation className="w-4 h-4 mr-2" />Track
            </Button>
          )}
        </div>
      </div>

      {/* ── Rate & Stats Summary ── */}
      <div className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-slate-800/60 border-slate-700/50")}>
        <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Load Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rate.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">${ratePerMile}/mi</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Distance</p>
              <p className={cn("text-3xl font-bold", isLight ? "text-slate-800" : "text-white")}>{distance}</p>
              <p className="text-xs text-slate-400 mt-0.5">miles</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Weight</p>
              <p className={cn("text-3xl font-bold", isLight ? "text-slate-800" : "text-white")}>{Number(load.weight || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{load.weightUnit || "lbs"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Equipment</p>
              <p className={cn("text-2xl font-bold capitalize", isLight ? "text-slate-800" : "text-white")}>{load.equipmentType || "—"}</p>
              <p className="text-xs text-slate-400 mt-0.5">{load.commodity || "General"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Route Card ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Navigation className="w-5 h-5 text-blue-500" />Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("p-5 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#1473FF]" />
                </div>
                <div>
                  <p className={valCls}>{originCity}{originState ? `, ${originState}` : ""}</p>
                  <p className="text-xs text-slate-400">{load.origin?.address || ""}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">Pickup: {String(load.pickupDate || "TBD")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center my-3 ml-5">
                <div className={cn("w-0.5 h-8", isLight ? "bg-slate-200" : "bg-slate-700")} />
                <div className="ml-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#BE01FF]/20">
                  <span className="text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{distance} miles</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE01FF]/20 to-[#1473FF]/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#BE01FF]" />
                </div>
                <div>
                  <p className={valCls}>{destCity}{destState ? `, ${destState}` : ""}</p>
                  <p className="text-xs text-slate-400">{load.destination?.address || ""}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">Delivery: {String(load.deliveryDate || "TBD")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Load Information ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Package className="w-5 h-5 text-purple-500" />Load Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Equipment", value: load.equipmentType || "N/A", icon: <Truck className="w-4 h-4 text-blue-500" /> },
                { label: "Weight", value: `${Number(load.weight || 0).toLocaleString()} ${load.weightUnit || "lbs"}`, icon: <Package className="w-4 h-4 text-purple-500" /> },
                { label: "Commodity", value: load.commodity || "General Freight", icon: <Package className="w-4 h-4 text-orange-500" /> },
                { label: "Cargo Type", value: load.cargoType || "General", icon: <FileText className="w-4 h-4 text-cyan-500" /> },
              ].map((item) => (
                <div key={item.label} className={cellCls}>
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-[10px] text-slate-400 uppercase">{item.label}</span></div>
                  <p className={cn(valCls, "capitalize")}>{item.value}</p>
                </div>
              ))}
            </div>
            {load.notes && !String(load.notes).includes("[WARNING]") && (
              <div className={cellCls}>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Notes</p>
                <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{load.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ERG Hazmat Classification ── */}
        {(load.hazmatClass || load.unNumber) && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <Shield className="w-5 h-5 text-cyan-500" />
                ERG Hazmat Classification
                {load.spectraMatchVerified && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent ml-auto">
                    <CheckCircle className="w-3 h-3 mr-1" />SPECTRA-MATCH Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {load.commodity && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">Product</p>
                    <p className={valCls}>{load.commodity}</p>
                  </div>
                )}
                {load.unNumber && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">UN Number</p>
                    <p className="text-cyan-500 font-bold text-sm">{load.unNumber}</p>
                  </div>
                )}
                {load.hazmatClass && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">Hazmat Class</p>
                    <p className="text-purple-500 font-medium text-sm">Class {load.hazmatClass}</p>
                  </div>
                )}
                {load.ergGuide && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">ERG Guide</p>
                    <p className={valCls}>Guide {load.ergGuide}</p>
                  </div>
                )}
              </div>
              {load.notes && String(load.notes).includes("[WARNING]") && (
                <div className="flex flex-wrap gap-2">
                  {String(load.notes).includes("Toxic Inhalation") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/30">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-red-500 text-xs font-bold">TOXIC INHALATION HAZARD</span>
                    </div>
                  )}
                  {String(load.notes).includes("Water-Reactive") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30">
                      <AlertTriangle className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-500 text-xs font-bold">WATER-REACTIVE</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400">Classification data from U.S. DOT ERG 2020 Emergency Response Guidebook</p>
            </CardContent>
          </Card>
        )}

        {/* ── SPECTRA-MATCH™ Oil Identification ── */}
        {isSpectraQualified(load.equipmentType || load.cargoType, load.commodity, load.hazmatClass) && (
          <Card className={cardCls}>
            <CardContent className="p-4">
              <SpectraMatchWidget
                compact={true}
                loadId={loadId}
                showSaveButton={true}
                productName={load.commodity}
                onIdentify={(result) => {
                  console.log("SpectraMatch result:", result);
                  loadQuery.refetch();
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Assigned Driver ── */}
        {load.driver && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <User className="w-5 h-5 text-cyan-500" />Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#1473FF]" />
                </div>
                <div>
                  <p className={valCls}>{load.driver.name}</p>
                  <p className="text-sm text-slate-400">{load.driver.phone}</p>
                  <p className="text-xs text-slate-400">Truck: {load.driver.truckNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Timeline ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Clock className="w-5 h-5 text-blue-500" />Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {load.timeline?.map((event: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", event.completed ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : isLight ? "bg-slate-300" : "bg-slate-600")} />
                  <div>
                    <p className={cn("font-medium text-sm", event.completed ? (isLight ? "text-slate-800" : "text-white") : "text-slate-400")}>{event.title}</p>
                    <p className="text-xs text-slate-400">{event.date}</p>
                  </div>
                </div>
              )) || (
                <div className={cn("text-center py-6 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/30")}>
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No timeline events yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Incoming Bids Section (Shipper View) ── */}
      {isShipper && (
        <Card className={cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Gavel className="w-5 h-5 text-purple-400" />
              Incoming Bids
              {pendingBids.length > 0 && (
                <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-xs ml-2">
                  {pendingBids.length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bidsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("font-medium", isLight ? "text-slate-500" : "text-slate-400")}>No bids yet</p>
                <p className="text-sm text-slate-500 mt-1">Carriers will bid on your load once it's visible in the marketplace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((bid: any) => (
                  <div key={bid.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    bid.status === "accepted" ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30") :
                    bid.status === "rejected" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30") :
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isLight ? "bg-slate-200" : "bg-slate-700")}>
                        <Building2 className={cn("w-5 h-5", isLight ? "text-slate-500" : "text-slate-400")} />
                      </div>
                      <div>
                        <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>
                          {bid.carrierName || `Carrier #${bid.carrierId}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : ""}
                          {bid.notes ? ` · ${bid.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-lg">
                          ${Number(bid.amount).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={cn(
                        "text-xs font-bold border",
                        bid.status === "accepted" ? "bg-green-500/15 text-green-500 border-green-500/30" :
                        bid.status === "rejected" ? "bg-red-500/15 text-red-500 border-red-500/30" :
                        bid.status === "pending" ? "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" :
                        "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      )}>{bid.status}</Badge>
                      {bid.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => rejectBidMutation.mutate({ bidId: bid.id, status: "rejected" })}
                            disabled={rejectBidMutation.isPending}>
                            Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => acceptBidMutation.mutate({ bidId: bid.id, status: "accepted" })}
                            disabled={acceptBidMutation.isPending}>
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Bottom Place Bid CTA (for posted loads — carriers only, not load owner) ── */}
      {load.status === "posted" && canBid && (
        <div className={cn("rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div>
            <p className={cn("font-bold text-lg", isLight ? "text-slate-800" : "text-white")}>Ready to haul this load?</p>
            <p className="text-sm text-slate-400">Submit a competitive bid and get assigned.</p>
          </div>
          <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold px-8 h-12 text-base" onClick={() => setLocation(`/bids/submit/${loadId}`)}>
            <Gavel className="w-5 h-5 mr-2" />Place Bid Now
          </Button>
        </div>
      )}
    </div>
  );
}
