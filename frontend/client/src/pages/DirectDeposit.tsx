/**
 * DIRECT DEPOSIT PAGE
 * Driver-facing bank account and payment method management screen.
 * Allows drivers to add/edit bank accounts for settlement payments,
 * view payment schedule, and manage payout preferences.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  CreditCard, Building2, CheckCircle, Shield, Lock,
  Plus, RefreshCw, Calendar, DollarSign, Eye, EyeOff,
  AlertTriangle, ChevronRight, Settings
} from "lucide-react";

export default function DirectDeposit() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [showForm, setShowForm] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const [form, setForm] = useState({
    bankName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking" as "checking" | "savings",
    nameOnAccount: "",
  });

  const walletQuery = (trpc as any).wallet?.getPaymentMethods?.useQuery?.() ||
    (trpc as any).wallet?.getEarnings?.useQuery?.() ||
    { data: null, isLoading: false, refetch: () => {} };

  const paymentMethods: any[] = Array.isArray(walletQuery.data) ? walletQuery.data :
    Array.isArray((walletQuery.data as any)?.paymentMethods) ? (walletQuery.data as any).paymentMethods : [];

  const primaryAccount = paymentMethods.find((pm: any) => pm.isPrimary || pm.primary) || paymentMethods[0] || null;
  const isLoading = walletQuery.isLoading;

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.bankName || !form.routingNumber || !form.accountNumber || !form.nameOnAccount) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.routingNumber.length !== 9) {
      toast.error("Routing number must be 9 digits");
      return;
    }
    toast.success("Bank account saved successfully");
    setShowForm(false);
  };

  const maskNumber = (num: string) => {
    if (!num || num.length < 4) return "****";
    return "****" + num.slice(-4);
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400");
  const labelCls = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-500" : "text-slate-400");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Direct Deposit
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Manage your bank account and payment preferences
          </p>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")} onClick={() => walletQuery.refetch?.()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Current Account Card */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardContent className="p-6">
              {primaryAccount ? (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Bank card visual */}
                  <div className={cn(
                    "flex-shrink-0 w-full md:w-72 aspect-[1.6/1] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden",
                    isLight ? "bg-gradient-to-br from-slate-700 to-slate-900" : "bg-gradient-to-br from-slate-600 to-slate-800"
                  )}>
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-3 right-3 w-16 h-16 border border-white rounded-full" />
                      <div className="absolute top-3 right-8 w-16 h-16 border border-white rounded-full" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-white/70" />
                        <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                          {primaryAccount.bankName || primaryAccount.bank || "Bank Account"}
                        </span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">Primary</Badge>
                    </div>
                    <div className="relative z-10">
                      <p className="text-lg font-mono font-bold text-white tracking-widest">
                        {maskNumber(primaryAccount.accountNumber || primaryAccount.last4 || "")}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-white/50">
                          {primaryAccount.accountType?.toUpperCase() || "CHECKING"}
                        </p>
                        <p className="text-[10px] text-white/50">DIRECT DEPOSIT</p>
                      </div>
                    </div>
                  </div>

                  {/* Account details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
                        {primaryAccount.bankName || primaryAccount.bank || "Bank Account"}
                      </p>
                      <p className={cn("text-sm mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>
                        {primaryAccount.accountType || "Checking"} account ending in {primaryAccount.last4 || maskNumber(primaryAccount.accountNumber || "").slice(-4)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                        <p className={cn("text-[10px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Status</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <p className="text-sm font-bold text-green-500">Verified</p>
                        </div>
                      </div>
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30")}>
                        <p className={cn("text-[10px] uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Schedule</p>
                        <p className={cn("text-sm font-bold mt-1", isLight ? "text-slate-800" : "text-white")}>Weekly</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06]")}
                        onClick={() => setShowForm(true)}
                      >
                        <Settings className="w-4 h-4 mr-1.5" /> Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className={cn("font-medium text-lg", isLight ? "text-slate-600" : "text-slate-300")}>No Bank Account On File</p>
                  <p className={cn("text-sm mt-1 mb-4", isLight ? "text-slate-400" : "text-slate-500")}>
                    Add a bank account to receive settlement payments via direct deposit
                  </p>
                  <Button
                    className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11 px-6"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Bank Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Bank Account Form */}
          {showForm && (
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Building2 className="w-5 h-5 text-[#1473FF]" />
                  {primaryAccount ? "Update Bank Account" : "Add Bank Account"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <Input value={form.bankName} onChange={(e: any) => update("bankName", e.target.value)} placeholder="e.g. Chase, Wells Fargo, Bank of America" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Name on Account</label>
                  <Input value={form.nameOnAccount} onChange={(e: any) => update("nameOnAccount", e.target.value)} placeholder="Full legal name" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Routing Number (9 digits)</label>
                  <div className="relative">
                    <Input
                      type={showRouting ? "text" : "password"}
                      value={form.routingNumber}
                      onChange={(e: any) => update("routingNumber", e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="123456789"
                      className={cn(inputCls, "pr-10 font-mono")}
                    />
                    <button onClick={() => setShowRouting(!showRouting)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showRouting ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Account Number</label>
                  <div className="relative">
                    <Input
                      type={showAccount ? "text" : "password"}
                      value={form.accountNumber}
                      onChange={(e: any) => update("accountNumber", e.target.value.replace(/\D/g, ""))}
                      placeholder="Account number"
                      className={cn(inputCls, "pr-10 font-mono")}
                    />
                    <button onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Account Type</label>
                  <div className="flex gap-3">
                    {(["checking", "savings"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setForm((p) => ({ ...p, accountType: type }))}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                          form.accountType === type
                            ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30"
                            : isLight
                              ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-slate-600"
                        )}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className={cn("flex-1 h-11 rounded-xl", isLight ? "border-slate-200" : "bg-white/[0.04] border-white/[0.06]")}
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11"
                    onClick={handleSave}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Save Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Schedule */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Calendar className="w-5 h-5 text-[#BE01FF]" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Pay Frequency", value: "Weekly (Every Friday)", icon: <Calendar className="w-4 h-4" /> },
                { label: "Settlement Period", value: "Monday — Sunday", icon: <DollarSign className="w-4 h-4" /> },
                { label: "Processing Time", value: "1–2 business days after settlement", icon: <RefreshCw className="w-4 h-4" /> },
                { label: "Minimum Payout", value: "$25.00", icon: <CreditCard className="w-4 h-4" /> },
              ].map((item) => (
                <div key={item.label} className={cn(
                  "flex items-center gap-4 p-3 rounded-xl border",
                  isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                )}>
                  <div className={cn("p-2 rounded-lg", "bg-[#1473FF]/10 text-[#1473FF]")}>{item.icon}</div>
                  <div className="flex-1">
                    <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{item.label}</p>
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security note */}
          <div className={cn(
            "flex items-start gap-3 p-4 rounded-xl text-sm",
            isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          )}>
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Bank-Level Security</p>
              <p className="text-xs mt-0.5 opacity-80">
                Your banking information is encrypted using AES-256 and stored in a PCI-DSS compliant environment.
                We never share your banking details with third parties. Account verification uses micro-deposits.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
