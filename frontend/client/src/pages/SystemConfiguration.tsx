/**
 * SYSTEM CONFIGURATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings, Save, RefreshCw, Shield, Bell,
  Mail, Globe, Database, Lock
} from "lucide-react";
import { toast } from "sonner";

export default function SystemConfiguration() {
  const configQuery = (trpc as any).admin.getSystemConfig.useQuery();

  const updateMutation = (trpc as any).admin.updateSystemConfig.useMutation({
    onSuccess: () => { toast.success("Configuration saved"); configQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const [localConfig, setLocalConfig] = useState<any>(null);

  React.useEffect(() => {
    if (configQuery.data && !localConfig) {
      setLocalConfig(configQuery.data);
    }
  }, [configQuery.data]);

  const handleSave = () => {
    if (localConfig) {
      updateMutation.mutate(localConfig);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">System Configuration</h1>
          <p className="text-slate-400 text-sm mt-1">Platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => configQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />Save Changes
          </Button>
        </div>
      </div>

      {configQuery.isLoading || !localConfig ? (
        <div className="space-y-6">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-400" />General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Platform Name</label>
                <Input value={localConfig.general?.platformName || ""} onChange={(e: any) => updateField("general", "platformName", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Support Email</label>
                <Input value={localConfig.general?.supportEmail || ""} onChange={(e: any) => updateField("general", "supportEmail", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white">Maintenance Mode</p><p className="text-xs text-slate-500">Disable access for non-admins</p></div>
                <Switch checked={localConfig.general?.maintenanceMode || false} onCheckedChange={(checked) => updateField("general", "maintenanceMode", checked)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-purple-400" />Security Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-white">Require 2FA</p><p className="text-xs text-slate-500">For all users</p></div>
                <Switch checked={localConfig.security?.require2FA || false} onCheckedChange={(checked) => updateField("security", "require2FA", checked)} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Session Timeout (minutes)</label>
                <Input type="number" value={localConfig.security?.sessionTimeout || 30} onChange={(e: any) => updateField("security", "sessionTimeout", parseInt(e.target.value))} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Max Login Attempts</label>
                <Input type="number" value={localConfig.security?.maxLoginAttempts || 5} onChange={(e: any) => updateField("security", "maxLoginAttempts", parseInt(e.target.value))} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-400" />Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-white">Email Notifications</p><p className="text-xs text-slate-500">Send system emails</p></div>
                <Switch checked={localConfig.notifications?.emailEnabled || false} onCheckedChange={(checked) => updateField("notifications", "emailEnabled", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white">SMS Notifications</p><p className="text-xs text-slate-500">Send SMS alerts</p></div>
                <Switch checked={localConfig.notifications?.smsEnabled || false} onCheckedChange={(checked) => updateField("notifications", "smsEnabled", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white">Push Notifications</p><p className="text-xs text-slate-500">Browser push alerts</p></div>
                <Switch checked={localConfig.notifications?.pushEnabled || false} onCheckedChange={(checked) => updateField("notifications", "pushEnabled", checked)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Database className="w-5 h-5 text-green-400" />Data Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Data Retention (days)</label>
                <Input type="number" value={(localConfig as any)?.retentionDays || 365} onChange={(e: any) => updateField("data", "retentionDays", parseInt(e.target.value))} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white">Auto Backup</p><p className="text-xs text-slate-500">Daily automatic backups</p></div>
                <Switch checked={localConfig(data as any)?.autoBackup || false} onCheckedChange={(checked) => updateField("data", "autoBackup", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-white">Audit Logging</p><p className="text-xs text-slate-500">Log all user actions</p></div>
                <Switch checked={localConfig(data as any)?.auditLogging || false} onCheckedChange={(checked) => updateField("data", "auditLogging", checked)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
