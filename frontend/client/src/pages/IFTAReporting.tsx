/**
 * IFTA REPORTING PAGE
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
  FileText, MapPin, Fuel, DollarSign, Download,
  CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IFTAReporting() {
  const [quarter, setQuarter] = useState("Q1-2024");

  const reportQuery = (trpc as any).fleet.getIFTAReport.useQuery({ quarter });
  const statsQuery = (trpc as any).fleet.getIFTAStats.useQuery({ quarter });

  const generateMutation = (trpc as any).fleet.generateIFTAReport.useMutation({
    onSuccess: () => toast.success("Report generated"),
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;
  const report = reportQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">IFTA Reporting</h1>
          <p className="text-slate-400 text-sm mt-1">International Fuel Tax Agreement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1-2024">Q1 2024</SelectItem>
              <SelectItem value="Q4-2023">Q4 2023</SelectItem>
              <SelectItem value="Q3-2023">Q3 2023</SelectItem>
              <SelectItem value="Q2-2023">Q2 2023</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => generateMutation.mutate({ quarter })}>
            <Download className="w-4 h-4 mr-2" />Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><MapPin className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalMiles?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Total Miles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Fuel className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{stats?.totalGallons?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Gallons</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.taxOwed?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Tax Owed</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><FileText className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.jurisdictions || 0}</p>}<p className="text-xs text-slate-400">States</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" />Jurisdiction Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          {reportQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : report?.jurisdictions?.length === 0 ? (
            <div className="text-center py-16"><MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No data for this quarter</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {report?.jurisdictions?.map((j: any) => (
                <div key={j.state} className={cn("p-4 flex items-center justify-between", j.netTax > 0 && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">{j.state}</div>
                    <div>
                      <p className="text-white font-bold">{j.stateName}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{j.distance?.toLocaleString()} mi</span>
                        <span>{j.gallonsPurchased?.toLocaleString()} gal purchased</span>
                        <span>{j.gallonsUsed?.toLocaleString()} gal used</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-bold", j.netTax > 0 ? "text-red-400" : "text-green-400")}>
                      {j.netTax > 0 ? "-" : "+"}${Math.abs(j.netTax)?.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">{j.netTax > 0 ? "Owed" : "Credit"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {report?.status && (
        <Card className={cn("rounded-xl", report.status === "filed" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : report.status === "pending" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-white/[0.02] border-white/[0.06]")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {report.status === "filed" ? <CheckCircle className="w-6 h-6 text-green-400" /> : report.status === "pending" ? <Clock className="w-6 h-6 text-yellow-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
              <div>
                <p className="text-white font-bold">Report Status: <span className="capitalize">{report.status}</span></p>
                <p className="text-sm text-slate-400">Due: {report.dueDate} | Filed: {report.filedDate || "Not filed"}</p>
              </div>
            </div>
            <Badge className={cn("border-0", report.status === "filed" ? "bg-green-500/20 text-green-400" : report.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{report.status}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
