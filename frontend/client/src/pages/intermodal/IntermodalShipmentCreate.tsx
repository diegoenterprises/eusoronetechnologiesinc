/**
 * INTERMODAL SHIPMENT CREATE — V5 Multi-Modal
 * Create multi-leg shipment: segment builder with mode selection,
 * visual journey preview, linked shipments across modes
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Layers,
  Plus,
  Trash2,
  Truck,
  TrainFront,
  Ship,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Segment {
  id: number;
  mode: string;
  origin: string;
  destination: string;
  carrier: string;
}

const MODE_ICON: Record<string, React.ReactNode> = {
  TRUCK: <Truck className="w-4 h-4 text-orange-400" />,
  RAIL: <TrainFront className="w-4 h-4 text-blue-400" />,
  VESSEL: <Ship className="w-4 h-4 text-cyan-400" />,
};

const MODE_COLOR: Record<string, string> = {
  TRUCK: "bg-orange-500/20 text-orange-400",
  RAIL: "bg-blue-500/20 text-blue-400",
  VESSEL: "bg-cyan-500/20 text-cyan-400",
};

let segmentIdCounter = 1;

export default function IntermodalShipmentCreate() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();

  const [commodity, setCommodity] = useState("");
  const [containerNumber, setContainerNumber] = useState("");
  const [segments, setSegments] = useState<Segment[]>([
    {
      id: segmentIdCounter++,
      mode: "TRUCK",
      origin: "",
      destination: "",
      carrier: "",
    },
  ]);

  const create = trpc.intermodal.createIntermodalShipment.useMutation({
    onSuccess: (d) => {
      toast.success(`Intermodal shipment ${d.shipmentNumber} created`);
      navigate(`/intermodal/tracking`);
    },
    onError: (e) => toast.error(e.message),
  });

  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      {
        id: segmentIdCounter++,
        mode: "RAIL",
        origin: prev[prev.length - 1]?.destination || "",
        destination: "",
        carrier: "",
      },
    ]);
  };

  const removeSegment = (id: number) => {
    if (segments.length <= 1) return;
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSegment = (id: number, field: keyof Segment, value: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const submit = () => {
    if (segments.some((s) => !s.origin || !s.destination)) {
      return toast.error("All segments need origin and destination");
    }
    create.mutate({
      commodity: commodity || undefined,
      containerNumber: containerNumber || undefined,
      segments: segments.map((s) => ({
        mode: s.mode as any,
        origin: s.origin,
        destination: s.destination,
        carrier: s.carrier || undefined,
      })),
    });
  };

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

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Layers className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1
            className={cn(
              "text-2xl font-bold",
              isLight ? "text-slate-900" : "text-white"
            )}
          >
            Create Intermodal Shipment
          </h1>
          <p
            className={cn(
              "text-sm",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            Build a multi-leg, multi-mode shipment
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* General Info */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              Shipment Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Commodity</label>
                <Input
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  placeholder="e.g. Electronics, Auto Parts"
                />
              </div>
              <div>
                <label className={lbl}>Container Number</label>
                <Input
                  value={containerNumber}
                  onChange={(e) => setContainerNumber(e.target.value)}
                  placeholder="e.g. MSCU1234567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Journey Preview */}
        {segments.length > 0 && (
          <div
            className={cn(
              "flex items-center gap-2 p-4 rounded-xl overflow-x-auto",
              isLight ? "bg-slate-100" : "bg-slate-800/40"
            )}
          >
            {segments.map((s, i) => (
              <React.Fragment key={s.id}>
                {i > 0 && <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0",
                    isLight ? "bg-white border-slate-200" : "bg-slate-700/30 border-slate-600/30"
                  )}
                >
                  {MODE_ICON[s.mode]}
                  <div className="text-xs">
                    <div className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>
                      {s.origin || "Origin"} → {s.destination || "Dest"}
                    </div>
                    <Badge className={cn(MODE_COLOR[s.mode], "text-[9px] px-1 py-0")}>
                      {s.mode}
                    </Badge>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Segments */}
        {segments.map((seg, idx) => (
          <Card key={seg.id} className={cardBg}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle
                className={cn(
                  "text-sm flex items-center gap-2",
                  isLight ? "text-slate-900" : "text-white"
                )}
              >
                {MODE_ICON[seg.mode]}
                Leg {idx + 1}
              </CardTitle>
              {segments.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  onClick={() => removeSegment(seg.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className={lbl}>Mode</label>
                <Select
                  value={seg.mode}
                  onValueChange={(v) => updateSegment(seg.id, "mode", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUCK">
                      <span className="flex items-center gap-2"><Truck size={14} /> Truck (Drayage)</span>
                    </SelectItem>
                    <SelectItem value="RAIL">
                      <span className="flex items-center gap-2"><TrainFront size={14} /> Rail (Cross-country)</span>
                    </SelectItem>
                    <SelectItem value="VESSEL">
                      <span className="flex items-center gap-2"><Ship size={14} /> Vessel (Ocean)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Origin</label>
                  <Input
                    value={seg.origin}
                    onChange={(e) =>
                      updateSegment(seg.id, "origin", e.target.value)
                    }
                    placeholder="City or terminal"
                  />
                </div>
                <div>
                  <label className={lbl}>Destination</label>
                  <Input
                    value={seg.destination}
                    onChange={(e) =>
                      updateSegment(seg.id, "destination", e.target.value)
                    }
                    placeholder="City or terminal"
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Carrier (optional)</label>
                <Input
                  value={seg.carrier}
                  onChange={(e) =>
                    updateSegment(seg.id, "carrier", e.target.value)
                  }
                  placeholder="e.g. JB Hunt, BNSF, MSC"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Segment + Submit */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={addSegment}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Leg
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            {create.isPending
              ? "Creating..."
              : `Create ${segments.length}-Leg Shipment`}
          </Button>
        </div>
      </div>
    </div>
  );
}
