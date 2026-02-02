/**
 * ADMIN SYSTEM SETTINGS PAGE
 * 100% Dynamic - Configure platform settings
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings, Save, Shield, Bell, Mail, Database,
  Globe, Clock, DollarSign, Truck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminSystemSettings() {
  const settingsQuery = trpc.admin.getSystemSettings.useQuery();
  const [settings, setSettings] = useState<any>(null);

  const saveMutation = trpc.admin.updateSystemSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      settingsQuery.refetch();
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  React.useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
  };

  if (settingsQuery.isLoading || !settings) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure platform settings</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Platform Name</label>
              <Input
                value={settings.general?.platformName || ""}
                onChange={(e) => updateSetting("general", "platformName", e.target.value)}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Support Email</label>
              <Input
                value={settings.general?.supportEmail || ""}
                onChange={(e) => updateSetting("general", "supportEmail", e.target.value)}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Default Timezone</label>
              <Select value={settings.general?.timezone} onValueChange={(v) => updateSetting("general", "timezone", v)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern</SelectItem>
                  <SelectItem value="America/Chicago">Central</SelectItem>
                  <SelectItem value="America/Denver">Mountain</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Date Format</label>
              <Select value={settings.general?.dateFormat} onValueChange={(v) => updateSetting("general", "dateFormat", v)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-white font-medium">Maintenance Mode</p>
              <p className="text-slate-400 text-sm">Disable platform for maintenance</p>
            </div>
            <Switch
              checked={settings.general?.maintenanceMode}
              onCheckedChange={(v) => updateSetting("general", "maintenanceMode", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "emailNotifications", label: "Email Notifications", desc: "Send email alerts" },
            { key: "smsNotifications", label: "SMS Notifications", desc: "Send SMS alerts" },
            { key: "pushNotifications", label: "Push Notifications", desc: "Browser push alerts" },
            { key: "slackIntegration", label: "Slack Integration", desc: "Post to Slack channels" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications?.[item.key]}
                onCheckedChange={(v) => updateSetting("notifications", item.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={settings.security?.sessionTimeout || 30}
                onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Max Login Attempts</label>
              <Input
                type="number"
                value={settings.security?.maxLoginAttempts || 5}
                onChange={(e) => updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-slate-400 text-sm">Require 2FA for all users</p>
            </div>
            <Switch
              checked={settings.security?.require2FA}
              onCheckedChange={(v) => updateSetting("security", "require2FA", v)}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-white font-medium">IP Whitelisting</p>
              <p className="text-slate-400 text-sm">Restrict access to specific IPs</p>
            </div>
            <Switch
              checked={settings.security?.ipWhitelist}
              onCheckedChange={(v) => updateSetting("security", "ipWhitelist", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operations Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">GPS Update Interval (seconds)</label>
              <Input
                type="number"
                value={settings.operations?.gpsInterval || 30}
                onChange={(e) => updateSetting("operations", "gpsInterval", parseInt(e.target.value))}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Default Rate Per Mile ($)</label>
              <Input
                type="number"
                step="0.01"
                value={settings.operations?.defaultRatePerMile || 3.50}
                onChange={(e) => updateSetting("operations", "defaultRatePerMile", parseFloat(e.target.value))}
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
            <div>
              <p className="text-white font-medium">Auto-Assign Drivers</p>
              <p className="text-slate-400 text-sm">Use ESANG AI for automatic assignment</p>
            </div>
            <Switch
              checked={settings.operations?.autoAssign}
              onCheckedChange={(v) => updateSetting("operations", "autoAssign", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
