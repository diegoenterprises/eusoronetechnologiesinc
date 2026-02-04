/**
 * CARRIER BID SUBMIT PAGE
 * 100% Dynamic - Submit bids on available loads with profitability preview
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  DollarSign, TrendingUp, MapPin, Truck, Clock,
  ChevronLeft, Send, AlertTriangle, Calendar,
  Gauge, Star, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierBidSubmit() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/carrier/bid/:loadId");
  const loadId = params?.loadId;

  const [bidAmount, setBidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [equipmentType, setEquipmentType] = useState("");

  const loadQuery = trpc.loads.getById.useQuery({ id: loadId || "" });
  const rateQuery = trpc.esang.suggestCarrierRate.useQuery({ loadId: loadId || "" });
  const profitQuery = trpc.carriers.calculateProfit.useQuery({
    loadId: loadId || "",
    bidAmount: parseFloat(bidAmount) || 0,
  }, { enabled: !!bidAmount });

  const submitBidMutation = trpc.carriers.submitBid.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully");
      navigate("/carrier/bids");
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const load = loadQuery.data;
  const rateData = rateQuery.data;
  const profit = profitQuery.data;

  const ratePerMile = load?.distance && bidAmount 
    ? (parseFloat(bidAmount) / load.distance).toFixed(2) 
    : "0.00";

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/carrier/loadboard")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Submit Bid
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
      </div>

      {/* Load Details */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-white font-bold text-xl">{load?.origin?.city}</p>
              <p className="text-slate-400 text-sm">{load?.origin?.state}</p>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-red-400" />
              <div className="w-3 h-3 rounded-full bg-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl">{load?.destination?.city}</p>
              <p className="text-slate-400 text-sm">{load?.destination?.state}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Package className="w-3 h-3" />Miles</p>
              <p className="text-white font-medium">{load?.distance}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Equipment</p>
              <p className="text-white font-medium">{load?.equipment}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Pickup</p>
              <p className="text-white font-medium">{load?.pickupDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Delivery</p>
              <p className="text-white font-medium">{load?.deliveryDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Star className="w-3 h-3" />Shipper</p>
              <p className="text-white font-medium">{load?.shipper?.name}</p>
            </div>
          </div>

          {load?.hazmat && (
            <Badge className="bg-orange-500/20 text-orange-400 border-0 mt-4">
              <AlertTriangle className="w-3 h-3 mr-1" />Hazmat - {load.hazmatClass}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* AI Rate Suggestion */}
      {rateData && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-purple-400 font-medium">ESANG AI Market Rate</p>
                <p className="text-white font-bold text-xl">
                  ${rateData.lowEstimate?.toLocaleString()} - ${rateData.highEstimate?.toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm">
                  ${(rateData.lowEstimate / load?.distance).toFixed(2)} - ${(rateData.highEstimate / load?.distance).toFixed(2)}/mi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bid Input */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Your Bid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Bid Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={rateData?.midEstimate?.toString() || "0"}
                  className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg text-xl font-bold"
                />
              </div>
              <p className="text-slate-400 text-sm">${ratePerMile}/mi</p>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for the shipper..."
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profit Preview */}
        <Card className={cn(
          "rounded-xl",
          profit?.netProfit > 0 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-red-500/10 border-red-500/30"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              Profit Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!bidAmount ? (
              <div className="text-center py-8 text-slate-400">
                Enter a bid amount to see profitability
              </div>
            ) : profitQuery.isLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <span className="text-slate-400">Revenue</span>
                  <span className="text-white font-medium">${parseFloat(bidAmount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <span className="text-slate-400">Est. Fuel Cost</span>
                  <span className="text-red-400">-${profit?.fuelCost?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <span className="text-slate-400">Est. Driver Pay</span>
                  <span className="text-red-400">-${profit?.driverPay?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                  <span className="text-slate-400">Other Costs</span>
                  <span className="text-red-400">-${profit?.otherCosts?.toLocaleString()}</span>
                </div>
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-lg",
                  profit?.netProfit > 0 ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                  <span className={cn("font-bold", profit?.netProfit > 0 ? "text-green-400" : "text-red-400")}>
                    Net Profit
                  </span>
                  <span className={cn("font-bold text-xl", profit?.netProfit > 0 ? "text-green-400" : "text-red-400")}>
                    ${profit?.netProfit?.toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-sm text-center">
                  {profit?.marginPercent?.toFixed(1)}% margin
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/carrier/loadboard")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => submitBidMutation.mutate({
            loadId: loadId!,
            amount: parseFloat(bidAmount),
            notes,
          })}
          disabled={!bidAmount || submitBidMutation.isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Bid
        </Button>
      </div>
    </div>
  );
}
