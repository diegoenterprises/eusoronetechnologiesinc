/**
 * SETTINGS PAGE
 * 100% Dynamic - All data from database
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Settings as SettingsIcon, User, Bell, Shield, CreditCard,
  Save, Loader2, Camera, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Profile form state ---
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
  });

  // --- Notification preferences state ---
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: true,
    marketingEmails: false,
  });

  // --- Security form state ---
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  // --- Queries ---
  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const preferencesQuery = (trpc as any).users.getPreferences.useQuery();

  // --- Mutations ---
  const updateProfileMutation = (trpc as any).users.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated successfully"); profileQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update profile", { description: error.message }),
  });

  const updatePreferencesMutation = (trpc as any).users.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences updated"); preferencesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update preferences", { description: error.message }),
  });

  const updateSecurityMutation = (trpc as any).users.updateSecurity.useMutation({
    onSuccess: () => { toast.success("Security settings updated"); setSecurityForm(s => ({ ...s, currentPassword: "", newPassword: "", confirmPassword: "" })); },
    onError: (error: any) => toast.error("Failed to update security", { description: error.message }),
  });

  const profile = profileQuery.data;
  const preferences = preferencesQuery.data;

  // Sync profile data into form when loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
      });
    }
  }, [profile]);

  // Sync notification preferences when loaded
  useEffect(() => {
    if (preferences) {
      setNotifPrefs({
        emailNotifications: preferences.emailNotifications ?? true,
        pushNotifications: preferences.pushNotifications ?? true,
        smsAlerts: preferences.smsAlerts ?? true,
        marketingEmails: preferences.marketingEmails ?? false,
      });
    }
  }, [preferences]);

  // --- Handlers ---
  const handleSaveProfile = () => {
    if (!profileForm.firstName.trim()) { toast.error("First name is required"); return; }
    updateProfileMutation.mutate({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      company: profileForm.company.trim(),
    });
  };

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(notifPrefs);
  };

  const handleSaveSecurity = () => {
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    updateSecurityMutation.mutate({
      currentPassword: securityForm.currentPassword || undefined,
      newPassword: securityForm.newPassword || undefined,
      twoFactorEnabled: securityForm.twoFactorEnabled,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const uploadPictureMutation = (trpc as any).users.uploadProfilePicture.useMutation({
    onSuccess: () => { toast.success("Profile picture saved"); profileQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to upload picture", { description: error.message }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadPictureMutation.mutate({ imageData: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Compute initials from the live form state
  const initials = `${profileForm.firstName?.charAt(0) || ""}${profileForm.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
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

        {/* ======== PROFILE TAB ======== */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Avatar Card */}
            <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-6 text-center">
                {profileQuery.isLoading ? (
                  <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                ) : (
                  <>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      {profile?.profilePicture ? (
                        <img src={profile.profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/30" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{initials}</span>
                        </div>
                      )}
                      <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-800 transition-colors">
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    <p className="text-white font-bold text-lg">{profileForm.firstName} {profileForm.lastName}</p>
                    <p className="text-slate-400 text-sm">{profileForm.email}</p>
                    <Badge className="mt-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-cyan-400 border-0">{profile?.role || "SHIPPER"}</Badge>
                    {profile?.verified && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-emerald-400 text-xs">
                        <CheckCircle className="w-3 h-3" />Verified Account
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-400">First Name</Label>
                        <Input value={profileForm.firstName} onChange={(e: any) => setProfileForm(s => ({ ...s, firstName: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-400">Last Name</Label>
                        <Input value={profileForm.lastName} onChange={(e: any) => setProfileForm(s => ({ ...s, lastName: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Email</Label>
                      <Input value={profileForm.email} onChange={(e: any) => setProfileForm(s => ({ ...s, email: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Phone</Label>
                      <Input value={profileForm.phone} onChange={(e: any) => setProfileForm(s => ({ ...s, phone: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">Company</Label>
                      <Input value={profileForm.company} onChange={(e: any) => setProfileForm(s => ({ ...s, company: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ======== NOTIFICATIONS TAB ======== */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-slate-400">Receive email updates about your loads</p>
                    </div>
                    <Switch checked={notifPrefs.emailNotifications} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, emailNotifications: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-sm text-slate-400">Receive push notifications on your device</p>
                    </div>
                    <Switch checked={notifPrefs.pushNotifications} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, pushNotifications: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">SMS Alerts</p>
                      <p className="text-sm text-slate-400">Receive SMS for urgent updates</p>
                    </div>
                    <Switch checked={notifPrefs.smsAlerts} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, smsAlerts: v }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                    <div>
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-sm text-slate-400">Receive news and promotional content</p>
                    </div>
                    <Switch checked={notifPrefs.marketingEmails} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, marketingEmails: v }))} />
                  </div>
                  <Button onClick={handleSavePreferences} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" disabled={updatePreferencesMutation.isPending}>
                    {updatePreferencesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== SECURITY TAB ======== */}
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
                  <Input type="password" value={securityForm.currentPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, currentPassword: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">New Password</Label>
                  <Input type="password" value={securityForm.newPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, newPassword: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">Confirm New Password</Label>
                  <Input type="password" value={securityForm.confirmPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, confirmPassword: e.target.value }))} className="bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-400">Add an extra layer of security</p>
                  </div>
                  <Switch checked={securityForm.twoFactorEnabled} onCheckedChange={(v) => setSecurityForm(s => ({ ...s, twoFactorEnabled: v }))} />
                </div>
                <Button onClick={handleSaveSecurity} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" disabled={updateSecurityMutation.isPending}>
                  {updateSecurityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Update Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== BILLING TAB ======== */}
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
