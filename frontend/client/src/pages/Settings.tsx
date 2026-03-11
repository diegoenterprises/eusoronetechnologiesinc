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
  Settings as SettingsIcon, User, Bell, Shield, CreditCard, Package,
  Save, Loader2, Camera, CheckCircle, Plus, Trash2, Star,
  Lock, Eye, EyeOff, Building2, AlertTriangle, Heart, Phone, Landmark, ExternalLink,
  Download, XCircle, Clock, FileDown, UserX
} from "lucide-react";
import MyProductsTab from "@/components/MyProductsTab";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "profile";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Stripe setup / Connect onboarding callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");
    const onboarding = params.get("onboarding");
    if (setup === "success") {
      toast.success("Payment method added successfully");
      setActiveTab("billing");
      window.history.replaceState({}, "", "/settings?tab=billing");
    } else if (setup === "cancelled") {
      toast.info("Payment method setup was cancelled");
      setActiveTab("billing");
      window.history.replaceState({}, "", "/settings?tab=billing");
    } else if (onboarding === "complete") {
      toast.success("EusoConnect setup submitted! Your account is being verified.");
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
  const [roleForm, setRoleForm] = useState<Record<string, any>>({});
  const [roleFormDirty, setRoleFormDirty] = useState(false);

  // --- Notification preferences state ---
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: true,
    marketingEmails: false,
  });

  // --- Emergency contact state ---
  const [emergencyForm, setEmergencyForm] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "",
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

  // --- Account deletion state ---
  const [deleteReason, setDeleteReason] = useState("");
  const [closePassword, setClosePassword] = useState("");
  const [showClosePassword, setShowClosePassword] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // --- Queries ---
  const profileQuery = (trpc as any).users.getProfile.useQuery();
  const preferencesQuery = (trpc as any).users.getPreferences.useQuery();
  const emergencyContactQuery = (trpc as any).users.getEmergencyContact.useQuery();
  const paymentMethodsQuery = (trpc as any).stripe.listPaymentMethods.useQuery(undefined, {
    enabled: activeTab === "billing",
    retry: false,
    onError: () => {},
  });
  const connectAccountQuery = (trpc as any).stripe.getConnectAccount.useQuery(undefined, {
    enabled: activeTab === "billing",
    retry: false,
    staleTime: 60000,
  });
  const createConnectAccountMutation = (trpc as any).stripe.createConnectAccount.useMutation();
  const createConnectOnboardingLinkMutation = (trpc as any).stripe.createConnectOnboardingLink.useMutation();

  const [connectLoading, setConnectLoading] = useState(false);
  const handleStartConnect = async () => {
    setConnectLoading(true);
    try {
      let accountId = connectAccountQuery?.data?.accountId;
      if (!accountId) {
        const result = await createConnectAccountMutation.mutateAsync({ businessType: "individual" });
        accountId = result.accountId;
      }
      if (accountId) {
        const link = await createConnectOnboardingLinkMutation.mutateAsync({ accountId });
        if (link?.url) { window.location.href = link.url; return; }
      }
      toast.error("Could not start EusoConnect bank setup");
    } catch (err: any) {
      toast.error(err?.message || "EusoConnect setup failed. Please try again.");
    } finally { setConnectLoading(false); }
  };

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

  const updateEmergencyContactMutation = (trpc as any).users.updateEmergencyContact.useMutation({
    onSuccess: () => { toast.success("Emergency contact saved"); emergencyContactQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to save emergency contact", { description: error.message }),
  });

  const createSetupCheckoutMutation = (trpc as any).stripe.createSetupCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open payment setup");
        setAddingCard(false);
      }
    },
    onError: (error: any) => { toast.error("Failed to connect payment provider", { description: error.message }); setAddingCard(false); },
  });

  const removePaymentMethodMutation = (trpc as any).stripe.removePaymentMethod.useMutation({
    onSuccess: () => { toast.success("Payment method removed"); paymentMethodsQuery.refetch(); setRemovingCardId(null); },
    onError: (error: any) => { toast.error("Failed to remove payment method", { description: error.message }); setRemovingCardId(null); },
  });

  const setDefaultPaymentMethodMutation = (trpc as any).stripe.setDefaultPaymentMethod.useMutation({
    onSuccess: () => { toast.success("Default payment method updated"); paymentMethodsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to set default", { description: error.message }),
  });

  // --- Account lifecycle mutations ---
  const accountInfoQuery = (trpc as any).users.getAccountInfo.useQuery(undefined, {
    enabled: activeTab === "account",
    retry: false,
  });

  const requestDeletionMutation = (trpc as any).users.requestAccountDeletion.useMutation({
    onSuccess: (data: any) => {
      toast.success("Account deletion scheduled", { description: `Your account will be deleted on ${new Date(data.scheduledFor).toLocaleDateString()}` });
      setShowDeleteConfirm(false);
      setConfirmDeleteText("");
      setDeleteReason("");
      profileQuery.refetch();
      accountInfoQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to schedule deletion", { description: error.message }),
  });

  const cancelDeletionMutation = (trpc as any).users.cancelAccountDeletion.useMutation({
    onSuccess: () => {
      toast.success("Account deletion cancelled", { description: "Your account is active again" });
      profileQuery.refetch();
      accountInfoQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to cancel deletion", { description: error.message }),
  });

  const closeAccountMutation = (trpc as any).users.closeAccount.useMutation({
    onSuccess: () => {
      toast.success("Account closed successfully");
      setShowCloseConfirm(false);
      setClosePassword("");
      // Redirect to login after a short delay
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    },
    onError: (error: any) => toast.error("Failed to close account", { description: error.message }),
  });

  const exportDataMutation = (trpc as any).users.exportPersonalData.useMutation({
    onSuccess: (result: any) => {
      // Download the export as JSON
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eusotrip-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded");
    },
    onError: (error: any) => toast.error("Failed to export data", { description: error.message }),
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
      if (profile.roleData) {
        setRoleForm(profile.roleData);
        setRoleFormDirty(false);
      }
    }
  }, [profile]);

  // Sync emergency contact when loaded
  useEffect(() => {
    if (emergencyContactQuery.data) {
      setEmergencyForm({
        name: emergencyContactQuery.data.name || "",
        phone: emergencyContactQuery.data.phone || "",
        email: emergencyContactQuery.data.email || "",
        relationship: emergencyContactQuery.data.relationship || "",
      });
    }
  }, [emergencyContactQuery.data]);

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
      ...(roleFormDirty ? { roleData: roleForm } : {}),
    });
    setRoleFormDirty(false);
  };

  const updateRoleField = (key: string, value: any) => {
    setRoleForm(prev => ({ ...prev, [key]: value }));
    setRoleFormDirty(true);
  };

  const updateNestedRoleField = (parent: string, key: string, value: any) => {
    setRoleForm(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [key]: value } }));
    setRoleFormDirty(true);
  };

  const handleSaveEmergencyContact = () => {
    if (!emergencyForm.name.trim()) { toast.error("Emergency contact name is required"); return; }
    if (!emergencyForm.phone.trim()) { toast.error("Emergency contact phone is required"); return; }
    if (!emergencyForm.email.trim()) { toast.error("Emergency contact email is required"); return; }
    if (!emergencyForm.relationship.trim()) { toast.error("Relationship is required"); return; }
    updateEmergencyContactMutation.mutate(emergencyForm);
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
          <TabsTrigger value="products" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />My Products
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">
            <UserX className="w-4 h-4 mr-2" />Account
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

          {/* ── Emergency Contact Card ── */}
          <Card className={`mt-6 ${cardCls} border-red-200/50 dark:border-red-500/20`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />Emergency Contact
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2">Used when SOS is triggered</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyContactQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-5">
                  {!emergencyContactQuery.data && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">No emergency contact on file. When SOS is triggered, your emergency contact will be notified by SMS and email immediately. Please add one now.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Full Name</Label>
                      <Input value={emergencyForm.name} onChange={(e: any) => setEmergencyForm(s => ({ ...s, name: e.target.value }))} className={inputCls} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Relationship</Label>
                      <Input value={emergencyForm.relationship} onChange={(e: any) => setEmergencyForm(s => ({ ...s, relationship: e.target.value }))} className={inputCls} placeholder="Spouse, Parent, Sibling..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Phone Number</Label>
                      <Input value={emergencyForm.phone} onChange={(e: any) => setEmergencyForm(s => ({ ...s, phone: e.target.value }))} className={inputCls} placeholder="(555) 000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Email Address</Label>
                      <Input value={emergencyForm.email} onChange={(e: any) => setEmergencyForm(s => ({ ...s, email: e.target.value }))} className={inputCls} placeholder="emergency@email.com" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveEmergencyContact} className="bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white rounded-lg" disabled={updateEmergencyContactMutation.isPending}>
                      {updateEmergencyContactMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                      Save Emergency Contact
                    </Button>
                    {emergencyContactQuery.data && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Contact on file
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Role-Specific Credentials ── */}
          {profile?.role === "DRIVER" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />CDL & Credentials
                  {profile.industryVertical && <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">{profile.industryVertical}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CDL Number</Label>
                      <Input value={roleForm.cdl?.number || ""} onChange={(e: any) => updateNestedRoleField("cdl", "number", e.target.value)} className={inputCls} placeholder="CDL number" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CDL State</Label>
                      <Input value={roleForm.cdl?.state || ""} onChange={(e: any) => updateNestedRoleField("cdl", "state", e.target.value)} className={inputCls} placeholder="e.g. TX" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CDL Expiration</Label>
                      <Input type="date" value={roleForm.cdl?.expiration || ""} onChange={(e: any) => updateNestedRoleField("cdl", "expiration", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CDL Class</Label>
                      <Input value={roleForm.cdl?.class || ""} onChange={(e: any) => updateNestedRoleField("cdl", "class", e.target.value)} className={inputCls} placeholder="A, B, or C" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>CDL Endorsements</Label>
                      <Input value={(roleForm.cdl?.endorsements || []).join(", ")} onChange={(e: any) => updateNestedRoleField("cdl", "endorsements", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className={inputCls} placeholder="H, N, T, X..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Years Experience</Label>
                      <Input type="number" value={roleForm.yearsExperience || ""} onChange={(e: any) => updateRoleField("yearsExperience", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Medical Card Expiry</Label>
                      <Input type="date" value={roleForm.medicalCardExpiration || ""} onChange={(e: any) => updateRoleField("medicalCardExpiration", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Hazmat Expiration</Label>
                      <Input type="date" value={roleForm.hazmatExpiration || ""} onChange={(e: any) => updateRoleField("hazmatExpiration", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>TWIC Expiration</Label>
                      <Input type="date" value={roleForm.twicExpiration || ""} onChange={(e: any) => updateRoleField("twicExpiration", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: "hazmatEndorsement", label: "Hazmat Endorsed" },
                      { key: "tankerEndorsement", label: "Tanker Endorsed" },
                      { key: "twicCard", label: "TWIC Card" },
                      { key: "hoseExperience", label: "Hose Experience" },
                      { key: "pumpExperience", label: "Pump Experience" },
                      { key: "bottomLoadExperience", label: "Bottom Load" },
                      { key: "vaporRecoveryExperience", label: "Vapor Recovery" },
                    ].map(({ key, label }) => (
                      <div key={key} className={switchRowCls}>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{label}</span>
                        <Switch checked={!!roleForm[key]} onCheckedChange={(v) => updateRoleField(key, v)} />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Credentials
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.role === "CATALYST" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Carrier Credentials & Fleet
                  {profile.industryVertical && <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">{profile.industryVertical}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>USDOT Number</Label>
                      <Input value={roleForm.usdotNumber || ""} onChange={(e: any) => updateRoleField("usdotNumber", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>MC Number</Label>
                      <Input value={roleForm.mcNumber || ""} onChange={(e: any) => updateRoleField("mcNumber", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>PHMSA Number</Label>
                      <Input value={roleForm.phmsaNumber || ""} onChange={(e: any) => updateRoleField("phmsaNumber", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Catalyst Type</Label>
                      <Input value={roleForm.catalystType || ""} onChange={(e: any) => updateRoleField("catalystType", e.target.value)} className={inputCls} placeholder="e.g. hazmat_carrier" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>EIN Number</Label>
                      <Input value={roleForm.einNumber || ""} onChange={(e: any) => updateRoleField("einNumber", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/40">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Liability Insurance</p>
                      <div className="space-y-2">
                        <Input value={roleForm.liabilityInsurance?.carrier || ""} onChange={(e: any) => updateNestedRoleField("liabilityInsurance", "carrier", e.target.value)} className={inputCls} placeholder="Insurance carrier" />
                        <Input value={roleForm.liabilityInsurance?.policy || ""} onChange={(e: any) => updateNestedRoleField("liabilityInsurance", "policy", e.target.value)} className={inputCls} placeholder="Policy number" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={roleForm.liabilityInsurance?.coverage || ""} onChange={(e: any) => updateNestedRoleField("liabilityInsurance", "coverage", e.target.value)} className={inputCls} placeholder="Coverage amount" />
                          <Input type="date" value={roleForm.liabilityInsurance?.expiration || ""} onChange={(e: any) => updateNestedRoleField("liabilityInsurance", "expiration", e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/40">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Cargo Insurance</p>
                      <div className="space-y-2">
                        <Input value={roleForm.cargoInsurance?.carrier || ""} onChange={(e: any) => updateNestedRoleField("cargoInsurance", "carrier", e.target.value)} className={inputCls} placeholder="Insurance carrier" />
                        <Input value={roleForm.cargoInsurance?.policy || ""} onChange={(e: any) => updateNestedRoleField("cargoInsurance", "policy", e.target.value)} className={inputCls} placeholder="Policy number" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={roleForm.cargoInsurance?.coverage || ""} onChange={(e: any) => updateNestedRoleField("cargoInsurance", "coverage", e.target.value)} className={inputCls} placeholder="Coverage amount" />
                          <Input type="date" value={roleForm.cargoInsurance?.expiration || ""} onChange={(e: any) => updateNestedRoleField("cargoInsurance", "expiration", e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: "hazmatEndorsed", label: "Hazmat Authority" },
                      { key: "tankerEndorsed", label: "Tanker Endorsed" },
                    ].map(({ key, label }) => (
                      <div key={key} className={switchRowCls}>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{label}</span>
                        <Switch checked={!!roleForm[key]} onCheckedChange={(v) => updateRoleField(key, v)} />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Credentials
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.role === "SHIPPER" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Shipper Details
                  {profile.industryVertical && <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">{profile.industryVertical}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>DBA Name</Label>
                      <Input value={roleForm.dba || ""} onChange={(e: any) => updateRoleField("dba", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Company Type</Label>
                      <Input value={roleForm.companyType || ""} onChange={(e: any) => updateRoleField("companyType", e.target.value)} className={inputCls} placeholder="LLC, Corp, etc." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>PHMSA Number</Label>
                      <Input value={roleForm.phmsaNumber || ""} onChange={(e: any) => updateRoleField("phmsaNumber", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>EPA ID</Label>
                      <Input value={roleForm.epaId || ""} onChange={(e: any) => updateRoleField("epaId", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Operating States</Label>
                      <Input value={(roleForm.operatingStates || []).join(", ")} onChange={(e: any) => updateRoleField("operatingStates", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className={inputCls} placeholder="TX, LA, OK..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={switchRowCls}>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Hazmat Endorsed</span>
                      <Switch checked={!!roleForm.hazmatEndorsed} onCheckedChange={(v) => updateRoleField("hazmatEndorsed", v)} />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.role === "BROKER" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Broker Credentials
                  {profile.industryVertical && <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">{profile.industryVertical}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>MC Number</Label>
                      <Input value={roleForm.mcNumber || ""} onChange={(e: any) => updateRoleField("mcNumber", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>DOT Number</Label>
                      <Input value={roleForm.dotNumber || ""} onChange={(e: any) => updateRoleField("dotNumber", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>License Number</Label>
                      <Input value={roleForm.licenseNumber || ""} onChange={(e: any) => updateRoleField("licenseNumber", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Operating States</Label>
                    <Input value={(roleForm.operatingStates || []).join(", ")} onChange={(e: any) => updateRoleField("operatingStates", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className={inputCls} placeholder="TX, LA, OK..." />
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Credentials
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.role === "TERMINAL_MANAGER" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Facility Details
                  {profile.industryVertical && <Badge className="ml-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs">{profile.industryVertical}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Facility Name</Label>
                      <Input value={roleForm.facilityName || ""} onChange={(e: any) => updateRoleField("facilityName", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Facility Type</Label>
                      <Input value={roleForm.facilityType || ""} onChange={(e: any) => updateRoleField("facilityType", e.target.value)} className={inputCls} placeholder="Terminal, Warehouse, Yard..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Operating Hours</Label>
                      <Input value={roleForm.operatingHours || ""} onChange={(e: any) => updateRoleField("operatingHours", e.target.value)} className={inputCls} placeholder="24/7, M-F 6am-6pm..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Storage Capacity</Label>
                      <Input value={roleForm.storageCapacity || ""} onChange={(e: any) => updateRoleField("storageCapacity", e.target.value)} className={inputCls} placeholder="e.g. 50,000 bbl" />
                    </div>
                  </div>
                  <div className={switchRowCls}>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Hazmat Capable</span>
                    <Switch checked={!!roleForm.hazmatCapable} onCheckedChange={(v) => updateRoleField("hazmatCapable", v)} />
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Facility Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.role === "DISPATCH" && (
            <Card className={`mt-6 ${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Dispatch Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Fleet Size</Label>
                      <Input value={roleForm.fleetSize || ""} onChange={(e: any) => updateRoleField("fleetSize", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Dispatch Team Size</Label>
                      <Input value={roleForm.dispatchTeamSize || ""} onChange={(e: any) => updateRoleField("dispatchTeamSize", e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Software</Label>
                      <Input value={roleForm.software || ""} onChange={(e: any) => updateRoleField("software", e.target.value)} className={inputCls} placeholder="TMS, dispatch software..." />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} className={btnCls} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance IDs — shown for all roles that have them */}
          {profile?.roleData?.complianceIds && Object.values(profile.roleData.complianceIds).some((v: any) => v) && (
            <Card className={`mt-6 ${cardCls} border-emerald-200/50 dark:border-emerald-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />Compliance IDs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(profile.roleData.complianceIds as Record<string, string>)
                    .filter(([, v]) => v)
                    .map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/15">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</p>
                        <p className="text-sm text-slate-800 dark:text-white font-mono mt-0.5">{value}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
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
        <TabsContent value="billing" className="mt-6 space-y-6">
          {/* ── EusoConnect Bank Status Card ── */}
          <Card className={`${cardCls} border-blue-200/50 dark:border-blue-500/20`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-500 dark:text-cyan-400" />EusoConnect — Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectAccountQuery?.isLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : connectAccountQuery?.data?.hasAccount ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${connectAccountQuery.data.chargesEnabled ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-amber-100 dark:bg-amber-500/15"}`}>
                      <Landmark className={`w-5 h-5 ${connectAccountQuery.data.chargesEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-900 dark:text-white font-medium text-sm">Payout Account</p>
                        <Badge className={`border-0 text-xs font-semibold ${connectAccountQuery.data.chargesEnabled ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                          {connectAccountQuery.data.chargesEnabled ? "Active" : connectAccountQuery.data.detailsSubmitted ? "Under Review" : "Incomplete"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {connectAccountQuery.data.chargesEnabled && connectAccountQuery.data.payoutsEnabled
                          ? "You can send and receive payments on EusoTrip"
                          : connectAccountQuery.data.detailsSubmitted
                          ? "Your information is being verified. This usually takes 1-2 business days."
                          : "Additional information is needed to activate your account."}
                      </p>
                    </div>
                  </div>
                  {!connectAccountQuery.data.chargesEnabled && (
                    <Button size="sm" onClick={handleStartConnect} disabled={connectLoading} className={btnCls}>
                      {connectLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                      {connectAccountQuery.data.detailsSubmitted ? "Check Status" : "Continue Setup"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Landmark className="w-8 h-8 text-blue-500 dark:text-cyan-400" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">Set up EusoConnect to receive payments</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-md mx-auto">Connect your bank account so you can receive payouts for completed loads, referrals, and other earnings.</p>
                  <Button onClick={handleStartConnect} disabled={connectLoading} className={`mt-4 ${btnCls}`}>
                    {connectLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Landmark className="w-4 h-4 mr-2" />}
                    EusoConnect to Bank
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                      <p className="text-xs text-blue-700 dark:text-blue-400">All payments are secured with bank-level encryption. Your card details never touch our servers.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ======== MY PRODUCTS TAB ======== */}
        <TabsContent value="products" className="mt-6">
          <MyProductsTab />
        </TabsContent>

        {/* ======== ACCOUNT TAB ======== */}
        <TabsContent value="account" className="mt-6 space-y-6">
          {/* Data Export */}
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500 dark:text-cyan-400" />Export Your Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Download a copy of all your personal data stored on EusoTrip (GDPR Article 15 / CCPA Right to Know). This includes your profile, load history, wallet transactions, documents, and messages.
              </p>
              <Button onClick={() => exportDataMutation.mutate({})} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={exportDataMutation.isPending}>
                {exportDataMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                Download My Data
              </Button>
            </CardContent>
          </Card>

          {/* Pending Deletion Banner */}
          {profile?.pendingDeletion && (
            <Card className={`${cardCls} border-amber-200/50 dark:border-amber-500/30`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/15">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Account Deletion Scheduled</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Your account is scheduled for permanent deletion on{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {new Date(profile.deletionDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </strong>.
                      All personal data will be permanently removed after this date.
                    </p>
                    <Button
                      onClick={() => cancelDeletionMutation.mutate({})}
                      className="mt-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                      disabled={cancelDeletionMutation.isPending}
                    >
                      {cancelDeletionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Cancel Deletion — Keep My Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Account Deletion (30-day grace) */}
          {!profile?.pendingDeletion && (
            <Card className={`${cardCls} border-red-200/30 dark:border-red-500/20`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />Delete Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Schedule your account for permanent deletion. You will have a <strong className="text-slate-700 dark:text-slate-300">30-day grace period</strong> to cancel before all data is permanently removed.
                </p>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-700 dark:text-red-400">
                      <p className="font-medium mb-1">This will permanently delete:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Your profile and personal information</li>
                        <li>All messages and notifications</li>
                        <li>Wallet and transaction history</li>
                        <li>Uploaded documents</li>
                      </ul>
                      <p className="mt-1.5">Financial records and load history will be anonymized and retained for regulatory compliance (7 years).</p>
                    </div>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <Button onClick={() => setShowDeleteConfirm(true)} variant="outline" className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4 mr-2" />Schedule Account Deletion
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-red-700 dark:text-red-400 font-medium">Reason (optional)</Label>
                      <Input
                        value={deleteReason}
                        onChange={(e: any) => setDeleteReason(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-500/30 text-slate-900 dark:text-white"
                        placeholder="Why are you leaving?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-red-700 dark:text-red-400 font-medium">
                        Type <span className="font-mono bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded text-xs">DELETE MY ACCOUNT</span> to confirm
                      </Label>
                      <Input
                        value={confirmDeleteText}
                        onChange={(e: any) => setConfirmDeleteText(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-500/30 text-slate-900 dark:text-white font-mono"
                        placeholder="DELETE MY ACCOUNT"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => requestDeletionMutation.mutate({ reason: deleteReason || undefined })}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        disabled={confirmDeleteText !== "DELETE MY ACCOUNT" || requestDeletionMutation.isPending}
                      >
                        {requestDeletionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Confirm Deletion
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowDeleteConfirm(false); setConfirmDeleteText(""); setDeleteReason(""); }} className="text-slate-500">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Immediate Account Closure */}
          <Card className={`${cardCls} border-red-200/30 dark:border-red-500/20`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-600" />Close Account Immediately
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Immediately close your account and anonymize your personal data. This action is <strong className="text-red-600 dark:text-red-400">irreversible</strong> and takes effect instantly. You must verify your password to proceed.
              </p>

              {!showCloseConfirm ? (
                <Button onClick={() => setShowCloseConfirm(true)} variant="outline" className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                  <UserX className="w-4 h-4 mr-2" />Close Account Now
                </Button>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-red-700 dark:text-red-400 font-medium">Confirm Your Password</Label>
                    <div className="relative">
                      <Input
                        type={showClosePassword ? "text" : "password"}
                        value={closePassword}
                        onChange={(e: any) => setClosePassword(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-red-200 dark:border-red-500/30 text-slate-900 dark:text-white"
                        placeholder="Enter your password"
                      />
                      <button type="button" onClick={() => setShowClosePassword(!showClosePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showClosePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => closeAccountMutation.mutate({ confirmPassword: closePassword, reason: "user_requested_immediate_closure" })}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      disabled={!closePassword || closeAccountMutation.isPending}
                    >
                      {closeAccountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
                      Close Account Permanently
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowCloseConfirm(false); setClosePassword(""); }} className="text-slate-500">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
