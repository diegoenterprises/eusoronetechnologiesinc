/**
 * DATA EXPORT PAGE
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
  Download, FileText, CheckCircle, Clock, Database,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DataExport() {
  const [dataType, setDataType] = useState("all");

  const exportsQuery = (trpc as any).admin.getExports.useQuery({ dataType });
  const statsQuery = (trpc as any).admin.getExportStats.useQuery();

  const createMutation = (trpc as any).admin.createExport.useMutation({
    onSuccess: () => { toast.success("Export started"); exportsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Data Export</h1>
          <p className="text-slate-400 text-sm mt-1">Export system data</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({ dataType })}>
          <Plus className="w-4 h-4 mr-2" />New Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Database className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Exports</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>}<p className="text-xs text-slate-400">Completed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Clock className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.processing || 0}</p>}<p className="text-xs text-slate-400">Processing</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Download className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.totalSize}</p>}<p className="text-xs text-slate-400">Total Size</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={dataType} onValueChange={setDataType}>
        <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Data</SelectItem>
          <SelectItem value="loads">Loads</SelectItem>
          <SelectItem value="drivers">Drivers</SelectItem>
          <SelectItem value="invoices">Invoices</SelectItem>
          <SelectItem value="compliance">Compliance</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Export History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {exportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (exportsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Database className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No exports found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(exportsQuery.data as any)?.map((exp: any) => (
                <div key={exp.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", exp.status === "completed" ? "bg-green-500/20" : exp.status === "processing" ? "bg-blue-500/20" : "bg-red-500/20")}>
                      <FileText className={cn("w-5 h-5", exp.status === "completed" ? "text-green-400" : exp.status === "processing" ? "text-blue-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{exp.name}</p>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Type: {exp.dataType}</span>
                        <span>Format: {exp.format}</span>
                        <span>Size: {exp.size}</span>
                        <span>Created: {exp.createdDate}</span>
                      </div>
                    </div>
                  </div>
                  {exp.status === "completed" && (
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                      <Download className="w-4 h-4 mr-1" />Download
                    </Button>
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
