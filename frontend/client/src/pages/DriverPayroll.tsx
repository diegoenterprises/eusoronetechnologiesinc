/**
 * DRIVER PAYROLL PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Search, Download, Calendar, Users,
  CheckCircle, Clock, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverPayroll() {
  const [searchTerm, setSearchTerm] = useState("");
  const [payPeriod, setPayPeriod] = useState("current");

  const payrollQuery = trpc.payroll.getDriverPayroll.useQuery({ period: payPeriod, limit: 50 });
  const summaryQuery = trpc.payroll.getSummary.useQuery({ period: payPeriod });

  const processPayrollMutation = trpc.payroll.process.useMutation({
    onSuccess: () => { toast.success("Payroll processed"); payrollQuery.refetch(); },
    onError: (error) => toast.error("Failed to process payroll", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "processing": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Processing</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredPayroll = payrollQuery.data?.filter((item: any) =>
    !searchTerm || item.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Payroll
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage driver compensation and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={payPeriod} onValueChange={setPayPeriod}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => processPayrollMutation.mutate({ period: payPeriod })}>
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${summary?.totalPayroll?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Payroll</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.driversCount || 0}</p>
                )}
                <p className="text-xs text-slate-400">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${summary?.avgPay?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Avg Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.paidCount || 0}</p>
                )}
                <p className="text-xs text-slate-400">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Period Info */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white font-medium">Pay Period: {summary?.periodStart} - {summary?.periodEnd}</p>
                <p className="text-sm text-slate-400">Pay Date: {summary?.payDate}</p>
              </div>
            </div>
            <Badge className={cn(summary?.status === "processed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>{summary?.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Payroll List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {payrollQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredPayroll?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No payroll records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredPayroll?.map((item: any) => (
                <div key={item.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{item.driverName}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-slate-400">Driver ID: {item.driverId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-xl">${item.totalPay?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Gross Pay</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400">Miles</p>
                      <p className="text-white font-medium">{item.miles?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400">Loads</p>
                      <p className="text-white font-medium">{item.loads}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400">Bonus</p>
                      <p className="text-green-400 font-medium">${item.bonus?.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                      <p className="text-slate-400">Deductions</p>
                      <p className="text-red-400 font-medium">${item.deductions?.toLocaleString()}</p>
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
