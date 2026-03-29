/**
 * CREATE LOAD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import DatePicker from "@/components/DatePicker";
import { Badge } from "@/components/ui/badge";
import {
  Package, MapPin, Truck, DollarSign, Calendar, ArrowRight,
  Send, Loader2, Globe, UserCheck, Briefcase, Building2
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function CreateLoad() {
  const { theme } = useTheme(); const L = theme === "light";
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    originCity: "",
    originState: "",
    destinationCity: "",
    destinationState: "",
    pickupDate: "",
    deliveryDate: "",
    equipmentType: "",
    weight: "",
    rate: "",
    commodity: "",
    notes: "",
    assignmentType: "open_market" as "open_market" | "direct_catalyst" | "broker" | "own_fleet",
  });

  const ASSIGNMENT_OPTIONS = [
    { value: "open_market" as const, label: "Open Market", desc: "Post to all catalysts for bidding", icon: Globe },
    { value: "direct_catalyst" as const, label: "Direct Catalyst", desc: "Assign to a specific catalyst", icon: UserCheck },
    { value: "broker" as const, label: "Via Broker", desc: "Let a broker coordinate", icon: Briefcase },
    { value: "own_fleet" as const, label: "Own Fleet", desc: "Use your own trucks", icon: Building2 },
  ];

  const createMutation = (trpc as any).loads.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Load created successfully");
      setLocation(`/loads/${data.id}`);
    },
    onError: (error: any) => toast.error("Failed to create load", { description: error.message }),
  });

  const handleSubmit = () => {
    if (!formData.originCity || !formData.destinationCity || !formData.pickupDate || !formData.equipmentType) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      origin: [formData.originCity, formData.originState].filter(Boolean).join(", "),
      destination: [formData.destinationCity, formData.destinationState].filter(Boolean).join(", "),
      pickupDate: formData.pickupDate || undefined,
      deliveryDate: formData.deliveryDate || undefined,
      weight: formData.weight || undefined,
      rate: formData.rate || undefined,
      equipment: formData.equipmentType || undefined,
      productName: formData.commodity || undefined,
      assignmentType: formData.assignmentType,
    } as any);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Create Load
          </h1>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Post a new load for catalysts to bid on</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin */}
        <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-900" : "text-white")}>
              <div className="p-2 rounded-full bg-green-500/20">
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              Origin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">City *</Label>
                <Input value={formData.originCity} onChange={(e: any) => setFormData({ ...formData, originCity: e.target.value })} placeholder="Enter city" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.originState} onChange={(e: any) => setFormData({ ...formData, originState: e.target.value })} placeholder="Enter state" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Pickup Date *</Label>
              <DatePicker value={formData.pickupDate} onChange={(v) => setFormData({ ...formData, pickupDate: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-900" : "text-white")}>
              <div className="p-2 rounded-full bg-red-500/20">
                <MapPin className="w-5 h-5 text-red-400" />
              </div>
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">City *</Label>
                <Input value={formData.destinationCity} onChange={(e: any) => setFormData({ ...formData, destinationCity: e.target.value })} placeholder="Enter city" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.destinationState} onChange={(e: any) => setFormData({ ...formData, destinationState: e.target.value })} placeholder="Enter state" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Delivery Date</Label>
              <DatePicker value={formData.deliveryDate} onChange={(v) => setFormData({ ...formData, deliveryDate: v })} />
            </div>
          </CardContent>
        </Card>

        {/* Load Details */}
        <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-900" : "text-white")}>
              <div className="p-2 rounded-full bg-blue-500/20">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              Load Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Equipment Type *</Label>
              <Select value={formData.equipmentType} onValueChange={(value) => setFormData({ ...formData, equipmentType: value })}>
                <SelectTrigger className={cn("rounded-lg", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")}>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry_van">Dry Van (53ft)</SelectItem>
                  <SelectItem value="reefer">Refrigerated (Reefer)</SelectItem>
                  <SelectItem value="flatbed">Standard Flatbed</SelectItem>
                  <SelectItem value="step_deck">Step Deck / Drop Deck</SelectItem>
                  <SelectItem value="lowboy">Lowboy / RGN</SelectItem>
                  <SelectItem value="double_drop">Double Drop / Stretch</SelectItem>
                  <SelectItem value="conestoga">Conestoga (Rolling-Tarp)</SelectItem>
                  <SelectItem value="tanker">Petroleum Tank (MC-306)</SelectItem>
                  <SelectItem value="gas_tank">Pressurized Gas Tank (MC-331)</SelectItem>
                  <SelectItem value="cryogenic">Cryogenic Tank (MC-338)</SelectItem>
                  <SelectItem value="hazmat_van">Hazmat-Rated Van</SelectItem>
                  <SelectItem value="food_grade_tank">Food-Grade Liquid Tank</SelectItem>
                  <SelectItem value="water_tank">Water Tank</SelectItem>
                  <SelectItem value="auto_carrier">Auto Carrier / Car Hauler</SelectItem>
                  <SelectItem value="livestock">Livestock / Cattle Pot</SelectItem>
                  <SelectItem value="log_trailer">Log Trailer</SelectItem>
                  <SelectItem value="grain_hopper">Grain Hopper</SelectItem>
                  <SelectItem value="bulk_hopper">Dry Bulk / Pneumatic Hopper</SelectItem>
                  <SelectItem value="pneumatic">Pneumatic Tank</SelectItem>
                  <SelectItem value="dump_trailer">End Dump / Bottom Dump</SelectItem>
                  <SelectItem value="intermodal">Intermodal Container Chassis</SelectItem>
                  <SelectItem value="curtainside">Curtainside / Tautliner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Weight (lbs)</Label>
                <Input type="number" value={formData.weight} onChange={(e: any) => setFormData({ ...formData, weight: e.target.value })} placeholder="Enter weight" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Rate ($)</Label>
                <Input type="number" value={formData.rate} onChange={(e: any) => setFormData({ ...formData, rate: e.target.value })} placeholder="Enter rate" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Commodity</Label>
              <Input value={formData.commodity} onChange={(e: any) => setFormData({ ...formData, commodity: e.target.value })} placeholder="What's being shipped?" className={cn("rounded-lg focus:border-cyan-500/50", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
            </div>
          </CardContent>
        </Card>

        {/* Posting Type */}
        <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-900" : "text-white")}>
              <div className="p-2 rounded-full bg-purple-500/20">
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              Posting Type *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {ASSIGNMENT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = formData.assignmentType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, assignmentType: opt.value })}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-[#1473FF] bg-[#1473FF]/10 ring-1 ring-[#1473FF]/30"
                        : L ? "border-slate-200 bg-slate-50 hover:border-slate-300" : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn("w-4 h-4", isSelected ? "text-[#1473FF]" : "text-slate-400")} />
                      <span className={cn("text-sm font-semibold", isSelected ? "text-white" : L ? "text-slate-700" : "text-slate-300")}>{opt.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className={cn("rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg", L ? "text-slate-900" : "text-white")}>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={formData.notes} onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions or requirements..." className={cn("rounded-lg focus:border-cyan-500/50 min-h-[150px]", L ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/50")} />
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" className={cn("rounded-lg", L ? "bg-slate-100 border-slate-200 hover:bg-slate-200" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => setLocation("/load/board")}>
          Cancel
        </Button>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg px-8" onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Create Load
        </Button>
      </div>
    </div>
  );
}
