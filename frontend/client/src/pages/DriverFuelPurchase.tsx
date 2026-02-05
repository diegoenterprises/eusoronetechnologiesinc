/**
 * DRIVER FUEL PURCHASE PAGE
 * 100% Dynamic - Record fuel purchases with receipt capture
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Fuel, DollarSign, MapPin, Camera, ChevronLeft,
  Send, Receipt, Droplets, Gauge, Clock, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverFuelPurchase() {
  const [, navigate] = useLocation();

  const [gallons, setGallons] = useState("");
  const [pricePerGallon, setPricePerGallon] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [fuelType, setFuelType] = useState("diesel");
  const [station, setStation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("fuel_card");
  const [odometer, setOdometer] = useState("");

  const vehicleQuery = trpc.drivers.getCurrentVehicle.useQuery();
  const loadQuery = trpc.loads.getTrackedLoads.useQuery({ search: "" });
  const stationsQuery = trpc.fuel.getNearbyStations.useQuery({ lat: 0, lng: 0 });
  const historyQuery = trpc.fuel.getTransactions.useQuery({ limit: 10 });

  const submitMutation = trpc.fuel.reportPurchase.useMutation({
    onSuccess: () => {
      toast.success("Fuel purchase recorded");
      navigate("/driver/dashboard");
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const vehicle = vehicleQuery.data;
  const load = loadQuery.data?.[0];
  const stations = stationsQuery.data || [];
  const history = historyQuery.data || [];

  const calculateTotal = () => {
    if (gallons && pricePerGallon) {
      setTotalAmount((parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/driver/dashboard")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Fuel Purchase
          </h1>
          <p className="text-slate-400 text-sm mt-1">Record fuel transaction</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <Fuel className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">Unit #{vehicle?.unitNumber}</p>
              <p className="text-slate-400 text-sm">{vehicle?.make} {vehicle?.model}</p>
            </div>
            {load && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                Load #{load.loadNumber}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fuel Entry Form */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Fuel Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Fuel Type</label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="def">DEF</SelectItem>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Station</label>
              <Select value={station} onValueChange={setStation}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.address}</SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Gallons</label>
              <Input
                type="number"
                step="0.01"
                value={gallons}
                onChange={(e) => { setGallons(e.target.value); calculateTotal(); }}
                placeholder="0.00"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Price/Gallon ($)</label>
              <Input
                type="number"
                step="0.001"
                value={pricePerGallon}
                onChange={(e) => { setPricePerGallon(e.target.value); calculateTotal(); }}
                placeholder="0.000"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Total ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 bg-slate-700/50 border-slate-600/50 rounded-lg font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Odometer Reading</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder={vehicle?.odometer?.toString() || "0"}
                  className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel_card">Fuel Card</SelectItem>
                  <SelectItem value="company_card">Company Card</SelectItem>
                  <SelectItem value="cash">Cash (Reimburse)</SelectItem>
                  <SelectItem value="comdata">Comdata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 rounded-lg">
            <Camera className="w-4 h-4 mr-2" />
            Capture Receipt
          </Button>
        </CardContent>
      </Card>

      {/* MPG Estimate */}
      {gallons && odometer && (vehicle as any)?.lastFuelOdometer && (
        <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-cyan-400 font-medium">Estimated MPG</p>
                  <p className="text-slate-400 text-sm">
                    {(parseInt(odometer) - ((vehicle as any).lastFuelOdometer || 0)).toLocaleString()} miles since last fill
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">
                {((parseInt(odometer) - ((vehicle as any).lastFuelOdometer || 0)) / parseFloat(gallons)).toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={() => submitMutation.mutate({
          vehicleId: vehicle?.id || "",
          gallons: parseFloat(gallons),
          pricePerGallon: parseFloat(pricePerGallon),
          fuelType: fuelType as "diesel" | "def" | "gasoline",
          location: station || "",
          odometer: parseInt(odometer),
        } as any)}
        disabled={!gallons || !totalAmount || !odometer || submitMutation.isPending}
        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg h-12"
      >
        <Send className="w-5 h-5 mr-2" />
        Submit Fuel Purchase
      </Button>

      {/* Recent Purchases */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-6">
              <Receipt className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No recent purchases</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Fuel className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">{purchase.gallons} gal @ ${purchase.pricePerGallon}</p>
                      <p className="text-slate-400 text-sm">{purchase.stationName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">${purchase.totalAmount}</p>
                    <p className="text-slate-500 text-xs">{purchase.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
