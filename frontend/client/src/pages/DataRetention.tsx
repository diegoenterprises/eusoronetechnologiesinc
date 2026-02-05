/**
 * DATA RETENTION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Database, Calendar, Clock, Trash2, Download,
  Shield, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DataRetention() {
  const retentionQuery = (trpc as any).legal.getDataRetention.useQuery();
  const myDataQuery = (trpc as any).legal.getMyDataSummary.useQuery();

  const requestDeletionMutation = (trpc as any).legal.requestDataDeletion.useMutation({
    onSuccess: () => toast.success("Deletion request submitted"),
    onError: (error: any) => toast.error("Failed to submit", { description: error.message }),
  });

  const requestExportMutation = (trpc as any).legal.requestDataExport.useMutation({
    onSuccess: () => toast.success("Export request submitted"),
    onError: (error: any) => toast.error("Failed to submit", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Data Retention
        </h1>
        <p className="text-slate-400 text-sm mt-1">How long we keep your data</p>
      </div>

      {/* Your Data Summary */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Your Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myDataQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-2xl font-bold text-white">{(myDataQuery.data as any)?.accountAge}</p>
                <p className="text-xs text-slate-400">Account Age</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-2xl font-bold text-white">{(myDataQuery.data as any)?.dataPoints?.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Data Points</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-2xl font-bold text-white">{(myDataQuery.data as any)?.storageUsed}</p>
                <p className="text-xs text-slate-400">Storage Used</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-2xl font-bold text-white">{(myDataQuery.data as any)?.lastActivity}</p>
                <p className="text-xs text-slate-400">Last Activity</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => requestExportMutation.mutate({})}>
              <Download className="w-4 h-4 mr-2" />Export My Data
            </Button>
            <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => requestDeletionMutation.mutate({})}>
              <Trash2 className="w-4 h-4 mr-2" />Request Deletion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Retention Periods */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Retention Periods
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {retentionQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(retentionQuery.data as any)?.categories?.map((category: any) => (
                <div key={category.name} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{category.name}</p>
                    <p className="text-sm text-slate-400">{category.description}</p>
                  </div>
                  <Badge className={cn(category.period === "Indefinite" ? "bg-yellow-500/20 text-yellow-400" : "bg-cyan-500/20 text-cyan-400", "border-0")}>{category.period}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">Important Notice</p>
              <p className="text-sm text-slate-400">Some data may be retained longer for legal, regulatory, or business purposes. Contact us for specific retention inquiries.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
