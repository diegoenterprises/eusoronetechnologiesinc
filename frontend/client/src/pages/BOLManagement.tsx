/**
 * BOL MANAGEMENT PAGE
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
  FileText, Search, Plus, Download, Upload,
  CheckCircle, Clock, Eye, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function BOLManagement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const bolsQuery = (trpc as any).bol.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const summaryQuery = (trpc as any).bol.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_transit": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Transit</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "issue": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Issue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredBOLs = (bolsQuery.data as any)?.filter((bol: any) =>
    !searchTerm || bol.bolNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || bol.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            BOL Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage Bills of Lading</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
            <Upload className="w-4 h-4 mr-2" />Upload BOL
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Create BOL
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total BOLs</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
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
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.issues || 0}</p>
                )}
                <p className="text-xs text-slate-400">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search BOLs..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="issue">Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BOL List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {bolsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredBOLs?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No BOLs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredBOLs?.map((bol: any) => (
                <div key={bol.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors cursor-pointer", bol.status === "issue" && "bg-red-500/5 border-l-2 border-red-500")} onClick={() => setLocation(`/bol/${bol.id}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{bol.bolNumber}</p>
                        {getStatusBadge(bol.status)}
                      </div>
                      <p className="text-sm text-slate-400">Load: {bol.loadNumber}</p>
                      <p className="text-sm text-slate-400">{bol.origin} → {bol.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{bol.pieces} pieces</p>
                      <p className="text-xs text-slate-500">{bol.weight?.toLocaleString()} lbs</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Shipper: {bol.shipperName}</span>
                      <span>Consignee: {bol.consigneeName}</span>
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
