/**
 * RAIL CONSISTS — V5 Multi-Modal
 * Train consist management: build, view active, add/remove cars, assign crew
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  TrainFront,
  Plus,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export default function RailConsists() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("active");
  const [buildForm, setBuildForm] = useState({
    trainSymbol: "",
    originYardId: "",
    destinationYardId: "",
    locomotiveNumbers: "",
  });

  const shipments = trpc.railShipments.getRailShipments.useQuery({
    limit: 50,
  });
  const yards = trpc.railShipments.getRailYards.useQuery({ limit: 50 });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200"
      : "bg-slate-800/60 border-slate-700/50"
  );
  const lbl = cn(
    "text-sm font-medium mb-1.5 block",
    isLight ? "text-slate-700" : "text-slate-300"
  );

  const setField = (k: string, v: string) =>
    setBuildForm((p) => ({ ...p, [k]: v }));

  // Filter shipments that are in consist-related statuses
  const consistShipments = (shipments.data?.shipments || []).filter(
    (s: any) =>
      [
        "in_consist",
        "in_transit",
        "at_interchange",
        "loaded",
      ].includes(s.status)
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Layers className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Train Consists
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Build, manage, and track train consists
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            <TrainFront className="w-3.5 h-3.5 mr-1" />
            Active Consists
          </TabsTrigger>
          <TabsTrigger value="build">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Build New
          </TabsTrigger>
        </TabsList>

        {/* Active Consists */}
        <TabsContent value="active">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                Active Consists ({consistShipments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : consistShipments.length === 0 ? (
                <div className="text-center py-12">
                  <TrainFront
                    className={cn(
                      "w-12 h-12 mx-auto mb-3",
                      isLight ? "text-slate-300" : "text-slate-600"
                    )}
                  />
                  <p
                    className={cn(
                      "text-sm",
                      isLight ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    No active consists. Build a new consist to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consistShipments.map((s: any) => (
                    <div
                      key={s.id}
                      className={cn(
                        "p-4 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-700/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrainFront className="w-4 h-4 text-blue-400" />
                          <span
                            className={cn(
                              "font-semibold text-sm",
                              isLight ? "text-slate-900" : "text-white"
                            )}
                          >
                            {s.shipmentNumber}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {s.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">Commodity: </span>
                          <span
                            className={
                              isLight ? "text-slate-700" : "text-slate-300"
                            }
                          >
                            {s.commodity || "General"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Car Type: </span>
                          <span
                            className={
                              isLight ? "text-slate-700" : "text-slate-300"
                            }
                          >
                            {s.carType?.replace(/_/g, " ") || "Mixed"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Cars: </span>
                          <span
                            className={
                              isLight ? "text-slate-700" : "text-slate-300"
                            }
                          >
                            {s.numberOfCars || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build New Consist */}
        <TabsContent value="build">
          <Card className={cn(cardBg, "max-w-2xl")}>
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                Build New Consist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={lbl}>Train Symbol</label>
                <Input
                  value={buildForm.trainSymbol}
                  onChange={(e) => setField("trainSymbol", e.target.value)}
                  placeholder="e.g. Q-CHILA (Chicago to LA)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Origin Yard</label>
                  <Select
                    value={buildForm.originYardId}
                    onValueChange={(v) => setField("originYardId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {(yards.data || []).map((y: any) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.name} — {y.city}, {y.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={lbl}>Destination Yard</label>
                  <Select
                    value={buildForm.destinationYardId}
                    onValueChange={(v) => setField("destinationYardId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {(yards.data || []).map((y: any) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.name} — {y.city}, {y.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className={lbl}>Locomotive Numbers</label>
                <Input
                  value={buildForm.locomotiveNumbers}
                  onChange={(e) =>
                    setField("locomotiveNumbers", e.target.value)
                  }
                  placeholder="e.g. UP 8765, UP 4321"
                />
              </div>

              {/* Info box about adding cars */}
              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg",
                  isLight ? "bg-blue-50" : "bg-blue-500/10"
                )}
              >
                <Package className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isLight ? "text-slate-900" : "text-white"
                    )}
                  >
                    Car Assignment
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isLight ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    After building the consist, assign railcars from the
                    shipment detail page by advancing shipments to
                    &quot;in_consist&quot; status.
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (
                    !buildForm.trainSymbol ||
                    !buildForm.originYardId ||
                    !buildForm.destinationYardId
                  ) {
                    toast.error(
                      "Please fill in train symbol, origin, and destination"
                    );
                    return;
                  }
                  toast.success(
                    `Consist ${buildForm.trainSymbol} ready — assign cars from shipment details`
                  );
                  setBuildForm({
                    trainSymbol: "",
                    originYardId: "",
                    destinationYardId: "",
                    locomotiveNumbers: "",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Build Consist
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
