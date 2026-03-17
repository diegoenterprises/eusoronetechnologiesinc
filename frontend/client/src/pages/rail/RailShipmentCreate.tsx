/**
 * RAIL SHIPMENT CREATE — V5 Multi-Modal
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CAR_TYPES = ["boxcar","gondola","hopper","tank_car","flat_car","refrigerated","autorack","intermodal_well","centerbeam","covered_hopper"];

export default function RailShipmentCreate() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ originYardId: "", destinationYardId: "", carType: "", commodity: "", weightLbs: "", hazmatClass: "", numberOfCars: "1", specialInstructions: "" });
  const yards = trpc.railShipments.getRailYards.useQuery({ limit: 50 });
  const create = trpc.railShipments.createRailShipment.useMutation({
    onSuccess: (d) => { toast.success(`Shipment ${d.shipmentNumber} created`); navigate(`/rail/shipments/${d.id}`); },
    onError: (e) => toast.error(e.message),
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const submit = () => {
    if (!form.originYardId || !form.destinationYardId) return toast.error("Select origin and destination yards");
    create.mutate({ originYardId: Number(form.originYardId), destinationYardId: Number(form.destinationYardId), carType: (form.carType || undefined) as any, commodity: form.commodity || undefined, weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined, hazmatClass: form.hazmatClass || undefined, numberOfCars: Number(form.numberOfCars) || 1, specialInstructions: form.specialInstructions || undefined });
  };
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const lbl = cn("text-sm font-medium mb-1.5 block", isLight ? "text-slate-700" : "text-slate-300");

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10"><TrainFront className="w-6 h-6 text-blue-400" /></div>
        <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Create Rail Shipment</h1>
      </div>
      <Card className={cn("border max-w-2xl", cardBg)}>
        <CardHeader><CardTitle className={cn(isLight ? "text-slate-900" : "text-white")}>Shipment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={lbl}>Origin Yard *</label>
              <Select value={form.originYardId} onValueChange={v => set("originYardId", v)}>
                <SelectTrigger><SelectValue placeholder="Select origin" /></SelectTrigger>
                <SelectContent>{(yards.data || []).map((y: any) => <SelectItem key={y.id} value={String(y.id)}>{y.name} — {y.city}, {y.state}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><label className={lbl}>Destination Yard *</label>
              <Select value={form.destinationYardId} onValueChange={v => set("destinationYardId", v)}>
                <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                <SelectContent>{(yards.data || []).map((y: any) => <SelectItem key={y.id} value={String(y.id)}>{y.name} — {y.city}, {y.state}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={lbl}>Car Type</label>
              <Select value={form.carType} onValueChange={v => set("carType", v)}>
                <SelectTrigger><SelectValue placeholder="Select car type" /></SelectTrigger>
                <SelectContent>{CAR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><label className={lbl}># of Cars</label><Input type="number" value={form.numberOfCars} onChange={e => set("numberOfCars", e.target.value)} /></div>
          </div>
          <div><label className={lbl}>Commodity</label><Input value={form.commodity} onChange={e => set("commodity", e.target.value)} placeholder="e.g. Grain, Coal, Chemicals" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={lbl}>Weight (lbs)</label><Input type="number" value={form.weightLbs} onChange={e => set("weightLbs", e.target.value)} /></div>
            <div><label className={lbl}>Hazmat Class</label><Input value={form.hazmatClass} onChange={e => set("hazmatClass", e.target.value)} placeholder="Optional" /></div>
          </div>
          <div><label className={lbl}>Special Instructions</label><Input value={form.specialInstructions} onChange={e => set("specialInstructions", e.target.value)} /></div>
          <Button onClick={submit} disabled={create.isPending} className="w-full bg-blue-600 hover:bg-blue-700">{create.isPending ? "Creating..." : "Create Rail Shipment"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
