/**
 * ADMIN REGISTRATION PAGE
 * Secure admin account creation with verification code requirement
 * WS-E2E-012: Complete Admin Registration
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, User, Phone, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function RegisterAdmin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.admin.registerAdmin.useMutation({
    onSuccess: (data) => {
      setSuccess("Admin registration successful! Redirecting to login...");
      toast.success("Admin account created successfully");
      setTimeout(() => setLocation("/login"), 3000);
    },
    onError: (err) => {
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
    },
    onSettled: () => setLoading(false),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError("All required fields must be filled");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 12) {
      setError("Admin password must be at least 12 characters");
      setLoading(false);
      return;
    }

    if (!formData.verificationCode) {
      setError("Verification code is required. Get one from an existing admin.");
      setLoading(false);
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone || undefined,
      verificationCode: formData.verificationCode,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Admin Registration</CardTitle>
          <CardDescription className="text-slate-400">
            Create an admin account. Requires a verification code from an existing administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                aria-required="true"
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="admin@company.com"
                autoComplete="email"
                aria-required="true"
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2">
                <Phone className="w-4 h-4" /> Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="555-000-0000"
                autoComplete="tel"
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min 12 characters"
                  autoComplete="new-password"
                  aria-required="true"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                  minLength={12}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Confirm *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  aria-required="true"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  required
                  minLength={12}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-slate-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Verification Code *
              </Label>
              <Input
                id="verificationCode"
                type="text"
                value={formData.verificationCode}
                onChange={(e) => updateField("verificationCode", e.target.value.toUpperCase())}
                placeholder="8-character code from existing admin"
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 font-mono tracking-widest"
                required
                maxLength={20}
              />
              <p className="text-xs text-slate-500">
                Obtain this code from an existing administrator via the Admin Dashboard.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !!success}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5"
            >
              {loading ? "Creating Account..." : "Register Admin Account"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
                Sign in
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
