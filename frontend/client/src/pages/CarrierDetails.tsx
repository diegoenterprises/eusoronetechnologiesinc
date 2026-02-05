/**
 * CARRIER DETAILS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building, Phone, Mail, Truck, Star, ArrowLeft,
  Shield, CheckCircle, Users, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";

export default function CarrierDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const carrierId = params.id as string;

  const carrierQuery = (trpc as any).carriers.getById.useQuery({ id: carrierId });
  const driversQuery = (trpc as any).carriers.getDrivers.useQuery({ carrierId, limit: 10 });
  const loadsQuery = (trpc as any).carriers.getRecentLoads.useQuery({ carrierId, limit: 5 });

  const carrier = carrierQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0">Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (carrierQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Building className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Carrier not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/carriers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Carriers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/carriers")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {carrier.name}
              </h1>
              {getStatusBadge(carrier.status)}
              {carrier.verified && (
                <Badge className="bg-blue-500/20 text-blue-400 border-0">
                  <CheckCircle className="w-3 h-3 mr-1" />Verified
                </Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">MC# {carrier.mcNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Phone className="w-4 h-4 mr-2" />Contact
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            Request Quote
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{carrier.rating?.toFixed(1) || "N/A"}</p>
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{carrier.loadsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{carrier.onTimeRate || 0}%</p>
                <p className="text-xs text-slate-400">On-Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{carrier.driverCount || 0}</p>
                <p className="text-xs text-slate-400">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Truck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{carrier.fleetSize || 0}</p>
                <p className="text-xs text-slate-400">Fleet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500">DOT Number</p>
              <p className="text-white font-medium">{carrier.dotNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500">MC Number</p>
              <p className="text-white font-medium">{carrier.mcNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" />
                {carrier.phone}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                {carrier.email}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-700/30">
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-white font-medium">{typeof carrier.address === "object" ? `${carrier.address.street}, ${carrier.address.city}, ${carrier.address.state} ${carrier.address.zip}` : carrier.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Compliance */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Safety & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Safety Rating</span>
                <span className={cn("font-bold", carrier.safetyRating === "Satisfactory" ? "text-green-400" : "text-yellow-400")}>
                  {carrier.safetyRating || "N/A"}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Insurance</span>
                <Badge className={carrier.insuranceValid ? "bg-green-500/20 text-green-400 border-0" : "bg-red-500/20 text-red-400 border-0"}>
                  {carrier.insuranceValid ? "Valid" : "Expired"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Expires: {carrier.insuranceExpiry}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Authority</span>
                <Badge className={carrier.authorityActive ? "bg-green-500/20 text-green-400 border-0" : "bg-red-500/20 text-red-400 border-0"}>
                  {carrier.authorityActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                <p className="text-lg font-bold text-blue-400">{carrier.csaScore || "N/A"}</p>
                <p className="text-xs text-slate-500">CSA Score</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-700/30 text-center">
                <p className="text-lg font-bold text-purple-400">{carrier.inspections || 0}</p>
                <p className="text-xs text-slate-500">Inspections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Equipment Types</CardTitle>
          </CardHeader>
          <CardContent>
            {carrier.equipmentTypes?.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No equipment listed</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {carrier.equipmentTypes?.map((type: string, idx: number) => (
                  <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-0">{type}</Badge>
                ))}
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <p className="text-slate-400 text-sm">Service Areas</p>
              <div className="flex flex-wrap gap-2">
                {carrier.serviceAreas?.map((area: string, idx: number) => (
                  <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0">{area}</Badge>
                )) || <p className="text-slate-500 text-sm">Nationwide</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Loads */}
        <Card className="lg:col-span-3 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Loads</CardTitle>
          </CardHeader>
          <CardContent>
            {loadsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (loadsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No recent loads</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(loadsQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setLocation(`/loads/${load.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber}</p>
                      <Badge className={load.status === "delivered" ? "bg-green-500/20 text-green-400 border-0" : "bg-blue-500/20 text-blue-400 border-0"}>
                        {load.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{load.origin?.city} → {load.destination?.city}</p>
                    <p className="text-xs text-slate-500">{load.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
