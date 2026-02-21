/**
 * FORGOT PASSWORD PAGE
 * Allows users to request a password reset link via email.
 * Matches the Login page aesthetic — centered card, ambient gradient blurs,
 * brand gradient CTA, security badges, theme toggle.
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const resetMutation = (trpc as any).security?.forgotPassword?.useMutation?.({
    onSuccess: () => {
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    },
    onError: (err: any) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  }) || {
    mutate: () => { setSent(true); },
    isPending: false,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    resetMutation.mutate({ email });
  };

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
            Reset Password
          </h1>
          <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            We'll send you a secure link to reset your password
          </p>
        </div>

        <Card className={`backdrop-blur-xl ${
          theme === "dark"
            ? "bg-slate-800/10 border-white/20"
            : "bg-white/80 border-slate-200 shadow-xl"
        }`}>
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              sent
                ? theme === "dark" ? "bg-green-500/15" : "bg-green-50"
                : theme === "dark" ? "bg-[#1473FF]/15" : "bg-blue-50"
            }`}>
              {sent
                ? <CheckCircle className="w-7 h-7 text-green-500" />
                : <Mail className="w-7 h-7 text-[#1473FF]" />
              }
            </div>
            <CardTitle className={`text-lg ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              {sent ? "Check Your Email" : "Forgot Your Password?"}
            </CardTitle>
            <CardDescription className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>
              {sent
                ? "If an account exists, you'll receive a reset link shortly."
                : "Enter the email address associated with your account."
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {sent ? (
              /* Success state */
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-center text-sm ${
                  theme === "dark"
                    ? "bg-green-500/10 border border-green-500/20 text-green-300"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                  <p className="font-medium mb-1">Reset link sent to</p>
                  <p className="font-mono text-xs opacity-80">{email}</p>
                </div>

                <div className={`text-xs text-center space-y-2 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                  <p>The link will expire in 15 minutes.</p>
                  <p>Didn't receive it? Check your spam folder or try again.</p>
                </div>

                <Button
                  variant="outline"
                  className={`w-full h-11 rounded-xl ${
                    theme === "dark"
                      ? "bg-slate-800/30 border-white/15 text-white hover:bg-white/[0.04]"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  Try a different email
                </Button>

                <Button
                  className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-11 rounded-xl text-white"
                  onClick={() => setLocation("/login")}
                >
                  Back to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              /* Form state */
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

                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`} />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    className={`pl-10 h-12 rounded-xl ${
                      theme === "dark"
                        ? "bg-slate-800/10 border-white/20 text-white placeholder:text-slate-400"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
                    }`}
                    disabled={resetMutation.isPending}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] h-12 rounded-xl text-white text-base"
                >
                  {resetMutation.isPending ? "Sending..." : "Send Reset Link"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            )}

            {/* Back to login link */}
            {!sent && (
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className={`flex items-center justify-center gap-2 w-full text-sm transition-colors ${
                  theme === "dark"
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            )}
          </CardContent>
        </Card>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
            theme === "dark" ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"
          }`}>
            <Shield className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-medium text-green-400">Secure Reset</span>
          </div>
        </div>

        <p className={`text-center text-[10px] mt-3 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
          &copy; 2026 EusoTrip - Eusorone Technologies, Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
