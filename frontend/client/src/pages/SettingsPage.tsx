/**
 * SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings, User, Bell, Shield, Palette,
  Save, Globe, Moon
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});

  const settingsQuery = trpc.users.getSettings.useQuery();

  const updateMutation = trpc.users.updateSettings.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your preferences</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />Save Changes
        </Button>
      </div>

      {settingsQuery.isLoading ? (
        <div className="space-y-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" />Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Display Name</label>
                <Input value={settings.displayName || ""} onChange={(e) => updateSetting("displayName", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email</label>
                <Input value={settings.email || ""} onChange={(e) => updateSetting("email", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Phone</label>
                <Input value={settings.phone || ""} onChange={(e) => updateSetting("phone", e.target.value)} className="bg-slate-700/50 border-slate-600/50 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-400" />Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div><p className="text-white font-medium">Email Notifications</p><p className="text-xs text-slate-500">Receive updates via email</p></div>
                <Switch checked={settings.emailNotifications || false} onCheckedChange={(v) => updateSetting("emailNotifications", v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div><p className="text-white font-medium">Push Notifications</p><p className="text-xs text-slate-500">Browser push notifications</p></div>
                <Switch checked={settings.pushNotifications || false} onCheckedChange={(v) => updateSetting("pushNotifications", v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div><p className="text-white font-medium">SMS Alerts</p><p className="text-xs text-slate-500">Critical alerts via SMS</p></div>
                <Switch checked={settings.smsAlerts || false} onCheckedChange={(v) => updateSetting("smsAlerts", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-purple-400" />Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2"><Moon className="w-4 h-4 text-purple-400" /><p className="text-white font-medium">Dark Mode</p></div>
                <Switch checked={settings.darkMode || true} onCheckedChange={(v) => updateSetting("darkMode", v)} />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Language</label>
                <Select value={settings.language || "en"} onValueChange={(v) => updateSetting("language", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Globe className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Timezone</label>
                <Select value={settings.timezone || "America/New_York"} onValueChange={(v) => updateSetting("timezone", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" />Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div><p className="text-white font-medium">Two-Factor Auth</p><p className="text-xs text-slate-500">Extra security layer</p></div>
                <Switch checked={settings.twoFactorAuth || false} onCheckedChange={(v) => updateSetting("twoFactorAuth", v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <div><p className="text-white font-medium">Login Alerts</p><p className="text-xs text-slate-500">Notify on new logins</p></div>
                <Switch checked={settings.loginAlerts || false} onCheckedChange={(v) => updateSetting("loginAlerts", v)} />
              </div>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">Change Password</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
