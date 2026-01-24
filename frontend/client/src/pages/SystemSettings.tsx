/**
 * SYSTEM SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Settings, Bell, Shield, Database, Mail, Globe,
  Save, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState("general");

  const settingsQuery = trpc.admin.getSettings.useQuery();
  
  const updateMutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => { toast.success("Settings saved"); settingsQuery.refetch(); },
    onError: (error) => toast.error("Failed to save settings", { description: error.message }),
  });

  const settings = settingsQuery.data;

  const handleSave = (section: string, data: any) => {
    updateMutation.mutate({ section, data });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure platform settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 rounded-md">
            <Settings className="w-4 h-4 mr-2" />General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 rounded-md">
            <Bell className="w-4 h-4 mr-2" />Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 rounded-md">
            <Shield className="w-4 h-4 mr-2" />Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-700 rounded-md">
            <Database className="w-4 h-4 mr-2" />Integrations
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-400">Company Name</Label>
                      <Input defaultValue={settings?.general?.companyName} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Contact Email</Label>
                      <Input defaultValue={settings?.general?.contactEmail} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Phone Number</Label>
                      <Input defaultValue={settings?.general?.phone} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Timezone</Label>
                      <Input defaultValue={settings?.general?.timezone} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => handleSave("general", {})} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-sm text-slate-400">Receive email alerts for important events</p>
                      </div>
                      <Switch defaultChecked={settings?.notifications?.email} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">SMS Notifications</p>
                        <p className="text-sm text-slate-400">Receive text messages for urgent alerts</p>
                      </div>
                      <Switch defaultChecked={settings?.notifications?.sms} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-sm text-slate-400">Browser and mobile push notifications</p>
                      </div>
                      <Switch defaultChecked={settings?.notifications?.push} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">Load Status Updates</p>
                        <p className="text-sm text-slate-400">Notifications when load status changes</p>
                      </div>
                      <Switch defaultChecked={settings?.notifications?.loadUpdates} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => handleSave("notifications", {})} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-400">Require 2FA for all users</p>
                      </div>
                      <Switch defaultChecked={settings?.security?.twoFactor} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">Session Timeout</p>
                        <p className="text-sm text-slate-400">Auto-logout after inactivity</p>
                      </div>
                      <Input defaultValue={settings?.security?.sessionTimeout || "30"} className="w-24 bg-slate-700/50 border-slate-600/50 rounded-lg text-center" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                      <div>
                        <p className="text-white font-medium">IP Whitelist</p>
                        <p className="text-sm text-slate-400">Restrict access to specific IPs</p>
                      </div>
                      <Switch defaultChecked={settings?.security?.ipWhitelist} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => handleSave("security", {})} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                API Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-500/20">
                            <Globe className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">FMCSA SAFER</p>
                            <p className="text-sm text-slate-400">Carrier verification system</p>
                          </div>
                        </div>
                        <Switch defaultChecked={settings?.integrations?.safer} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <Shield className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Clearinghouse</p>
                            <p className="text-sm text-slate-400">Drug & Alcohol database</p>
                          </div>
                        </div>
                        <Switch defaultChecked={settings?.integrations?.clearinghouse} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-purple-500/20">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">ELD Integration</p>
                            <p className="text-sm text-slate-400">Electronic logging device sync</p>
                          </div>
                        </div>
                        <Switch defaultChecked={settings?.integrations?.eld} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => handleSave("integrations", {})} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
