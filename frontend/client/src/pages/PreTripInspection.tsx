/**
 * PRE-TRIP INSPECTION PAGE (DVIR)
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ClipboardCheck, CheckCircle, XCircle, AlertTriangle,
  Truck, Camera, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

const INSPECTION_CATEGORIES = [
  { id: "brakes", name: "Brakes", items: ["Service Brakes", "Parking Brake", "Brake Lines", "Air Compressor"] },
  { id: "tires", name: "Tires & Wheels", items: ["Tire Condition", "Tire Pressure", "Lug Nuts", "Wheel Seals"] },
  { id: "lights", name: "Lights & Reflectors", items: ["Headlights", "Tail Lights", "Turn Signals", "Reflectors"] },
  { id: "steering", name: "Steering", items: ["Steering Wheel", "Power Steering", "Tie Rods", "Steering Column"] },
  { id: "fluids", name: "Fluids", items: ["Engine Oil", "Coolant", "Transmission Fluid", "Windshield Washer"] },
  { id: "safety", name: "Safety Equipment", items: ["Fire Extinguisher", "Triangles", "First Aid Kit", "Spare Fuses"] },
];

export default function PreTripInspection() {
  const [, setLocation] = useLocation();
  const [inspectionResults, setInspectionResults] = useState<Record<string, "pass" | "fail" | null>>({});
  const [notes, setNotes] = useState("");

  const vehicleQuery = (trpc as any).drivers.getCurrentVehicle.useQuery();
  const previousQuery = (trpc as any).inspections.getPrevious.useQuery();

  const submitMutation = (trpc as any).inspections.submit.useMutation({
    onSuccess: () => { toast.success("Inspection submitted"); setLocation("/driver"); },
    onError: (error: any) => toast.error("Failed to submit inspection", { description: error.message }),
  });

  const vehicle = vehicleQuery.data;

  const handleItemResult = (itemId: string, result: "pass" | "fail") => {
    setInspectionResults((prev: any) => ({ ...prev, [itemId]: result }));
  };

  const getCompletionPercentage = () => {
    const totalItems = INSPECTION_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
    const completedItems = Object.keys(inspectionResults).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  const hasDefects = Object.values(inspectionResults).some((r: any) => r === "fail");

  const handleSubmit = () => {
    if (getCompletionPercentage() < 100) {
      toast.error("Please complete all inspection items");
      return;
    }
    submitMutation.mutate({
      vehicleId: vehicle?.id || "",
      type: "pre_trip" as const,
      odometer: 0,
      items: Object.entries(inspectionResults).map(([id, status]) => ({ id, category: "general", name: id, status: status as "pass" | "fail" | "na" })),
      overallStatus: hasDefects ? "fail" as const : "pass" as const,
      notes,
    } as any);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Pre-Trip Inspection
        </h1>
        <p className="text-slate-400 text-sm mt-1">Driver Vehicle Inspection Report (DVIR)</p>
      </div>

      {/* Vehicle Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          {vehicleQuery.isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-cyan-500/20">
                  <Truck className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{vehicle?.unitNumber}</p>
                  <p className="text-sm text-slate-400">{vehicle?.make} {vehicle?.model} • {vehicle?.year}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Odometer</p>
                <p className="text-white font-medium">{vehicle?.odometer?.toLocaleString()} mi</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Inspection Progress</span>
            <span className="text-white font-bold">{getCompletionPercentage()}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all" style={{ width: `${getCompletionPercentage()}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Inspection Categories */}
      {INSPECTION_CATEGORIES.map((category: any) => (
        <Card key={category.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">{category.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {category.items.map((item: any) => {
              const itemId = `${category.id}_${item.toLowerCase().replace(/\s/g, "_")}`;
              const result = inspectionResults[itemId];
              
              return (
                <div key={itemId} className={cn("p-3 rounded-xl flex items-center justify-between", result === "pass" ? "bg-green-500/10 border border-green-500/20" : result === "fail" ? "bg-red-500/10 border border-red-500/20" : "bg-slate-700/30")}>
                  <span className={cn("font-medium", result === "pass" ? "text-green-400" : result === "fail" ? "text-red-400" : "text-white")}>{item}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant={result === "pass" ? "default" : "outline"} className={cn("rounded-lg", result === "pass" ? "bg-green-600 hover:bg-green-700" : "bg-slate-700/50 border-slate-600/50 hover:bg-green-500/20 hover:border-green-500/30")} onClick={() => handleItemResult(itemId, "pass")}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant={result === "fail" ? "default" : "outline"} className={cn("rounded-lg", result === "fail" ? "bg-red-600 hover:bg-red-700" : "bg-slate-700/50 border-slate-600/50 hover:bg-red-500/20 hover:border-red-500/30")} onClick={() => handleItemResult(itemId, "fail")}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Notes */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Notes / Defects</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Describe any defects or issues found..." className="bg-slate-700/30 border-slate-600/50 rounded-xl min-h-[100px]" />
          <Button variant="outline" className="mt-3 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
            <Camera className="w-4 h-4 mr-2" />Add Photo
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="space-y-3">
        {hasDefects && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Defects found - vehicle may require maintenance</span>
          </div>
        )}
        <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-xl py-6 text-lg" onClick={handleSubmit} disabled={submitMutation.isPending}>
          <Send className="w-5 h-5 mr-2" />
          Submit Inspection
        </Button>
      </div>
    </div>
  );
}
