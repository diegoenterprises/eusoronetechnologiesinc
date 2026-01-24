/**
 * INSURANCE CERTIFICATES PAGE
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
  Shield, Search, Plus, Download, Calendar,
  CheckCircle, AlertTriangle, Clock, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function InsuranceCertificates() {
  const [searchTerm, setSearchTerm] = useState("");

  const certificatesQuery = trpc.insurance.getCertificates.useQuery({ limit: 50 });
  const summaryQuery = trpc.insurance.getSummary.useQuery();

  const requestMutation = trpc.insurance.requestCertificate.useMutation({
    onSuccess: () => { toast.success("Certificate requested"); certificatesQuery.refetch(); },
    onError: (error) => toast.error("Request failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case "pending": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCertificates = certificatesQuery.data?.filter((cert: any) =>
    !searchTerm || cert.holderName?.toLowerCase().includes(searchTerm.toLowerCase()) || cert.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Insurance Certificates
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage COIs and insurance documentation</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => requestMutation.mutate({})}>
          <Plus className="w-4 h-4 mr-2" />Request COI
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total COIs</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.expiringSoon || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring Soon</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.expired || 0}</p>
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
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search certificates..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Certificates List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Certificates of Insurance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {certificatesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredCertificates?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No certificates found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCertificates?.map((cert: any) => (
                <div key={cert.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", cert.status === "expired" && "bg-red-500/5 border-l-2 border-red-500", cert.status === "expiring" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{cert.holderName}</p>
                        {getStatusBadge(cert.status)}
                      </div>
                      <p className="text-sm text-slate-400">{cert.coverageType}</p>
                      <p className="text-sm text-slate-400">Policy: {cert.policyNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">${cert.coverageAmount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Coverage</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Effective: {cert.effectiveDate}</span>
                      <span>Expires: {cert.expirationDate}</span>
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
