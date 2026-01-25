/**
 * DATA IMPORT PAGE
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
  Upload, FileText, CheckCircle, Clock, AlertTriangle,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataImport() {
  const [dataType, setDataType] = useState("all");

  const importsQuery = trpc.admin.getImports.useQuery({ dataType });
  const statsQuery = trpc.admin.getImportStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "partial": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Partial</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Data Import</h1>
          <p className="text-slate-400 text-sm mt-1">Import data into the system</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Import
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Upload className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Imports</p></div>
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
              <div className="p-3 rounded-full bg-purple-500/20"><FileText className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.recordsImported?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Records</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.failed || 0}</p>}<p className="text-xs text-slate-400">Failed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={dataType} onValueChange={setDataType}>
        <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="drivers">Drivers</SelectItem>
          <SelectItem value="vehicles">Vehicles</SelectItem>
          <SelectItem value="customers">Customers</SelectItem>
          <SelectItem value="rates">Rates</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-cyan-400" />Import History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {importsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : importsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No imports found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {importsQuery.data?.map((imp: any) => (
                <div key={imp.id} className={cn("p-4 flex items-center justify-between", imp.status === "failed" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", imp.status === "completed" ? "bg-green-500/20" : imp.status === "processing" ? "bg-blue-500/20" : imp.status === "partial" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Upload className={cn("w-5 h-5", imp.status === "completed" ? "text-green-400" : imp.status === "processing" ? "text-blue-400" : imp.status === "partial" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{imp.fileName}</p>
                        {getStatusBadge(imp.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Type: {imp.dataType}</span>
                        <span>Records: {imp.recordCount?.toLocaleString()}</span>
                        <span>Success: {imp.successCount?.toLocaleString()}</span>
                        {imp.errorCount > 0 && <span className="text-red-400">Errors: {imp.errorCount}</span>}
                        <span>Date: {imp.importDate}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">View Details</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
