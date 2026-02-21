/**
 * TWO FACTOR SETUP PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Smartphone, Key, CheckCircle, AlertTriangle,
  Copy, RefreshCw, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TwoFactorSetup() {
  const [verificationCode, setVerificationCode] = useState("");

  const statusQuery = (trpc as any).users.get2FAStatus.useQuery();
  const setupQuery = (trpc as any).users.setup2FA.useQuery(undefined, { enabled: !(statusQuery.data as any)?.enabled });

  const enableMutation = (trpc as any).users.enable2FA.useMutation({
    onSuccess: () => { toast.success("2FA enabled successfully"); statusQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const disableMutation = (trpc as any).users.disable2FA.useMutation({
    onSuccess: () => { toast.success("2FA disabled"); statusQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const regenerateBackupMutation = (trpc as any).users.regenerateBackupCodes.useMutation({
    onSuccess: () => { toast.success("Backup codes regenerated"); statusQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const status = statusQuery.data;
  const setup = setupQuery.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Two-Factor Authentication
          </h1>
          <p className="text-slate-400 text-sm mt-1">Secure your account with 2FA</p>
        </div>
      </div>

      {/* Status Card */}
      {statusQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <Card className={cn("rounded-xl", status?.enabled ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-full", status?.enabled ? "bg-green-500/20" : "bg-yellow-500/20")}>
                <Shield className={cn("w-8 h-8", status?.enabled ? "text-green-400" : "text-yellow-400")} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-xl font-bold">Two-Factor Authentication</p>
                  {status?.enabled ? (
                    <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Enabled</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Not Enabled</Badge>
                  )}
                </div>
                <p className="text-slate-400">{status?.enabled ? "Your account is protected with two-factor authentication" : "Enable 2FA to add an extra layer of security"}</p>
              </div>
              {status?.enabled && (
                <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => disableMutation.mutate({})}>
                  <Trash2 className="w-4 h-4 mr-2" />Disable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Section (if not enabled) */}
      {!status?.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Step 1: Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {setupQuery.isLoading ? (
                <Skeleton className="h-48 w-48 mx-auto rounded-xl" />
              ) : (
                <>
                  <div className="bg-slate-800 p-4 rounded-xl w-fit mx-auto">
                    <img src={setup?.qrCode} alt="2FA QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-sm text-slate-400 text-center">Scan this QR code with your authenticator app</p>
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Manual entry code:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-slate-300 font-mono flex-1">{setup?.secret}</code>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => copyToClipboard(setup?.secret || "")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Verification */}
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Step 2: Verify Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">Enter the 6-digit code from your authenticator app to verify setup</p>
              <Input value={verificationCode} onChange={(e: any) => setVerificationCode(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest bg-white/[0.02] border-white/[0.06] rounded-lg" />
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => enableMutation.mutate({ code: verificationCode })} disabled={verificationCode.length !== 6}>
                <Shield className="w-4 h-4 mr-2" />Enable 2FA
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backup Codes (if enabled) */}
      {status?.enabled && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Backup Codes
              </CardTitle>
              <Button variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg" onClick={() => regenerateBackupMutation.mutate({})}>
                <RefreshCw className="w-4 h-4 mr-2" />Regenerate
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">Save these backup codes in a secure place. Each code can only be used once.</p>
            {statusQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {status?.backupCodes?.map((code: string, idx: number) => (
                  <div key={idx} className={cn("p-2 rounded-lg text-center font-mono text-sm", status?.usedBackupCodes?.includes(code) ? "bg-slate-700/30 text-slate-500 line-through" : "bg-white/[0.04] text-slate-300")}>
                    {code}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">{status?.remainingBackupCodes || 0} codes remaining</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
