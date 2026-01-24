/**
 * SYSTEM CONFIGURATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Settings, Save, RefreshCw, Globe, Mail,
  Database, Shield, Bell
} from "lucide-react";
import { toast } from "sonner";

export default function SystemConfiguration() {
  const configQuery = trpc.admin.getSystemConfig.useQuery();

  const updateMutation = trpc.admin.updateSystemConfig.useMutation({
    onSuccess: () => { toast.success("Configuration updated"); configQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const config = configQuery.data;

  const ConfigSection = ({ icon: Icon, iconColor, title, children }: any) => (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );

  const ConfigRow = ({ label, description, settingKey, type = "switch" }: any) => (
    <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {type === "switch" ? (
        <Switch checked={config?.[settingKey]} onCheckedChange={(checked) => updateMutation.mutate({ key: settingKey, value: checked })} />
      ) : (
        <Input value={config?.[settingKey] || ""} onChange={(e) => updateMutation.mutate({ key: settingKey, value: e.target.value })} className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg" />
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            System Configuration
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure system-wide settings</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => configQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {configQuery.isLoading ? (
        <div className="space-y-6">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* General Settings */}
          <ConfigSection icon={Globe} iconColor="text-cyan-400" title="General Settings">
            <ConfigRow label="Maintenance Mode" description="Enable to show maintenance page to users" settingKey="maintenanceMode" />
            <ConfigRow label="User Registration" description="Allow new users to register" settingKey="allowRegistration" />
            <ConfigRow label="Site Name" description="Display name for the platform" settingKey="siteName" type="input" />
          </ConfigSection>

          {/* Email Settings */}
          <ConfigSection icon={Mail} iconColor="text-blue-400" title="Email Settings">
            <ConfigRow label="Email Notifications" description="Enable system email notifications" settingKey="emailNotifications" />
            <ConfigRow label="SMTP Host" description="SMTP server hostname" settingKey="smtpHost" type="input" />
            <ConfigRow label="From Email" description="Default sender email address" settingKey="fromEmail" type="input" />
          </ConfigSection>

          {/* Security Settings */}
          <ConfigSection icon={Shield} iconColor="text-purple-400" title="Security Settings">
            <ConfigRow label="Two-Factor Required" description="Require 2FA for all users" settingKey="require2FA" />
            <ConfigRow label="Session Timeout (minutes)" description="Auto-logout after inactivity" settingKey="sessionTimeout" type="input" />
            <ConfigRow label="Password Expiry (days)" description="Force password change after days" settingKey="passwordExpiry" type="input" />
          </ConfigSection>

          {/* Notification Settings */}
          <ConfigSection icon={Bell} iconColor="text-yellow-400" title="Notification Settings">
            <ConfigRow label="Push Notifications" description="Enable push notifications" settingKey="pushNotifications" />
            <ConfigRow label="SMS Notifications" description="Enable SMS notifications" settingKey="smsNotifications" />
            <ConfigRow label="Slack Integration" description="Enable Slack notifications" settingKey="slackIntegration" />
          </ConfigSection>

          {/* Database Settings */}
          <ConfigSection icon={Database} iconColor="text-green-400" title="Database Settings">
            <ConfigRow label="Auto Backup" description="Enable automatic database backups" settingKey="autoBackup" />
            <ConfigRow label="Backup Retention (days)" description="Days to keep backups" settingKey="backupRetention" type="input" />
            <ConfigRow label="Query Logging" description="Log all database queries" settingKey="queryLogging" />
          </ConfigSection>
        </div>
      )}
    </div>
  );
}
