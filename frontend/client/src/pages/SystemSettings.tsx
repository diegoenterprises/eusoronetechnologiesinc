/**
 * SYSTEM SETTINGS PAGE
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
  Settings, Shield, Bell, Database, Globe,
  Save
} from "lucide-react";
import { toast } from "sonner";

export default function SystemSettings() {
  const settingsQuery = (trpc as any).admin.getSystemSettings.useQuery();

  const updateMutation = (trpc as any).admin.updateSystemSettings.useMutation({
    onSuccess: () => { toast.success("Settings updated"); settingsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const settings = settingsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">System Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Configure system preferences</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => updateMutation.mutate(settings)}>
          <Save className="w-4 h-4 mr-2" />Save Changes
        </Button>
      </div>

      {settingsQuery.isLoading ? (
        <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
      ) : (
        <div className="grid gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Require 2FA for all users</p>
                </div>
                <Switch checked={settings?.twoFactorRequired} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Session Timeout</p>
                  <p className="text-xs text-slate-500">Auto logout after inactivity</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{settings?.sessionTimeout} min</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Password Expiry</p>
                  <p className="text-xs text-slate-500">Force password change</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-0">{settings?.passwordExpiry} days</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-purple-400" />Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-xs text-slate-500">Send email alerts</p>
                </div>
                <Switch checked={settings?.emailNotifications} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-xs text-slate-500">Send SMS alerts</p>
                </div>
                <Switch checked={settings?.smsNotifications} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-xs text-slate-500">Browser push alerts</p>
                </div>
                <Switch checked={settings?.pushNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Database className="w-5 h-5 text-green-400" />Data Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Auto Backup</p>
                  <p className="text-xs text-slate-500">Automatic data backups</p>
                </div>
                <Switch checked={settings?.autoBackup} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Data Retention</p>
                  <p className="text-xs text-slate-500">Keep historical data</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-0">{settings?.dataRetention} years</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-blue-400" />Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Timezone</p>
                  <p className="text-xs text-slate-500">System timezone</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-0">{settings?.timezone}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Date Format</p>
                  <p className="text-xs text-slate-500">Display format</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-0">{settings?.dateFormat}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Currency</p>
                  <p className="text-xs text-slate-500">Default currency</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-0">{settings?.currency}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
