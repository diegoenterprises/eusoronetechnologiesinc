/**
 * DRIVER PAY STATEMENTS PAGE
 * 100% Dynamic - View detailed pay statements and earnings breakdown
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, DollarSign, Calendar, Download, TrendingUp,
  Truck, Clock, Fuel, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverPayStatements() {
  const [periodFilter, setPeriodFilter] = useState("current");

  const statementsQuery = trpc.drivers.getAll.useQuery({});
  const summaryQuery = trpc.drivers.getSummary.useQuery();
  const currentStatementQuery = trpc.drivers.getSummary.useQuery();

  const statements = statementsQuery.data || [];
  const summary = summaryQuery.data as any;
  const currentStatement = currentStatementQuery.data as any;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Pay Statements
          </h1>
          <p className="text-slate-400 text-sm mt-1">View earnings and pay details</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Period</SelectItem>
            <SelectItem value="last">Last Period</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Period Summary */}
      {currentStatement && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-sm">Current Pay Period</p>
                <p className="text-white font-medium">{currentStatement.periodStart} - {currentStatement.periodEnd}</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-0">
                {currentStatement.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs">Gross Pay</p>
                <p className="text-2xl font-bold text-green-400">${currentStatement.grossPay?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs">Deductions</p>
                <p className="text-2xl font-bold text-red-400">-${currentStatement.deductions?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs">Reimbursements</p>
                <p className="text-2xl font-bold text-cyan-400">+${currentStatement.reimbursements?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs">Net Pay</p>
                <p className="text-2xl font-bold text-white">${currentStatement.netPay?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* YTD Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">YTD Earnings</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${summary?.ytdEarnings?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">YTD Miles</span>
                </div>
                <p className="text-2xl font-bold text-white">{summary?.ytdMiles?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg $/Mile</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">${summary?.avgPerMile?.toFixed(2) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">YTD Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{summary?.ytdLoads || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Statement History */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Statement History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : statements.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No pay statements found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {statements.map((statement: any) => (
                <div key={statement.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">Pay Period: {statement.periodLabel}</p>
                          <Badge className={cn(
                            "border-0",
                            statement.status === "paid" ? "bg-green-500/20 text-green-400" :
                            statement.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {statement.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {statement.periodStart} - {statement.periodEnd}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Loads</p>
                        <p className="text-white font-bold">{statement.loads}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Miles</p>
                        <p className="text-white">{statement.distance?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Gross</p>
                        <p className="text-white">${statement.grossPay?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Net Pay</p>
                        <p className="text-green-400 font-bold text-lg">${statement.netPay?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                        >
                          <Download className="w-4 h-4 mr-1" />PDF
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs">Line Haul</p>
                      <p className="text-white font-medium">${statement.lineHaul?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs">Accessorials</p>
                      <p className="text-white font-medium">${statement.accessorials?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs flex items-center justify-center gap-1"><Fuel className="w-3 h-3" />Fuel</p>
                      <p className="text-red-400 font-medium">-${statement.fuelDeduction?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs">Insurance</p>
                      <p className="text-red-400 font-medium">-${statement.insuranceDeduction?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs">Advances</p>
                      <p className="text-red-400 font-medium">-${statement.advances?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400 text-xs">Other</p>
                      <p className="text-white font-medium">${statement.other?.toLocaleString()}</p>
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
