/**
 * ACCOUNT PREFERENCES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings, Globe, Bell, Moon, Sun, Clock,
  Languages, Palette, Save
} from "lucide-react";
import { toast } from "sonner";

export default function AccountPreferences() {
  const prefsQuery = (trpc as any).users.getPreferences.useQuery();

  const updateMutation = (trpc as any).users.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences saved"); prefsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const prefs = prefsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Account Preferences
          </h1>
          <p className="text-slate-400 text-sm mt-1">Customize your account settings</p>
        </div>
      </div>

      {/* Appearance */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsQuery.isLoading ? (
            [1, 2].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Moon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Dark Mode</p>
                    <p className="text-xs text-slate-500">Use dark theme across the application</p>
                  </div>
                </div>
                <Switch checked={prefs?.darkMode} onCheckedChange={(checked) => updateMutation.mutate({ darkMode: checked })} />
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Sun className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Compact Mode</p>
                    <p className="text-xs text-slate-500">Reduce spacing for more content</p>
                  </div>
                </div>
                <Switch checked={prefs?.compactMode} onCheckedChange={(checked) => updateMutation.mutate({ compactMode: checked })} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-400" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsQuery.isLoading ? (
            [1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Languages className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Language</p>
                    <p className="text-xs text-slate-500">Select your preferred language</p>
                  </div>
                </div>
                <Select value={prefs?.language} onValueChange={(value) => updateMutation.mutate({ language: value })}>
                  <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Timezone</p>
                    <p className="text-xs text-slate-500">Set your local timezone</p>
                  </div>
                </div>
                <Select value={prefs?.timezone} onValueChange={(value) => updateMutation.mutate({ timezone: value })}>
                  <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Globe className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Date Format</p>
                    <p className="text-xs text-slate-500">Choose date display format</p>
                  </div>
                </div>
                <Select value={prefs?.dateFormat} onValueChange={(value) => updateMutation.mutate({ dateFormat: value })}>
                  <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsQuery.isLoading ? (
            [1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive updates via email</p>
                </div>
                <Switch checked={prefs?.emailNotifications} onCheckedChange={(checked) => updateMutation.mutate({ emailNotifications: checked })} />
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-xs text-slate-500">Receive browser push notifications</p>
                </div>
                <Switch checked={prefs?.pushNotifications} onCheckedChange={(checked) => updateMutation.mutate({ pushNotifications: checked })} />
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-xs text-slate-500">Receive text message alerts</p>
                </div>
                <Switch checked={prefs?.smsNotifications} onCheckedChange={(checked) => updateMutation.mutate({ smsNotifications: checked })} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
