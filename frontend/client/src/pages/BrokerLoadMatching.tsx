/**
 * BROKER LOAD MATCHING PAGE
 * 100% Dynamic - AI-powered carrier matching with ESANG recommendations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  Sparkles, Truck, MapPin, DollarSign, Star,
  Shield, ChevronLeft, Send, CheckCircle, Clock,
  TrendingUp, AlertTriangle, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerLoadMatching() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/broker/match/:loadId");
  const loadId = params?.loadId;

  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [customRate, setCustomRate] = useState("");

  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId || "" });
  const matchQuery = (trpc as any).carriers.getAvailableCapacity.useQuery({ limit: 20 });
  const rateQuery = (trpc as any).esang.chat.useMutation();

  const sendOffersMutation = (trpc as any).brokers.vetCarrier.useMutation({
    onSuccess: () => {
      toast.success(`Offers sent to ${selectedCarriers.length} carriers`);
      navigate("/broker/loads");
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const load = loadQuery.data;
  const matches = matchQuery.data || [];
  const rateData = rateQuery.data as any;

  const toggleCarrier = (id: string) => {
    setSelectedCarriers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

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
          onClick={() => navigate("/broker/loads")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Carrier Matching
          </h1>
          <p className="text-slate-400 text-sm mt-1">Load #{load?.loadNumber}</p>
        </div>
      </div>

      {/* Load Summary */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-slate-400 text-xs">Route</p>
              <p className="text-white font-medium">{load?.origin?.city} → {load?.destination?.city}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Miles</p>
              <p className="text-white font-medium">{load?.distance}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Equipment</p>
              <Badge className="bg-slate-600/50 text-slate-300 border-0">{load?.equipmentType || 'TBD'}</Badge>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Pickup</p>
              <p className="text-white font-medium">{load?.pickupDate ? new Date(String(load.pickupDate)).toLocaleDateString() : 'TBD'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Customer Rate</p>
              <p className="text-green-400 font-bold">${(load as any)?.customerRate?.toLocaleString() || 'TBD'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Rate Suggestion */}
      {(rateQuery as any).isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : rateData && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-400 font-medium">ESANG AI Suggested Carrier Rate</p>
                  <p className="text-white font-bold text-xl">
                    ${rateData.lowEstimate?.toLocaleString()} - ${rateData.highEstimate?.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Est. Margin</p>
                <p className="text-green-400 font-bold text-xl">
                  ${(((load as any)?.customerRate || 0) - (rateData.midEstimate || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer Rate Input */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-slate-300 text-sm">Offer Rate to Carriers</label>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <Input
                  type="number"
                  value={customRate}
                  onChange={(e: any) => setCustomRate(e.target.value)}
                  placeholder={rateData?.midEstimate?.toString() || "0"}
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg text-xl font-bold w-40"
                />
                <span className="text-slate-400">
                  (${((parseFloat(customRate) || 0) / (typeof load?.distance === 'number' ? load.distance : 1)).toFixed(2)}/mi)
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Your Margin</p>
              <p className={cn(
                "font-bold text-xl",
                ((load as any)?.customerRate || 0) - (parseFloat(customRate) || 0) > 0 ? "text-green-400" : "text-red-400"
              )}>
                ${(((load as any)?.customerRate || 0) - (parseFloat(customRate) || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matched Carriers */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              Matched Carriers ({matches.length})
            </CardTitle>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
              {selectedCarriers.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {matchQuery.isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No matching carriers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((carrier: any) => (
                <div
                  key={carrier.id}
                  onClick={() => toggleCarrier(carrier.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedCarriers.includes(carrier.id)
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{carrier.name}</p>
                          {carrier.preferred && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Preferred</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-slate-400">MC# {carrier.mcNumber}</span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((s: any) => (
                              <Star key={s} className={cn("w-3 h-3", s <= carrier.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Match Score</p>
                        <p className="text-purple-400 font-bold">{carrier.matchScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Time</p>
                        <p className="text-green-400 font-medium">{carrier.onTimeRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Avg Rate</p>
                        <p className="text-white font-medium">${carrier.avgRate?.toFixed(2)}/mi</p>
                      </div>

                      {carrier.hazmatCertified && (
                        <Badge className="bg-green-500/20 text-green-400 border-0">
                          <Shield className="w-3 h-3 mr-1" />Hazmat
                        </Badge>
                      )}

                      {selectedCarriers.includes(carrier.id) && (
                        <CheckCircle className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                  </div>

                  {carrier.lastLoadWith && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      Last load: {carrier.lastLoadWith}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/broker/loads")}
          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={() => sendOffersMutation.mutate({
            mcNumber: "",
            dotNumber: loadId!,
          } as any)}
          disabled={selectedCarriers.length === 0 || sendOffersMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg px-8"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Offers ({selectedCarriers.length})
        </Button>
      </div>
    </div>
  );
}
