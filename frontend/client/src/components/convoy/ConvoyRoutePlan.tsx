/**
 * CONVOY ROUTE PLAN (GAP-082 Task 5.2)
 * Displays optimized convoy route with fuel stops, rest areas,
 * daylight windows, state permits, and warnings.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import {
  Fuel, BedDouble, Sun, FileCheck, AlertTriangle, CheckCircle,
  Clock, MapPin, Route, Zap, Shield, ChevronDown, ChevronUp,
  Calendar, Gauge, Truck, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvoyRoutePlanProps {
  convoyId?: number;
  loadId?: number;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  totalDistanceMiles?: number;
  className?: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function ConvoyRoutePlan({
  convoyId, loadId, originLat, originLng, destLat, destLng, totalDistanceMiles, className,
}: ConvoyRoutePlanProps) {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(!totalDistanceMiles);

  // Form state for manual input
  const [formOriginLat, setFormOriginLat] = useState(originLat || 29.76);
  const [formOriginLng, setFormOriginLng] = useState(originLng || -95.37);
  const [formDestLat, setFormDestLat] = useState(destLat || 32.78);
  const [formDestLng, setFormDestLng] = useState(destLng || -96.8);
  const [formDistance, setFormDistance] = useState(totalDistanceMiles || 240);
  const [formIsOversize, setFormIsOversize] = useState(false);
  const [formWidth, setFormWidth] = useState<number | undefined>();
  const [formHeight, setFormHeight] = useState<number | undefined>();
  const [formWeight, setFormWeight] = useState<number | undefined>();
  const [formTransitStates, setFormTransitStates] = useState<string[]>([]);
  const [formDeparture, setFormDeparture] = useState("");

  // Submitted parameters (only query when submitted)
  const [queryParams, setQueryParams] = useState<any>(
    totalDistanceMiles ? {
      convoyId, loadId,
      originLat: originLat || 29.76, originLng: originLng || -95.37,
      destLat: destLat || 32.78, destLng: destLng || -96.8,
      totalDistanceMiles,
      isOversize: false,
      transitStates: [],
    } : null
  );

  const routePlanQuery = (trpc as any).convoy?.optimizeConvoyRoute?.useQuery?.(
    queryParams,
    { enabled: !!queryParams, staleTime: 120_000 }
  ) || { data: null, isLoading: false };
  const plan = routePlanQuery.data;

  const handleSubmit = () => {
    setQueryParams({
      convoyId, loadId,
      originLat: formOriginLat, originLng: formOriginLng,
      destLat: formDestLat, destLng: formDestLng,
      totalDistanceMiles: formDistance,
      isOversize: formIsOversize,
      loadWidth: formWidth, loadHeight: formHeight, loadWeight: formWeight,
      departureTime: formDeparture || undefined,
      transitStates: formTransitStates,
    });
    setShowForm(false);
  };

  const toggleState = (st: string) => {
    setFormTransitStates(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15">
              <Route className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Convoy Route Plan</p>
              <p className="text-xs text-slate-400">Fuel, rest, timing & permits optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plan && (
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                {plan.summary.estimatedDays} day{plan.summary.estimatedDays > 1 ? "s" : ""}
              </Badge>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-slate-400" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Hide" : "Edit"}
            </Button>
            <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <CardContent className="p-4 space-y-4">
          {/* Input Form */}
          {showForm && (
            <div className="p-4 rounded-xl border border-slate-700/30 bg-slate-900/30 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-400">Distance (miles)</Label>
                  <Input type="number" value={formDistance} onChange={(e: any) => setFormDistance(Number(e.target.value))}
                    className="h-8 text-xs bg-slate-800/50 border-slate-700" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Departure</Label>
                  <Input type="datetime-local" value={formDeparture} onChange={(e: any) => setFormDeparture(e.target.value)}
                    className="h-8 text-xs bg-slate-800/50 border-slate-700" />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2 h-8">
                    <Checkbox checked={formIsOversize} onCheckedChange={(c: any) => setFormIsOversize(!!c)} />
                    <Label className="text-xs text-slate-300">Oversize Load</Label>
                  </div>
                </div>
              </div>

              {formIsOversize && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-slate-400">Width (ft)</Label>
                    <Input type="number" value={formWidth || ""} onChange={(e: any) => setFormWidth(Number(e.target.value) || undefined)}
                      className="h-8 text-xs bg-slate-800/50 border-slate-700" placeholder="12" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Height (ft)</Label>
                    <Input type="number" value={formHeight || ""} onChange={(e: any) => setFormHeight(Number(e.target.value) || undefined)}
                      className="h-8 text-xs bg-slate-800/50 border-slate-700" placeholder="14" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Weight (lbs)</Label>
                    <Input type="number" value={formWeight || ""} onChange={(e: any) => setFormWeight(Number(e.target.value) || undefined)}
                      className="h-8 text-xs bg-slate-800/50 border-slate-700" placeholder="100000" />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-slate-400 mb-1.5 block">Transit States</Label>
                <div className="flex flex-wrap gap-1.5">
                  {US_STATES.map(st => (
                    <button
                      key={st}
                      onClick={() => toggleState(st)}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded border transition-colors",
                        formTransitStates.includes(st)
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <Button size="sm" onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                <Zap className="w-3.5 h-3.5 mr-1" />Generate Route Plan
              </Button>
            </div>
          )}

          {/* Loading */}
          {routePlanQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full bg-slate-700/30 rounded-lg" />
              <Skeleton className="h-32 w-full bg-slate-700/30 rounded-lg" />
            </div>
          )}

          {/* Results */}
          {plan && (
            <>
              {/* Summary Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Distance", value: `${plan.summary.totalDistanceMiles} mi`, icon: <MapPin className="w-3.5 h-3.5" />, color: "text-blue-400" },
                  { label: "Travel Time", value: `${plan.summary.estimatedTravelHours}h`, icon: <Clock className="w-3.5 h-3.5" />, color: "text-cyan-400" },
                  { label: "Convoy Speed", value: `${plan.summary.avgConvoySpeed} mph`, icon: <Gauge className="w-3.5 h-3.5" />, color: "text-emerald-400" },
                  { label: "Duration", value: `${plan.summary.estimatedDays} day${plan.summary.estimatedDays > 1 ? "s" : ""}`, icon: <Calendar className="w-3.5 h-3.5" />, color: "text-purple-400" },
                ].map(s => (
                  <div key={s.label} className="p-2.5 rounded-xl border border-slate-700/30 bg-slate-900/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={s.color}>{s.icon}</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</span>
                    </div>
                    <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Fuel Stops */}
              {plan.fuelStops.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Fuel Stops ({plan.fuelStops.length})</span>
                  </div>
                  <div className="space-y-2">
                    {plan.fuelStops.map((stop: any) => (
                      <div key={stop.stopNumber} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">#{stop.stopNumber}</span>
                          <span className="text-xs text-white">Mile {stop.approximateMile}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{stop.estimatedTime}</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 italic mt-1">{plan.fuelStops[0]?.notes}</p>
                  </div>
                </div>
              )}

              {/* Rest Stops */}
              {plan.restStops.length > 0 && (
                <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <BedDouble className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-400">HOS Rest Stops ({plan.restStops.length})</span>
                  </div>
                  <div className="space-y-2">
                    {plan.restStops.map((stop: any) => (
                      <div key={stop.stopNumber} className="p-2 rounded-lg bg-slate-900/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs",
                              stop.type === "overnight" ? "border-indigo-500/40 text-indigo-400" : "border-cyan-500/40 text-cyan-400"
                            )}>
                              {stop.type === "overnight" ? "Overnight" : "Break"}
                            </Badge>
                            <span className="text-xs text-white">At hour {stop.approximateHour}</span>
                          </div>
                          <span className="text-xs text-slate-400">{stop.duration}</span>
                        </div>
                        <p className="text-xs text-slate-500">{stop.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daylight Windows (Oversize) */}
              {plan.daylightWindows.length > 0 && (
                <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Daylight Travel Windows</span>
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">Oversize</Badge>
                  </div>
                  <div className="space-y-2">
                    {plan.daylightWindows.map((w: any) => (
                      <div key={w.day} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 px-1.5 py-0.5 rounded">Day {w.day}</span>
                          <span className="text-xs text-white">{w.start.split(" ")[0]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{w.start.split(" ")[1]} → {w.end.split(" ")[1]}</span>
                          <span className="text-xs text-yellow-400 font-mono">{w.miles} mi</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 italic">No weekend travel. Daylight hours only per state DOT requirements.</p>
                  </div>
                </div>
              )}

              {/* State Permit Checkpoints */}
              {plan.permitCheckpoints.length > 0 && (
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">State Permits ({plan.permitCheckpoints.length})</span>
                  </div>
                  <div className="space-y-2">
                    {plan.permitCheckpoints.map((pc: any) => (
                      <div key={pc.state} className="p-2 rounded-lg bg-slate-900/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400">{pc.state}</span>
                            <div className="flex gap-1">
                              {pc.restrictions.daylightOnly && <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">Daylight</Badge>}
                              {pc.restrictions.noWeekends && <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-400">No Wknd</Badge>}
                              {pc.restrictions.escortRequired && <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">Escort Req</Badge>}
                              {pc.restrictions.policeEscort && <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">Police</Badge>}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">Max {pc.restrictions.maxSpeed} mph</span>
                        </div>
                        <p className="text-xs text-slate-500">{pc.restrictions.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {plan.warnings.length > 0 && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-red-400">Warnings</span>
                  </div>
                  <div className="space-y-1.5">
                    {plan.warnings.map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-red-300">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {plan.recommendations.length > 0 && (
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Pre-Departure Checklist</span>
                  </div>
                  <div className="space-y-1.5">
                    {plan.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-emerald-300">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!plan && !routePlanQuery.isLoading && !showForm && (
            <div className="text-center py-8">
              <Route className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No route plan generated yet</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowForm(true)}>
                Plan Route
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
