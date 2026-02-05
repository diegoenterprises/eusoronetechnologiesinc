/**
 * SMS NOTIFICATIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Send, CheckCircle, Clock, DollarSign,
  Settings, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SMSNotifications() {
  const [testNumber, setTestNumber] = useState("");

  const settingsQuery = (trpc as any).sms.getSettings.useQuery();
  const usageQuery = (trpc as any).sms.getUsage.useQuery();
  const templatesQuery = (trpc as any).sms.getTemplates.useQuery();
  const logsQuery = (trpc as any).sms.getLogs.useQuery({ limit: 10 });

  const testMutation = (trpc as any).sms.sendTest.useMutation({
    onSuccess: () => { toast.success("Test SMS sent"); setTestNumber(""); },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });

  const toggleMutation = (trpc as any).sms.toggleTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated"); templatesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const usage = usageQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          SMS Notifications
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure SMS alerts and notifications</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{usage?.sentThisMonth || 0}</p>
                )}
                <p className="text-xs text-slate-400">Sent This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{usage?.deliveryRate}%</p>
                )}
                <p className="text-xs text-slate-400">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{usage?.remaining || 0}</p>
                )}
                <p className="text-xs text-slate-400">Credits Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {usageQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${usage?.costThisMonth?.toFixed(2)}</p>
                )}
                <p className="text-xs text-slate-400">Cost This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test SMS */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Send Test SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={testNumber} onChange={(e: any) => setTestNumber(e.target.value)} placeholder="+1 (555) 123-4567" className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => testMutation.mutate({ phoneNumber: testNumber })} disabled={!testNumber || testMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Templates */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {templatesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(templatesQuery.data as any)?.map((template: any) => (
                  <div key={template.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-xs text-slate-500">{template.description}</p>
                    </div>
                    <Switch checked={template.enabled} onCheckedChange={() => toggleMutation.mutate({ templateId: template.id, enabled: !template.enabled })} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (logsQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent messages</p>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
                {(logsQuery.data as any)?.map((log: any) => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{log.recipient}</span>
                      <Badge className={cn(log.status === "delivered" ? "bg-green-500/20 text-green-400" : log.status === "sent" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400", "border-0 text-xs")}>{log.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{log.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{log.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
