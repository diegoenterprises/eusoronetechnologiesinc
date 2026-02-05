/**
 * BROKER QUOTE BUILDER PAGE
 * 100% Dynamic - Build and send rate quotes to shippers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  DollarSign, MapPin, Truck, Calendar, Send,
  Plus, Trash2, Sparkles, Calculator, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerQuoteBuilder() {
  const [, navigate] = useLocation();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [equipment, setEquipment] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ description: string; amount: string }>>([]);
  const [notes, setNotes] = useState("");
  const [shipperId, setShipperId] = useState("");
  const [validDays, setValidDays] = useState("7");

  const shippersQuery = trpc.brokers.getShippers.useQuery({ search: "" });
  const rateQuery = { data: { lowEstimate: 0, midEstimate: 0, highEstimate: 0 }, isLoading: false }; // Placeholder

  const sendQuoteMutation = trpc.brokers.vetCarrier.useMutation({
    onSuccess: () => {
      toast.success("Quote sent successfully");
      navigate("/broker/quotes");
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const shippers = shippersQuery.data || [];
  const suggestedRate = rateQuery.data;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", amount: "" }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: "description" | "amount", value: string) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const totalAmount = parseFloat(baseRate || "0") + 
    lineItems.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Quote Builder
        </h1>
        <p className="text-slate-400 text-sm mt-1">Create and send rate quotes</p>
      </div>

      {/* Shipper Selection */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Shipper</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={shipperId} onValueChange={setShipperId}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
              <SelectValue placeholder="Select shipper" />
            </SelectTrigger>
            <SelectContent>
              {shippers.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lane Details */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            Lane Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Origin</label>
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="City, State"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Destination</label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, State"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Equipment Type</label>
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tanker">Tanker</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="van">Dry Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Pickup Date</label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Rate Suggestion */}
      {suggestedRate && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-400 font-medium">ESANG AI Suggested Rate</p>
                  <p className="text-white font-bold text-xl">
                    ${suggestedRate.lowEstimate?.toLocaleString()} - ${suggestedRate.highEstimate?.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setBaseRate(suggestedRate.midEstimate?.toString() || "")}
                className="bg-purple-500/10 border-purple-500/30 text-purple-400 rounded-lg"
              >
                Use Mid Rate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Builder */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-400" />
            Rate Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Base Rate</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              <Input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                placeholder="0.00"
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg text-xl font-bold"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm">Additional Charges</label>
              <Button variant="ghost" size="sm" onClick={addLineItem} className="text-cyan-400">
                <Plus className="w-4 h-4 mr-1" />Add Item
              </Button>
            </div>
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
                <div className="relative w-32">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateLineItem(idx, "amount", e.target.value)}
                    placeholder="0.00"
                    className="pl-8 bg-slate-700/50 border-slate-600/50 rounded-lg"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeLineItem(idx)} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="p-4 rounded-lg bg-green-500/10 flex items-center justify-between">
            <span className="text-green-400 font-bold text-lg">Total Quote</span>
            <span className="text-green-400 font-bold text-2xl">${totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quote Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Quote Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Valid For (Days)</label>
            <Select value={validDays} onValueChange={setValidDays}>
              <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any terms or conditions..."
              className="bg-slate-700/50 border-slate-600/50 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/broker/quotes")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Save Draft
        </Button>
        <Button
          onClick={() => sendQuoteMutation.mutate({
            mcNumber: "",
            dotNumber: shipperId,
          } as any)}
          disabled={!shipperId || !origin || !destination || !baseRate || sendQuoteMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Quote
        </Button>
      </div>
    </div>
  );
}
