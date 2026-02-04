/**
 * ESCORT EQUIPMENT MANAGEMENT PAGE
 * 100% Dynamic - Manage escort vehicle equipment and certifications
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
  Car, Plus, Search, CheckCircle, AlertTriangle,
  Wrench, Calendar, Camera, Radio, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortEquipmentManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const equipmentQuery = trpc.escorts.getEquipment.useQuery({ status: statusFilter });
  const statsQuery = trpc.escorts.getEquipmentStats.useQuery();

  const equipment = equipmentQuery.data || [];
  const stats = statsQuery.data;

  const filteredEquipment = equipment.filter((e: any) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-500/20 text-green-400";
      case "needs_inspection": return "bg-yellow-500/20 text-yellow-400";
      case "maintenance": return "bg-orange-500/20 text-orange-400";
      case "out_of_service": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Equipment Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage escort vehicle equipment</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Vehicles</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.vehicles || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Operational</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.operational || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Needs Attention</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.needsAttention || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Inspections Due</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.inspectionsDue || 0}</p>
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
                placeholder="Search equipment..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="needs_inspection">Needs Inspection</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {equipmentQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No equipment found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredEquipment.map((item: any) => (
                <div key={item.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Car className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{item.vehicleNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(item.status))}>
                            {item.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{item.year} {item.make} {item.model}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Last Inspection</p>
                        <p className="text-white">{item.lastInspection || "N/A"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Next Due</p>
                        <p className={cn(
                          item.inspectionDue ? "text-yellow-400" : "text-white"
                        )}>
                          {item.nextInspection || "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Mileage</p>
                        <p className="text-white">{item.mileage?.toLocaleString() || 0}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Details
                      </Button>
                    </div>
                  </div>

                  {/* Equipment Items */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className={cn("w-4 h-4", item.equipment?.signs ? "text-green-400" : "text-slate-500")} />
                      <span className="text-sm text-slate-300">Signs/Flags</span>
                      {item.equipment?.signs && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio className={cn("w-4 h-4", item.equipment?.radio ? "text-green-400" : "text-slate-500")} />
                      <span className="text-sm text-slate-300">2-Way Radio</span>
                      {item.equipment?.radio && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className={cn("w-4 h-4", item.equipment?.lights ? "text-green-400" : "text-slate-500")} />
                      <span className="text-sm text-slate-300">Warning Lights</span>
                      {item.equipment?.lights && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className={cn("w-4 h-4", item.equipment?.heightPole ? "text-green-400" : "text-slate-500")} />
                      <span className="text-sm text-slate-300">Height Pole</span>
                      {item.equipment?.heightPole && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
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
