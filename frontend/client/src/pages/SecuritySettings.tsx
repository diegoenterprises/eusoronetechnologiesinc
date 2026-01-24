/**
 * SECURITY SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Key, Smartphone, Monitor, MapPin, Clock,
  CheckCircle, AlertTriangle, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const securityQuery = trpc.security.getSettings.useQuery();
  const sessionsQuery = trpc.security.getActiveSessions.useQuery();
  const activityQuery = trpc.security.getRecentActivity.useQuery({ limit: 10 });

  const updateMutation = trpc.security.updateSettings.useMutation({
    onSuccess: () => { toast.success("Settings updated"); securityQuery.refetch(); },
    onError: (error) => toast.error("Failed to update settings", { description: error.message }),
  });

  const revokeSessionMutation = trpc.security.revokeSession.useMutation({
    onSuccess: () => { toast.success("Session revoked"); sessionsQuery.refetch(); },
    onError: (error) => toast.error("Failed to revoke session", { description: error.message }),
  });

  const security = securityQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Security Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account security</p>
      </div>

      {/* Security Status */}
      <Card className={cn("rounded-xl", security?.score >= 80 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30")}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-full", security?.score >= 80 ? "bg-green-500/20" : "bg-yellow-500/20")}>
                <Shield className={cn("w-8 h-8", security?.score >= 80 ? "text-green-400" : "text-yellow-400")} />
              </div>
              <div>
                <p className="text-white font-medium">Security Score</p>
                <p className="text-sm text-slate-400">{security?.score >= 80 ? "Your account is well protected" : "Some improvements recommended"}</p>
              </div>
            </div>
            {securityQuery.isLoading ? <Skeleton className="h-12 w-16" /> : (
              <p className={cn("text-4xl font-bold", security?.score >= 80 ? "text-green-400" : "text-yellow-400")}>{security?.score}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password & 2FA */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-sm text-slate-400">Last changed: {security?.passwordLastChanged || "Never"}</p>
              </div>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                Change
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-400">{security?.twoFactorEnabled ? "Enabled via authenticator app" : "Not enabled"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {security?.twoFactorEnabled ? (
                  <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Disabled</Badge>
                )}
                <Switch checked={security?.twoFactorEnabled} onCheckedChange={(checked) => updateMutation.mutate({ twoFactorEnabled: checked })} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Login Notifications</p>
                <p className="text-sm text-slate-400">Get notified of new logins</p>
              </div>
              <Switch checked={security?.loginNotifications} onCheckedChange={(checked) => updateMutation.mutate({ loginNotifications: checked })} />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-400" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessionsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : sessionsQuery.data?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No active sessions</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {sessionsQuery.data?.map((session: any) => (
                  <div key={session.id} className={cn("p-4 flex items-center justify-between", session.isCurrent && "bg-cyan-500/5")}>
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{session.device}</p>
                          {session.isCurrent && <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Current</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => revokeSessionMutation.mutate({ sessionId: session.id })}>
                        <LogOut className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Recent Security Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activityQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {activityQuery.data?.map((activity: any) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", activity.type === "login" ? "bg-green-500/20" : activity.type === "password_change" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                      {activity.type === "login" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Key className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.ip} • {activity.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{activity.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
