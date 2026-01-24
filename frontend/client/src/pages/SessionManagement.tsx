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
  Monitor, Smartphone, Tablet, Globe, MapPin,
  Clock, LogOut, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SessionManagement() {
  const sessionsQuery = trpc.auth.getSessions.useQuery();

  const revokeMutation = trpc.auth.revokeSession.useMutation({
    onSuccess: () => { toast.success("Session revoked"); sessionsQuery.refetch(); },
    onError: (error) => toast.error("Failed to revoke", { description: error.message }),
  });

  const revokeAllMutation = trpc.auth.revokeAllSessions.useMutation({
    onSuccess: () => { toast.success("All other sessions revoked"); sessionsQuery.refetch(); },
    onError: (error) => toast.error("Failed to revoke", { description: error.message }),
  });

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case "desktop": return <Monitor className="w-5 h-5" />;
      case "mobile": return <Smartphone className="w-5 h-5" />;
      case "tablet": return <Tablet className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
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
        <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => revokeAllMutation.mutate({})}>
          <LogOut className="w-4 h-4 mr-2" />Revoke All Other Sessions
        </Button>
      </div>

      {/* Current Session */}
      {sessionsQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-cyan-500/20">
                {getDeviceIcon(sessionsQuery.data?.current?.device)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-lg font-bold">Current Session</p>
                  <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{sessionsQuery.data?.current?.browser}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{sessionsQuery.data?.current?.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{sessionsQuery.data?.current?.lastActive}</span>
                </div>
              </div>
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Sessions */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Other Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : sessionsQuery.data?.others?.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Monitor className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No other active sessions</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {sessionsQuery.data?.others?.map((session: any) => (
                <div key={session.id} className="p-4 flex items-center gap-4">
                  <div className={cn("p-3 rounded-full", session.suspicious ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-400")}>
                    {getDeviceIcon(session.device)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{session.browser} on {session.os}</p>
                      {session.suspicious && <Badge className="bg-red-500/20 text-red-400 border-0">Suspicious</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Last active: {session.lastActive}</span>
                      <span>IP: {session.ip}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 rounded-lg" onClick={() => revokeMutation.mutate({ sessionId: session.id })}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">-</span>
              Revoke sessions from devices you no longer use
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">-</span>
              If you see a suspicious session, revoke it immediately and change your password
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">-</span>
              Enable two-factor authentication for additional security
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">-</span>
              Always log out when using shared or public computers
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
