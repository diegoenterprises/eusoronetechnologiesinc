/**
 * ADMIN DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Package, UserCheck, Activity, Ticket,
  TrendingUp, CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboardNew() {
  const statsQuery = trpc.admin.getDashboardStats.useQuery();
  const pendingQuery = trpc.admin.getPendingVerifications.useQuery({ limit: 5 });
  const ticketsQuery = trpc.admin.getOpenTickets.useQuery({ limit: 5 });
  const healthQuery = trpc.admin.getPlatformHealth.useQuery({}, { refetchInterval: 30000 });

  const stats = statsQuery.data;
  const health = healthQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform administration</p>
        </div>
      </div>

      {healthQuery.isLoading ? <Skeleton className="h-20 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", health?.overallStatus === "healthy" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : health?.overallStatus === "degraded" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", health?.overallStatus === "healthy" ? "bg-green-500/20" : health?.overallStatus === "degraded" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Activity className={cn("w-6 h-6", health?.overallStatus === "healthy" ? "text-green-400" : health?.overallStatus === "degraded" ? "text-yellow-400" : "text-red-400")} />
              </div>
              <div>
                <p className="text-white font-bold">Platform Status: <span className="capitalize">{health?.overallStatus}</span></p>
                <p className="text-sm text-slate-400">Uptime: {health?.uptime} | CPU: {health?.cpu}% | Memory: {health?.memory}%</p>
              </div>
            </div>
            <Badge className={cn("border-0", health?.overallStatus === "healthy" ? "bg-green-500/20 text-green-400" : health?.overallStatus === "degraded" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
              {health?.overallStatus === "healthy" ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
              {health?.overallStatus}
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Users className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalUsers?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Total Users</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><UserCheck className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pendingVerifications || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Package className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.activeLoads || 0}</p>}<p className="text-xs text-slate-400">Active Loads</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><TrendingUp className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.todaySignups || 0}</p>}<p className="text-xs text-slate-400">Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><Ticket className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.openTickets || 0}</p>}<p className="text-xs text-slate-400">Tickets</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-yellow-400" />Pending Verifications</CardTitle></CardHeader>
          <CardContent className="p-0">
            {pendingQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : pendingQuery.data?.length === 0 ? (
              <div className="p-6 text-center"><CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No pending verifications</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {pendingQuery.data?.map((user: any) => (
                  <div key={user.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-sm">{user.name?.charAt(0)}</div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email} | {user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg h-7 text-xs">Reject</Button>
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg h-7 text-xs">Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-red-400" />Open Tickets</CardTitle></CardHeader>
          <CardContent className="p-0">
            {ticketsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
            ) : ticketsQuery.data?.length === 0 ? (
              <div className="p-6 text-center"><CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-slate-400 text-sm">No open tickets</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {ticketsQuery.data?.map((ticket: any) => (
                  <div key={ticket.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium text-sm">#{ticket.id}</p>
                        <Badge className={cn("border-0 text-xs", ticket.priority === "high" ? "bg-red-500/20 text-red-400" : ticket.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400")}>{ticket.priority}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">{ticket.user} | {ticket.createdAt}</p>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg h-7 text-xs">View</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
