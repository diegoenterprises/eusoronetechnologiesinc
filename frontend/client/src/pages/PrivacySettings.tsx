/**
 * PRIVACY SETTINGS PAGE
 * User-facing privacy and data management screen.
 * Controls for location sharing, data retention, communication
 * preferences, and CCPA/GDPR data rights.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Shield, Lock, Eye, EyeOff, MapPin, Bell,
  Database, Download, Trash2, CheckCircle, ChevronRight,
  FileText, Settings, Radio
} from "lucide-react";

type ToggleSetting = { id: string; label: string; description: string; icon: React.ReactNode; enabled: boolean };

export default function PrivacySettings() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [settings, setSettings] = useState<ToggleSetting[]>([
    { id: "location_sharing", label: "Location Sharing", description: "Share your real-time location with dispatch and shippers during active loads", icon: <MapPin className="w-4 h-4" />, enabled: true },
    { id: "location_history", label: "Location History", description: "Store your route history for performance analytics and compliance", icon: <MapPin className="w-4 h-4" />, enabled: true },
    { id: "push_notifications", label: "Push Notifications", description: "Receive push notifications for load assignments, messages, and alerts", icon: <Bell className="w-4 h-4" />, enabled: true },
    { id: "email_notifications", label: "Email Notifications", description: "Receive email updates for settlements, compliance, and announcements", icon: <Bell className="w-4 h-4" />, enabled: true },
    { id: "sms_notifications", label: "SMS Notifications", description: "Receive text messages for urgent alerts and load updates", icon: <Radio className="w-4 h-4" />, enabled: false },
    { id: "profile_visibility", label: "Profile Visibility", description: "Allow other users (shippers, dispatchers) to view your driver profile", icon: <Eye className="w-4 h-4" />, enabled: true },
    { id: "performance_sharing", label: "Performance Data Sharing", description: "Share your safety score and on-time metrics with potential shippers", icon: <Database className="w-4 h-4" />, enabled: true },
    { id: "analytics_tracking", label: "Analytics & Improvement", description: "Help improve EusoTrip by sharing anonymous usage data", icon: <Settings className="w-4 h-4" />, enabled: true },
  ]);

  const toggle = (id: string) => {
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSave = () => {
    toast.success("Privacy settings saved");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Privacy Settings
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Control your data, notifications, and visibility preferences
        </p>
      </div>

      {/* Privacy Toggles */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Shield className="w-5 h-5 text-[#1473FF]" />
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-colors",
                isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", setting.enabled ? "bg-[#1473FF]/10 text-[#1473FF]" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-700/30 text-slate-500")}>
                  {setting.icon}
                </div>
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{setting.label}</p>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{setting.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(setting.id)}
                className={cn(
                  "w-12 h-7 rounded-full flex-shrink-0 ml-4 transition-colors relative",
                  setting.enabled ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : isLight ? "bg-slate-200" : "bg-slate-600"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
                  setting.enabled ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Database className="w-5 h-5 text-[#BE01FF]" />
            Your Data Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: <Download className="w-4 h-4" />, label: "Download My Data", description: "Export all your personal data in a portable format (JSON/CSV)", action: "Download", color: "text-blue-400", bg: "bg-blue-500/15" },
            { icon: <Eye className="w-4 h-4" />, label: "View Data Usage", description: "See how your data is used across EusoTrip services", action: "View", color: "text-green-400", bg: "bg-green-500/15" },
            { icon: <FileText className="w-4 h-4" />, label: "Privacy Policy", description: "Read our full privacy policy and data handling practices", action: "Read", color: "text-purple-400", bg: "bg-purple-500/15" },
            { icon: <Trash2 className="w-4 h-4" />, label: "Delete My Account", description: "Permanently delete your account and all associated data", action: "Request", color: "text-red-400", bg: "bg-red-500/15" },
          ].map((item) => (
            <div key={item.label} className={cn(
              "flex items-center justify-between p-4 rounded-xl border",
              isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", item.bg, item.color)}>{item.icon}</div>
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.label}</p>
                  <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{item.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-xl text-xs", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")}
                onClick={() => toast.info(`${item.action} requested — processing...`)}
              >
                {item.action} <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Compliance note */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
      )}>
        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">CCPA & GDPR Compliance</p>
          <p className="text-xs mt-0.5 opacity-80">
            EusoTrip complies with the California Consumer Privacy Act (CCPA) and the General Data
            Protection Regulation (GDPR). You have the right to access, correct, delete, and port your data.
            Data requests are processed within 30 days.
          </p>
        </div>
      </div>

      {/* Save */}
      <Button
        className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
        onClick={handleSave}
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Save Privacy Settings
      </Button>
    </div>
  );
}
