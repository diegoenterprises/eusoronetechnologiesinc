/**
 * STRIPE CONNECT PAYMENT SETUP — Registration Step
 * Collects business type and explains payment setup for post-registration onboarding.
 * Used in ALL role registration wizards — every user who transacts on EusoTrip.
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Landmark, ShieldCheck, Zap, ArrowRight, Building2, User,
  CreditCard, DollarSign, Lock, CheckCircle
} from "lucide-react";

type BusinessType = "individual" | "company" | "";

interface StripeConnectStepProps {
  businessType: BusinessType;
  onBusinessTypeChange: (type: "individual" | "company") => void;
  role: string;
}

const ROLE_CONTEXT: Record<string, { headline: string; benefits: string[] }> = {
  CATALYST: {
    headline: "Receive payouts directly to your business bank account",
    benefits: [
      "Get paid within 1-2 business days after load delivery",
      "Instant payout option available (for a small fee)",
      "Issue driver settlements from your EusoWallet",
      "Full payment history and tax document generation",
    ],
  },
  SHIPPER: {
    headline: "Securely pay carriers and manage freight invoices",
    benefits: [
      "Pay carrier invoices directly from the platform",
      "Escrow protection — funds held until delivery confirmed",
      "Automated accessorial and detention billing",
      "Full AP/AR reconciliation and reporting",
    ],
  },
  BROKER: {
    headline: "Manage carrier payments and shipper collections",
    benefits: [
      "Collect from shippers and pay carriers seamlessly",
      "Escrow-protected transactions for every load",
      "Automated margin tracking and commission splits",
      "Instant payout option for carrier quick pay",
    ],
  },
  DRIVER: {
    headline: "Get paid fast — direct deposit to your bank",
    benefits: [
      "Receive settlements directly to your bank account",
      "Instant payout option for same-day access",
      "Track all earnings, deductions, and per-diem",
      "Tax-ready 1099 / W-2 document access",
    ],
  },
  ESCORT: {
    headline: "Receive escort job payments directly",
    benefits: [
      "Get paid per escort assignment to your bank",
      "Instant payout available after job completion",
      "Track escort earnings and mileage reimbursements",
      "Year-end tax document generation",
    ],
  },
  DISPATCH: {
    headline: "Receive dispatch commissions and fees directly",
    benefits: [
      "Earn dispatch fees paid directly to your bank",
      "Track commissions per load and per driver",
      "Instant payout option for same-day access",
      "Tax-ready earnings reports and 1099 generation",
    ],
  },
  TERMINAL_MANAGER: {
    headline: "Collect terminal fees and loading charges seamlessly",
    benefits: [
      "Receive loading/unloading fees directly to your facility account",
      "Automated detention billing and demurrage collection",
      "Track rack pricing revenue and throughput payments",
      "Full reconciliation and tax document generation",
    ],
  },
  COMPLIANCE_OFFICER: {
    headline: "Receive consulting fees and compliance service payments",
    benefits: [
      "Get paid for compliance audits and consulting services",
      "Track per-engagement earnings and reimbursements",
      "Direct deposit to your personal or business bank",
      "Year-end tax documentation and reporting",
    ],
  },
  SAFETY_MANAGER: {
    headline: "Receive safety consulting and training payments",
    benefits: [
      "Collect fees for safety audits, training, and assessments",
      "Track earnings per engagement and per company",
      "Instant payout available after service completion",
      "Tax-ready 1099 / W-2 document generation",
    ],
  },
  FACTORING: {
    headline: "Manage factoring disbursements and collections",
    benefits: [
      "Disburse factored payments directly to carriers",
      "Collect shipper invoices through the platform",
      "Automated fee deduction and reconciliation",
      "Full transaction history and compliance reporting",
    ],
  },
};

export default function StripeConnectStep({ businessType, onBusinessTypeChange, role }: StripeConnectStepProps) {
  const ctx = ROLE_CONTEXT[role] || ROLE_CONTEXT.CATALYST;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#1473FF]/10 via-purple-500/10 to-[#BE01FF]/10 border border-blue-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Payment Setup</h3>
            <p className="text-slate-300 text-sm">{ctx.headline}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-bold">
                <Lock className="w-3 h-3 mr-1" />Stripe Secured
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 mr-1" />Bank-Level Encryption
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-2.5">
        {ctx.benefits.map((b, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/20 border border-slate-700/30">
            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300">{b}</p>
          </div>
        ))}
      </div>

      {/* Business Type Selection */}
      <div className="space-y-3">
        <Label className="text-slate-300 text-sm font-semibold">How will you receive payments? <span className="text-red-400">*</span></Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onBusinessTypeChange("company")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              businessType === "company"
                ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                businessType === "company" ? "bg-blue-500/20" : "bg-slate-600/50"
              }`}>
                <Building2 className={`w-5 h-5 ${businessType === "company" ? "text-blue-400" : "text-slate-400"}`} />
              </div>
              <div>
                <p className={`font-bold text-sm ${businessType === "company" ? "text-blue-400" : "text-white"}`}>Business Account</p>
                <p className="text-[11px] text-slate-400">LLC, Corp, Partnership</p>
              </div>
              {businessType === "company" && <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payouts go to your company bank account. Requires EIN and business verification.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onBusinessTypeChange("individual")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              businessType === "individual"
                ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30"
                : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                businessType === "individual" ? "bg-purple-500/20" : "bg-slate-600/50"
              }`}>
                <User className={`w-5 h-5 ${businessType === "individual" ? "text-purple-400" : "text-slate-400"}`} />
              </div>
              <div>
                <p className={`font-bold text-sm ${businessType === "individual" ? "text-purple-400" : "text-white"}`}>Individual / Sole Prop</p>
                <p className="text-[11px] text-slate-400">Owner-Operator, 1099</p>
              </div>
              {businessType === "individual" && <CheckCircle className="w-5 h-5 text-purple-500 ml-auto" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Payouts go to your personal bank account. Requires SSN and identity verification.
            </p>
          </button>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="p-4 rounded-xl bg-slate-700/20 border border-slate-700/30">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What Happens Next</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/40">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">1</div>
            <span className="text-xs text-slate-300">Complete registration</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/40">
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">2</div>
            <span className="text-xs text-slate-300">Log in to your account</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/40">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">3</div>
            <span className="text-xs text-slate-300">Verify &amp; connect bank via Stripe</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-3 italic">
          After logging in, you'll be guided through Stripe's secure onboarding to verify your identity and connect your bank account. This typically takes 2-3 minutes.
        </p>
      </div>
    </div>
  );
}
