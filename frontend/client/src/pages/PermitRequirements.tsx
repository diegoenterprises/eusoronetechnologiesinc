/**
 * PERMIT REQUIREMENTS PAGE
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
  FileCheck, Search, MapPin, AlertTriangle, CheckCircle,
  Clock, DollarSign, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PermitRequirements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const permitsQuery = trpc.permits.getRequirements.useQuery({ state: stateFilter === "all" ? undefined : stateFilter });
  const statesQuery = trpc.permits.getStates.useQuery();
  const activePermitsQuery = trpc.permits.getActive.useQuery();

  const filteredPermits = permitsQuery.data?.filter((permit: any) =>
    !searchTerm || permit.name?.toLowerCase().includes(searchTerm.toLowerCase()) || permit.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "required": return <Badge className="bg-red-500/20 text-red-400 border-0">Required</Badge>;
      case "optional": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Optional</Badge>;
      case "not_required": return <Badge className="bg-green-500/20 text-green-400 border-0">Not Required</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Permit Requirements
        </h1>
        <p className="text-slate-400 text-sm mt-1">State-by-state permit and regulatory requirements</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {activePermitsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{activePermitsQuery.data?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Permits</p>
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
                {activePermitsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{activePermitsQuery.data?.valid || 0}</p>
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
                {activePermitsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{activePermitsQuery.data?.expiringSoon || 0}</p>
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
                {activePermitsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{activePermitsQuery.data?.expired || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search permits..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {statesQuery.data?.map((state: any) => (
              <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permit Requirements */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Permit Requirements by State</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {permitsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : filteredPermits?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileCheck className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No permits found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredPermits?.map((permit: any) => (
                <div key={permit.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", permit.status === "required" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{permit.name}</p>
                        {getStatusBadge(permit.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{permit.state}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">${permit.fee}</p>
                      <p className="text-xs text-slate-500">{permit.validity}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{permit.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Processing: {permit.processingTime}</span>
                      {permit.renewalRequired && <span className="text-yellow-400">Renewal Required</span>}
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                      <ExternalLink className="w-3 h-3 mr-1" />Apply
                    </Button>
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
