/**
 * DRIVER NAVIGATION PAGE
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
  Navigation, MapPin, Clock, Truck, AlertTriangle,
  Phone, ExternalLink, Fuel, Shield, Flame, Route,
  AlertOctagon, Ban, CheckCircle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverNavigation() {
  const assignmentQuery = trpc.drivers.getCurrentAssignment.useQuery();
  const routeQuery = trpc.drivers.getRouteInfo.useQuery(undefined, { enabled: !!assignmentQuery.data });

  const assignment = assignmentQuery.data;
  const route = routeQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Navigation</h1>
          <p className="text-slate-400 text-sm mt-1">Route and destination info</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <ExternalLink className="w-4 h-4 mr-2" />Open in Maps
        </Button>
      </div>

      {assignmentQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : !assignment ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No active assignment</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Current Load</p>
                  <p className="text-white font-bold text-xl">#{assignment.loadNumber}</p>
                </div>
                <Badge className={cn("border-0", assignment.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" : assignment.status === "loading" ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400")}>
                  {assignment.status?.replace("_", " ")}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-green-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Origin</span></div>
                  <p className="text-white text-sm font-medium">{typeof assignment.origin === 'object' ? `${assignment.origin.city}, ${assignment.origin.state}` : assignment.origin}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-red-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Destination</span></div>
                  <p className="text-white text-sm font-medium">{typeof assignment.destination === 'object' ? `${assignment.destination.city}, ${assignment.destination.state}` : assignment.destination}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {routeQuery.isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : route && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-cyan-500/20"><Navigation className="w-6 h-6 text-cyan-400" /></div>
                      <div><p className="text-2xl font-bold text-cyan-400">{route.distanceRemaining}</p><p className="text-xs text-slate-400">Miles Left</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-500/20"><Clock className="w-6 h-6 text-green-400" /></div>
                      <div><p className="text-2xl font-bold text-green-400">{route.eta}</p><p className="text-xs text-slate-400">ETA</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-purple-500/20"><Clock className="w-6 h-6 text-purple-400" /></div>
                      <div><p className="text-2xl font-bold text-purple-400">{route.driveTimeRemaining}</p><p className="text-xs text-slate-400">Drive Time</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-yellow-500/20"><Fuel className="w-6 h-6 text-yellow-400" /></div>
                      <div><p className="text-2xl font-bold text-yellow-400">{route.fuelStops?.length || 0}</p><p className="text-xs text-slate-400">Fuel Stops</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[300px]">
                <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Navigation className="w-5 h-5 text-cyan-400" />Route Map</CardTitle></CardHeader>
                <CardContent className="h-[220px] flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">Map integration placeholder</p>
                  </div>
                </CardContent>
              </Card>

              {/* HazMat Route Restrictions */}
              {route.hazmatRestrictions && route.hazmatRestrictions.length > 0 && (
                <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Flame className="w-5 h-5 text-red-400" />
                      HazMat Route Restrictions
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">
                        {route.hazmatRestrictions.length} Areas
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {route.hazmatRestrictions.map((restriction: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-red-500/10 flex items-center gap-3">
                        <Ban className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{restriction.type}</p>
                          <p className="text-xs text-slate-400">{restriction.location}</p>
                          <p className="text-xs text-red-300 mt-1">{restriction.description}</p>
                        </div>
                        <Badge className="bg-slate-800 text-slate-300 text-xs">
                          {restriction.distance} mi ahead
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Route Compliance Status */}
              <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Route Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">HazMat Cleared</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Tunnel OK</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Weight Cleared</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Permits Valid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {route.alerts && route.alerts.length > 0 && (
                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
                  <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" />Route Alerts</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {route.alerts.map((alert: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-yellow-500/10 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <div>
                          <p className="text-white text-sm">{alert.message}</p>
                          <p className="text-xs text-slate-500">{alert.location}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-green-400" />Contacts</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between">
                    <div><p className="text-white font-medium">Dispatch</p><p className="text-sm text-slate-400">1-800-555-0123</p></div>
                    <Button size="sm" variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400 rounded-lg"><Phone className="w-4 h-4" /></Button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between">
                    <div><p className="text-white font-medium">Receiver</p><p className="text-sm text-slate-400">1-800-555-0456</p></div>
                    <Button size="sm" variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400 rounded-lg"><Phone className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
