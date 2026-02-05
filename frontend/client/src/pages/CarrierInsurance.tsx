/**
 * CARRIER INSURANCE PAGE
 * 100% Dynamic - Manage insurance policies and certificates
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
  Shield, Plus, Search, CheckCircle, AlertTriangle,
  Calendar, FileText, Download, Upload, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CarrierInsurance() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const policiesQuery = trpc.carriers.getInsurance.useQuery({});
  const statsQuery = trpc.carriers.getDashboardStats.useQuery();

  const policies = (policiesQuery.data as any)?.policies || [];
  const stats = statsQuery.data as any;

  const filteredPolicies = policies.filter((p: any) =>
    p.policyNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.provider?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expiring_soon": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Insurance Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage policies and certificates</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Policy
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Policies</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalPolicies || 0}</p>
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
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Expiring Soon</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.expiringSoon || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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

      {/* Alerts */}
      {stats?.expiringSoon > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">
              {stats.expiringSoon} policy(ies) expiring within 30 days. Please renew to maintain compliance.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policies..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auto_liability">Auto Liability</SelectItem>
                <SelectItem value="cargo">Cargo</SelectItem>
                <SelectItem value="general_liability">General Liability</SelectItem>
                <SelectItem value="workers_comp">Workers Comp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {policiesQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No insurance policies found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredPolicies.map((policy: any) => (
                <div key={policy.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        policy.status === "active" ? "bg-green-500/20" :
                        policy.status === "expiring_soon" ? "bg-yellow-500/20" : "bg-red-500/20"
                      )}>
                        <Shield className={cn(
                          "w-6 h-6",
                          policy.status === "active" ? "text-green-400" :
                          policy.status === "expiring_soon" ? "text-yellow-400" : "text-red-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{policy.type}</p>
                          <Badge className={cn("border-0", getStatusColor(policy.status))}>
                            {policy.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {policy.provider} • Policy #{policy.policyNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Coverage</p>
                        <p className="text-green-400 font-bold">${policy.coverageAmount?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Premium</p>
                        <p className="text-white font-medium">${policy.premium?.toLocaleString()}/yr</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Effective</p>
                        <p className="text-white">{policy.effectiveDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Expires</p>
                        <p className={cn(
                          policy.status === "expired" ? "text-red-400" :
                          policy.status === "expiring_soon" ? "text-yellow-400" : "text-white"
                        )}>
                          {policy.expirationDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                          <FileText className="w-4 h-4 mr-1" />COI
                        </Button>
                      </div>
                    </div>
                  </div>

                  {policy.endorsements && policy.endorsements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                      {policy.endorsements.map((endorsement: string, idx: number) => (
                        <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          {endorsement}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
