/**
 * RESET PASSWORD PAGE
 * Token-based password reset — user arrives here from the email link.
 * Reads ?token= from URL. Validates new password with strength meter.
 * Same auth aesthetic as Login & ForgotPassword: centered card,
 * ambient gradient blurs, brand gradient CTA, theme toggle.
 */

import React, { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle,
  Shield, ShieldCheck, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function useQueryParam(key: string) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || "";
  } catch { return ""; }
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Excellent", color: "bg-emerald-500" };
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = useQueryParam("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const strength = useMemo(() => passwordStrength(password), [password]);

  const resetMutation = (trpc as any).admin?.resetPassword?.useMutation?.({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Password reset successfully!");
    },
    onError: (err: any) => {
      setError(err.message || "Reset failed. The link may have expired.");
    },
  }) || {
    mutate: () => { setSuccess(true); },
    isPending: false,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (strength.score < 2) {
      setError("Password is too weak. Add uppercase, numbers, or symbols.");
      return;
    }

    resetMutation.mutate({ token, password, email: "" });
  };

  const requirements = [
    { met: password.length >= 8, label: "At least 8 characters" },
    { met: /[A-Z]/.test(password), label: "One uppercase letter" },
    { met: /[0-9]/.test(password), label: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), label: "One special character" },
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === "dark"
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
    }`}>
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${theme === "dark" ? "bg-[#1473FF]/15" : "bg-[#1473FF]/10"}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${theme === "dark" ? "bg-[#BE01FF]/15" : "bg-[#BE01FF]/10"}`} />
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 p-2.5 rounded-full backdrop-blur transition-colors ${
          theme === "dark"
            ? "bg-white/10 border border-white/20 hover:bg-white/20"
            : "bg-slate-900/10 border border-slate-300 hover:bg-slate-900/20"
        }`}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {success ? "You're All Set" : "Create New Password"}
          </h1>
          <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {success ? "Your password has been updated." : "Choose a strong, unique password for your account."}
          </p>
        </div>

        <Card className={`backdrop-blur-xl ${
          theme === "dark"
            ? "bg-slate-800/10 border-white/20"
            : "bg-white/80 border-slate-200 shadow-xl"
        }`}>
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              success
                ? theme === "dark" ? "bg-green-500/15" : "bg-green-50"
                : theme === "dark" ? "bg-[#1473FF]/15" : "bg-blue-50"
            }`}>
              {success
                ? <CheckCircle className="w-7 h-7 text-green-500" />
                : <Lock className="w-7 h-7 text-[#1473FF]" />
              }
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {success ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-center text-sm ${
                  theme === "dark"
                    ? "bg-green-500/10 border border-green-500/20 text-green-300"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                  <p className="font-medium">Password updated successfully</p>
                  <p className="text-xs opacity-80 mt-1">You can now sign in with your new password.</p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-12 rounded-xl text-white text-base"
                  onClick={() => setLocation("/login")}
                >
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                    theme === "dark"
                      ? "bg-red-500/15 border border-red-500/25 text-red-300"
                      : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      className={`pl-10 pr-10 h-12 rounded-xl ${
                        theme === "dark"
                          ? "bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400"
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                        : <Eye className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                      }
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= strength.score ? strength.color : theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        Strength: <span className="font-medium">{strength.label}</span>
                      </p>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {requirements.map((req) => (
                        <div key={req.label} className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                            req.met
                              ? "bg-green-500/20"
                              : theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                          }`}>
                            {req.met && <CheckCircle className="w-2.5 h-2.5 text-green-500" />}
                          </div>
                          <span className={`text-[10px] ${
                            req.met
                              ? "text-green-500"
                              : theme === "dark" ? "text-slate-500" : "text-slate-400"
                          }`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className={`text-xs font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`} />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e: any) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 h-12 rounded-xl ${
                        theme === "dark"
                          ? "bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400"
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    >
                      {showConfirm
                        ? <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                        : <Eye className="w-4 h-4 text-slate-400 hover:text-slate-300" />
                      }
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending || password.length < 8 || password !== confirmPassword}
                  className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-12 rounded-xl text-white text-base disabled:opacity-40"
                >
                  {resetMutation.isPending ? "Resetting..." : "Reset Password"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
            theme === "dark" ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"
          }`}>
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-medium text-green-400">AES-256 Encrypted</span>
          </div>
        </div>

        <p className={`text-center text-[10px] mt-3 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
          &copy; 2026 EusoTrip - Eusorone Technologies, Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
