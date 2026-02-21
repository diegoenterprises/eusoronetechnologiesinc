/**
 * NOTIFICATION SETTINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bell, Mail, Smartphone, MessageSquare, AlertTriangle,
  Truck, DollarSign, FileText
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const settingsQuery = (trpc as any).notifications.getSettings.useQuery();

  const updateMutation = (trpc as any).notifications.updateSetting.useMutation({
    onSuccess: () => { toast.success("Setting updated"); settingsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const settings = settingsQuery.data;

  const NotificationRow = ({ icon: Icon, iconColor, title, description, settingKey, emailKey, pushKey, smsKey }: any) => (
    <div className="p-4 rounded-xl bg-slate-700/30">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 pl-8">
        {emailKey && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <Switch checked={(settings as any)?.[emailKey]} onCheckedChange={(checked) => updateMutation.mutate({ setting: emailKey, value: checked })} />
          </div>
        )}
        {pushKey && (
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <Switch checked={(settings as any)?.[pushKey]} onCheckedChange={(checked) => updateMutation.mutate({ setting: pushKey, value: checked })} />
          </div>
        )}
        {smsKey && (
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <Switch checked={(settings as any)?.[smsKey]} onCheckedChange={(checked) => updateMutation.mutate({ setting: smsKey, value: checked })} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Notification Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage how you receive notifications</p>
      </div>

      {/* Channel Legend */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <span className="text-slate-400 text-sm">Channels:</span>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /><span className="text-sm text-slate-300">Email</span></div>
            <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-400" /><span className="text-sm text-slate-300">Push</span></div>
            <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-400" /><span className="text-sm text-slate-300">SMS</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Load Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Load Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsQuery.isLoading ? (
            [1, 2, 3].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : (
            <>
              <NotificationRow icon={Truck} iconColor="text-blue-400" title="New Load Matches" description="When new loads match your criteria" emailKey="loadMatchEmail" pushKey="loadMatchPush" />
              <NotificationRow icon={MessageSquare} iconColor="text-green-400" title="Bid Updates" description="When your bids are accepted or rejected" emailKey="bidUpdateEmail" pushKey="bidUpdatePush" smsKey="bidUpdateSms" />
              <NotificationRow icon={AlertTriangle} iconColor="text-yellow-400" title="Load Status Changes" description="When load status changes" emailKey="loadStatusEmail" pushKey="loadStatusPush" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Financial Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
            Financial Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsQuery.isLoading ? (
            [1, 2].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : (
            <>
              <NotificationRow icon={DollarSign} iconColor="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" title="Payment Received" description="When payments are processed" emailKey="paymentEmail" pushKey="paymentPush" />
              <NotificationRow icon={FileText} iconColor="text-purple-400" title="Invoice Generated" description="When new invoices are created" emailKey="invoiceEmail" pushKey="invoicePush" />
            </>
          )}
        </CardContent>
      </Card>

      {/* System Notifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            System Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsQuery.isLoading ? (
            [1, 2].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : (
            <>
              <NotificationRow icon={AlertTriangle} iconColor="text-red-400" title="Security Alerts" description="Important security notifications" emailKey="securityEmail" pushKey="securityPush" smsKey="securitySms" />
              <NotificationRow icon={Bell} iconColor="text-cyan-400" title="Product Updates" description="New features and improvements" emailKey="productEmail" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
