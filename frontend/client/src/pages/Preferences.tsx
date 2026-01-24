/**
 * PREFERENCES PAGE
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
  Settings, Bell, Moon, Sun, Globe, Clock,
  Save, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

export default function Preferences() {
  const preferencesQuery = trpc.preferences.get.useQuery();

  const updateMutation = trpc.preferences.update.useMutation({
    onSuccess: () => { toast.success("Preferences saved"); preferencesQuery.refetch(); },
    onError: (error) => toast.error("Failed to save", { description: error.message }),
  });

  const resetMutation = trpc.preferences.reset.useMutation({
    onSuccess: () => { toast.success("Preferences reset"); preferencesQuery.refetch(); },
    onError: (error) => toast.error("Failed to reset", { description: error.message }),
  });

  const prefs = preferencesQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Preferences
          </h1>
          <p className="text-slate-400 text-sm mt-1">Customize your experience</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => resetMutation.mutate({})}>
            <RotateCcw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => updateMutation.mutate(prefs)}>
            <Save className="w-4 h-4 mr-2" />Save
          </Button>
        </div>
      </div>

      {preferencesQuery.isLoading ? (
        <div className="space-y-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Appearance */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-400" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Dark Mode</p>
                  <p className="text-xs text-slate-500">Use dark theme across the application</p>
                </div>
                <Switch checked={prefs?.darkMode} onCheckedChange={(checked) => updateMutation.mutate({ ...prefs, darkMode: checked })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Compact Mode</p>
                  <p className="text-xs text-slate-500">Reduce spacing for more content</p>
                </div>
                <Switch checked={prefs?.compactMode} onCheckedChange={(checked) => updateMutation.mutate({ ...prefs, compactMode: checked })} />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive updates via email</p>
                </div>
                <Switch checked={prefs?.emailNotifications} onCheckedChange={(checked) => updateMutation.mutate({ ...prefs, emailNotifications: checked })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-xs text-slate-500">Receive browser push notifications</p>
                </div>
                <Switch checked={prefs?.pushNotifications} onCheckedChange={(checked) => updateMutation.mutate({ ...prefs, pushNotifications: checked })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-xs text-slate-500">Receive text message alerts</p>
                </div>
                <Switch checked={prefs?.smsNotifications} onCheckedChange={(checked) => updateMutation.mutate({ ...prefs, smsNotifications: checked })} />
              </div>
            </CardContent>
          </Card>

          {/* Regional */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Regional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Timezone</p>
                  <p className="text-xs text-slate-500">Your local timezone</p>
                </div>
                <Select value={prefs?.timezone} onValueChange={(value) => updateMutation.mutate({ ...prefs, timezone: value })}>
                  <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Date Format</p>
                  <p className="text-xs text-slate-500">How dates are displayed</p>
                </div>
                <Select value={prefs?.dateFormat} onValueChange={(value) => updateMutation.mutate({ ...prefs, dateFormat: value })}>
                  <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Distance Unit</p>
                  <p className="text-xs text-slate-500">Miles or kilometers</p>
                </div>
                <Select value={prefs?.distanceUnit} onValueChange={(value) => updateMutation.mutate({ ...prefs, distanceUnit: value })}>
                  <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
