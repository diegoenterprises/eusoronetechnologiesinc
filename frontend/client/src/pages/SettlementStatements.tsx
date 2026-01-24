/**
 * SETTLEMENT STATEMENTS PAGE
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
  FileText, Search, Download, DollarSign, Calendar,
  CheckCircle, Clock, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function SettlementStatements() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  const statementsQuery = trpc.settlements.list.useQuery({ period: periodFilter === "all" ? undefined : periodFilter, limit: 50 });
  const summaryQuery = trpc.settlements.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "finalized": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Finalized</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "draft": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Draft</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredStatements = statementsQuery.data?.filter((statement: any) =>
    !searchTerm || statement.statementNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || statement.carrierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Settlement Statements
          </h1>
          <p className="text-slate-400 text-sm mt-1">View and manage carrier settlements</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export All
        </Button>
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
                  <p className="text-2xl font-bold text-emerald-400">${summary?.totalSettled?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Settled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalStatements || 0}</p>
                )}
                <p className="text-xs text-slate-400">Statements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${summary?.avgSettlement?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Avg Settlement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search statements..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            <SelectItem value="current_week">This Week</SelectItem>
            <SelectItem value="current_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statements List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {statementsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredStatements?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No statements found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredStatements?.map((statement: any) => (
                <div key={statement.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(`/settlements/${statement.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{statement.statementNumber}</p>
                        {getStatusBadge(statement.status)}
                      </div>
                      <p className="text-sm text-slate-400">{statement.carrierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-xl">${statement.totalAmount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Net Settlement</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Period: {statement.periodStart} - {statement.periodEnd}</span>
                      <span>{statement.loadsCount} loads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
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
