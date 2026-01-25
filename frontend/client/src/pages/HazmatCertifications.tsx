/**
 * HAZMAT CERTIFICATIONS PAGE
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
  AlertTriangle, CheckCircle, Clock, User, Search,
  FileText, Shield, Calendar, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HazmatCertifications() {
  const [search, setSearch] = useState("");

  const driversQuery = trpc.compliance.getHazmatDrivers.useQuery({ search });
  const statsQuery = trpc.compliance.getHazmatStats.useQuery();
  const expiringQuery = trpc.compliance.getExpiringHazmat.useQuery({ limit: 5 });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case "none": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Not Certified</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Hazmat Certifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">PHMSA hazardous materials endorsements</p>
        </div>
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
                  <p className="text-2xl font-bold text-green-400">{stats?.valid || 0}</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.expiring || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.totalCertified || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Certified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon */}
      {expiringQuery.data?.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-yellow-500/20">
              {expiringQuery.data?.map((driver: any) => (
                <div key={driver.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <User className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-sm text-slate-400">Hazmat Endorsement</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-yellow-400">Expires: {driver.expiresAt}</p>
                    <p className="text-xs text-slate-500">{driver.daysRemaining} days left</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* Drivers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Driver Hazmat Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {driversQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : driversQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {driversQuery.data?.map((driver: any) => (
                <div key={driver.id} className={cn("p-4", driver.status === "expired" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white">
                        {driver.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{driver.name}</p>
                          {getStatusBadge(driver.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>CDL: {driver.cdlNumber}</span>
                          {driver.endorsementNumber && <span>Endorsement: {driver.endorsementNumber}</span>}
                          {driver.expiresAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires: {driver.expiresAt}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {driver.status === "none" && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                          <Upload className="w-4 h-4 mr-1" />Upload
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <FileText className="w-4 h-4 mr-1" />View
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
