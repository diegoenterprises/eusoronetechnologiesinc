/**
 * CARRIER SETTLEMENTS PAGE
 * 100% Dynamic - Manage driver and owner-operator settlements
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
  DollarSign, Search, Download, CheckCircle, Clock,
  User, Truck, Calendar, FileText, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierSettlements() {
  const [periodFilter, setPeriodFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const settlementsQuery = trpc.carriers.getSettlements.useQuery({ period: periodFilter, status: statusFilter });
  const statsQuery = trpc.carriers.getSettlementStats.useQuery({ period: periodFilter });

  const processSettlementMutation = trpc.carriers.processSettlement.useMutation({
    onSuccess: () => {
      toast.success("Settlement processed");
      settlementsQuery.refetch();
    },
  });

  const settlements = settlementsQuery.data || [];
  const stats = statsQuery.data;

  const filteredSettlements = settlements.filter((s: any) =>
    s.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "processing": return "bg-cyan-500/20 text-cyan-400";
      case "hold": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Settlements
          </h1>
          <p className="text-slate-400 text-sm mt-1">Driver and owner-operator pay</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="last">Last Period</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
            <Send className="w-4 h-4 mr-2" />Process All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.driverCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Total Payable</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${stats?.totalPayable?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Processed</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">${stats?.processed?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${stats?.pending?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Loads</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.loadCount || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by driver name..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Settlements List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {settlementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredSettlements.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No settlements found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredSettlements.map((settlement: any) => (
                <div key={settlement.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{settlement.driverName}</p>
                          <Badge className={cn("border-0", getStatusColor(settlement.status))}>
                            {settlement.status}
                          </Badge>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {settlement.type === "owner_op" ? "Owner Operator" : "Company Driver"}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {settlement.loadCount} loads • {settlement.miles?.toLocaleString()} miles
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Gross</p>
                        <p className="text-white font-bold">${settlement.gross?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Deductions</p>
                        <p className="text-red-400 font-bold">-${settlement.deductions?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Net Pay</p>
                        <p className="text-green-400 font-bold text-lg">${settlement.netPay?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <Download className="w-4 h-4" />
                        </Button>
                        {settlement.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => processSettlementMutation.mutate({ settlementId: settlement.id })}
                            className="bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {settlement.deductionDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-4 text-sm">
                      {settlement.deductionDetails.map((ded: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-slate-500">{ded.name}:</span>
                          <span className="text-red-400">-${ded.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
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
