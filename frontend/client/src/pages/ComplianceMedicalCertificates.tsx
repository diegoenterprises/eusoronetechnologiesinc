/**
 * COMPLIANCE MEDICAL CERTIFICATES PAGE
 * 100% Dynamic - Track driver medical certificate compliance
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
  FileHeart, Search, User, Calendar, AlertTriangle,
  CheckCircle, Clock, FileText, Bell, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComplianceMedicalCertificates() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const certificatesQuery = trpc.compliance.getMedicalCerts.useQuery({ search: statusFilter === 'all' ? undefined : statusFilter });
  const statsQuery = trpc.compliance.getMedicalCertStats.useQuery();

  const sendReminderMutation = trpc.compliance.scheduleDrugTest.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
  });

  const certificates = certificatesQuery.data || [];
  const stats = statsQuery.data;

  const filteredCerts = certificates.filter((c: any) =>
    c.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    c.driverId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
            Medical Certificates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track driver medical certificate compliance</p>
        </div>
        <Button className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg">
          <Download className="w-4 h-4 mr-2" />Export Report
        </Button>
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
                  <span className="text-slate-400 text-sm">Valid</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.valid || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Expiring 30d</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.expiringSoon || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-400 text-sm">Expiring 7d</span>
                </div>
                <p className="text-2xl font-bold text-orange-400">{stats?.expiring || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Expired</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Urgent Attention */}
      {stats?.expiring7 > 0 || stats?.expired > 0 ? (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Requires Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificatesQuery.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : (
              <div className="flex flex-wrap gap-3">
                {certificates
                  .filter((c: any) => c.status === "expired" || c.daysUntilExpiry <= 7)
                  .slice(0, 5)
                  .map((cert: any) => (
                    <div key={cert.id} className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded flex items-center justify-center",
                        cert.status === "expired" ? "bg-red-500/20" : "bg-orange-500/20"
                      )}>
                        {cert.status === "expired" ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-orange-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{cert.driverName}</p>
                        <p className={cn(
                          "text-sm",
                          cert.status === "expired" ? "text-red-400" : "text-orange-400"
                        )}>
                          {cert.status === "expired" ? "Expired" : `${cert.daysUntilExpiry} days left`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendReminderMutation.mutate({ driverId: cert.driverId })}
                        className="text-cyan-400"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drivers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring_30">Expiring 30 days</SelectItem>
                <SelectItem value="expiring_7">Expiring 7 days</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <div className="space-y-4">
        {certificatesQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)
        ) : filteredCerts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <FileHeart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No certificates found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCerts.map((cert: any) => (
            <Card key={cert.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              cert.status === "expired" && "border-l-4 border-red-500",
              cert.daysUntilExpiry <= 7 && cert.status !== "expired" && "border-l-4 border-orange-500",
              cert.daysUntilExpiry <= 30 && cert.daysUntilExpiry > 7 && "border-l-4 border-yellow-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-600/50 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{cert.driverName}</p>
                      <p className="text-slate-400 text-sm">ID: {cert.driverId}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    cert.status === "valid" ? "bg-green-500/20 text-green-400" :
                    cert.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {cert.status === "valid" ? "Valid" :
                     cert.status === "expiring" ? `${cert.daysUntilExpiry} days` :
                     "Expired"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Certificate Type</p>
                    <p className="text-white">{cert.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Issue Date</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {cert.issueDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Expiry Date</p>
                    <p className={cn(
                      "flex items-center gap-1",
                      cert.status === "expired" ? "text-red-400" :
                      cert.daysUntilExpiry <= 30 ? "text-yellow-400" :
                      "text-white"
                    )}>
                      <Calendar className="w-4 h-4" />
                      {cert.expiryDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Examiner</p>
                    <p className="text-white">{cert.examinerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Restrictions</p>
                    <p className="text-white">{cert.restrictions || "None"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-700/50 mt-4 gap-2">
                  <Button variant="ghost" size="sm" className="text-cyan-400">
                    <FileText className="w-4 h-4 mr-1" />View Certificate
                  </Button>
                  {(cert.status === "expired" || cert.daysUntilExpiry <= 30) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminderMutation.mutate({ driverId: cert.driverId })}
                      className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                    >
                      <Bell className="w-4 h-4 mr-1" />Send Reminder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
