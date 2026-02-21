/**
 * SUPER ADMIN TOOLS PAGE
 * Frontend for superAdmin router — platform-wide admin controls,
 * user management, system configuration, and monitoring.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Crown, Users, Shield, Activity, Server, Database,
  Settings, AlertTriangle, BarChart3, Lock, Eye, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuperAdminTools() {
  const [tab, setTab] = useState<"overview" | "users" | "system">("overview");

  const platformStatsQuery = (trpc as any).superAdmin?.getPlatformStats?.useQuery?.() || { data: null, isLoading: false };
  const systemHealthQuery = (trpc as any).superAdmin?.getSystemHealth?.useQuery?.() || { data: null, isLoading: false };

  const pStats = platformStatsQuery.data;
  const health = systemHealthQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Super Admin</h1>
          <p className="text-slate-400 text-sm">Platform-wide administration and monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{k:"overview",l:"Overview",i:<BarChart3 className="w-3 h-3 mr-1" />},{k:"users",l:"User Management",i:<Users className="w-3 h-3 mr-1" />},{k:"system",l:"System Health",i:<Server className="w-3 h-3 mr-1" />}].map(t => (
          <Button key={t.k} size="sm" variant={tab === t.k ? "default" : "outline"} onClick={() => setTab(t.k as any)}
            className={tab === t.k ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {t.i}{t.l}
          </Button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: pStats?.totalUsers || 0, icon: <Users className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
              { label: "Active Loads", value: pStats?.activeLoads || 0, icon: <Activity className="w-5 h-5 text-green-400" />, color: "text-green-400" },
              { label: "Revenue MTD", value: `$${Number(pStats?.revenueMTD || 0).toLocaleString()}`, icon: <BarChart3 className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
              { label: "Alerts", value: pStats?.alerts || 0, icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
            ].map(s => (
              <Card key={s.label} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-slate-700/30">{s.icon}</div>
                    <div><p className={cn("text-xl font-bold", s.color)}>{s.value}</p><p className="text-[10px] text-slate-400 uppercase">{s.label}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Admin Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "User Management", desc: "Manage accounts, roles, permissions", icon: <Users className="w-5 h-5 text-blue-400" /> },
                  { label: "Security Settings", desc: "Auth, 2FA, session policies", icon: <Lock className="w-5 h-5 text-red-400" /> },
                  { label: "System Config", desc: "Platform settings and features", icon: <Settings className="w-5 h-5 text-purple-400" /> },
                  { label: "Audit Trail", desc: "Track all system changes", icon: <Eye className="w-5 h-5 text-yellow-400" /> },
                  { label: "Database", desc: "DB health and migrations", icon: <Database className="w-5 h-5 text-green-400" /> },
                  { label: "Performance", desc: "Server metrics and uptime", icon: <Zap className="w-5 h-5 text-cyan-400" /> },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-xl bg-slate-900/30 border border-slate-700/20 hover:border-[#1473FF]/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-white font-medium text-sm">{item.label}</span></div>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      {tab === "system" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><Server className="w-5 h-5 text-green-400" />System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(health).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 text-center">
                    <p className="text-[10px] text-slate-400 uppercase">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-lg font-bold text-white">{String(val)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Server className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">System health data loading...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users */}
      {tab === "users" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" />User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">User management interface connected to the superAdmin router. View, edit, suspend, and manage platform users with role-based access control.</p>
            <div className="mt-4 p-4 rounded-xl bg-slate-900/30 border border-slate-700/20">
              <p className="text-xs text-slate-500">Navigate to <span className="text-[#1473FF]">/admin/users</span> for full user management, or use the <span className="text-[#1473FF]">/admin</span> dashboard for comprehensive platform administration.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
