/**
 * INSURANCE MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, DollarSign, CheckCircle, Clock, AlertTriangle,
  FileText, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsuranceManagement() {
  const [filter, setFilter] = useState("all");

  const policiesQuery = (trpc as any).insurance.getPolicies.useQuery({ filter });
  const statsQuery = (trpc as any).insurance.getStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Insurance Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage insurance policies</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Policy
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Shield className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{(stats as any)?.totalPolicies || 0}</p>}<p className="text-xs text-slate-400">Policies</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{(stats as any)?.active || 0}</p>}<p className="text-xs text-slate-400">Active</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.expiring || 0}</p>}<p className="text-xs text-slate-400">Expiring</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${(stats as any)?.totalCoverage?.toLocaleString() || 0}</p>}<p className="text-xs text-slate-400">Coverage</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="expiring">Expiring</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Insurance Policies</CardTitle></CardHeader>
        <CardContent className="p-0">
          {policiesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (policiesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Shield className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No policies found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(policiesQuery.data as any)?.map((policy: any) => (
                <div key={policy.id} className={cn("p-4 flex items-center justify-between", policy.status === "expiring" && "bg-yellow-500/5 border-l-2 border-yellow-500", policy.status === "expired" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", policy.status === "active" ? "bg-green-500/20" : policy.status === "expiring" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Shield className={cn("w-5 h-5", policy.status === "active" ? "text-green-400" : policy.status === "expiring" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{policy.type}</p>
                        {getStatusBadge(policy.status)}
                      </div>
                      <p className="text-sm text-slate-400">{policy.provider} - Policy #{policy.policyNumber}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Effective: {policy.effectiveDate}</span>
                        <span>Expires: {policy.expirationDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${policy.coverage?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Premium: ${policy.premium}/mo</p>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><FileText className="w-4 h-4" /></Button>
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
