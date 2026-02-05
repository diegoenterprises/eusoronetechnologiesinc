/**
 * ACCOUNT SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, Mail, Phone, MapPin, Globe, Bell, Save,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AccountSettings() {
  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const preferencesQuery = (trpc as any).users.getPreferences.useQuery();

  const updateProfileMutation = (trpc as any).users.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated"); profileQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update profile", { description: error.message }),
  });

  const updatePreferencesMutation = (trpc as any).users.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences updated"); preferencesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update preferences", { description: error.message }),
  });

  const profile = profileQuery.data;
  const preferences = preferencesQuery.data;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    timezone: "",
    language: "",
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        timezone: profile.timezone || "",
        language: profile.language || "",
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your personal information</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSave} disabled={updateProfileMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-6 text-center">
            {profileQuery.isLoading ? (
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            ) : (
              <>
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center relative">
                  <span className="text-4xl font-bold text-white">
                    {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                  </span>
                  <Button size="sm" className="absolute bottom-0 right-0 rounded-full bg-slate-700 hover:bg-slate-600 p-2">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white font-bold text-lg">{profile?.firstName} {profile?.lastName}</p>
                <p className="text-slate-400 text-sm">{profile?.email}</p>
                <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 border-0">{profile?.role}</Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">First Name</Label>
                    <Input value={formData.firstName} onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Last Name</Label>
                    <Input value={formData.lastName} onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">Phone</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(v: any) => setFormData({ ...formData, timezone: v })}>
                      <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400">Language</Label>
                    <Select value={formData.language} onValueChange={(v: any) => setFormData({ ...formData, language: v })}>
                      <SelectTrigger className="bg-slate-700/30 border-slate-600/50 rounded-lg"><SelectValue placeholder="Select language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preferencesQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-400">Receive updates via email</p>
                </div>
                <Switch checked={preferences?.emailNotifications} onCheckedChange={(checked) => updatePreferencesMutation.mutate({ emailNotifications: checked })} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">SMS Notifications</p>
                  <p className="text-sm text-slate-400">Receive updates via SMS</p>
                </div>
                <Switch checked={preferences?.smsNotifications} onCheckedChange={(checked) => updatePreferencesMutation.mutate({ smsNotifications: checked })} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-sm text-slate-400">Receive push notifications</p>
                </div>
                <Switch checked={preferences?.pushNotifications} onCheckedChange={(checked) => updatePreferencesMutation.mutate({ pushNotifications: checked })} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Marketing Emails</p>
                  <p className="text-sm text-slate-400">Receive marketing updates</p>
                </div>
                <Switch checked={preferences?.marketingEmails} onCheckedChange={(checked) => updatePreferencesMutation.mutate({ marketingEmails: checked })} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
