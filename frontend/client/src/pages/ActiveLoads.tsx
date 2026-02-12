/**
 * ACTIVE LOADS PAGE
 * 100% Dynamic - No mock data
 * Phone = message carrier/driver | Eye = inline load preview modal
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Clock, Truck, RefreshCw, Search, Eye, Phone, Navigation,
  ArrowRight, DollarSign, Weight, Route, Plus, AlertTriangle, MessageSquare,
  User, Building2, Calendar, X, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const ACTIVE_STATUSES = ["posted", "bidding", "assigned", "in_transit", "picked_up", "at_facility", "delayed"];

export default function ActiveLoadsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewLoad, setPreviewLoad] = useState<any>(null);

  const { data: allLoads, isLoading, refetch, isRefetching } = (trpc as any).loads.list.useQuery({
    limit: 100,
  });

  // Message carrier/driver mutation
  const createConversation = (trpc as any).messages.createConversation.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.existing ? "Opened conversation" : "Conversation started");
      setLocation("/messages");
    },
    onError: () => {
      toast.error("Could not start conversation");
      setLocation("/messages");
    },
  });

  // Filter to only active statuses
  const loads = allLoads?.filter((l: any) => ACTIVE_STATUSES.includes(l.status)) || [];

  const inTransitCount = loads.filter((l: any) => l.status === "in_transit").length;
  const assignedCount = loads.filter((l: any) => l.status === "assigned" || l.status === "picked_up").length;
  const postedCount = loads.filter((l: any) => l.status === "posted" || l.status === "bidding").length;
  const delayedCount = loads.filter((l: any) => l.status === "delayed").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_transit": return <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[11px]">In Transit</Badge>;
      case "assigned": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-[11px]">Assigned</Badge>;
      case "picked_up": return <Badge className="bg-green-500/20 text-green-400 border-0 text-[11px]">Picked Up</Badge>;
      case "posted": return <Badge className="bg-violet-500/20 text-violet-400 border-0 text-[11px]">Posted</Badge>;
      case "bidding": return <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[11px]">Bidding</Badge>;
      case "delayed": return <Badge className="bg-red-500/20 text-red-400 border-0 text-[11px]">Delayed</Badge>;
      case "at_facility": return <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[11px]">At Facility</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0 text-[11px]">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_transit": return <Truck className="w-5 h-5 text-blue-400" />;
      case "assigned": case "picked_up": return <Package className="w-5 h-5 text-cyan-400" />;
      case "posted": case "bidding": return <Clock className="w-5 h-5 text-violet-400" />;
      case "delayed": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Truck className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleContact = (load: any) => {
    const contactId = load.driverId || load.carrierId;
    if (contactId) {
      createConversation.mutate({ participantIds: [contactId], type: "direct" });
    } else {
      toast.info("No carrier or driver assigned yet", { description: "This load hasn't been assigned to a carrier." });
    }
  };

  const filteredLoads = loads.filter((load: any) => {
    const matchesSearch = !searchQuery || 
      load.loadNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.origin?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.destination?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || load.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Active Loads
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Real-time tracking of all your live shipments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
            onClick={() => setLocation("/loads/create")}
          >
            <Plus className="w-4 h-4 mr-2" />Create Load
          </Button>
          <Button variant="outline" className={cn("rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { count: inTransitCount, label: "In Transit", color: "blue", icon: <Truck className="w-5 h-5 text-blue-400" /> },
          { count: assignedCount, label: "Assigned", color: "cyan", icon: <Package className="w-5 h-5 text-cyan-400" /> },
          { count: postedCount, label: "Posted", color: "violet", icon: <Clock className="w-5 h-5 text-violet-400" /> },
          { count: delayedCount, label: "Delayed", color: "red", icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-${s.color}-500/20`}>{s.icon}</div>
                <div>
                  <p className={`text-2xl font-bold text-${s.color}-400 tabular-nums`}>{s.count}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            placeholder="Search by load number, origin, or destination..."
            className={cn("pl-9 rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50")}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn("w-44 rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Active ({loads.length})</SelectItem>
            <SelectItem value="in_transit">In Transit ({inTransitCount})</SelectItem>
            <SelectItem value="assigned">Assigned ({assignedCount})</SelectItem>
            <SelectItem value="posted">Posted ({postedCount})</SelectItem>
            <SelectItem value="bidding">Bidding</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="delayed">Delayed ({delayedCount})</SelectItem>
            <SelectItem value="at_facility">At Facility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loads List */}
      <Card className={cn("rounded-xl overflow-hidden border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className={cn("h-20 w-full rounded-xl", isLight ? "bg-slate-100" : "bg-slate-700/50")} />)}
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-20">
              <div className={cn("p-5 rounded-2xl w-24 h-24 mx-auto mb-5 flex items-center justify-center border", isLight ? "bg-slate-50 border-slate-200" : "bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/30")}>
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <p className={cn("text-lg font-semibold mb-1", isLight ? "text-slate-800" : "text-white")}>No active loads</p>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "No loads match your current filters. Try adjusting your search."
                  : "Create a new load to start shipping. Your active loads will appear here."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
                  onClick={() => setLocation("/loads/create")}
                >
                  <Plus className="w-4 h-4 mr-2" />Create Your First Load
                </Button>
              )}
            </div>
          ) : (
            <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/30")}>
              {filteredLoads.map((load: any) => (
                <div
                  key={load.id}
                  className={cn("p-4 transition-all cursor-pointer group", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]")}
                  onClick={() => setLocation(`/load/${load.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={cn("p-2.5 rounded-xl border transition-colors", isLight ? "bg-slate-50 border-slate-200 group-hover:border-slate-300" : "bg-white/[0.04] border-white/[0.06] group-hover:border-white/[0.12]")}>
                        {getStatusIcon(load.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <p className={cn("font-semibold text-sm tracking-wide", isLight ? "text-slate-800" : "text-white")}>
                            {load.loadNumber || `#LOAD-${load.id?.slice(0, 6)}`}
                          </p>
                          {getStatusBadge(load.status)}
                          {load.hazmatClass && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">HAZMAT {load.hazmatClass}</Badge>
                          )}
                        </div>
                        <div className={cn("flex items-center gap-2 text-sm mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>
                          <span className="flex items-center gap-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#1473FF] to-[#BE01FF] shrink-0" />
                            <span className="truncate">{load.origin?.city || "N/A"}{load.origin?.state ? `, ${load.origin.state}` : ""}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="flex items-center gap-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#BE01FF] to-[#1473FF] shrink-0" />
                            <span className="truncate">{load.destination?.city || "N/A"}{load.destination?.state ? `, ${load.destination.state}` : ""}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {load.commodity && load.commodity !== "General" && (
                            <span className="flex items-center gap-1"><Package className="w-3 h-3" />{load.commodity}</span>
                          )}
                          {load.weight > 0 && (
                            <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{load.weight.toLocaleString()} lbs</span>
                          )}
                          {load.distance > 0 && (
                            <span className="flex items-center gap-1"><Route className="w-3 h-3" />{load.distance.toLocaleString()} mi</span>
                          )}
                          {load.carrierName && (
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{load.carrierName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {load.rate > 0 && (
                        <div className="text-right mr-2">
                          <p className="font-bold tabular-nums bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${load.rate.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">rate</p>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent rounded-lg"
                        title={load.driverName ? `Message ${load.driverName}` : load.carrierName ? `Message ${load.carrierName}` : "No carrier assigned"}
                        onClick={(e: any) => { e.stopPropagation(); handleContact(load); }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className={cn("rounded-lg border", isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-white")}
                        onClick={(e: any) => { e.stopPropagation(); setPreviewLoad(load); }}
                      >
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer summary */}
      {filteredLoads.length > 0 && (
        <p className="text-center text-slate-500 text-xs">
          Showing {filteredLoads.length} of {loads.length} active load{loads.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ═══ Load Preview Modal ═══ */}
      <Dialog open={!!previewLoad} onOpenChange={(open) => { if (!open) setPreviewLoad(null); }}>
        <DialogContent
          className={cn("sm:max-w-2xl rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          {previewLoad && (
            <>
              {/* Modal Header */}
              <div className="p-5 pb-0">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DialogTitle className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                        {previewLoad.loadNumber || `#LOAD-${previewLoad.id?.slice(0, 6)}`}
                      </DialogTitle>
                      {getStatusBadge(previewLoad.status)}
                      {previewLoad.hazmatClass && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px]">HAZMAT {previewLoad.hazmatClass}</Badge>
                      )}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-5 space-y-4">
                {/* Route */}
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#1473FF]" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{previewLoad.origin?.city}{previewLoad.origin?.state ? `, ${previewLoad.origin.state}` : ""}</p>
                        <p className="text-[11px] text-slate-500">{previewLoad.origin?.address || "Origin"}</p>
                      </div>
                    </div>
                    <div className="flex-1 mx-4 flex items-center">
                      <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                      <Truck className="w-5 h-5 mx-2 text-[#8B5CF6]" />
                      <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{previewLoad.destination?.city}{previewLoad.destination?.state ? `, ${previewLoad.destination.state}` : ""}</p>
                        <p className="text-[11px] text-slate-500 text-right">{previewLoad.destination?.address || "Destination"}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE01FF]/20 to-[#1473FF]/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#BE01FF]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Rate", value: previewLoad.rate > 0 ? `$${previewLoad.rate.toLocaleString()}` : "N/A", gradient: true },
                    { label: "Weight", value: previewLoad.weight > 0 ? `${previewLoad.weight.toLocaleString()} lbs` : "N/A" },
                    { label: "Distance", value: previewLoad.distance > 0 ? `${previewLoad.distance.toLocaleString()} mi` : "N/A" },
                    { label: "Commodity", value: previewLoad.commodity || "General" },
                    { label: "Pickup", value: previewLoad.pickupDate || "TBD" },
                    { label: "Delivery", value: previewLoad.deliveryDate || "TBD" },
                    { label: "Carrier", value: previewLoad.carrierName || "Unassigned" },
                    { label: "Driver", value: previewLoad.driverName || "Unassigned" },
                  ].map((item: any) => (
                    <div key={item.label} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                      <p className={item.gradient && previewLoad.rate > 0
                        ? "font-bold text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent"
                        : cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")
                      }>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Company Info */}
                {(previewLoad.carrierCompanyName || previewLoad.driverPhone) && (
                  <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                    <p className="text-xs text-slate-500 mb-2 font-medium">Contact Information</p>
                    <div className="flex items-center gap-4">
                      {previewLoad.carrierCompanyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{previewLoad.carrierCompanyName}</span>
                        </div>
                      )}
                      {previewLoad.driverPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <a href={`tel:${previewLoad.driverPhone}`} className="text-sm text-cyan-400 hover:underline">{previewLoad.driverPhone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
                    onClick={() => { setPreviewLoad(null); setLocation(`/load/${previewLoad.id}`); }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />Full Details
                  </Button>
                  <Button
                    variant="outline"
                    className={cn("flex-1 rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700")}
                    onClick={() => { setPreviewLoad(null); handleContact(previewLoad); }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {previewLoad.driverName ? `Message ${previewLoad.driverName}` : previewLoad.carrierName ? `Message ${previewLoad.carrierName}` : "Message"}
                  </Button>
                  <Button
                    variant="outline"
                    className={cn("rounded-lg", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700")}
                    onClick={() => { setPreviewLoad(null); setLocation("/tracking"); }}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
