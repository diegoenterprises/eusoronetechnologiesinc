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
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, Calendar, ArrowRight,
  Send, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CreateLoad() {
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
  });

  const createMutation = trpc.loads.create.useMutation({
    onSuccess: (data) => {
      toast.success("Load created successfully");
      setLocation(`/loads/${data.id}`);
    },
    onError: (error) => toast.error("Failed to create load", { description: error.message }),
  });

  const handleSubmit = () => {
    if (!formData.originCity || !formData.destinationCity || !formData.pickupDate || !formData.equipmentType) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      origin: { city: formData.originCity, state: formData.originState },
      destination: { city: formData.destinationCity, state: formData.destinationState },
      pickupDate: new Date(formData.pickupDate),
      deliveryDate: new Date(formData.deliveryDate),
      equipmentType: formData.equipmentType,
      weight: parseInt(formData.weight) || 0,
      rate: parseFloat(formData.rate) || 0,
      commodity: formData.commodity,
      notes: formData.notes,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Create Load
          </h1>
          <p className="text-slate-400 text-sm mt-1">Post a new load for carriers to bid on</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
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
                <Input value={formData.originCity} onChange={(e) => setFormData({ ...formData, originCity: e.target.value })} placeholder="Enter city" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.originState} onChange={(e) => setFormData({ ...formData, originState: e.target.value })} placeholder="Enter state" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Pickup Date *</Label>
              <Input type="date" value={formData.pickupDate} onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
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
                <Input value={formData.destinationCity} onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })} placeholder="Enter city" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">State</Label>
                <Input value={formData.destinationState} onChange={(e) => setFormData({ ...formData, destinationState: e.target.value })} placeholder="Enter state" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Delivery Date</Label>
              <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Load Details */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
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
                <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry_van">Dry Van</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="step_deck">Step Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Weight (lbs)</Label>
                <Input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="Enter weight" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Rate ($)</Label>
                <Input type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} placeholder="Enter rate" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Commodity</Label>
              <Input value={formData.commodity} onChange={(e) => setFormData({ ...formData, commodity: e.target.value })} placeholder="What's being shipped?" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions or requirements..." className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50 min-h-[150px]" />
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation("/loads")}>
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
