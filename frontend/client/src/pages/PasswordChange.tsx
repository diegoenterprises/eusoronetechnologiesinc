/**
 * PASSWORD CHANGE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Lock, Eye, EyeOff, CheckCircle, XCircle,
  AlertTriangle, Shield, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const securityQuery = trpc.user.getPasswordSecurity.useQuery();

  const changeMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      securityQuery.refetch();
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const security = securityQuery.data;

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains number", met: /[0-9]/.test(newPassword) },
    { label: "Contains special character", met: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Change Password
          </h1>
          <p className="text-slate-400 text-sm mt-1">Update your account password</p>
        </div>
      </div>

      {/* Security Info */}
      {securityQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Last Changed</p>
                  <p className="text-sm text-slate-400">{security?.lastChanged || "Never"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Password Strength</p>
                  <p className="text-sm text-slate-400">{security?.strength || "Unknown"}</p>
                </div>
              </div>
              {security?.expiresIn && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Expires In</p>
                    <p className="text-sm text-slate-400">{security?.expiresIn}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Current Password</label>
              <div className="relative">
                <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="pr-10 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">New Password</label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="pr-10 bg-slate-800/50 border-slate-700/50 rounded-lg" />
                <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Password strength</span>
                    <span className={cn(passwordStrength < 40 ? "text-red-400" : passwordStrength < 70 ? "text-yellow-400" : "text-green-400")}>{passwordStrength < 40 ? "Weak" : passwordStrength < 70 ? "Medium" : "Strong"}</span>
                  </div>
                  <Progress value={passwordStrength} className={cn("h-2", passwordStrength < 40 && "[&>div]:bg-red-500", passwordStrength >= 40 && passwordStrength < 70 && "[&>div]:bg-yellow-500")} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Confirm New Password</label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={cn("pr-10 bg-slate-800/50 border-slate-700/50 rounded-lg", confirmPassword && (passwordsMatch ? "border-green-500/50" : "border-red-500/50"))} />
                <Button type="button" size="sm" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {confirmPassword && (
                <p className={cn("text-xs flex items-center gap-1", passwordsMatch ? "text-green-400" : "text-red-400")}>
                  {passwordsMatch ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            <Button className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => changeMutation.mutate({ currentPassword, newPassword })} disabled={!currentPassword || !newPassword || !passwordsMatch || passwordStrength < 40}>
              <Lock className="w-4 h-4 mr-2" />Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Password Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirements.map((req, idx) => (
              <div key={idx} className={cn("flex items-center gap-3 p-3 rounded-lg", req.met ? "bg-green-500/10" : "bg-slate-700/30")}>
                {req.met ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-slate-500" />}
                <span className={cn("text-sm", req.met ? "text-green-400" : "text-slate-400")}>{req.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
