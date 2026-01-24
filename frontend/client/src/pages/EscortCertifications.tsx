/**
 * ESCORT CERTIFICATIONS PAGE
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
  Award, MapPin, CheckCircle, Clock, AlertTriangle,
  Search, Plus, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortCertifications() {
  const [searchTerm, setSearchTerm] = useState("");

  const certificationsQuery = trpc.escorts.getCertifications.useQuery();
  const summaryQuery = trpc.escorts.getCertificationSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/20 text-green-400 border-0">Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0">Expired</Badge>;
      case "pending": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCertifications = certificationsQuery.data?.filter((cert: any) => {
    return !searchTerm || 
      cert.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Escort Certifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your state certifications and reciprocity</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Certification
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Certs</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.valid || 0}</p>
                )}
                <p className="text-xs text-slate-400">Valid</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.expiring || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <MapPin className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.statesCovered || 0}</p>
                )}
                <p className="text-xs text-slate-400">States</p>
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
          placeholder="Search by state or cert number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Certifications Grid */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">State Certifications</CardTitle>
        </CardHeader>
        <CardContent>
          {certificationsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filteredCertifications?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Award className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No certifications found</p>
              <p className="text-slate-500 text-sm mt-1">Add your first certification to get started</p>
              <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                <Plus className="w-4 h-4 mr-2" />Add Certification
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCertifications?.map((cert: any) => (
                <Card key={cert.id} className={cn("border-2 rounded-xl", cert.status === "valid" ? "bg-green-500/10 border-green-500/30" : cert.status === "expiring" ? "bg-yellow-500/10 border-yellow-500/30" : cert.status === "expired" ? "bg-red-500/10 border-red-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-full", cert.status === "valid" ? "bg-green-500/20" : cert.status === "expiring" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                          <MapPin className={cn("w-4 h-4", cert.status === "valid" ? "text-green-400" : cert.status === "expiring" ? "text-yellow-400" : "text-red-400")} />
                        </div>
                        <p className="text-white font-bold text-lg">{cert.state}</p>
                      </div>
                      {getStatusBadge(cert.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Certificate Number</p>
                        <p className="text-white">{cert.certNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expiration Date</p>
                        <p className={cn("font-medium", cert.status === "expired" ? "text-red-400" : cert.status === "expiring" ? "text-yellow-400" : "text-white")}>
                          {cert.expirationDate}
                        </p>
                      </div>
                      {cert.reciprocityStates?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500">Reciprocity</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cert.reciprocityStates.map((state: string) => (
                              <Badge key={state} className="bg-slate-600/50 text-slate-300 border-0 text-xs">{state}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
