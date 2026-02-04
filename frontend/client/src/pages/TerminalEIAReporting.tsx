/**
 * TERMINAL EIA REPORTING PAGE
 * 100% Dynamic - Energy Information Administration compliance reporting
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Send, CheckCircle, Clock, AlertTriangle,
  Calendar, BarChart3, Download, Droplets, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalEIAReporting() {
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [selectedWeek, setSelectedWeek] = useState("");

  const reportQuery = trpc.terminals.getEIAReport.useQuery({ period: reportPeriod });
  const historyQuery = trpc.terminals.getAppointments.useQuery({});
  const inventoryQuery = trpc.terminals.getInventory.useQuery({});

  const submitMutation = trpc.terminals.submitEIAReport.useMutation({
    onSuccess: () => {
      toast.success("EIA report submitted");
      historyQuery.refetch();
    },
    onError: (error) => toast.error("Submission failed", { description: error.message }),
  });

  const report = reportQuery.data;
  const history = historyQuery.data || [];
  const inventory = inventoryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            EIA Reporting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Energy Information Administration Compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Inventory Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {inventoryQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Droplets className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Gasoline</span>
                </div>
                <p className="text-2xl font-bold text-white">{((inventory as any)?.[0]?.currentLevel / 1000 || 0).toFixed(1)}K</p>
                <p className="text-slate-400 text-xs">barrels</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Droplets className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Diesel</span>
                </div>
                <p className="text-2xl font-bold text-white">{((inventory as any)?.[1]?.currentLevel / 1000 || 0).toFixed(1)}K</p>
                <p className="text-slate-400 text-xs">barrels</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Jet Fuel</span>
                </div>
                <p className="text-2xl font-bold text-white">{((inventory as any)?.[2]?.currentLevel / 1000 || 0).toFixed(1)}K</p>
                <p className="text-slate-400 text-xs">barrels</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Throughput</span>
                </div>
                <p className="text-2xl font-bold text-white">{((inventory as any)?.length || 0).toLocaleString()}</p>
                <p className="text-slate-400 text-xs">bbl/day</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Current Report */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Current Report Period
            </CardTitle>
            <Badge className={cn(
              "border-0",
              report?.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
              report?.status === "submitted" ? "bg-green-500/20 text-green-400" :
              "bg-slate-500/20 text-slate-400"
            )}>
              {report?.status || "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reportQuery.isLoading ? (
            <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-slate-400 text-sm mb-1">Report Period</p>
                  <p className="text-white font-medium">{report?.periodStart} - {report?.periodEnd}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-slate-400 text-sm mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <p className="text-white font-medium">{report?.dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-slate-300 font-medium">Product Volumes (Barrels)</p>
                {report?.products?.map((product: any) => (
                  <div key={product.code} className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{product.name}</span>
                      <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                        Code: {product.code}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">Opening</p>
                        <p className="text-white">{product.opening?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Receipts</p>
                        <p className="text-green-400">+{product.receipts?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Shipments</p>
                        <p className="text-red-400">-{product.shipments?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Closing</p>
                        <p className="text-white font-medium">{product.closing?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  Save Draft
                </Button>
                <Button
                  onClick={() => submitMutation.mutate({ reportId: report?.id })}
                  disabled={report?.status === "submitted" || submitMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit to EIA
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submission History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No previous submissions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    {item.status === "accepted" ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : item.status === "pending" ? (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{item.period}</p>
                      <p className="text-slate-400 text-sm">Submitted {item.submittedAt}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    item.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    item.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
