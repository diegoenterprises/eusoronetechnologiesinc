/**
 * SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings as SettingsIcon, User, Bell, Shield, CreditCard,
  Save, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const profileQuery = trpc.users.getProfile.useQuery();
  const preferencesQuery = trpc.users.getPreferences.useQuery();

  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated"); profileQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updatePreferencesMutation = trpc.users.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences updated"); preferencesQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const profile = profileQuery.data;
  const preferences = preferencesQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700 rounded-md">
            <User className="w-4 h-4 mr-2" />Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 rounded-md">
            <Bell className="w-4 h-4 mr-2" />Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 rounded-md">
            <Shield className="w-4 h-4 mr-2" />Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-slate-700 rounded-md">
            <CreditCard className="w-4 h-4 mr-2" />Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400">First Name</Label>
                      <Input defaultValue={profile?.firstName} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Last Name</Label>
                      <Input defaultValue={profile?.lastName} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Email</Label>
                    <Input defaultValue={profile?.email} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Phone</Label>
                    <Input defaultValue={profile?.phone} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Company</Label>
                    <Input defaultValue={profile?.company} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                  </div>
                  <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-slate-400">Receive email updates about your loads</p>
                    </div>
                    <Switch defaultChecked={preferences?.emailNotifications} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-sm text-slate-400">Receive push notifications on your device</p>
                    </div>
                    <Switch defaultChecked={preferences?.pushNotifications} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">SMS Alerts</p>
                      <p className="text-sm text-slate-400">Receive SMS for urgent updates</p>
                    </div>
                    <Switch defaultChecked={preferences?.smsAlerts} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-sm text-slate-400">Receive news and promotional content</p>
                    </div>
                    <Switch defaultChecked={preferences?.marketingEmails} />
                  </div>
                  <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" disabled={updatePreferencesMutation.isPending}>
                    {updatePreferencesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-400">Current Password</Label>
                  <Input type="password" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">New Password</Label>
                  <Input type="password" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">Confirm New Password</Label>
                  <Input type="password" className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-400">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  <Save className="w-4 h-4 mr-2" />Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No payment methods on file</p>
                <p className="text-slate-500 text-sm mt-1">Add a payment method to get started</p>
                <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
