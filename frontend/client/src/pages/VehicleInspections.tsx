/**
 * VEHICLE INSPECTIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Truck, CheckCircle, AlertTriangle, Clock, Search,
  Plus, FileText, Wrench, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function VehicleInspections() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const inspectionsQuery = (trpc as any).vehicle.getInspections.useQuery({ filter, search });
  const statsQuery = (trpc as any).vehicle.getInspectionStats.useQuery();
  const dueQuery = (trpc as any).vehicle.getInspectionsDue.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getResultBadge = (result: string) => {
    switch (result) {
      case "pass": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case "fail": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Fail</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{result}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "pre_trip": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Pre-Trip</Badge>;
      case "post_trip": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Post-Trip</Badge>;
      case "annual": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Annual</Badge>;
      case "roadside": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Roadside</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Vehicle Inspections
          </h1>
          <p className="text-slate-400 text-sm mt-1">DVIR and inspection records</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Inspection
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.passed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.failed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.defectsOpen || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open Defects</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.totalThisMonth || 0}</p>
                )}
                <p className="text-xs text-slate-400">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspections Due */}
      {((dueQuery.data as any)?.length ?? 0) > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              Inspections Due
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-yellow-500/20">
              {(dueQuery.data as any)?.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Truck className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.vehicleNumber}</p>
                      <p className="text-sm text-slate-400">{item.inspectionType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm", item.overdue ? "text-red-400" : "text-yellow-400")}>{item.dueDate}</p>
                    {item.overdue && <p className="text-xs text-red-400">Overdue</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search by vehicle..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="pass">Passed</SelectItem>
            <SelectItem value="fail">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspections List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Inspection Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inspectionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (inspectionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No inspection records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(inspectionsQuery.data as any)?.map((inspection: any) => (
                <div key={inspection.id} className={cn("p-4", inspection.result === "fail" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", inspection.result === "pass" ? "bg-green-500/20" : inspection.result === "fail" ? "bg-red-500/20" : "bg-slate-700/50")}>
                        <Truck className={cn("w-5 h-5", inspection.result === "pass" ? "text-green-400" : inspection.result === "fail" ? "text-red-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{inspection.vehicleNumber}</p>
                          {getResultBadge(inspection.result)}
                          {getTypeBadge(inspection.type)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{inspection.date}</span>
                          <span>Inspector: {inspection.inspector}</span>
                          {inspection.defectsCount > 0 && <span className="text-yellow-400">{inspection.defectsCount} defects</span>}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                      <FileText className="w-4 h-4 mr-1" />View
                    </Button>
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
