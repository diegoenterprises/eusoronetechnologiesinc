/**
 * COMPLIANCE NETWORKS PAGE
 * Frontend for complianceNetworks router — Drivewyze, PrePass, and other
 * compliance network integrations for weigh station bypass and screening.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Network, Shield, CheckCircle, AlertTriangle, Truck,
  MapPin, Activity, Wifi, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceNetworksPage() {
  const statusQuery = (trpc as any).complianceNetworks.getStatus.useQuery();
  const networksQuery = (trpc as any).complianceNetworks.listNetworks.useQuery();

  const status = statusQuery.data;
  const networks = networksQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Compliance Networks</h1>
        <p className="text-slate-400 text-sm mt-1">Weigh station bypass, screening, and compliance network integrations</p>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Network className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-blue-400">{status.connectedNetworks || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Connected</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-green-400">{status.bypassRate || 0}%</p>
              <p className="text-[9px] text-slate-400 uppercase">Bypass Rate</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Truck className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-cyan-400">{status.enrolledVehicles || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Enrolled Vehicles</p>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-400">{status.totalBypasses || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Total Bypasses</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drivewyze */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400" />Drivewyze PreClear
              <Badge className="bg-blue-500/20 text-blue-400 text-[9px] ml-auto">
                <Wifi className="w-3 h-3 mr-0.5" />Connected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">Weigh station bypass service covering 900+ sites in 48 states. Uses USDOT safety data and real-time screening.</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-blue-400">900+</p><p className="text-[9px] text-slate-400">Sites</p></div>
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-green-400">48</p><p className="text-[9px] text-slate-400">States</p></div>
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-cyan-400">98%</p><p className="text-[9px] text-slate-400">Uptime</p></div>
            </div>
          </CardContent>
        </Card>

        {/* PrePass */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />PrePass Safety Alliance
              <Badge className="bg-green-500/20 text-green-400 text-[9px] ml-auto">
                <Wifi className="w-3 h-3 mr-0.5" />Available
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">Industry-leading weigh station bypass and screening network. Integrates with FMCSA BASICs for real-time compliance scoring.</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-green-400">2,500+</p><p className="text-[9px] text-slate-400">Sites</p></div>
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-green-400">50</p><p className="text-[9px] text-slate-400">States</p></div>
              <div className="p-2 rounded-lg bg-slate-900/30"><p className="text-sm font-bold text-green-400">99%</p><p className="text-[9px] text-slate-400">Reliability</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Vehicles */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />Network Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networksQuery.isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : networks.length === 0 ? (
            <div className="p-6 text-center">
              <Network className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No vehicles enrolled in compliance networks yet</p>
              <p className="text-xs text-slate-500 mt-1">Enroll your fleet to start bypassing weigh stations</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {networks.map((n: any, i: number) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <span className="text-white text-sm">{n.name || n.network}</span>
                  <Badge className={cn("text-[9px]", n.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>{n.active ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
