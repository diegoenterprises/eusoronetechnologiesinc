/**
 * CARRIER DRIVER MANAGEMENT PAGE
 * 100% Dynamic - Manage company drivers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Plus, Search, Clock, CheckCircle, AlertTriangle,
  Phone, MapPin, Shield, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CarrierDriverManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const driversQuery = trpc.carriers.getDrivers.useQuery({ status: statusFilter });
  const statsQuery = trpc.carriers.getDriverStats.useQuery();

  const drivers = driversQuery.data || [];
  const stats = statsQuery.data;

  const filteredDrivers = drivers.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.cdlNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400";
      case "driving": return "bg-cyan-500/20 text-cyan-400";
      case "on_duty": return "bg-yellow-500/20 text-yellow-400";
      case "off_duty": return "bg-slate-500/20 text-slate-400";
      case "sleeper": return "bg-purple-500/20 text-purple-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your drivers</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Available</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.available || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Driving</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.driving || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">On Duty</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.onDuty || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">HOS Alert</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.hosAlert || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or CDL..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="driving">Driving</SelectItem>
                <SelectItem value="on_duty">On Duty</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredDrivers.map((driver: any) => (
                <div key={driver.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{driver.name}</p>
                          <Badge className={cn("border-0", getStatusColor(driver.status))}>
                            {driver.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">CDL: {driver.cdlNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Drive Avail</p>
                        <p className={cn(
                          "font-bold",
                          driver.hos?.drivingRemaining > 2 ? "text-green-400" : "text-red-400"
                        )}>
                          {driver.hos?.drivingRemaining || 0}h
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">On-Duty</p>
                        <p className="text-white font-bold">{driver.hos?.onDutyRemaining || 0}h</p>
                      </div>
                      {driver.currentLocation && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Location</p>
                          <p className="text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{driver.currentLocation}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-1">
                        {driver.hazmatEndorsement && (
                          <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">H</Badge>
                        )}
                        {driver.tankerEndorsement && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">N</Badge>
                        )}
                        {driver.twicCard && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">TWIC</Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Details
                      </Button>
                    </div>
                  </div>

                  {driver.currentLoad && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-400">Current Load:</span>
                      <span className="text-white">#{driver.currentLoad.loadNumber}</span>
                      <span className="text-slate-500">→ {driver.currentLoad.destination}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
