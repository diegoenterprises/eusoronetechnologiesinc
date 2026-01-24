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
  ClipboardCheck, Search, Plus, Truck, Calendar,
  CheckCircle, XCircle, AlertTriangle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function VehicleInspections() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  const inspectionsQuery = trpc.inspections.list.useQuery({ result: resultFilter === "all" ? undefined : resultFilter, limit: 50 });
  const summaryQuery = trpc.inspections.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getResultBadge = (result: string) => {
    switch (result) {
      case "pass": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Pass</Badge>;
      case "fail": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Fail</Badge>;
      case "conditional": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Conditional</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{result}</Badge>;
    }
  };

  const filteredInspections = inspectionsQuery.data?.filter((inspection: any) =>
    !searchTerm || inspection.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || inspection.inspector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Vehicle Inspections
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track DOT inspections and results</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Log Inspection
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <ClipboardCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Inspections</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.passRate}%</p>
                )}
                <p className="text-xs text-slate-400">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.violations || 0}</p>
                )}
                <p className="text-xs text-slate-400">Violations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.oosRate}%</p>
                )}
                <p className="text-xs text-slate-400">OOS Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search inspections..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inspections List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {inspectionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredInspections?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ClipboardCheck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No inspections found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredInspections?.map((inspection: any) => (
                <div key={inspection.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", inspection.result === "fail" && "bg-red-500/5 border-l-2 border-red-500")} onClick={() => setLocation(`/inspections/${inspection.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{inspection.reportNumber}</p>
                        {getResultBadge(inspection.result)}
                        {inspection.outOfService && <Badge className="bg-red-500/20 text-red-400 border-0">OOS</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Truck className="w-3 h-3" />
                        <span>{inspection.vehicleNumber} - {inspection.vehicleType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{inspection.level}</p>
                      <p className="text-xs text-slate-500">Inspection Level</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{inspection.date}</span>
                      <span>Inspector: {inspection.inspector}</span>
                      <span>{inspection.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {inspection.violations > 0 && (
                        <span className="text-xs text-red-400">{inspection.violations} violations</span>
                      )}
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
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
