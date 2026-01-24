/**
 * DATA EXPORT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Download, FileText, Database, Clock, CheckCircle,
  RefreshCw, Trash2, Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DataExport() {
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [format, setFormat] = useState("json");

  const exportsQuery = trpc.user.getExports.useQuery();
  const dataTypesQuery = trpc.user.getExportableDataTypes.useQuery();

  const requestMutation = trpc.user.requestExport.useMutation({
    onSuccess: () => { toast.success("Export requested", { description: "You'll be notified when ready" }); exportsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const deleteMutation = trpc.user.deleteExport.useMutation({
    onSuccess: () => { toast.success("Export deleted"); exportsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const toggleDataType = (type: string) => {
    setSelectedData(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Data Export
          </h1>
          <p className="text-slate-400 text-sm mt-1">Download your data</p>
        </div>
      </div>

      {/* Request Export */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Archive className="w-5 h-5 text-cyan-400" />
            Request Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">Select the data you want to export. Large exports may take some time to process.</p>

          {dataTypesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {dataTypesQuery.data?.map((type: any) => (
                <div key={type.id} className={cn("p-4 rounded-xl cursor-pointer transition-colors", selectedData.includes(type.id) ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-slate-700/30 hover:bg-slate-700/50")} onClick={() => toggleDataType(type.id)}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedData.includes(type.id)} className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    <div>
                      <p className="text-white font-medium">{type.name}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Format:</span>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-[120px] bg-slate-800/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => requestMutation.mutate({ dataTypes: selectedData, format })} disabled={selectedData.length === 0}>
              <Download className="w-4 h-4 mr-2" />Request Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Exports */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Previous Exports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {exportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : exportsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No exports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {exportsQuery.data?.map((exp: any) => (
                <div key={exp.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", exp.status === "completed" ? "bg-green-500/20" : exp.status === "processing" ? "bg-blue-500/20" : "bg-slate-700/50")}>
                      <FileText className={cn("w-5 h-5", exp.status === "completed" ? "text-green-400" : exp.status === "processing" ? "text-blue-400" : "text-slate-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{exp.name}</p>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{exp.format?.toUpperCase()}</span>
                        <span>{exp.size}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exp.createdAt}</span>
                        {exp.expiresAt && <span>Expires: {exp.expiresAt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.status === "completed" && (
                      <Button size="sm" variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 rounded-lg">
                        <Download className="w-4 h-4 mr-1" />Download
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ exportId: exp.id })}>
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
