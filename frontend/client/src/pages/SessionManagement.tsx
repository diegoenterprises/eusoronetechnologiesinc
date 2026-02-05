/**
 * SESSION MANAGEMENT PAGE
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
  Monitor, Smartphone, Tablet, Globe, LogOut,
  Clock, MapPin, CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SessionManagement() {
  const sessionsQuery = (trpc as any).users.getSessions.useQuery();
  const summaryQuery = (trpc as any).users.getSessionSummary.useQuery();

  const terminateMutation = (trpc as any).users.terminateSession.useMutation({
    onSuccess: () => { toast.success("Session terminated"); sessionsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const terminateAllMutation = (trpc as any).users.terminateAllSessions.useMutation({
    onSuccess: () => { toast.success("All other sessions terminated"); sessionsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getDeviceIcon = (device: string) => {
    if (device?.toLowerCase().includes("mobile") || device?.toLowerCase().includes("iphone") || device?.toLowerCase().includes("android")) return <Smartphone className="w-5 h-5" />;
    if (device?.toLowerCase().includes("tablet") || device?.toLowerCase().includes("ipad")) return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Session Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your active sessions</p>
        </div>
        <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => terminateAllMutation.mutate({})}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out All Other
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Monitor className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalSessions || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.uniqueLocations || 0}</p>
                )}
                <p className="text-xs text-slate-400">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.mobileDevices || 0}</p>
                )}
                <p className="text-xs text-slate-400">Mobile Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.lastActivity}</p>
                )}
                <p className="text-xs text-slate-400">Last Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (sessionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Monitor className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No active sessions</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(sessionsQuery.data as any)?.map((session: any) => (
                <div key={session.id} className={cn("p-4", session.isCurrent && "bg-green-500/5 border-l-2 border-green-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", session.isCurrent ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <div className={session.isCurrent ? "text-green-400" : "text-slate-400"}>
                          {getDeviceIcon(session.device)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{session.device}</p>
                          {session.isCurrent && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Current</Badge>}
                          {session.suspicious && <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Suspicious</Badge>}
                        </div>
                        <p className="text-sm text-slate-400">{session.browser} on {session.os}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                          <span>{session.ip}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button size="sm" variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => terminateMutation.mutate({ sessionId: session.id })}>
                        <LogOut className="w-4 h-4 mr-1" />Sign Out
                      </Button>
                    )}
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
