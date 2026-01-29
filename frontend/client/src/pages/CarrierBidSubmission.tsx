/**
 * CARRIER BID SUBMISSION PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, MapPin, Clock, Truck, AlertTriangle,
  CheckCircle, Calendar, Package, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";

export default function CarrierBidSubmission() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const loadId = params.id;

  const [bidAmount, setBidAmount] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [notes, setNotes] = useState("");

  const loadQuery = trpc.loads.getById.useQuery({ id: loadId! }, { enabled: !!loadId });
  const driversQuery = trpc.drivers.getAvailable.useQuery();

  const submitBidMutation = trpc.bids.submit.useMutation({
    onSuccess: () => {
      toast.success("Bid submitted successfully");
      setLocation("/bids");
    },
    onError: (error) => toast.error("Failed to submit bid", { description: error.message }),
  });

  if (loadQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading load details</p>
        <Button className="mt-4" onClick={() => loadQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const load = loadQuery.data;

  const handleSubmit = () => {
    if (!bidAmount || isNaN(parseFloat(bidAmount))) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    if (!selectedDriver) {
      toast.error("Please select a driver");
      return;
    }
    submitBidMutation.mutate({
      loadId: loadId!,
      amount: parseFloat(bidAmount),
      driverId: selectedDriver,
      notes,
    });
  };

  const ratePerMile = bidAmount && load?.distance ? (parseFloat(bidAmount) / (load.distance || 1)).toFixed(2) : "0.00";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Submit Bid</h1>
          <p className="text-slate-400 text-sm">Place your bid on this load</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />Load Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-64" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Load Number</span>
                  <span className="text-white font-bold">{load?.loadNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Commodity</span>
                  <span className="text-white">{load?.commodity}</span>
                </div>
                {load?.hazmatClass && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hazmat</span>
                    <Badge className="bg-red-500/20 text-red-400">Class {load.hazmatClass}</Badge>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white">{load?.pickupLocation?.city}, {load?.pickupLocation?.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-white">{load?.deliveryLocation?.city}, {load?.deliveryLocation?.state}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-xs">Distance</span>
                    <p className="text-white font-medium">{load?.distance} miles</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Weight</span>
                    <p className="text-white font-medium">{load?.weight}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Pickup Date</span>
                    <p className="text-white font-medium">{String(load?.pickupDate || "")}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Delivery Date</span>
                    <p className="text-white font-medium">{String(load?.deliveryDate || "")}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Rate</span>
                    <span className="text-green-400 font-bold text-xl">${load?.rate?.toLocaleString()}</span>
                  </div>
                  {load?.suggestedRateMin && load?.suggestedRateMax && (
                    <p className="text-xs text-slate-500 mt-1">
                      Suggested: ${load.suggestedRateMin.toLocaleString()} - ${load.suggestedRateMax.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bid Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />Your Bid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-400">Bid Amount</Label>
              <div className="relative mt-1">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid"
                  className="pl-9 bg-slate-700/50 border-slate-600 text-lg"
                />
              </div>
            </div>

            {bidAmount && (
              <div className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rate per mile</span>
                  <span className="text-white font-medium">${ratePerMile}/mi</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-slate-400">Assign Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {driversQuery.isLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : driversQuery.data?.length === 0 ? (
                    <SelectItem value="none" disabled>No available drivers</SelectItem>
                  ) : (
                    driversQuery.data?.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <span>{driver.firstName} {driver.lastName}</span>
                          <span className="text-slate-500">({driver.hoursAvailable}h available)</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-400">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                className="mt-1 bg-slate-700/50 border-slate-600"
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={submitBidMutation.isPending}
            >
              {submitBidMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Submit Bid
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
