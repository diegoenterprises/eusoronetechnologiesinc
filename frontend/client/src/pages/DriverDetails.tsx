/**
 * DRIVER DETAILS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Phone, Mail, Truck, Clock, Star, ArrowLeft,
  FileText, Shield, MapPin, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";

export default function DriverDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const driverId = params.id as string;

  const driverQuery = (trpc as any).drivers.getById.useQuery({ id: driverId });
  const hosQuery = (trpc as any).drivers.getHOS.useQuery({ driverId });
  const loadsQuery = (trpc as any).drivers.getRecentLoads.useQuery({ driverId, limit: 5 });

  const driver = driverQuery.data;
  const hos = hosQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "driving": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Driving</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Off Duty</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  if (driverQuery.isLoading) {
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

  if (!driver) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg">Driver not found</p>
          <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation("/drivers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Drivers
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
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setLocation("/drivers")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {driver.name}
              </h1>
              {getStatusBadge(driver.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">Driver Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Phone className="w-4 h-4 mr-2" />Call
          </Button>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Mail className="w-4 h-4 mr-2" />Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {driver.name?.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{driver.name}</h2>
            <p className="text-slate-400 text-sm mb-4">{driver.truckNumber}</p>
            
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star: any) => (
                <Star key={star} className={cn("w-5 h-5", star <= (driver.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-600")} />
              ))}
              <span className="text-white ml-2">{driver.rating?.toFixed(1)}</span>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">{driver.phone}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">{driver.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300">CDL: {driver.cdlNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & HOS */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Hours of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {hosQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400">Driving Time</span>
                    <span className="text-white font-bold">{typeof hos?.drivingHours === 'number' ? hos.drivingHours : (hos?.drivingHours as any)?.used || 0}h / 11h</span>
                  </div>
                  <Progress value={((typeof hos?.drivingHours === 'number' ? hos.drivingHours : (hos?.drivingHours as any)?.used || 0) / 11) * 100} className="h-3" />
                  <p className="text-xs text-slate-500 mt-2">{11 - (typeof hos?.drivingHours === 'number' ? hos.drivingHours : (hos?.drivingHours as any)?.used || 0)}h remaining</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400">On-Duty Time</span>
                    <span className="text-white font-bold">{typeof hos?.onDutyHours === 'number' ? hos.onDutyHours : (hos?.onDutyHours as any)?.used || 0}h / 14h</span>
                  </div>
                  <Progress value={((typeof hos?.onDutyHours === 'number' ? hos.onDutyHours : (hos?.onDutyHours as any)?.used || 0) / 14) * 100} className="h-3" />
                  <p className="text-xs text-slate-500 mt-2">{14 - (typeof hos?.onDutyHours === 'number' ? hos.onDutyHours : (hos?.onDutyHours as any)?.used || 0)}h remaining</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400">70hr Cycle</span>
                    <span className="text-white font-bold">{typeof hos?.cycleHours === 'number' ? hos.cycleHours : (hos?.cycleHours as any)?.used || 0}h / 70h</span>
                  </div>
                  <Progress value={((typeof hos?.cycleHours === 'number' ? hos.cycleHours : (hos?.cycleHours as any)?.used || 0) / 70) * 100} className="h-3" />
                  <p className="text-xs text-slate-500 mt-2">{70 - (typeof hos?.cycleHours === 'number' ? hos.cycleHours : (hos?.cycleHours as any)?.used || 0)}h remaining</p>
                </div>
              </>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-2xl font-bold text-blue-400">{driver.loadsCompleted || 0}</p>
                <p className="text-xs text-slate-400">Loads Completed</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-2xl font-bold text-green-400">{driver.onTimeRate || 0}%</p>
                <p className="text-xs text-slate-400">On-Time Rate</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-2xl font-bold text-purple-400">{((driver as any).distanceLogged || driver.milesLogged || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Miles Logged</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                <p className="text-2xl font-bold text-cyan-400">{driver.safetyScore || 0}</p>
                <p className="text-xs text-slate-400">Safety Score</p>
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
                  <Truck className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No recent loads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(loadsQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setLocation(`/loads/${load.id}`)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-500/20">
                          <Truck className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span>{load.origin?.city}</span>
                            <span>→</span>
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{load.destination?.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">${load.rate?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{load.date}</p>
                      </div>
                    </div>
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
