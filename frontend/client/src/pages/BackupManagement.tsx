/**
 * BACKUP MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Database, Download, RefreshCw, CheckCircle, Clock,
  HardDrive, Calendar, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BackupManagement() {
  const backupsQuery = trpc.admin.getBackups.useQuery({ limit: 20 });
  const settingsQuery = trpc.admin.getBackupSettings.useQuery();

  const createMutation = trpc.admin.createBackup.useMutation({
    onSuccess: () => { toast.success("Backup started"); backupsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const deleteMutation = trpc.admin.deleteBackup.useMutation({
    onSuccess: () => { toast.success("Backup deleted"); backupsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updateSettingsMutation = trpc.admin.updateBackupSettings.useMutation({
    onSuccess: () => { toast.success("Settings updated"); settingsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const settings = settingsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0">Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Backup Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage database backups</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => createMutation.mutate({})}>
          <Database className="w-4 h-4 mr-2" />Create Backup
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {settingsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{settings?.totalBackups || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <HardDrive className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {settingsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">{settings?.totalSize}</p>
                )}
                <p className="text-xs text-slate-400">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {settingsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{settings?.lastBackup}</p>
                )}
                <p className="text-xs text-slate-400">Last Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {settingsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{settings?.nextScheduled}</p>
                )}
                <p className="text-xs text-slate-400">Next Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Settings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Backup Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsQuery.isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : (
            <>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Automatic Backups</p>
                  <p className="text-xs text-slate-500">Enable scheduled automatic backups</p>
                </div>
                <Switch checked={settings?.autoBackup} onCheckedChange={(checked) => updateSettingsMutation.mutate({ autoBackup: checked })} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Backup Compression</p>
                  <p className="text-xs text-slate-500">Compress backups to save storage</p>
                </div>
                <Switch checked={settings?.compression} onCheckedChange={(checked) => updateSettingsMutation.mutate({ compression: checked })} />
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-xs text-slate-500">Notify on backup completion/failure</p>
                </div>
                <Switch checked={settings?.emailNotifications} onCheckedChange={(checked) => updateSettingsMutation.mutate({ emailNotifications: checked })} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Recent Backups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {backupsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : backupsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Database className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No backups yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {backupsQuery.data?.map((backup: any) => (
                <div key={backup.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", backup.status === "completed" ? "bg-green-500/20" : backup.status === "in_progress" ? "bg-blue-500/20" : "bg-red-500/20")}>
                      <Database className={cn("w-5 h-5", backup.status === "completed" ? "text-green-400" : backup.status === "in_progress" ? "text-blue-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{backup.name}</p>
                        {getStatusBadge(backup.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{backup.createdAt}</span>
                        <span>{backup.size}</span>
                        <span className="capitalize">{backup.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.status === "completed" && (
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ backupId: backup.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
