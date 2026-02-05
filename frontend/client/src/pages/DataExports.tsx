/**
 * DATA EXPORTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Download, FileSpreadsheet, Clock, CheckCircle, Plus,
  RefreshCw, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DataExports() {
  const [exportType, setExportType] = useState("loads");

  const exportsQuery = (trpc as any).exports.list.useQuery({ limit: 20 });
  const templatesQuery = (trpc as any).exports.getTemplates.useQuery();

  const createMutation = (trpc as any).exports.create.useMutation({
    onSuccess: () => { toast.success("Export started"); exportsQuery.refetch(); },
    onError: (error: any) => toast.error("Export failed", { description: error.message }),
  });

  const deleteMutation = (trpc as any).exports.delete.useMutation({
    onSuccess: () => { toast.success("Export deleted"); exportsQuery.refetch(); },
    onError: (error: any) => toast.error("Delete failed", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Data Exports
          </h1>
          <p className="text-slate-400 text-sm mt-1">Export your data in various formats</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({ type: exportType })}>
          <Plus className="w-4 h-4 mr-2" />New Export
        </Button>
      </div>

      {/* Export Templates */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Quick Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-[200px] bg-slate-700/30 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loads">Loads</SelectItem>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="drivers">Drivers</SelectItem>
                <SelectItem value="carriers">Carriers</SelectItem>
                <SelectItem value="settlements">Settlements</SelectItem>
                <SelectItem value="fuel">Fuel Transactions</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => createMutation.mutate({ type: exportType })} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Exporting..." : "Export Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Templates */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Export Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templatesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(templatesQuery.data as any)?.map((template: any) => (
                <div key={template.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => createMutation.mutate({ type: template.type, templateId: template.id })}>
                  <div className="p-2 rounded-lg bg-cyan-500/20 w-fit mb-3">
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-white font-medium">{template.name}</p>
                  <p className="text-xs text-slate-500">{template.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {exportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (exportsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Download className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No exports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(exportsQuery.data as any)?.map((exp: any) => (
                <div key={exp.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-700/50">
                      <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{exp.name}</p>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{exp.type}</span>
                        <span>{exp.recordCount?.toLocaleString()} records</span>
                        <span>{exp.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.status === "completed" && (
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteMutation.mutate({ id: exp.id })}>
                      <Trash2 className="w-4 h-4" />
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
