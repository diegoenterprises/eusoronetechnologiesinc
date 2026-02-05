/**
 * TWO FACTOR AUTH PAGE
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
  Shield, Smartphone, Key, CheckCircle, XCircle,
  QrCode, Copy, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TwoFactorAuth() {
  const [verificationCode, setVerificationCode] = useState("");

  const statusQuery = (trpc as any).auth.get2FAStatus.useQuery();
  const setupQuery = (trpc as any).auth.setup2FA.useQuery(undefined, { enabled: false });

  const enableMutation = (trpc as any).auth.enable2FA.useMutation({
    onSuccess: () => { toast.success("2FA enabled"); statusQuery.refetch(); setVerificationCode(""); },
    onError: (error: any) => toast.error("Failed to enable 2FA", { description: error.message }),
  });

  const disableMutation = (trpc as any).auth.disable2FA.useMutation({
    onSuccess: () => { toast.success("2FA disabled"); statusQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to disable 2FA", { description: error.message }),
  });

  const regenerateMutation = (trpc as any).auth.regenerateBackupCodes.useMutation({
    onSuccess: () => { toast.success("Backup codes regenerated"); statusQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to regenerate", { description: error.message }),
  });

  const status = statusQuery.data;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Two-Factor Authentication
        </h1>
        <p className="text-slate-400 text-sm mt-1">Add an extra layer of security to your account</p>
      </div>

      {/* Status Card */}
      <Card className={cn("rounded-xl", status?.enabled ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30")}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-full", status?.enabled ? "bg-green-500/20" : "bg-yellow-500/20")}>
              <Shield className={cn("w-8 h-8", status?.enabled ? "text-green-400" : "text-yellow-400")} />
            </div>
            <div>
              {statusQuery.isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-xl font-bold">Two-Factor Authentication</p>
                    <Badge className={cn(status?.enabled ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400", "border-0")}>
                      {status?.enabled ? <><CheckCircle className="w-3 h-3 mr-1" />Enabled</> : <><XCircle className="w-3 h-3 mr-1" />Disabled</>}
                    </Badge>
                  </div>
                  <p className="text-slate-400">{status?.enabled ? "Your account is protected with 2FA" : "Enable 2FA to secure your account"}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup / Disable */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              {status?.enabled ? "Manage 2FA" : "Setup 2FA"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!status?.enabled ? (
              <>
                {/* QR Code */}
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  {setupQuery.isLoading ? (
                    <Skeleton className="h-48 w-48 mx-auto rounded-xl" />
                  ) : (setupQuery.data as any)?.qrCode ? (
                    <img src={(setupQuery.data as any).qrCode} alt="2FA QR Code" className="mx-auto rounded-xl" />
                  ) : (
                    <div className="h-48 w-48 mx-auto rounded-xl bg-slate-600/50 flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Secret Key */}
                {(setupQuery.data as any)?.secret && (
                  <div className="p-3 rounded-xl bg-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Manual Entry Key</p>
                    <div className="flex items-center gap-2">
                      <code className="text-cyan-400 font-mono text-sm flex-1">{(setupQuery.data as any).secret}</code>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => copyToClipboard((setupQuery.data as any).secret)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Verification */}
                <div className="space-y-2">
                  <p className="text-white font-medium">Enter verification code</p>
                  <Input value={verificationCode} onChange={(e: any) => setVerificationCode(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest bg-slate-700/30 border-slate-600/50 rounded-lg" />
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => enableMutation.mutate({ code: verificationCode })} disabled={verificationCode.length !== 6 || enableMutation.isPending}>
                  {enableMutation.isPending ? "Enabling..." : "Enable 2FA"}
                </Button>

                {!setupQuery.data && (
                  <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setupQuery.refetch()}>
                    <QrCode className="w-4 h-4 mr-2" />Generate QR Code
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-slate-400">Two-factor authentication is currently enabled on your account.</p>
                <Button variant="outline" className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => disableMutation.mutate({})} disabled={disableMutation.isPending}>
                  {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Backup Codes */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Backup Codes
              </CardTitle>
              {status?.enabled && (
                <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => regenerateMutation.mutate({})}>
                  <RefreshCw className="w-4 h-4 mr-1" />Regenerate
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!status?.enabled ? (
              <p className="text-slate-400">Enable 2FA to generate backup codes.</p>
            ) : statusQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-2">{[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : (
              <>
                <p className="text-slate-400 text-sm mb-4">Save these codes in a secure place. Each code can only be used once.</p>
                <div className="grid grid-cols-2 gap-2">
                  {status?.backupCodes?.map((code: string, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-700/30 font-mono text-center text-white">{code}</div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => copyToClipboard(status?.backupCodes?.join("\n") || "")}>
                  <Copy className="w-4 h-4 mr-2" />Copy All Codes
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
