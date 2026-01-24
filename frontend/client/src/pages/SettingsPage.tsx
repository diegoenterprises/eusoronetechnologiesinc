/**
 * SETTINGS PAGE
 * User preferences and account settings
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, User, Bell, Shield, CreditCard, Palette,
  Globe, Lock, Smartphone, Mail, Key, Eye, EyeOff,
  Save, RefreshCw, Trash2, Download, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  loadAlerts: boolean;
  bidNotifications: boolean;
  paymentAlerts: boolean;
  complianceReminders: boolean;
  marketingEmails: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "connections";
  showOnlineStatus: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    loadAlerts: true,
    bidNotifications: true,
    paymentAlerts: true,
    complianceReminders: true,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "connections",
    showOnlineStatus: true,
    showLocation: true,
    allowMessages: true,
    twoFactorEnabled: false,
  });

  const [appearance, setAppearance] = useState({
    theme: "dark",
    language: "en",
    timezone: "America/Chicago",
    dateFormat: "MM/DD/YYYY",
    measurementUnit: "imperial",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">First Name</Label>
                  <Input defaultValue="John" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Last Name</Label>
                  <Input defaultValue="Smith" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input type="email" defaultValue="john.smith@example.com" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Phone</Label>
                  <Input type="tel" defaultValue="(555) 123-4567" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Company</Label>
                <Input defaultValue="ABC Transport LLC" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Current Password</Label>
                <div className="relative mt-1">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    className="bg-slate-700/50 border-slate-600 text-white pr-10" 
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">New Password</Label>
                  <Input type="password" placeholder="••••••••" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Confirm New Password</Label>
                  <Input type="password" placeholder="••••••••" className="mt-1 bg-slate-700/50 border-slate-600 text-white" />
                </div>
              </div>
              <Button variant="outline" className="border-slate-600">
                <Key className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", label: "Email Notifications", icon: <Mail className="w-4 h-4" /> },
                { key: "push", label: "Push Notifications", icon: <Bell className="w-4 h-4" /> },
                { key: "sms", label: "SMS Notifications", icon: <Smartphone className="w-4 h-4" /> },
              ].map((channel) => (
                <div key={channel.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">{channel.icon}</div>
                    <span className="text-white">{channel.label}</span>
                  </div>
                  <Switch 
                    checked={notifications[channel.key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => setNotifications({...notifications, [channel.key]: checked})}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Notification Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "loadAlerts", label: "Load Alerts", desc: "New loads matching your criteria" },
                { key: "bidNotifications", label: "Bid Notifications", desc: "Updates on your bids" },
                { key: "paymentAlerts", label: "Payment Alerts", desc: "Payment received/sent notifications" },
                { key: "complianceReminders", label: "Compliance Reminders", desc: "Document expiration and compliance alerts" },
                { key: "marketingEmails", label: "Marketing Emails", desc: "News, features, and promotional content" },
              ].map((type) => (
                <div key={type.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div>
                    <p className="text-white">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.desc}</p>
                  </div>
                  <Switch 
                    checked={notifications[type.key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => setNotifications({...notifications, [type.key]: checked})}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Security */}
        <TabsContent value="privacy" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Profile Visibility</Label>
                <Select 
                  value={privacy.profileVisibility} 
                  onValueChange={(v: any) => setPrivacy({...privacy, profileVisibility: v})}
                >
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                    <SelectItem value="connections">Connections Only</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {[
                { key: "showOnlineStatus", label: "Show Online Status" },
                { key: "showLocation", label: "Show Location" },
                { key: "allowMessages", label: "Allow Direct Messages" },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <span className="text-white">{setting.label}</span>
                  <Switch 
                    checked={privacy[setting.key as keyof PrivacySettings] as boolean}
                    onCheckedChange={(checked) => setPrivacy({...privacy, [setting.key]: checked})}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security</p>
                </div>
                <div className="flex items-center gap-3">
                  {privacy.twoFactorEnabled ? (
                    <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400">Disabled</Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-slate-600"
                    onClick={() => setPrivacy({...privacy, twoFactorEnabled: !privacy.twoFactorEnabled})}
                  >
                    {privacy.twoFactorEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-white font-medium mb-2">Active Sessions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chrome on Windows • Houston, TX</span>
                    <Badge className="bg-green-500/20 text-green-400">Current</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mobile App on iPhone • Dallas, TX</span>
                    <Button variant="ghost" size="sm" className="text-red-400 h-6">Revoke</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 font-medium">Danger Zone</p>
                  <p className="text-xs text-slate-500">Permanently delete your account</p>
                </div>
                <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-400" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Theme</Label>
                <Select value={appearance.theme} onValueChange={(v) => setAppearance({...appearance, theme: v})}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Language</Label>
                <Select value={appearance.language} onValueChange={(v) => setAppearance({...appearance, language: v})}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Timezone</Label>
                <Select value={appearance.timezone} onValueChange={(v) => setAppearance({...appearance, timezone: v})}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Measurement Units</Label>
                <Select value={appearance.measurementUnit} onValueChange={(v) => setAppearance({...appearance, measurementUnit: v})}>
                  <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (miles, gallons)</SelectItem>
                    <SelectItem value="metric">Metric (km, liters)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="mt-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white">Visa ending in 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/2027</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400">Default</Badge>
                  <Button variant="ghost" size="sm" className="text-slate-400">Edit</Button>
                </div>
              </div>

              <Button variant="outline" className="w-full border-dashed border-slate-600">
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Data Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">Download a copy of your data including loads, transactions, and documents.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="border-slate-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
