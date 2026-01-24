/**
 * DQ FILE MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, User, CheckCircle, AlertTriangle, Clock,
  Search, Eye, Upload, Download, Calendar, Shield, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DQFileManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const summaryQuery = trpc.compliance.getDQSummary.useQuery();
  const driversQuery = trpc.compliance.getDQDrivers.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const documentsQuery = trpc.compliance.getDQDocuments.useQuery(
    { driverId: selectedDriver! },
    { enabled: !!selectedDriver }
  );

  const uploadMutation = trpc.compliance.uploadDQDocument.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); documentsQuery.refetch(); driversQuery.refetch(); },
    onError: (error) => toast.error("Upload failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading DQ file data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-500/20 text-green-400";
      case "expiring": return "bg-yellow-500/20 text-yellow-400";
      case "expired": case "non_compliant": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DQ File Management</h1>
          <p className="text-slate-400 text-sm">Driver Qualification Files per 49 CFR 391.51</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <Download className="w-4 h-4 mr-2" />Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.compliant || 0}</p>
            )}
            <p className="text-xs text-slate-400">Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.expiringSoon || 0}</p>
            )}
            <p className="text-xs text-slate-400">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.nonCompliant || 0}</p>
            )}
            <p className="text-xs text-slate-400">Non-Compliant</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className={cn("text-2xl font-bold", getComplianceColor(summary?.overallCompliance || 0))}>{summary?.overallCompliance || 0}%</p>
            )}
            <p className="text-xs text-slate-400">Overall Compliance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drivers List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Drivers</CardTitle>
              <div className="flex gap-2">
                <div className="relative w-48">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 h-8 bg-slate-700/50 border-slate-600 text-sm" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-8 bg-slate-700/50 border-slate-600 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {driversQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : driversQuery.data?.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No drivers found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {driversQuery.data?.map((driver) => (
                  <div
                    key={driver.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                      selectedDriver === driver.id ? "bg-blue-500/20 border border-blue-500" : "bg-slate-700/30 hover:bg-slate-700/50"
                    )}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <p className="text-xs text-slate-500">{driver.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn("font-bold", getComplianceColor(driver.compliancePercentage))}>{driver.compliancePercentage}%</p>
                        <p className="text-xs text-slate-500">{driver.documentsComplete}/{driver.documentsRequired}</p>
                      </div>
                      <Badge className={getStatusColor(driver.status)}>{driver.status?.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Panel */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              {selectedDriver ? "DQ File Documents" : "Select a Driver"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDriver ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Select a driver to view their DQ file</p>
              </div>
            ) : documentsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {documentsQuery.data?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", doc.status === "valid" ? "bg-green-500/20" : doc.status === "expiring" ? "bg-yellow-500/20" : doc.status === "expired" ? "bg-red-500/20" : "bg-slate-500/20")}>
                        <FileText className={cn("w-4 h-4", doc.status === "valid" ? "text-green-400" : doc.status === "expiring" ? "text-yellow-400" : doc.status === "expired" ? "text-red-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <p className="text-white text-sm">{doc.name}</p>
                        {doc.expirationDate && <p className="text-xs text-slate-500">Expires: {doc.expirationDate}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      {doc.status === "missing" || doc.status === "expired" ? (
                        <Button size="sm" variant="outline" className="border-slate-600"><Upload className="w-3 h-3" /></Button>
                      ) : (
                        <Button size="sm" variant="ghost"><Eye className="w-3 h-3" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
