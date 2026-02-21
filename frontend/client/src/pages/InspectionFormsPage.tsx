/**
 * INSPECTION FORMS PAGE
 * Frontend for inspectionForms router — DVIR, pre/post-trip inspections,
 * defect tracking, and compliance reporting.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ClipboardCheck, AlertTriangle, CheckCircle, Clock, Truck,
  Shield, FileText, Filter, Search, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  pre_trip: "Pre-Trip", post_trip: "Post-Trip", en_route: "En Route", dot: "DOT", annual: "Annual",
};
const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400", passed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400", in_progress: "bg-blue-500/20 text-blue-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function InspectionFormsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [defectsOnly, setDefectsOnly] = useState(false);

  const listQuery = (trpc as any).inspectionForms.list.useQuery({
    type: typeFilter || undefined,
    hasDefects: defectsOnly || undefined,
    limit: 50,
  });
  const statsQuery = (trpc as any).inspectionForms.getStats.useQuery();
  const templateQuery = (trpc as any).inspectionForms.getTemplates.useQuery();

  const inspections = listQuery.data?.inspections || [];
  const stats = statsQuery.data;
  const templates = templateQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Inspection Forms</h1>
        <p className="text-slate-400 text-sm mt-1">DVIR management, pre/post-trip inspections, and defect tracking</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total || 0, icon: <ClipboardCheck className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
            { label: "Passed", value: stats.passed || 0, icon: <CheckCircle className="w-5 h-5 text-green-400" />, color: "text-green-400" },
            { label: "Defects", value: stats.withDefects || 0, icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
            { label: "OOS", value: stats.oos || 0, icon: <Shield className="w-5 h-5 text-red-400" />, color: "text-red-400" },
            { label: "Pending", value: stats.pending || 0, icon: <Clock className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
          ].map(s => (
            <Card key={s.label} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                <p className="text-[9px] text-slate-400 uppercase">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "pre_trip", "post_trip", "dot", "annual"].map(f => (
          <Button key={f} size="sm" variant={typeFilter === f ? "default" : "outline"} onClick={() => setTypeFilter(f)}
            className={typeFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {f ? TYPE_LABELS[f] || f : "All Types"}
          </Button>
        ))}
        <Button size="sm" variant={defectsOnly ? "default" : "outline"} onClick={() => setDefectsOnly(!defectsOnly)}
          className={defectsOnly ? "bg-red-600" : "border-slate-600 text-slate-300"}>
          <AlertTriangle className="w-3 h-3 mr-1" />Defects Only
        </Button>
      </div>

      {/* Inspection List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1473FF]" />Inspection Records
            <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{listQuery.data?.total || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : inspections.length === 0 ? (
            <div className="p-8 text-center"><ClipboardCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No inspections found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {inspections.map((insp: any) => (
                <div key={insp.id} className="p-3 flex items-center justify-between hover:bg-white/[0.04]">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-medium text-sm">Inspection #{insp.id}</span>
                      <Badge variant="outline" className="text-[9px] border-slate-600">{TYPE_LABELS[insp.type] || insp.type}</Badge>
                      <Badge className={cn("text-[9px]", STATUS_COLORS[insp.status] || "bg-slate-500/20 text-slate-400")}>{insp.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Vehicle #{insp.vehicleId}</span>
                      <span>Driver #{insp.driverId}</span>
                      {insp.location && <span>{insp.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {insp.defectsFound > 0 && <Badge className="bg-yellow-500/20 text-yellow-400 text-[9px]"><AlertTriangle className="w-3 h-3 mr-0.5" />{insp.defectsFound}</Badge>}
                    {insp.oosViolation && <Badge className="bg-red-500/20 text-red-400 text-[9px]">OOS</Badge>}
                    <span className="text-[10px] text-slate-500">{insp.createdAt ? new Date(insp.createdAt).toLocaleDateString() : ""}</span>
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
