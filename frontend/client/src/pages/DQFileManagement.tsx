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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FolderOpen, FileText, CheckCircle, AlertTriangle, Clock,
  Search, Upload, User, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DQFileManagement() {
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const driversQuery = (trpc as any).compliance.getDQDrivers.useQuery({ search });
  const driverDQQuery = (trpc as any).compliance.getDriverDQFile.useQuery({ driverId: selectedDriver! }, { enabled: !!selectedDriver });
  const statsQuery = (trpc as any).compliance.getDQStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case "incomplete": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Incomplete</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getDocStatusIcon = (status: string) => {
    switch (status) {
      case "valid": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "expiring": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "expired": return <Clock className="w-4 h-4 text-red-400" />;
      case "missing": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            DQ File Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Driver Qualification Files per 49 CFR 391.51</p>
        </div>
        {selectedDriver && (
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setSelectedDriver(null)}>
            Back to List
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.complete || 0}</p>
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
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.incomplete || 0}</p>
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
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.expiringSoon || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <FolderOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver DQ Detail */}
      {selectedDriver ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          {driverDQQuery.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xl font-bold text-white">
                    {(driverDQQuery.data as any)?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xl font-bold">{(driverDQQuery.data as any)?.name}</p>
                      {getStatusBadge((driverDQQuery.data as any)?.dqStatus || "")}
                    </div>
                    <p className="text-slate-400">CDL: {(driverDQQuery.data as any)?.cdlNumber} | Hired: {(driverDQQuery.data as any)?.hireDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Completion</p>
                    <p className={cn("text-2xl font-bold", ((driverDQQuery.data as any)?.completionPercent ?? 0) >= 100 ? "text-green-400" : ((driverDQQuery.data as any)?.completionPercent ?? 0) >= 80 ? "text-yellow-400" : "text-red-400")}>
                      {(driverDQQuery.data as any)?.completionPercent}%
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={(driverDQQuery.data as any)?.completionPercent} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(driverDQQuery.data as any)?.documents?.map((doc: any) => (
                    <div key={doc.id} className={cn("p-4 rounded-xl border flex items-center justify-between", doc.status === "valid" ? "bg-slate-700/30 border-slate-600/50" : doc.status === "expiring" ? "bg-yellow-500/5 border-yellow-500/30" : "bg-red-500/5 border-red-500/30")}>
                      <div className="flex items-center gap-3">
                        {getDocStatusIcon(doc.status)}
                        <div>
                          <p className="text-white font-medium">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.status === "missing" ? "Not uploaded" : `Expires: ${doc.expiresAt || "N/A"}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status !== "missing" && (
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                          <Upload className="w-4 h-4 mr-1" />{doc.status === "missing" ? "Upload" : "Replace"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
          </div>

          {/* Drivers List */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Driver DQ Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (driversQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {(driversQuery.data as any)?.map((driver: any) => (
                    <div key={driver.id} className={cn("p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors cursor-pointer", driver.dqStatus === "expired" && "bg-red-500/5 border-l-2 border-red-500")} onClick={() => setSelectedDriver(driver.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">
                          {driver.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{driver.name}</p>
                            {getStatusBadge(driver.dqStatus)}
                          </div>
                          <p className="text-xs text-slate-500">CDL: {driver.cdlNumber} | {driver.missingDocs} missing docs</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <Progress value={driver.completionPercent} className="h-2" />
                          <p className="text-xs text-slate-500 text-right mt-1">{driver.completionPercent}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
