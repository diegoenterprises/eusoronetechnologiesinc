/**
 * SAFETY INSPECTION REPORTS PAGE
 * 100% Dynamic - View and manage DOT inspection reports
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
  ClipboardCheck, Search, AlertTriangle, CheckCircle, XCircle,
  Calendar, User, Truck, MapPin, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyInspectionReports() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("90d");
  const [resultFilter, setResultFilter] = useState("all");

  const inspectionsQuery = trpc.safety.getInspectionReports.useQuery({ period: periodFilter, result: resultFilter });
  const statsQuery = trpc.safety.getInspectionStats.useQuery({ period: periodFilter });

  const inspections = inspectionsQuery.data || [];
  const stats = statsQuery.data;

  const filteredInspections = inspections.filter((i: any) =>
    i.reportNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    i.truckNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  );

  const getResultColor = (result: string) => {
    switch (result) {
      case "passed": return "bg-green-500/20 text-green-400";
      case "failed": return "bg-red-500/20 text-red-400";
      case "warning": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Inspection Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">DOT and roadside inspection history</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="12m">Last 12 Months</SelectItem>
            <SelectItem value="24m">Last 24 Months</SelectItem>
          </SelectContent>
        </Select>
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
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Inspections</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalInspections || 0}</p>
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
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.failed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Violations</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.totalViolations || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Pass Rate</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  (stats?.passRate || 0) >= 90 ? "text-green-400" :
                  (stats?.passRate || 0) >= 80 ? "text-yellow-400" : "text-red-400"
                )}>
                  {stats?.passRate || 0}%
                </p>
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
                placeholder="Search inspections..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {inspectionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No inspections found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInspections.map((inspection: any) => (
                <div key={inspection.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  inspection.result === "failed" && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        inspection.result === "passed" ? "bg-green-500/20" :
                        inspection.result === "failed" ? "bg-red-500/20" :
                        "bg-yellow-500/20"
                      )}>
                        {inspection.result === "passed" ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : inspection.result === "failed" ? (
                          <XCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">#{inspection.reportNumber}</p>
                          <Badge className={cn("border-0", getResultColor(inspection.result))}>
                            {inspection.result}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            Level {inspection.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{inspection.date}</span>
                          <span className="text-slate-600">•</span>
                          <MapPin className="w-3 h-3" />
                          <span>{inspection.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Driver</p>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-white">{inspection.driverName}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Truck</p>
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span className="text-white">#{inspection.truckNumber}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Violations</p>
                        <p className={cn(
                          "font-bold",
                          inspection.violationCount > 0 ? "text-red-400" : "text-green-400"
                        )}>
                          {inspection.violationCount}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <FileText className="w-4 h-4 mr-1" />View
                      </Button>
                    </div>
                  </div>

                  {inspection.violations && inspection.violations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-400 text-xs mb-2">Violations:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {inspection.violations.map((v: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span className="text-red-400 font-medium text-sm">{v.code}</span>
                              <Badge className={cn(
                                "border-0 text-xs",
                                v.oos ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                              )}>
                                {v.oos ? "OOS" : "Non-OOS"}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-xs mt-1">{v.description}</p>
                          </div>
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
