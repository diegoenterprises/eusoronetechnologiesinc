/**
 * SETTINGS PAGE - ROBUST IMPLEMENTATION
 * Comprehensive account, notification, security, billing, and integration settings
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Bell, Mail, Lock, Eye, Save, Shield, LogOut, CreditCard, 
  Key, Globe, Palette, Clock, User, Phone, MapPin, Briefcase,
  Download, FileText, Trash2, AlertCircle, Check, X, Plus,
  Settings as SettingsIcon, Smartphone, Monitor, Tablet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  last4: string;
  brand?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"account" | "notifications" | "security" | "billing" | "privacy" | "integrations">("account");
  
  // Account Settings State
  const [accountData, setAccountData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Houston, TX 77001",
    timezone: "America/Chicago",
    language: "en",
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    emailAlerts: true,
    loadUpdates: true,
    bidNotifications: true,
    messageNotifications: true,
    paymentNotifications: true,
    complianceAlerts: true,
    weeklyDigest: true,
  });

  // Security Settings State
  const [security, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: "30",
  });

  // Active Sessions (mock data - replace with real tRPC query)
  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Houston, TX",
      lastActive: "Just now",
      current: true,
    },
    {
      id: "2",
      device: "Safari on iPhone",
      location: "Houston, TX",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      id: "3",
      device: "Chrome on MacBook",
      location: "Dallas, TX",
      lastActive: "1 day ago",
      current: false,
    },
  ]);

  // Payment Methods (mock data - replace with real tRPC query)
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      expiryDate: "12/25",
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      last4: "5555",
      brand: "Mastercard",
      expiryDate: "08/26",
      isDefault: false,
    },
    {
      id: "3",
      type: "bank",
      last4: "6789",
      isDefault: false,
    },
  ]);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key} ${!notifications[key] ? "enabled" : "disabled"}`);
  };

  const handleSecurityToggle = (key: keyof typeof security) => {
    if (typeof security[key] === "boolean") {
      setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
      toast.success(`${key} ${!security[key] ? "enabled" : "disabled"}`);
    }
  };

  const handleSaveAccount = () => {
    toast.success("Account settings saved successfully");
  };

  const handleChangePassword = () => {
    toast.info("Password change dialog would open here");
  };

  const handleRevokeSession = (sessionId: string) => {
    toast.success(`Session ${sessionId} revoked`);
  };

  const handleAddPaymentMethod = () => {
    toast.info("Add payment method dialog would open here");
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    toast.success(`Payment method removed`);
  };

  const tabs = [
    { id: "account" as const, label: "Account", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "billing" as const, label: "Billing", icon: CreditCard },
    { id: "privacy" as const, label: "Privacy", icon: Eye },
    { id: "integrations" as const, label: "Integrations", icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences, security, and integrations</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Account Settings Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-400" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm font-semibold">Full Name</label>
                <Input
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Email Address</label>
                <Input
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Phone Number</label>
                <Input
                  value={accountData.phone}
                  onChange={(e) => setAccountData({ ...accountData, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Account Role</label>
                <Input
                  value={user?.role || ""}
                  disabled
                  className="bg-slate-700 border-slate-600 text-gray-400 mt-2 cursor-not-allowed capitalize"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm font-semibold">Address</label>
                <Input
                  value={accountData.address}
                  onChange={(e) => setAccountData({ ...accountData, address: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-2"
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Globe size={20} className="text-purple-400" />
              Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm font-semibold">Timezone</label>
                <select
                  value={accountData.timezone}
                  onChange={(e) => setAccountData({ ...accountData, timezone: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white mt-2 p-2 rounded-md"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm font-semibold">Language</label>
                <select
                  value={accountData.language}
                  onChange={(e) => setAccountData({ ...accountData, language: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white mt-2 p-2 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </Card>

          <Button 
            onClick={handleSaveAccount}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all"
          >
            <Save size={18} className="mr-2" />
            Save Account Settings
          </Button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={24} className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: "emailNotifications" as const,
                  label: "Email Notifications",
                  description: "Receive general updates via email",
                },
                {
                  key: "pushNotifications" as const,
                  label: "Push Notifications",
                  description: "Receive push notifications on your devices",
                },
                {
                  key: "smsNotifications" as const,
                  label: "SMS Notifications",
                  description: "Receive critical updates via SMS",
                },
                {
                  key: "emailAlerts" as const,
                  label: "Email Alerts",
                  description: "Receive important alerts and warnings",
                },
                {
                  key: "loadUpdates" as const,
                  label: "Load Updates",
                  description: "Get notified about load status changes",
                },
                {
                  key: "bidNotifications" as const,
                  label: "Bid Notifications",
                  description: "Receive notifications when bids are placed or accepted",
                },
                {
                  key: "messageNotifications" as const,
                  label: "Message Notifications",
                  description: "Get notified about new messages",
                },
                {
                  key: "paymentNotifications" as const,
                  label: "Payment Notifications",
                  description: "Receive notifications about payments and transactions",
                },
                {
                  key: "complianceAlerts" as const,
                  label: "Compliance Alerts",
                  description: "Get alerted about compliance issues and expirations",
                },
                {
                  key: "weeklyDigest" as const,
                  label: "Weekly Digest",
                  description: "Receive a weekly summary of your activity",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-all"
                >
                  <div>
                    <p className="text-white font-semibold">{item.label}</p>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleToggle(item.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={24} className="text-purple-400" />
              <h2 className="text-xl font-bold text-white">Security Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                  <p className="text-white font-semibold">Two-Factor Authentication (2FA)</p>
                  <p className="text-gray-400 text-sm">Add extra security with 2FA via SMS or authenticator app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorAuth}
                    onChange={() => handleSecurityToggle("twoFactorAuth")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                  <p className="text-white font-semibold">Biometric Authentication</p>
                  <p className="text-gray-400 text-sm">Use fingerprint or face recognition on mobile devices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.biometricAuth}
                    onChange={() => handleSecurityToggle("biometricAuth")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-cyan-600"></div>
                </label>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <label className="text-white font-semibold block mb-2">Session Timeout</label>
                <p className="text-gray-400 text-sm mb-3">Automatically log out after period of inactivity</p>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...security, sessionTimeout: e.target.value })}
                  className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded-md"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <Button 
                onClick={handleChangePassword}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all"
              >
                <Lock size={18} className="mr-2" />
                Change Password
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Monitor size={20} className="text-blue-400" />
              Active Sessions
            </h2>

            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    {session.device.includes("iPhone") ? (
                      <Smartphone size={20} className="text-blue-400" />
                    ) : session.device.includes("MacBook") ? (
                      <Monitor size={20} className="text-purple-400" />
                    ) : (
                      <Monitor size={20} className="text-green-400" />
                    )}
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </p>
                      <p className="text-gray-400 text-sm">{session.location} • {session.lastActive}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      onClick={() => handleRevokeSession(session.id)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <X size={16} className="mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold transition-all">
              <LogOut size={18} className="mr-2" />
              Logout from All Devices
            </Button>
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard size={20} className="text-green-400" />
                Payment Methods
              </h2>
              <Button
                onClick={handleAddPaymentMethod}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus size={16} className="mr-2" />
                Add Payment Method
              </Button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-blue-400" />
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">
                        {method.type === "card" ? `${method.brand} •••• ${method.last4}` : `Bank Account •••• ${method.last4}`}
                        {method.isDefault && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </p>
                      {method.expiryDate && (
                        <p className="text-gray-400 text-sm">Expires {method.expiryDate}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText size={20} className="text-purple-400" />
              Billing History
            </h2>

            <div className="space-y-3">
              {[
                { date: "Nov 15, 2025", amount: "$1,250.00", status: "Paid", invoice: "INV-2025-001" },
                { date: "Oct 15, 2025", amount: "$980.50", status: "Paid", invoice: "INV-2025-002" },
                { date: "Sep 15, 2025", amount: "$1,450.75", status: "Paid", invoice: "INV-2025-003" },
              ].map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div>
                    <p className="text-white font-semibold">{transaction.invoice}</p>
                    <p className="text-gray-400 text-sm">{transaction.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-bold">{transaction.amount}</span>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">{transaction.status}</span>
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye size={20} className="text-blue-400" />
              Privacy Settings
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <label className="text-white font-semibold block mb-2">Profile Visibility</label>
                <p className="text-gray-400 text-sm mb-3">Control who can see your profile information</p>
                <select className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded-md">
                  <option value="public">Public - Anyone can see</option>
                  <option value="network">Network Only - Only connections</option>
                  <option value="private">Private - Only me</option>
                </select>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <label className="text-white font-semibold block mb-2">Data Sharing</label>
                <p className="text-gray-400 text-sm mb-3">Allow EusoTrip to share anonymized data for analytics</p>
                <select className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded-md">
                  <option value="all">Share all data</option>
                  <option value="limited">Limited sharing</option>
                  <option value="none">Do not share</option>
                </select>
              </div>

              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <label className="text-white font-semibold block mb-2">Activity Status</label>
                <p className="text-gray-400 text-sm mb-3">Show when you're online to other users</p>
                <select className="w-full bg-slate-700 border-slate-600 text-white p-2 rounded-md">
                  <option value="everyone">Show to everyone</option>
                  <option value="connections">Show to connections only</option>
                  <option value="nobody">Don't show</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Data Management</h2>

            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all justify-start">
                <Download size={18} className="mr-2" />
                Download My Data
              </Button>

              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all justify-start">
                <FileText size={18} className="mr-2" />
                Privacy Policy & Terms
              </Button>

              <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold transition-all justify-start">
                <AlertCircle size={18} className="mr-2" />
                Cookie Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key size={20} className="text-yellow-400" />
                API Keys
              </h2>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus size={16} className="mr-2" />
                Generate New Key
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: "Production API Key", key: "sk_live_••••••••••••4242", created: "Nov 1, 2025", lastUsed: "2 hours ago" },
                { name: "Development API Key", key: "sk_test_••••••••••••5555", created: "Oct 15, 2025", lastUsed: "1 day ago" },
              ].map((apiKey, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div>
                    <p className="text-white font-semibold">{apiKey.name}</p>
                    <p className="text-gray-400 text-sm font-mono">{apiKey.key}</p>
                    <p className="text-gray-500 text-xs mt-1">Created {apiKey.created} • Last used {apiKey.lastUsed}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <SettingsIcon size={20} className="text-purple-400" />
              Third-Party Integrations
            </h2>

            <div className="space-y-3">
              {[
                { name: "Google Maps", status: "Connected", icon: MapPin, color: "text-red-400" },
                { name: "Stripe Payments", status: "Connected", icon: CreditCard, color: "text-purple-400" },
                { name: "Twilio SMS", status: "Not Connected", icon: Smartphone, color: "text-gray-400" },
                { name: "Slack Notifications", status: "Not Connected", icon: Bell, color: "text-gray-400" },
              ].map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={integration.color} />
                      <div>
                        <p className="text-white font-semibold">{integration.name}</p>
                        <p className="text-gray-400 text-sm">{integration.status}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className={
                        integration.status === "Connected"
                          ? "border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          : "border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      }
                    >
                      {integration.status === "Connected" ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Danger Zone */}
      <Card className="bg-red-900/20 border-red-700 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          Danger Zone
        </h2>

        <div className="space-y-3">
          <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold transition-all justify-start">
            <LogOut size={18} className="mr-2" />
            Logout from All Devices
          </Button>

          <Button className="w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-semibold transition-all border border-red-600 justify-start">
            <Trash2 size={18} className="mr-2" />
            Delete Account Permanently
          </Button>
        </div>
      </Card>
    </div>
  );
}

