/**
 * GEOFENCE MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MapPin, Search, Plus, Edit, Trash2,
  CheckCircle, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function GeofenceManagement() {
  const [search, setSearch] = useState("");

  const geofencesQuery = (trpc as any).fleet.getGeofences.useQuery({ search });
  const statsQuery = (trpc as any).fleet.getGeofenceStats.useQuery();

  const deleteMutation = (trpc as any).fleet.deleteGeofence.useMutation({
    onSuccess: () => { toast.success("Geofence deleted"); geofencesQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Geofence Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage location boundaries</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Geofence
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><MapPin className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Bell className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.alertsToday || 0}</p>}<p className="text-xs text-slate-400">Alerts Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><MapPin className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.vehiclesInside || 0}</p>}<p className="text-xs text-slate-400">Inside</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search geofences..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Geofences</CardTitle></CardHeader>
        <CardContent className="p-0">
          {geofencesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (geofencesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No geofences found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(geofencesQuery.data as any)?.map((geofence: any) => (
                <div key={geofence.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", geofence.active ? "bg-green-500/20" : "bg-slate-500/20")}>
                      <MapPin className={cn("w-5 h-5", geofence.active ? "text-green-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{geofence.name}</p>
                        <Badge className={cn("border-0", geofence.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>{geofence.active ? "Active" : "Inactive"}</Badge>
                        <Badge className="bg-purple-500/20 text-purple-400 border-0">{geofence.type}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{geofence.address}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Radius: {geofence.radius}m</span>
                        <span>Vehicles inside: {geofence.vehiclesInside}</span>
                        <span>Last alert: {geofence.lastAlert || "Never"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => deleteMutation.mutate({ id: geofence.id })}><Trash2 className="w-4 h-4" /></Button>
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
