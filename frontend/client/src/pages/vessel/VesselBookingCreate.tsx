/**
 * VESSEL BOOKING CREATE — V5 Multi-Modal
 * Create new ocean freight booking: port selectors, container type/count,
 * commodity, weight, volume, incoterms, hazmat (IMDG), sailing schedule
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Ship, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CARGO_TYPES = [
  "container",
  "bulk_dry",
  "bulk_liquid",
  "breakbulk",
  "ro_ro",
  "reefer",
  "project_cargo",
];

const INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
];

const FREIGHT_TERMS = ["prepaid", "collect", "third_party"];

export default function VesselBookingCreate() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    originPortId: "",
    destinationPortId: "",
    cargoType: "",
    commodity: "",
    numberOfContainers: "1",
    totalWeightKg: "",
    totalVolumeCBM: "",
    hazmatClass: "",
    imdgCode: "",
    incoterms: "",
    freightTerms: "",
  });

  // Fetch ports list — reused from the vesselShipments router via getPortDetails
  // For now we use a simple query approach
  const portsQuery = trpc.vesselShipments.getVesselShipments.useQuery(
    { limit: 1 },
    { enabled: false }
  );
  // We'll use a dedicated ports list — for now fetch from port directory
  // This is a placeholder; in production we'd have a ports list query

  const create = trpc.vesselShipments.createVesselBooking.useMutation({
    onSuccess: (d) => {
      toast.success(`Booking ${d.bookingNumber} created`);
      navigate(`/vessel/bookings/${d.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.originPortId || !form.destinationPortId) {
      return toast.error("Select origin and destination ports");
    }
    create.mutate({
      originPortId: Number(form.originPortId),
      destinationPortId: Number(form.destinationPortId),
      cargoType: (form.cargoType || undefined) as any,
      commodity: form.commodity || undefined,
      numberOfContainers: Number(form.numberOfContainers) || 1,
      totalWeightKg: form.totalWeightKg ? Number(form.totalWeightKg) : undefined,
      totalVolumeCBM: form.totalVolumeCBM ? Number(form.totalVolumeCBM) : undefined,
      hazmatClass: form.hazmatClass || undefined,
      imdgCode: form.imdgCode || undefined,
      incoterms: form.incoterms || undefined,
      freightTerms: (form.freightTerms || undefined) as any,
    });
  };

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
  );
  const lbl = cn(
    "text-sm font-medium mb-1.5 block",
    isLight ? "text-slate-700" : "text-slate-300"
  );

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Ship className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            Create Vessel Booking
          </h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
            Request a new ocean freight booking
          </p>
        </div>
      </div>

      <Card className={cn(cardBg, "max-w-2xl")}>
        <CardHeader>
          <CardTitle className={cn(isLight ? "text-slate-900" : "text-white")}>
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Port Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Origin Port ID *</label>
              <Input
                type="number"
                value={form.originPortId}
                onChange={(e) => set("originPortId", e.target.value)}
                placeholder="Port ID (e.g. 1)"
              />
            </div>
            <div>
              <label className={lbl}>Destination Port ID *</label>
              <Input
                type="number"
                value={form.destinationPortId}
                onChange={(e) => set("destinationPortId", e.target.value)}
                placeholder="Port ID (e.g. 5)"
              />
            </div>
          </div>

          {/* Cargo Type & Containers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Cargo Type</label>
              <Select value={form.cargoType} onValueChange={(v) => set("cargoType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={lbl}># of Containers</label>
              <Input
                type="number"
                value={form.numberOfContainers}
                onChange={(e) => set("numberOfContainers", e.target.value)}
              />
            </div>
          </div>

          {/* Commodity */}
          <div>
            <label className={lbl}>Commodity</label>
            <Input
              value={form.commodity}
              onChange={(e) => set("commodity", e.target.value)}
              placeholder="e.g. Electronics, Auto Parts, Textiles"
            />
          </div>

          {/* Weight & Volume */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Total Weight (kg)</label>
              <Input
                type="number"
                value={form.totalWeightKg}
                onChange={(e) => set("totalWeightKg", e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Total Volume (CBM)</label>
              <Input
                type="number"
                value={form.totalVolumeCBM}
                onChange={(e) => set("totalVolumeCBM", e.target.value)}
              />
            </div>
          </div>

          {/* Incoterms & Freight Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Incoterms</label>
              <Select value={form.incoterms} onValueChange={(v) => set("incoterms", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incoterm" />
                </SelectTrigger>
                <SelectContent>
                  {INCOTERMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={lbl}>Freight Terms</label>
              <Select
                value={form.freightTerms}
                onValueChange={(v) => set("freightTerms", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terms" />
                </SelectTrigger>
                <SelectContent>
                  {FREIGHT_TERMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hazmat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Hazmat Class</label>
              <Input
                value={form.hazmatClass}
                onChange={(e) => set("hazmatClass", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className={lbl}>IMDG Code</label>
              <Input
                value={form.imdgCode}
                onChange={(e) => set("imdgCode", e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={create.isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            {create.isPending ? "Creating..." : "Create Vessel Booking"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
