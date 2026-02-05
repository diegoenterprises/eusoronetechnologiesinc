/**
 * COMPLIANCE DRIVER QUALIFICATION PAGE
 * 100% Dynamic - Manage driver qualification files per 49 CFR 391.51
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  FolderOpen, Search, CheckCircle, XCircle, Clock,
  User, FileText, AlertTriangle, Calendar, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComplianceDriverQualification() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const driversQuery = (trpc as any).compliance.getDQFiles.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined });
  const statsQuery = (trpc as any).compliance.getDQStats.useQuery();

  const requestDocMutation = (trpc as any).compliance.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document request sent");
      driversQuery.refetch();
    },
  });

  const drivers = driversQuery.data || [];
  const stats = statsQuery.data;

  const filteredDrivers = drivers.filter((d: any) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.cdlNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Driver Qualification Files
          </h1>
          <p className="text-slate-400 text-sm mt-1">49 CFR 391.51 compliance management</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Drivers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalDrivers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Fully Compliant</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.complete || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Expiring Soon</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.expiringSoon || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Missing Docs</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.missing || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Completion</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.incomplete || 0}</p>
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
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search by name or CDL number..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Fully Compliant</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="space-y-4">
        {driversQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-80 rounded-xl" />)
        ) : filteredDrivers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No drivers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver: any) => (
            <Card key={driver.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              driver.completionRate < 100 && driver.hasExpired && "border-l-4 border-red-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold",
                      driver.completionRate === 100 ? "bg-green-500/20 text-green-400" :
                      driver.completionRate >= 80 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {driver.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{driver.name}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <span>CDL: {driver.cdlNumber}</span>
                        <Badge className={cn(
                          "border-0 text-xs",
                          driver.status === "active" ? "bg-green-500/20 text-green-400" :
                          driver.status === "inactive" ? "bg-slate-500/20 text-slate-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {driver.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">File Completion</p>
                    <div className="flex items-center gap-3">
                      <Progress value={driver.completionRate} className="w-32 h-2" />
                      <span className={cn(
                        "font-bold",
                        driver.completionRate === 100 ? "text-green-400" :
                        driver.completionRate >= 80 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {driver.completionRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-slate-400 text-sm mb-3">Required Documents (49 CFR 391.51)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {driver.documents?.map((doc: any) => (
                      <div key={doc.name} className={cn(
                        "p-3 rounded-lg border",
                        doc.status === "valid" ? "bg-green-500/10 border-green-500/30" :
                        doc.status === "expiring" ? "bg-yellow-500/10 border-yellow-500/30" :
                        doc.status === "expired" ? "bg-red-500/10 border-red-500/30" :
                        "bg-slate-700/30 border-slate-600/50"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {doc.status === "valid" ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : doc.status === "expiring" ? (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            ) : doc.status === "expired" ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="text-white text-sm font-medium">{doc.name}</span>
                          </div>
                          <Badge className={cn(
                            "border-0 text-xs",
                            doc.status === "valid" ? "bg-green-500/20 text-green-400" :
                            doc.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                            doc.status === "expired" ? "bg-red-500/20 text-red-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {doc.status || "missing"}
                          </Badge>
                        </div>
                        {doc.expiryDate && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span>Expires: {doc.expiryDate}</span>
                          </div>
                        )}
                        {doc.status === "missing" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => requestDocMutation.mutate({ documentType: doc.type, userType: "driver" as const } as any)}
                            className="w-full mt-2 text-xs h-7 text-cyan-400 hover:text-cyan-300"
                          >
                            Request Document
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {driver.alerts && driver.alerts.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium text-sm">Compliance Alerts</span>
                    </div>
                    <ul className="text-sm text-slate-400 space-y-1">
                      {driver.alerts.map((alert: string, idx: number) => (
                        <li key={idx}>- {alert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-end mt-4 gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <FileText className="w-4 h-4 mr-1" />View File
                  </Button>
                  <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                    Send Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
