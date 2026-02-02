/**
 * ESCORT CERTIFICATION RENEWAL PAGE
 * 100% Dynamic - Manage escort certification renewals by state
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
  Award, Search, Calendar, AlertTriangle, CheckCircle,
  Clock, MapPin, FileText, RefreshCw, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortCertificationRenewal() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const certificationsQuery = trpc.escort.getCertifications.useQuery({ status: statusFilter });
  const statsQuery = trpc.escort.getCertificationStats.useQuery();

  const startRenewalMutation = trpc.escort.startCertificationRenewal.useMutation({
    onSuccess: () => {
      toast.success("Renewal process started");
      certificationsQuery.refetch();
    },
  });

  const certifications = certificationsQuery.data || [];
  const stats = statsQuery.data;

  const filteredCertifications = certifications.filter((c: any) =>
    c.state?.toLowerCase().includes(search.toLowerCase()) ||
    c.certNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getExpiryColor = (days: number) => {
    if (days <= 0) return "text-red-400";
    if (days <= 30) return "text-red-400";
    if (days <= 60) return "text-orange-400";
    if (days <= 90) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Certification Renewal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your escort certifications by state</p>
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
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Certs</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalCertifications || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>
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
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Expired</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Pending Renewal</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.pendingRenewal || 0}</p>
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
                placeholder="Search by state or cert number..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificationsQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredCertifications.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Award className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No certifications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCertifications.map((cert: any) => {
            const daysLeft = getDaysUntilExpiry(cert.expiryDate);
            return (
              <Card key={cert.id} className={cn(
                "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
                daysLeft <= 0 && "border-l-4 border-red-500",
                daysLeft > 0 && daysLeft <= 30 && "border-l-4 border-orange-500"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        cert.status === "active" && daysLeft > 30 ? "bg-green-500/20" :
                        cert.status === "pending" ? "bg-purple-500/20" :
                        daysLeft <= 0 ? "bg-red-500/20" :
                        "bg-yellow-500/20"
                      )}>
                        <MapPin className={cn(
                          "w-6 h-6",
                          cert.status === "active" && daysLeft > 30 ? "text-green-400" :
                          cert.status === "pending" ? "text-purple-400" :
                          daysLeft <= 0 ? "text-red-400" :
                          "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{cert.state}</p>
                        <Badge className={cn(
                          "border-0 text-xs",
                          cert.status === "active" ? "bg-green-500/20 text-green-400" :
                          cert.status === "pending" ? "bg-purple-500/20 text-purple-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {cert.status}
                        </Badge>
                      </div>
                    </div>
                    {cert.hasReciprocity && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                        Reciprocity
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Cert Number</span>
                      <span className="text-white font-medium">{cert.certNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Issued</span>
                      <span className="text-white">{cert.issueDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Expires</span>
                      <span className={cn("font-medium", getExpiryColor(daysLeft))}>
                        {cert.expiryDate}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">Time Remaining</span>
                      <span className={cn("font-medium", getExpiryColor(daysLeft))}>
                        {daysLeft <= 0 ? "Expired" : `${daysLeft} days`}
                      </span>
                    </div>
                    <Progress 
                      value={daysLeft <= 0 ? 0 : Math.min(100, (daysLeft / 365) * 100)} 
                      className="h-2" 
                    />
                  </div>

                  {cert.reciprocityStates && cert.reciprocityStates.length > 0 && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-xs mb-2">Covers states:</p>
                      <div className="flex flex-wrap gap-1">
                        {cert.reciprocityStates.map((s: string) => (
                          <Badge key={s} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {cert.status === "active" && daysLeft <= 60 && (
                      <Button
                        onClick={() => startRenewalMutation.mutate({ certId: cert.id })}
                        disabled={startRenewalMutation.isPending}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />Renew
                      </Button>
                    )}
                    {cert.status === "expired" && (
                      <Button
                        onClick={() => startRenewalMutation.mutate({ certId: cert.id })}
                        disabled={startRenewalMutation.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />Reinstate
                      </Button>
                    )}
                    {cert.renewalUrl && (
                      <Button
                        variant="outline"
                        className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                        onClick={() => window.open(cert.renewalUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />State Portal
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
