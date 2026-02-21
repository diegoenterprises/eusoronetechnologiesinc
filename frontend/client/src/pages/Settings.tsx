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
import { getStripe } from "@/lib/stripe";
import {
  Settings as SettingsIcon, User, Bell, Shield, CreditCard,
  Save, Loader2, Camera, CheckCircle, Plus, Trash2, Star,
  Lock, Eye, EyeOff, Building2, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "profile";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Stripe setup callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");
    if (setup === "success") {
      toast.success("Payment method added successfully");
      setActiveTab("billing");
      window.history.replaceState({}, "", "/settings?tab=billing");
    } else if (setup === "cancelled") {
      toast.info("Payment method setup was cancelled");
      setActiveTab("billing");
      window.history.replaceState({}, "", "/settings?tab=billing");
    }
  }, []);

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
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // --- Billing state ---
  const [addingCard, setAddingCard] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);

  // --- Queries ---
  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const preferencesQuery = (trpc as any).users.getPreferences.useQuery();
  const paymentMethodsQuery = (trpc as any).stripe.listPaymentMethods.useQuery(undefined, {
    enabled: activeTab === "billing",
    retry: false,
    onError: () => {},
  });

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

  const uploadPictureMutation = (trpc as any).users.uploadProfilePicture.useMutation({
    onSuccess: () => { toast.success("Profile picture saved"); profileQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to upload picture", { description: error.message }),
  });

  const createSetupCheckoutMutation = (trpc as any).stripe.createSetupCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open Stripe checkout");
        setAddingCard(false);
      }
    },
    onError: (error: any) => { toast.error("Failed to connect to Stripe", { description: error.message }); setAddingCard(false); },
  });

  const removePaymentMethodMutation = (trpc as any).stripe.removePaymentMethod.useMutation({
    onSuccess: () => { toast.success("Payment method removed"); paymentMethodsQuery.refetch(); setRemovingCardId(null); },
    onError: (error: any) => { toast.error("Failed to remove payment method", { description: error.message }); setRemovingCardId(null); },
  });

  const setDefaultPaymentMethodMutation = (trpc as any).stripe.setDefaultPaymentMethod.useMutation({
    onSuccess: () => { toast.success("Default payment method updated"); paymentMethodsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to set default", { description: error.message }),
  });

  const profile = profileQuery.data;
  const preferences = preferencesQuery.data;
  const paymentMethods = paymentMethodsQuery.data || [];

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
    if (securityForm.newPassword && securityForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    updateSecurityMutation.mutate({
      currentPassword: securityForm.currentPassword || undefined,
      newPassword: securityForm.newPassword || undefined,
      twoFactorEnabled: securityForm.twoFactorEnabled,
    });
  };

  const handleAvatarClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { uploadPictureMutation.mutate({ imageData: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  const handleAddPaymentMethod = () => {
    setAddingCard(true);
    createSetupCheckoutMutation.mutate();
  };

  const handleRemovePaymentMethod = (id: string) => {
    setRemovingCardId(id);
    removePaymentMethodMutation.mutate({ paymentMethodId: id });
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethodMutation.mutate({ paymentMethodId: id });
  };

  // Compute initials from the live form state
  const initials = `${profileForm.firstName?.charAt(0) || ""}${profileForm.lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  const cardBrandIcon = (brand: string) => {
    const brands: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };
    return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  // Shared input style
  const inputCls = "bg-white dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/50 rounded-lg focus:border-purple-400 dark:focus:border-cyan-500/50 text-slate-900 dark:text-white";
  const labelCls = "text-slate-600 dark:text-slate-400 text-sm font-medium";
  const cardCls = "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm dark:shadow-none";
  const switchRowCls = "flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/40";
  const btnCls = "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] hover:opacity-90 text-white rounded-lg";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" />Billing
          </TabsTrigger>
        </TabsList>

        {/* ======== PROFILE TAB ======== */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className={`lg:col-span-1 ${cardCls}`}>
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
                      <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
                        <Camera className="w-4 h-4 text-slate-600 dark:text-white" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">{profileForm.firstName} {profileForm.lastName}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{profileForm.email}</p>
                    <Badge className="mt-2 bg-gradient-to-r from-purple-500/15 to-blue-500/15 text-purple-600 dark:text-cyan-400 border-0">{profile?.role || "SHIPPER"}</Badge>
                    {profile?.verified && (
                      <div className="flex items-center justify-center gap-1 mt-2 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent dark:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent text-xs">
                        <CheckCircle className="w-3 h-3" />Verified Account
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className={`lg:col-span-2 ${cardCls}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileQuery.isLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className={labelCls}>First Name</Label>
                        <Input value={profileForm.firstName} onChange={(e: any) => setProfileForm(s => ({ ...s, firstName: e.target.value }))} className={inputCls} placeholder="First name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelCls}>Last Name</Label>
                        <Input value={profileForm.lastName} onChange={(e: any) => setProfileForm(s => ({ ...s, lastName: e.target.value }))} className={inputCls} placeholder="Last name" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Email</Label>
                      <Input value={profileForm.email} onChange={(e: any) => setProfileForm(s => ({ ...s, email: e.target.value }))} className={inputCls} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Phone</Label>
                      <Input value={profileForm.phone} onChange={(e: any) => setProfileForm(s => ({ ...s, phone: e.target.value }))} className={inputCls} placeholder="(555) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Company</Label>
                      <Input value={profileForm.company} onChange={(e: any) => setProfileForm(s => ({ ...s, company: e.target.value }))} className={inputCls} placeholder="Your company name" />
                    </div>
                    <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
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
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferencesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className={switchRowCls}>
                    <div><p className="text-slate-900 dark:text-white font-medium">Email Notifications</p><p className="text-sm text-slate-500 dark:text-slate-400">Receive email updates about your loads</p></div>
                    <Switch checked={notifPrefs.emailNotifications} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, emailNotifications: v }))} />
                  </div>
                  <div className={switchRowCls}>
                    <div><p className="text-slate-900 dark:text-white font-medium">Push Notifications</p><p className="text-sm text-slate-500 dark:text-slate-400">Receive push notifications on your device</p></div>
                    <Switch checked={notifPrefs.pushNotifications} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, pushNotifications: v }))} />
                  </div>
                  <div className={switchRowCls}>
                    <div><p className="text-slate-900 dark:text-white font-medium">SMS Alerts</p><p className="text-sm text-slate-500 dark:text-slate-400">Receive SMS for urgent updates</p></div>
                    <Switch checked={notifPrefs.smsAlerts} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, smsAlerts: v }))} />
                  </div>
                  <div className={switchRowCls}>
                    <div><p className="text-slate-900 dark:text-white font-medium">Marketing Emails</p><p className="text-sm text-slate-500 dark:text-slate-400">Receive news and promotional content</p></div>
                    <Switch checked={notifPrefs.marketingEmails} onCheckedChange={(v) => setNotifPrefs(s => ({ ...s, marketingEmails: v }))} />
                  </div>
                  <Button onClick={handleSavePreferences} className={btnCls} disabled={updatePreferencesMutation.isPending}>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Current Password</Label>
                    <div className="relative">
                      <Input type={showCurrentPw ? "text" : "password"} value={securityForm.currentPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, currentPassword: e.target.value }))} className={inputCls} placeholder="Enter current password" />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>New Password</Label>
                    <div className="relative">
                      <Input type={showNewPw ? "text" : "password"} value={securityForm.newPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, newPassword: e.target.value }))} className={inputCls} placeholder="Minimum 8 characters" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {securityForm.newPassword && securityForm.newPassword.length < 8 && (
                      <p className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Must be at least 8 characters</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Confirm New Password</Label>
                    <Input type="password" value={securityForm.confirmPassword} onChange={(e: any) => setSecurityForm(s => ({ ...s, confirmPassword: e.target.value }))} className={inputCls} placeholder="Re-enter new password" />
                    {securityForm.confirmPassword && securityForm.newPassword !== securityForm.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Passwords do not match</p>
                    )}
                  </div>
                  <Button onClick={handleSaveSecurity} className={btnCls} disabled={updateSecurityMutation.isPending || (!securityForm.newPassword)}>
                    {updateSecurityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={cardCls}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Security Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={switchRowCls}>
                    <div>
                      <p className="text-slate-900 dark:text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                    </div>
                    <Switch checked={securityForm.twoFactorEnabled} onCheckedChange={(v) => setSecurityForm(s => ({ ...s, twoFactorEnabled: v }))} />
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700 dark:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Account Security Status</p>
                        <p className="text-xs text-emerald-600 dark:bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">Your account is protected with enterprise-grade encryption. All data in transit uses TLS 1.3.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ======== BILLING TAB ======== */}
        <TabsContent value="billing" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className={`lg:col-span-2 ${cardCls}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Payment Methods
                </CardTitle>
                <Button size="sm" onClick={handleAddPaymentMethod} className={btnCls} disabled={addingCard}>
                  {addingCard ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  Add Card
                </Button>
              </CardHeader>
              <CardContent>
                {paymentMethodsQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No payment methods on file</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add a card or bank account to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((pm: any) => (
                      <div key={pm.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${pm.isDefault ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30" : "bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700/40"}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                            <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white font-medium text-sm">
                              {cardBrandIcon(pm.brand)} ending in {pm.last4}
                              {pm.isDefault && <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">DEFAULT</span>}
                            </p>
                            <p className="text-xs text-slate-400">Expires {pm.expMonth}/{pm.expYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!pm.isDefault && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(pm.id)} className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400">
                              <Star className="w-3.5 h-3.5 mr-1" />Set Default
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleRemovePaymentMethod(pm.id)} disabled={removingCardId === pm.id} className="text-xs text-slate-500 hover:text-red-500">
                            {removingCardId === pm.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`lg:col-span-1 ${cardCls}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-500 dark:text-cyan-400" />Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-500/20">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current Plan</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">EusoTrip Platform</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pay-per-load pricing</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/40">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Payment Methods</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{paymentMethods.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-400">All payments are secured via Stripe. Your card details never touch our servers.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
