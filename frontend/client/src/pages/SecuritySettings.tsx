/**
 * SECURITY SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Lock, Key, Smartphone, AlertTriangle,
  CheckCircle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SecuritySettings() {
  const [, setLocation] = useLocation();

  const securityQuery = (trpc as any).security.getSettings.useQuery();
  const alertsQuery = (trpc as any).security.getAlerts.useQuery({ limit: 5 });

  const updateMutation = (trpc as any).security.updateSetting.useMutation({
    onSuccess: () => { toast.success("Setting updated"); securityQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const settings = securityQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Security Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account security</p>
      </div>

      {/* Security Score */}
      {securityQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", (settings?.score ?? 0) >= 80 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (settings?.score ?? 0) >= 50 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", (settings?.score ?? 0) >= 80 ? "bg-green-500/20" : (settings?.score ?? 0) >= 50 ? "bg-yellow-500/20" : "bg-red-500/20")}>
                <Shield className={cn("w-8 h-8", (settings?.score ?? 0) >= 80 ? "text-green-400" : (settings?.score ?? 0) >= 50 ? "text-yellow-400" : "text-red-400")} />
              </div>
              <div>
                <p className="text-white text-2xl font-bold">Security Score: {settings?.score}%</p>
                <p className="text-slate-400">{(settings?.score ?? 0) >= 80 ? "Your account is well protected" : (settings?.score ?? 0) >= 50 ? "Some improvements recommended" : "Your account needs attention"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Options */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Security Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityQuery.isLoading ? (
              [1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings?.twoFactorEnabled ? <Badge className="bg-green-500/20 text-green-400 border-0">Enabled</Badge> : <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Disabled</Badge>}
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation("/two-factor-setup")}>
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Password</p>
                      <p className="text-xs text-slate-500">Last changed: {settings?.passwordLastChanged}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation("/change-password")}>
                    Change
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Login Notifications</p>
                      <p className="text-xs text-slate-500">Get notified of new logins</p>
                    </div>
                  </div>
                  <Switch checked={settings?.loginNotifications} onCheckedChange={(checked) => updateMutation.mutate({ setting: "loginNotifications", value: checked })} />
                </div>

                <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Suspicious Activity Alerts</p>
                      <p className="text-xs text-slate-500">Alert on unusual activity</p>
                    </div>
                  </div>
                  <Switch checked={settings?.suspiciousActivityAlerts} onCheckedChange={(checked) => updateMutation.mutate({ setting: "suspiciousActivityAlerts", value: checked })} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Security Alerts */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Recent Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alertsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (alertsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No security alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(alertsQuery.data as any)?.map((alert: any) => (
                  <div key={alert.id} className={cn("p-4", alert.severity === "high" && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{alert.title}</p>
                      <Badge className={cn(alert.severity === "high" ? "bg-red-500/20 text-red-400" : alert.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400", "border-0 text-xs")}>{alert.severity}</Badge>
                    </div>
                    <p className="text-sm text-slate-400">{alert.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.timestamp}</p>
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
