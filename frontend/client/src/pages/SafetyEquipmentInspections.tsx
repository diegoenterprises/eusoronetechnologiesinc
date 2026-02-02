/**
 * SAFETY EQUIPMENT INSPECTIONS PAGE
 * 100% Dynamic - Track and manage equipment safety inspections
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
  Wrench, Search, Plus, CheckCircle, AlertTriangle,
  Calendar, Truck, Clock, FileText, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyEquipmentInspections() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const inspectionsQuery = trpc.safety.getEquipmentInspections.useQuery({ status: statusFilter, type: typeFilter });
  const statsQuery = trpc.safety.getEquipmentInspectionStats.useQuery();

  const inspections = inspectionsQuery.data || [];
  const stats = statsQuery.data;

  const filteredInspections = inspections.filter((i: any) =>
    i.unitNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspectorName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "bg-green-500/20 text-green-400";
      case "failed": return "bg-red-500/20 text-red-400";
      case "due": return "bg-yellow-500/20 text-yellow-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "scheduled": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Equipment Inspections
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vehicle and equipment safety inspections</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Inspection
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
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Passed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.passed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.failed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Due Soon</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.dueSoon || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.overdue || 0}</p>
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
                placeholder="Search by unit or inspector..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Equipment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="tractor">Tractors</SelectItem>
                <SelectItem value="trailer">Trailers</SelectItem>
                <SelectItem value="tanker">Tankers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="due">Due Soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {inspectionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No inspections found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInspections.map((inspection: any) => (
                <div key={inspection.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        inspection.status === "passed" ? "bg-green-500/20" :
                        inspection.status === "failed" || inspection.status === "overdue" ? "bg-red-500/20" :
                        "bg-yellow-500/20"
                      )}>
                        <Truck className={cn(
                          "w-6 h-6",
                          inspection.status === "passed" ? "text-green-400" :
                          inspection.status === "failed" || inspection.status === "overdue" ? "text-red-400" :
                          "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{inspection.unitNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(inspection.status))}>
                            {inspection.status}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {inspection.equipmentType}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {inspection.make} {inspection.model} • {inspection.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Last Inspection</p>
                        <p className="text-white">{inspection.lastInspectionDate || "Never"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Next Due</p>
                        <p className={cn(
                          inspection.status === "overdue" ? "text-red-400" :
                          inspection.status === "due" ? "text-yellow-400" : "text-white"
                        )}>
                          {inspection.nextDueDate}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Inspector</p>
                        <p className="text-white">{inspection.inspectorName || "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Defects</p>
                        <p className={cn(
                          "font-bold",
                          inspection.defectCount > 0 ? "text-yellow-400" : "text-green-400"
                        )}>
                          {inspection.defectCount || 0}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />Report
                      </Button>
                    </div>
                  </div>

                  {inspection.defects && inspection.defects.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Open Defects:</p>
                      <div className="flex flex-wrap gap-2">
                        {inspection.defects.map((defect: any, idx: number) => (
                          <Badge key={idx} className={cn(
                            "border-0 text-xs",
                            defect.severity === "critical" ? "bg-red-500/20 text-red-400" :
                            defect.severity === "major" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-cyan-500/20 text-cyan-400"
                          )}>
                            <AlertTriangle className="w-3 h-3 mr-1" />{defect.description}
                          </Badge>
                        ))}
                      </div>
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
