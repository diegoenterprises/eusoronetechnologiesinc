/**
 * DQ FILE MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Users, CheckCircle, AlertTriangle, Clock,
  Search, Eye, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function DQFileManagement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const summaryQuery = trpc.compliance.getDQSummary.useQuery();
  const driversQuery = trpc.compliance.getDQFiles.useQuery({ limit: 50 });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete": return <Badge className="bg-green-500/20 text-green-400 border-0">Complete</Badge>;
      case "incomplete": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Incomplete</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredDrivers = driversQuery.data?.filter((driver: any) => {
    return !searchTerm || 
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.cdlNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            DQ File Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Driver Qualification files per 49 CFR 391.51</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Drivers</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.completeFiles || 0}</p>
                )}
                <p className="text-xs text-slate-400">Complete</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.incompleteFiles || 0}</p>
                )}
                <p className="text-xs text-slate-400">Incomplete</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.expiredDocs || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search drivers..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Driver DQ Files */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Driver DQ Files</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredDrivers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No DQ files found</p>
              <p className="text-slate-500 text-sm mt-1">Add drivers to manage their qualification files</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredDrivers?.map((driver: any) => (
                <div key={driver.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", driver.status === "complete" ? "bg-green-500/20" : driver.status === "expired" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                        <FileText className={cn("w-6 h-6", driver.status === "complete" ? "text-green-400" : driver.status === "expired" ? "text-red-400" : "text-yellow-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getStatusBadge(driver.status)}
                        </div>
                        <p className="text-sm text-slate-400">CDL: {driver.cdlNumber}</p>
                        <p className="text-xs text-slate-500">{driver.documentsComplete}/{driver.documentsRequired} documents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Completion</p>
                        <p className={cn("font-bold", driver.completionRate >= 100 ? "text-green-400" : driver.completionRate >= 75 ? "text-yellow-400" : "text-red-400")}>
                          {driver.completionRate}%
                        </p>
                      </div>
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/drivers/${driver.id}/dq`)}>
                        <Eye className="w-4 h-4 mr-1" />View
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
