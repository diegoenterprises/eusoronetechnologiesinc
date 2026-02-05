/**
 * ACCOUNT DELETION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Trash2, AlertTriangle, Shield, Download, Clock,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AccountDeletion() {
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const accountQuery = (trpc as any).users.getAccountInfo.useQuery();

  const deleteMutation = (trpc as any).users.requestAccountDeletion.useMutation({
    onSuccess: () => { toast.success("Account deletion requested", { description: "You will receive a confirmation email" }); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const cancelMutation = (trpc as any).users.cancelAccountDeletion.useMutation({
    onSuccess: () => { toast.success("Deletion cancelled"); accountQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const account = accountQuery.data;
  const canDelete = confirmText === "DELETE" && acknowledged;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Delete Account
          </h1>
          <p className="text-slate-400 text-sm mt-1">Permanently delete your account and data</p>
        </div>
      </div>

      {/* Pending Deletion Notice */}
      {account?.pendingDeletion && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-red-500/20">
                <Clock className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-xl font-bold">Account Deletion Pending</p>
                <p className="text-slate-400">Your account is scheduled for deletion on {account?.deletionDate}</p>
              </div>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => cancelMutation.mutate({})}>
                <XCircle className="w-4 h-4 mr-2" />Cancel Deletion
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Card */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-white text-lg font-bold mb-2">Warning: This action is irreversible</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" />All your data will be permanently deleted</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" />Your username will become available to others</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" />Active subscriptions will be cancelled</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" />You will lose access to all services</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before You Go */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Before You Go
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">Consider these options before deleting your account:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-blue-400" />
                <p className="text-white font-medium">Export Your Data</p>
              </div>
              <p className="text-xs text-slate-500 mb-3">Download a copy of your data before deletion</p>
              <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <Download className="w-4 h-4 mr-2" />Export Data
              </Button>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <p className="text-white font-medium">Take a Break</p>
              </div>
              <p className="text-xs text-slate-500 mb-3">Temporarily deactivate instead of deleting</p>
              <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <Clock className="w-4 h-4 mr-2" />Deactivate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {!account?.pendingDeletion && (
        <Card className="bg-slate-800/50 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete My Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="acknowledge" checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(checked as boolean)} className="mt-1 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
              <label htmlFor="acknowledge" className="text-sm text-slate-400 cursor-pointer">
                I understand that deleting my account is permanent and cannot be undone. All my data, including profile, settings, and history will be permanently removed.
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Type DELETE to confirm</label>
              <Input value={confirmText} onChange={(e: any) => setConfirmText(e.target.value)} placeholder="DELETE" className={cn("bg-slate-800/50 border-slate-700/50 rounded-lg", confirmText === "DELETE" && "border-red-500/50")} />
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700 rounded-lg" onClick={() => deleteMutation.mutate({})} disabled={!canDelete}>
              <Trash2 className="w-4 h-4 mr-2" />Permanently Delete Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
