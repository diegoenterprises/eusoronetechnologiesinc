/**
 * PER-LOAD INSURANCE PAGE (C-100/S-053 + C-101/S-054)
 * Gold Standard Screen — Loadsure-style per-load insurance quoting & purchase.
 * Two-step flow: 1) Get instant quote based on load details,
 * 2) Purchase coverage with one click.
 * Covers cargo insurance, hazmat surcharges, and premium calculation.
 * Theme-aware | Brand gradient | Jony Ive aesthetic
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, CheckCircle, Clock, DollarSign, Truck, Package,
  AlertTriangle, FileText, ArrowRight, Lock, Zap, Star,
  ChevronDown, MapPin, ShieldCheck
} from "lucide-react";

type Step = "quote" | "review" | "purchased";

interface QuoteResult {
  premium: number;
  coverage: number;
  deductible: number;
  hazmatSurcharge: number;
  reeferSurcharge: number;
  highValueSurcharge: number;
  totalPremium: number;
  policyType: string;
  validUntil: string;
}

const COMMODITY_TYPES = [
  { value: "general", label: "General Freight", rate: 0.0012 },
  { value: "electronics", label: "Electronics", rate: 0.0018 },
  { value: "food_dry", label: "Dry Food / Beverage", rate: 0.0014 },
  { value: "food_reefer", label: "Temperature-Controlled Food", rate: 0.0020 },
  { value: "pharma", label: "Pharmaceuticals", rate: 0.0025 },
  { value: "hazmat_flammable", label: "Hazmat — Flammable Liquids (Class 3)", rate: 0.0035 },
  { value: "hazmat_corrosive", label: "Hazmat — Corrosives (Class 8)", rate: 0.0032 },
  { value: "hazmat_gas", label: "Hazmat — Gases (Class 2)", rate: 0.0038 },
  { value: "hazmat_explosive", label: "Hazmat — Explosives (Class 1)", rate: 0.0055 },
  { value: "hazmat_radioactive", label: "Hazmat — Radioactive (Class 7)", rate: 0.0060 },
  { value: "crude_oil", label: "Crude Oil / Petroleum", rate: 0.0022 },
  { value: "machinery", label: "Heavy Machinery", rate: 0.0016 },
  { value: "auto", label: "Automobiles", rate: 0.0020 },
] as const;

const COVERAGE_TIERS = [
  { value: 100000, label: "$100,000" },
  { value: 250000, label: "$250,000" },
  { value: 500000, label: "$500,000" },
  { value: 1000000, label: "$1,000,000" },
] as const;

export default function PerLoadInsurance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [step, setStep] = useState<Step>("quote");

  const [cargoValue, setCargoValue] = useState("");
  const [commodity, setCommodity] = useState("general");
  const [coverage, setCoverage] = useState(250000);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [miles, setMiles] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [policyNumber, setPolicyNumber] = useState("");
  const [showCommodityDropdown, setShowCommodityDropdown] = useState(false);

  const selectedCommodity = COMMODITY_TYPES.find((c) => c.value === commodity);

  const quoteMut = (trpc as any).insurance.getPerLoadQuote.useMutation({
    onSuccess: (data: any) => {
      setQuote(data);
      setStep("review");
    },
    onError: () => toast.error("Failed to generate quote"),
  });

  const purchaseMut = (trpc as any).insurance.purchasePerLoad.useMutation({
    onSuccess: (data: any) => {
      setPolicyNumber(data.policyNumber);
      setStep("purchased");
      toast.success("Insurance policy activated");
    },
    onError: () => toast.error("Failed to purchase policy"),
  });

  const calculateQuote = () => {
    const value = parseFloat(cargoValue);
    if (isNaN(value) || value <= 0) { toast.error("Enter a valid cargo value"); return; }
    if (!origin || !destination) { toast.error("Enter origin and destination"); return; }
    quoteMut.mutate({
      cargoValue: value,
      commodityType: commodity,
      coverageAmount: coverage,
      origin,
      destination,
    });
  };

  const purchasePolicy = () => {
    if (!quote) return;
    purchaseMut.mutate({
      cargoValue: parseFloat(cargoValue),
      coverageAmount: quote.coverage,
      deductible: quote.deductible,
      premium: quote.totalPremium,
      basePremium: quote.premium,
      hazmatSurcharge: quote.hazmatSurcharge,
      reeferSurcharge: quote.reeferSurcharge,
      highValueSurcharge: quote.highValueSurcharge,
      commodityType: commodity,
      policyType: quote.policyType,
      origin,
      destination,
    });
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const sub = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const inputCn = cn("rounded-xl h-11", isLight ? "border-slate-200" : "border-slate-700 bg-white/[0.02]");

  // ─── STEP 3: PURCHASED ───────────────────────────────────────────────────
  if (step === "purchased" && quote) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[700px] mx-auto">
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="py-14 text-center px-8">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center", isLight ? "bg-green-50" : "bg-green-500/10")}>
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>
            <h2 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>
              Policy Activated
            </h2>
            <p className={cn("mt-2 max-w-sm mx-auto", sub)}>
              Your cargo is now covered. Policy documents have been attached to the load.
            </p>
            <div className={cn("mt-8 p-5 rounded-xl text-left space-y-3", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
              <div className="flex justify-between">
                <span className={sub}>Policy Number</span>
                <span className={cn("font-mono text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
                  {policyNumber || "EUS-..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={sub}>Coverage</span>
                <span className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>
                  ${(quote.coverage || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={sub}>Premium Paid</span>
                <span className="font-semibold text-green-500">${quote.totalPremium || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className={sub}>Type</span>
                <span className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{quote.policyType || "All-Risk Cargo"}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-8 justify-center">
              <Button variant="outline" className={cn("rounded-xl gap-1.5", isLight ? "border-slate-200" : "border-slate-700")}>
                <FileText className="w-4 h-4" /> View Certificate
              </Button>
              <Button
                onClick={() => { setStep("quote"); setQuote(null); }}
                className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
              >
                New Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── STEP 2: REVIEW QUOTE ────────────────────────────────────────────────
  if (step === "review" && quote) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[700px] mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Your Quote
          </h1>
          <p className={sub}>Review coverage details and purchase instantly</p>
        </div>

        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
          <CardContent className="p-6">
            {/* Price Hero */}
            <div className="text-center py-6">
              <p className={cn("text-xs uppercase tracking-wider font-semibold mb-2", isLight ? "text-slate-400" : "text-slate-500")}>
                Total Premium
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={cn("text-5xl font-bold tabular-nums tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                  ${quote.totalPremium}
                </span>
              </div>
              <p className={cn("text-xs mt-2", isLight ? "text-slate-400" : "text-slate-500")}>
                One-time payment · Valid until {new Date(quote.validUntil).toLocaleDateString()}
              </p>
            </div>

            {/* Breakdown */}
            <div className={cn("rounded-xl p-4 space-y-2.5", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
              <div className="flex justify-between text-sm">
                <span className={sub}>Base Premium</span>
                <span className={cn("tabular-nums", isLight ? "text-slate-700" : "text-slate-300")}>${quote.premium}</span>
              </div>
              {quote.hazmatSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    <span className={sub}>Hazmat Surcharge</span>
                  </span>
                  <span className="text-orange-500 tabular-nums">+${quote.hazmatSurcharge}</span>
                </div>
              )}
              {quote.reeferSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={sub}>Reefer Surcharge</span>
                  <span className="text-blue-500 tabular-nums">+${quote.reeferSurcharge}</span>
                </div>
              )}
              {quote.highValueSurcharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={sub}>High-Value Surcharge</span>
                  <span className="text-purple-500 tabular-nums">+${quote.highValueSurcharge}</span>
                </div>
              )}
              <div className={cn("border-t pt-2.5 flex justify-between font-semibold", isLight ? "border-slate-200" : "border-slate-600")}>
                <span className={isLight ? "text-slate-700" : "text-slate-200"}>Coverage</span>
                <span className="text-green-500">${quote.coverage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={sub}>Deductible</span>
                <span className={cn("tabular-nums", isLight ? "text-slate-700" : "text-slate-300")}>${quote.deductible.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={sub}>Policy Type</span>
                <span className={cn("text-xs", isLight ? "text-slate-700" : "text-slate-300")}>{quote.policyType}</span>
              </div>
            </div>

            {/* Coverage Highlights */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { icon: Truck, label: "Transit Coverage" },
                { icon: Package, label: "Loading/Unloading" },
                { icon: Clock, label: "Warehouse Extension" },
                { icon: Shield, label: "General Average" },
              ].map((item) => (
                <div key={item.label} className={cn("flex items-center gap-2 p-2.5 rounded-lg text-xs", isLight ? "bg-green-50" : "bg-green-500/5")}>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className={isLight ? "text-slate-700" : "text-slate-300"}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Purchase Button */}
            <Button
              onClick={purchasePolicy}
              className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <Lock className="w-4 h-4 mr-2" /> Purchase Coverage — ${quote.totalPremium}
            </Button>
            <p className={cn("text-center text-xs mt-2", isLight ? "text-slate-400" : "text-slate-500")}>
              Charged to your EusoWallet. Cancel within 1 hour for full refund.
            </p>

            <button
              onClick={() => setStep("quote")}
              className={cn("mt-3 text-xs w-full text-center", isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-500 hover:text-slate-300")}
            >
              Back to quote form
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── STEP 1: QUOTE FORM ──────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Per-Load Insurance
          </h1>
          <p className={sub}>Instant cargo coverage — quote in seconds</p>
        </div>
        <Badge className="rounded-full px-3 py-1 text-xs font-medium border bg-[#1473FF]/15 text-[#1473FF] border-[#1473FF]/30">
          <Zap className="w-3 h-3 mr-1" /> Instant Quote
        </Badge>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap, label: "Instant Activation", desc: "Coverage starts immediately" },
          { icon: Shield, label: "All-Risk Coverage", desc: "Including hazmat & environmental" },
          { icon: Star, label: "No Annual Premium", desc: "Pay only per load" },
        ].map((p) => (
          <Card key={p.label} className={cc}>
            <CardContent className="p-4 text-center">
              <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                <p.icon className="w-5 h-5 text-[#1473FF]" />
              </div>
              <p className={cn("text-xs font-semibold", isLight ? "text-slate-700" : "text-slate-200")}>{p.label}</p>
              <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quote Form */}
      <Card className={cc}>
        <CardContent className="p-6 space-y-5">
          {/* Cargo Value */}
          <div>
            <label className={cn("text-xs font-semibold mb-1.5 block", isLight ? "text-slate-600" : "text-slate-300")}>
              Declared Cargo Value
            </label>
            <div className="relative">
              <DollarSign className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
              <Input
                type="number"
                placeholder="150,000"
                value={cargoValue}
                onChange={(e) => setCargoValue(e.target.value)}
                className={cn(inputCn, "pl-9")}
              />
            </div>
          </div>

          {/* Commodity Type */}
          <div>
            <label className={cn("text-xs font-semibold mb-1.5 block", isLight ? "text-slate-600" : "text-slate-300")}>
              Commodity Type
            </label>
            <div className="relative">
              <button
                onClick={() => setShowCommodityDropdown(!showCommodityDropdown)}
                className={cn(
                  "w-full h-11 px-3 rounded-xl border text-left flex items-center justify-between text-sm",
                  isLight ? "border-slate-200 bg-white text-slate-700" : "border-slate-700 bg-white/[0.02] text-slate-200"
                )}
              >
                <span>{selectedCommodity?.label || "Select commodity"}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showCommodityDropdown && (
                <div className={cn(
                  "absolute z-10 mt-1 w-full rounded-xl border shadow-xl max-h-60 overflow-y-auto",
                  isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"
                )}>
                  {COMMODITY_TYPES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setCommodity(c.value); setShowCommodityDropdown(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                        commodity === c.value
                          ? "bg-[#1473FF]/10 text-[#1473FF] font-medium"
                          : isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-white/[0.04] text-slate-200"
                      )}
                    >
                      {c.label}
                      {c.value.startsWith("hazmat_") && (
                        <AlertTriangle className="w-3 h-3 text-orange-500 inline ml-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coverage Tier */}
          <div>
            <label className={cn("text-xs font-semibold mb-1.5 block", isLight ? "text-slate-600" : "text-slate-300")}>
              Coverage Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COVERAGE_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setCoverage(tier.value)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-medium transition-all",
                    coverage === tier.value
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-blue-500/25"
                      : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]"
                  )}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cn("text-xs font-semibold mb-1.5 block", isLight ? "text-slate-600" : "text-slate-300")}>
                Origin
              </label>
              <div className="relative">
                <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
                <Input placeholder="Houston, TX" value={origin} onChange={(e) => setOrigin(e.target.value)} className={cn(inputCn, "pl-9")} />
              </div>
            </div>
            <div>
              <label className={cn("text-xs font-semibold mb-1.5 block", isLight ? "text-slate-600" : "text-slate-300")}>
                Destination
              </label>
              <div className="relative">
                <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
                <Input placeholder="Chicago, IL" value={destination} onChange={(e) => setDestination(e.target.value)} className={cn(inputCn, "pl-9")} />
              </div>
            </div>
          </div>

          {/* Get Quote Button */}
          <Button
            onClick={calculateQuote}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            Get Instant Quote <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
