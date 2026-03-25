/**
 * MULTI-STOP PANEL — GAP-002: Multi-Stop Load Support
 * Displays and manages ordered stops for a load.
 * Supports add, edit, reorder, delete, and status updates.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Plus, GripVertical, Trash2, ChevronDown, ChevronUp,
  Clock, CheckCircle, Truck, Package, Fuel, Scale, Shield,
  ArrowDown, ArrowUp, Building2, Phone, Navigation, Loader2,
  AlertCircle, CircleDot, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const STOP_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pickup: { label: "Pickup", icon: <Package className="w-4 h-4" />, color: "text-blue-500" },
  delivery: { label: "Delivery", icon: <Building2 className="w-4 h-4" />, color: "text-purple-500" },
  fuel: { label: "Fuel Stop", icon: <Fuel className="w-4 h-4" />, color: "text-amber-500" },
  rest: { label: "Rest Stop", icon: <Clock className="w-4 h-4" />, color: "text-cyan-500" },
  scale: { label: "Scale/Weigh", icon: <Scale className="w-4 h-4" />, color: "text-emerald-500" },
  inspection: { label: "Inspection", icon: <Shield className="w-4 h-4" />, color: "text-red-500" },
  crossdock: { label: "Cross-Dock", icon: <Truck className="w-4 h-4" />, color: "text-orange-500" },
  relay: { label: "Relay Point", icon: <Navigation className="w-4 h-4" />, color: "text-indigo-500" },
  customs: { label: "Customs", icon: <Shield className="w-4 h-4" />, color: "text-rose-500" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-slate-400", bgColor: "bg-slate-500/15" },
  en_route: { label: "En Route", color: "text-blue-400", bgColor: "bg-blue-500/15" },
  arrived: { label: "Arrived", color: "text-amber-400", bgColor: "bg-amber-500/15" },
  loading: { label: "Loading", color: "text-cyan-400", bgColor: "bg-cyan-500/15" },
  unloading: { label: "Unloading", color: "text-purple-400", bgColor: "bg-purple-500/15" },
  completed: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-500/15" },
  skipped: { label: "Skipped", color: "text-slate-400", bgColor: "bg-slate-500/10" },
};

interface MultiStopPanelProps {
  loadId: number;
  canEdit?: boolean;
  compact?: boolean;
}

export default function MultiStopPanel({ loadId, canEdit = false, compact = false }: MultiStopPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedStop, setExpandedStop] = useState<number | null>(null);
  const [newStop, setNewStop] = useState({
    stopType: "delivery" as string,
    facilityName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    referenceNumber: "",
  });

  const stopsQuery = (trpc as any).loadStops.getByLoadId.useQuery(
    { loadId },
    { enabled: !!loadId }
  );
  const summaryQuery = (trpc as any).loadStops.getSummary.useQuery(
    { loadId },
    { enabled: !!loadId }
  );
  const stops = (stopsQuery.data || []) as any[];
  const summary = summaryQuery.data as any;

  const addMutation = (trpc as any).loadStops.add.useMutation({
    onSuccess: () => {
      toast.success("Stop added");
      stopsQuery.refetch();
      summaryQuery.refetch();
      setShowAddForm(false);
      setNewStop({ stopType: "delivery", facilityName: "", address: "", city: "", state: "", zipCode: "", contactName: "", contactPhone: "", notes: "", referenceNumber: "" });
    },
    onError: (err: any) => toast.error("Failed to add stop", { description: err.message }),
  });

  const updateMutation = (trpc as any).loadStops.update.useMutation({
    onSuccess: () => {
      toast.success("Stop updated");
      stopsQuery.refetch();
      summaryQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to update stop", { description: err.message }),
  });

  const removeMutation = (trpc as any).loadStops.remove.useMutation({
    onSuccess: () => {
      toast.success("Stop removed");
      stopsQuery.refetch();
      summaryQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to remove stop", { description: err.message }),
  });

  const reorderMutation = (trpc as any).loadStops.reorder.useMutation({
    onSuccess: () => {
      stopsQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to reorder", { description: err.message }),
  });

  const handleAddStop = () => {
    if (!newStop.city && !newStop.facilityName) {
      toast.error("City or facility name required");
      return;
    }
    addMutation.mutate({
      loadId,
      stop: {
        stopType: newStop.stopType,
        facilityName: newStop.facilityName || undefined,
        address: newStop.address || undefined,
        city: newStop.city || undefined,
        state: newStop.state || undefined,
        zipCode: newStop.zipCode || undefined,
        contactName: newStop.contactName || undefined,
        contactPhone: newStop.contactPhone || undefined,
        notes: newStop.notes || undefined,
        referenceNumber: newStop.referenceNumber || undefined,
      },
    });
  };

  const handleStatusUpdate = (stopId: number, status: string) => {
    updateMutation.mutate({ stopId, data: { status } });
  };

  const handleMoveUp = (stop: any) => {
    if (stop.sequence <= 1) return;
    reorderMutation.mutate({ loadId, stopId: stop.id, newSequence: stop.sequence - 1 });
  };

  const handleMoveDown = (stop: any, maxSeq: number) => {
    if (stop.sequence >= maxSeq) return;
    reorderMutation.mutate({ loadId, stopId: stop.id, newSequence: stop.sequence + 1 });
  };

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const inputCls = cn("h-8 text-xs rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700/50 text-slate-200");

  if (stopsQuery.isLoading) {
    return (
      <Card className={cardCls}>
        <CardContent className="p-5 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-400">Loading stops...</span>
        </CardContent>
      </Card>
    );
  }

  if (stops.length === 0 && !canEdit) return null;

  return (
    <Card className={cn(cardCls, "lg:col-span-2")}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>
          <MapPin className="w-5 h-5 text-[#1473FF]" />
          Route Stops
          {stops.length > 0 && (
            <Badge className="ml-2 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs">
              {stops.length} stop{stops.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {summary && summary.totalStops > 0 && (
            <span className="ml-auto text-xs text-slate-400 font-normal">
              {summary.completedStops}/{summary.totalStops} completed ({summary.progress}%)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Progress bar */}
        {summary && summary.totalStops > 0 && (
          <div className="w-full h-1.5 rounded-full bg-slate-700/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-500"
              style={{ width: `${summary.progress}%` }}
            />
          </div>
        )}

        {/* Stops list */}
        {stops.length > 0 ? (
          <div className="space-y-2">
            {stops.map((stop: any, idx: number) => {
              const config = STOP_TYPE_CONFIG[stop.stopType] || STOP_TYPE_CONFIG.delivery;
              const statusCfg = STATUS_CONFIG[stop.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedStop === stop.id;
              const isFirst = idx === 0;
              const isLast = idx === stops.length - 1;
              const isCompleted = stop.status === "completed";
              const isSkipped = stop.status === "skipped";

              return (
                <div key={stop.id}>
                  {/* Connector line */}
                  {idx > 0 && (
                    <div className="flex items-center ml-6 -my-1">
                      <div className={cn("w-0.5 h-4", isCompleted || isSkipped || (stops[idx - 1]?.status === "completed") ? "bg-emerald-500/50" : isLight ? "bg-slate-200" : "bg-slate-700")} />
                      {stop.distanceFromPrev && (
                        <span className="ml-3 text-xs text-slate-400">{Number(stop.distanceFromPrev).toFixed(1)} mi</span>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-xl border transition-all",
                      isCompleted ? (isLight ? "bg-emerald-50/50 border-emerald-200/50" : "bg-emerald-500/5 border-emerald-500/20") :
                      isSkipped ? (isLight ? "bg-slate-50 border-slate-200 opacity-60" : "bg-slate-800/30 border-slate-700/30 opacity-60") :
                      stop.status === "arrived" || stop.status === "loading" || stop.status === "unloading" ? (isLight ? "bg-blue-50/50 border-blue-200" : "bg-blue-500/5 border-blue-500/20") :
                      isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/40"
                    )}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                    >
                      {/* Sequence indicator */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                        isCompleted ? "bg-emerald-500/20 text-emerald-500" :
                        stop.status === "arrived" || stop.status === "loading" || stop.status === "unloading" ? "bg-blue-500/20 text-blue-500" :
                        stop.status === "en_route" ? "bg-amber-500/20 text-amber-500" :
                        isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700/50 text-slate-400"
                      )}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : stop.sequence}
                      </div>

                      {/* Stop info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>{config.label}</span>
                          <Badge className={cn("text-xs border-0 font-medium", statusCfg.bgColor, statusCfg.color)}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className={cn("text-sm font-medium mt-0.5 truncate", isLight ? "text-slate-800" : "text-white")}>
                          {stop.facilityName || `${stop.city || ""}${stop.state ? `, ${stop.state}` : ""}`}
                        </p>
                        {stop.address && (
                          <p className="text-xs text-slate-400 truncate">{stop.address}</p>
                        )}
                      </div>

                      {/* Time info */}
                      <div className="text-right flex-shrink-0">
                        {stop.appointmentStart && (
                          <p className="text-xs text-slate-400">
                            {new Date(stop.appointmentStart).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        )}
                        {stop.dwellMinutes != null && stop.dwellMinutes > 0 && (
                          <p className={cn("text-xs font-medium", stop.dwellMinutes > 120 ? "text-red-400" : "text-slate-400")}>
                            {stop.dwellMinutes}min dwell
                          </p>
                        )}
                      </div>

                      {/* Expand chevron */}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className={cn("px-4 pb-4 pt-1 border-t space-y-3", isLight ? "border-slate-100" : "border-slate-700/30")}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {stop.city && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">City</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{stop.city}{stop.state ? `, ${stop.state}` : ""}</p>
                            </div>
                          )}
                          {stop.zipCode && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Zip</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{stop.zipCode}</p>
                            </div>
                          )}
                          {stop.contactName && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Contact</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{stop.contactName}</p>
                            </div>
                          )}
                          {stop.contactPhone && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Phone</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{stop.contactPhone}</p>
                            </div>
                          )}
                          {stop.referenceNumber && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Ref #</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{stop.referenceNumber}</p>
                            </div>
                          )}
                          {(stop.estimatedWeight || stop.actualWeight) && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Weight</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                                {stop.actualWeight ? `${Number(stop.actualWeight).toLocaleString()} lbs (actual)` : `${Number(stop.estimatedWeight).toLocaleString()} lbs (est)`}
                              </p>
                            </div>
                          )}
                          {stop.arrivedAt && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Arrived</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                                {new Date(stop.arrivedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          )}
                          {stop.departedAt && (
                            <div className={cellCls}>
                              <p className="text-xs text-slate-400 uppercase">Departed</p>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                                {new Date(stop.departedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          )}
                        </div>

                        {stop.notes && (
                          <div className={cellCls}>
                            <p className="text-xs text-slate-400 uppercase">Notes</p>
                            <p className={cn("text-xs", isLight ? "text-slate-700" : "text-slate-300")}>{stop.notes}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {canEdit && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {stop.status === "pending" && (
                              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "en_route")}>
                                <Truck className="w-3 h-3 mr-1" />En Route
                              </Button>
                            )}
                            {stop.status === "en_route" && (
                              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "arrived")}>
                                <MapPin className="w-3 h-3 mr-1" />Arrived
                              </Button>
                            )}
                            {stop.status === "arrived" && stop.stopType === "pickup" && (
                              <Button size="sm" className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "loading")}>
                                <Package className="w-3 h-3 mr-1" />Start Loading
                              </Button>
                            )}
                            {stop.status === "arrived" && stop.stopType === "delivery" && (
                              <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "unloading")}>
                                <Package className="w-3 h-3 mr-1" />Start Unloading
                              </Button>
                            )}
                            {stop.status === "arrived" && !["pickup", "delivery"].includes(stop.stopType) && (
                              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "completed")}>
                                <CheckCircle className="w-3 h-3 mr-1" />Complete
                              </Button>
                            )}
                            {(stop.status === "loading" || stop.status === "unloading") && (
                              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={() => handleStatusUpdate(stop.id, "completed")}>
                                <CheckCircle className="w-3 h-3 mr-1" />Complete
                              </Button>
                            )}
                            {!["completed", "skipped"].includes(stop.status) && (
                              <Button size="sm" variant="outline" className={cn("h-7 text-xs rounded-lg", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => handleStatusUpdate(stop.id, "skipped")}>
                                Skip
                              </Button>
                            )}

                            {/* Reorder buttons */}
                            {!isFirst && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleMoveUp(stop)}>
                                <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                              </Button>
                            )}
                            {!isLast && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleMoveDown(stop, stops.length)}>
                                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 ml-auto" onClick={() => removeMutation.mutate({ stopId: stop.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={cn("text-center py-8 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/30")}>
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>No stops defined</p>
            <p className="text-xs text-slate-400 mt-1">Add intermediate stops for multi-stop loads.</p>
          </div>
        )}

        {/* Add Stop Form */}
        {canEdit && showAddForm && (
          <div className={cn("rounded-xl border p-4 space-y-3", isLight ? "bg-blue-50/30 border-blue-200/50" : "bg-blue-500/5 border-blue-500/15")}>
            <p className={cn("text-xs font-semibold uppercase tracking-wider", isLight ? "text-blue-600" : "text-blue-400")}>Add Stop</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select
                className={cn(inputCls, "cursor-pointer")}
                value={newStop.stopType}
                onChange={(e) => setNewStop({ ...newStop, stopType: e.target.value })}
              >
                {Object.entries(STOP_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <Input className={inputCls} placeholder="Facility name" value={newStop.facilityName} onChange={(e) => setNewStop({ ...newStop, facilityName: e.target.value })} />
              <Input className={inputCls} placeholder="City" value={newStop.city} onChange={(e) => setNewStop({ ...newStop, city: e.target.value })} />
              <Input className={inputCls} placeholder="State" value={newStop.state} onChange={(e) => setNewStop({ ...newStop, state: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input className={inputCls} placeholder="Address" value={newStop.address} onChange={(e) => setNewStop({ ...newStop, address: e.target.value })} />
              <Input className={inputCls} placeholder="Zip code" value={newStop.zipCode} onChange={(e) => setNewStop({ ...newStop, zipCode: e.target.value })} />
              <Input className={inputCls} placeholder="Contact name" value={newStop.contactName} onChange={(e) => setNewStop({ ...newStop, contactName: e.target.value })} />
              <Input className={inputCls} placeholder="Contact phone" value={newStop.contactPhone} onChange={(e) => setNewStop({ ...newStop, contactPhone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input className={inputCls} placeholder="Reference #" value={newStop.referenceNumber} onChange={(e) => setNewStop({ ...newStop, referenceNumber: e.target.value })} />
              <Input className={inputCls} placeholder="Notes" value={newStop.notes} onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })} />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg" onClick={handleAddStop} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                Add Stop
              </Button>
              <Button size="sm" variant="outline" className={cn("h-8 text-xs rounded-lg", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Add Stop Button */}
        {canEdit && !showAddForm && (
          <Button
            variant="outline"
            className={cn("w-full h-9 text-xs rounded-xl border-dashed", isLight ? "border-slate-300 text-slate-500 hover:bg-slate-50" : "border-slate-600 text-slate-400 hover:bg-slate-800")}
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />Add Stop
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
