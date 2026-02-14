import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { TrendingUp, DollarSign, FileText } from "lucide-react";

export default function FactoringReports() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const reportsQuery = (trpc as any).factoring.getReports.useQuery({ period });
  const feeQuery = (trpc as any).factoring.getFeeSchedule.useQuery();
  const report = reportsQuery.data;
  const fees = feeQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Factoring Reports
          </h1>
          <p className="text-muted-foreground mt-1">Financial reports and fee schedules</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportsQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">${(report?.totalVolume || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1473FF]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${(report?.revenue || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoices Processed</p>
                <p className="text-2xl font-bold">{report?.invoicesProcessed || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {fees && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Fee Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Standard Factoring</p>
                <p className="font-bold text-lg">{((fees.standardFactoring?.rate || 0.025) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Quick Pay</p>
                <p className="font-bold text-lg">{((fees.standardFactoring?.quickPayFee || 0.035) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Advance Rate</p>
                <p className="font-bold text-lg">{((fees.standardFactoring?.advanceRate || 0.95) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
