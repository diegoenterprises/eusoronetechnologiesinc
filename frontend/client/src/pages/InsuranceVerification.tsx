/**
 * INSURANCE VERIFICATION PAGE
 * ESANG AI-powered document scanning + FMCSA cross-verification
 * Upload Dec Pages / ACORD certs → AI extracts → Review → Save → Verify
 */

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Upload, FileText, CheckCircle, AlertTriangle, XCircle,
  Scan, Eye, Save, RotateCcw, Truck, DollarSign, Clock,
  ChevronDown, ChevronUp, Search, Sparkles, Building2,
  ShieldCheck, ShieldAlert, ShieldX, Loader2, Info, Trash2,
  BadgeCheck, FileWarning, Zap, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

type ScanState = "idle" | "uploading" | "scanning" | "review" | "saving" | "complete" | "error";

export default function InsuranceVerification() {
  const { theme } = useTheme();
  const L = theme === "light";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [extraction, setExtraction] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // FMCSA verify state
  const [dotNumber, setDotNumber] = useState("");
  const [fmcsaResult, setFmcsaResult] = useState<any>(null);
  const [fmcsaLoading, setFmcsaLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"scan" | "policies" | "compliance" | "alerts">("scan");

  // Queries
  const policiesQuery = (trpc as any).insurance.getPolicies.useQuery({ filter: "all" });
  const summaryQuery = (trpc as any).insurance.getSummary.useQuery();
  const alertsQuery = (trpc as any).insurance.getAlerts.useQuery({});
  const complianceQuery = (trpc as any).insurance.checkLoadCompliance.useQuery({});

  // Mutations
  const scanMutation = (trpc as any).insurance.scanDocument.useMutation({
    onSuccess: (data: any) => {
      if (data.success && data.extraction) {
        setExtraction(data.extraction);
        setScanState("review");
        toast.success("Document scanned", { description: `${data.extraction.documentType} — ${(data.extraction.confidence * 100).toFixed(0)}% confidence` });
      } else {
        setScanError(data.error || "Extraction failed");
        setScanState("error");
      }
    },
    onError: (err: any) => {
      setScanError(err.message || "Scan failed");
      setScanState("error");
    },
  });

  const confirmMutation = (trpc as any).insurance.confirmExtraction.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        setScanState("complete");
        toast.success(data.message);
        policiesQuery.refetch();
        summaryQuery.refetch();
        complianceQuery.refetch();
      }
    },
    onError: (err: any) => toast.error("Save failed", { description: err.message }),
  });

  const fmcsaMutation = (trpc as any).insurance.verifyWithFMCSA.useMutation({
    onSuccess: (data: any) => {
      setFmcsaResult(data.result);
      setFmcsaLoading(false);
      if (data.success) toast.success("FMCSA verification complete");
      else toast.error(data.error || "Verification failed");
    },
    onError: (err: any) => {
      setFmcsaLoading(false);
      toast.error("FMCSA error", { description: err.message });
    },
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", { description: "Upload PDF, PNG, or JPEG" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum 10MB" });
      return;
    }

    setSelectedFile(file.name);
    setScanState("scanning");
    setScanError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      scanMutation.mutate({
        fileBase64: base64,
        mimeType: file.type as any,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [scanMutation]);

  const handleConfirm = () => {
    if (!extraction) return;
    setScanState("saving");
    confirmMutation.mutate({ extraction });
  };

  const handleFMCSAVerify = () => {
    if (!dotNumber.trim()) return;
    setFmcsaLoading(true);
    setFmcsaResult(null);
    fmcsaMutation.mutate({ dotNumber: dotNumber.trim() });
  };

  const resetScan = () => {
    setScanState("idle");
    setExtraction(null);
    setScanError(null);
    setSelectedFile(null);
  };

  const summary = summaryQuery.data || {};
  const policies = policiesQuery.data || [];
  const alerts = alertsQuery.data || [];
  const compliance = complianceQuery.data || {};

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");
  const vl = L ? "text-slate-800" : "text-white";
  const mt = L ? "text-slate-500" : "text-slate-400";

  const tabs = [
    { id: "scan" as const, label: "Scan & Upload", icon: Scan },
    { id: "policies" as const, label: "Policies", icon: FileText, count: summary.active || 0 },
    { id: "compliance" as const, label: "Compliance", icon: ShieldCheck },
    { id: "alerts" as const, label: "Alerts", icon: AlertTriangle, count: alerts.filter((a: any) => a.status === "active").length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Insurance Verification</h1>
          <p className={cn("text-sm", mt)}>ESANG AI document scanning + FMCSA cross-verification</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Policies", value: summary.active || 0, icon: <Shield className="w-4 h-4" />, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
          { label: "Total Coverage", value: `$${((summary.totalCoverage || 0) / 1000000).toFixed(1)}M`, icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-600/5" },
          { label: "Expiring Soon", value: summary.expiringSoon || 0, icon: <Clock className="w-4 h-4" />, color: summary.expiringSoon > 0 ? "text-yellow-500" : "text-slate-400", bg: "from-yellow-500/10 to-yellow-600/5" },
          { label: "Compliance", value: (compliance.compliant ? "Pass" : compliance.totalPolicies > 0 ? "Fail" : "N/A"), icon: <ShieldCheck className="w-4 h-4" />, color: compliance.compliant ? "text-green-500" : "text-red-500", bg: compliance.compliant ? "from-green-500/10 to-green-600/5" : "from-red-500/10 to-red-600/5" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 bg-gradient-to-br border", L ? `${s.bg} border-slate-200/60` : `${s.bg} border-slate-700/30`)}>
            <div className="flex items-center justify-between mb-2"><span className={s.color}>{s.icon}</span></div>
            <p className={cn("text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
            activeTab === tab.id
              ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
              : L ? "bg-white border-slate-200 text-slate-500 hover:border-blue-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600"
          )}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn("text-[10px] font-bold", activeTab === tab.id ? "text-white/80" : "text-slate-400")}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ SCAN & UPLOAD TAB ═══════════════════ */}
      {activeTab === "scan" && (
        <div className="space-y-5">
          {/* Upload zone */}
          <Card className={cc}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={cn("font-bold text-sm", vl)}>AI Document Scanner</p>
                  <p className={cn("text-xs", mt)}>Upload a Declaration Page or ACORD certificate — ESANG AI will extract all policy data</p>
                </div>
              </div>

              {scanState === "idle" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn("border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:scale-[1.01]",
                    L ? "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30" : "border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5"
                  )}
                >
                  <Upload className={cn("w-10 h-10 mx-auto mb-3", L ? "text-slate-300" : "text-slate-600")} />
                  <p className={cn("font-bold text-sm mb-1", vl)}>Drop your insurance document here</p>
                  <p className={cn("text-xs", mt)}>PDF, PNG, or JPEG — Declaration Pages, ACORD 25/24 certificates</p>
                  <p className={cn("text-[10px] mt-2", mt)}>Maximum 10MB</p>
                </div>
              )}

              {scanState === "scanning" && (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className={cn("font-bold text-sm mb-1", vl)}>Scanning with ESANG AI...</p>
                  <p className={cn("text-xs", mt)}>Extracting policy data from {selectedFile}</p>
                </div>
              )}

              {scanState === "error" && (
                <div className="text-center py-10">
                  <XCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
                  <p className={cn("font-bold text-sm mb-1", vl)}>Scan Failed</p>
                  <p className="text-xs text-red-400 mb-4">{scanError}</p>
                  <Button variant="outline" size="sm" onClick={resetScan} className="rounded-xl"><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Try Again</Button>
                </div>
              )}

              {scanState === "complete" && (
                <div className="text-center py-10">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                  <p className={cn("font-bold text-sm mb-1", vl)}>Policy Saved Successfully</p>
                  <p className={cn("text-xs mb-4", mt)}>Your insurance data has been extracted and saved to your profile.</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={resetScan} className="rounded-xl"><Upload className="w-3.5 h-3.5 mr-1.5" />Scan Another</Button>
                    <Button size="sm" onClick={() => setActiveTab("policies")} className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"><Eye className="w-3.5 h-3.5 mr-1.5" />View Policies</Button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} className="hidden" />
            </CardContent>
          </Card>

          {/* Extraction Review */}
          {scanState === "review" && extraction && (
            <Card className={cn(cc, "ring-1 ring-blue-500/20")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/15"><Eye className="w-5 h-5 text-blue-500" /></div>
                    <div>
                      <p className={cn("font-bold text-sm", vl)}>Review Extraction</p>
                      <p className={cn("text-xs", mt)}>
                        {extraction.documentType} — {(extraction.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs font-bold",
                    extraction.confidence >= 0.85 ? "bg-green-500/15 text-green-500" :
                    extraction.confidence >= 0.7 ? "bg-yellow-500/15 text-yellow-500" :
                    "bg-red-500/15 text-red-500"
                  )}>
                    {extraction.confidence >= 0.85 ? "High" : extraction.confidence >= 0.7 ? "Medium" : "Low"} Confidence
                  </Badge>
                </div>

                {/* Warnings */}
                {extraction.extractionWarnings?.length > 0 && (
                  <div className={cn("rounded-xl p-3 mb-5 border", L ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/10 border-yellow-500/20")}>
                    <p className="text-xs font-bold text-yellow-500 mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Warnings</p>
                    {extraction.extractionWarnings.map((w: string, i: number) => (
                      <p key={i} className="text-[11px] text-yellow-600 dark:text-yellow-400">• {w}</p>
                    ))}
                  </div>
                )}

                {/* Policy Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className={cn("rounded-xl p-4 border", L ? "bg-slate-50 border-slate-100" : "bg-slate-800/30 border-slate-700/30")}>
                    <p className="text-[10px] uppercase font-bold text-blue-500 mb-2">Policy Details</p>
                    <div className="space-y-1.5">
                      {[
                        ["Policy #", extraction.policy.number],
                        ["Insurer", extraction.policy.insurerName],
                        ["Named Insured", extraction.policy.namedInsured],
                        ["Effective", extraction.policy.effectiveDate],
                        ["Expiration", extraction.policy.expirationDate],
                        ...(extraction.policy.insurerNAIC ? [["NAIC", extraction.policy.insurerNAIC]] : []),
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between text-xs">
                          <span className="text-slate-400">{label}</span>
                          <span className={cn("font-medium", vl)}>{(val as string) || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn("rounded-xl p-4 border", L ? "bg-slate-50 border-slate-100" : "bg-slate-800/30 border-slate-700/30")}>
                    <p className="text-[10px] uppercase font-bold text-purple-500 mb-2">Endorsements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: "mcs90", label: "MCS-90", critical: true },
                        { key: "hazmatCoverage", label: "Hazmat" },
                        { key: "pollutionLiability", label: "Pollution" },
                        { key: "additionalInsured", label: "Add'l Insured" },
                        { key: "waiverOfSubrogation", label: "Waiver Sub." },
                        { key: "primaryNonContributory", label: "Primary/NC" },
                      ].map(e => {
                        const active = extraction.endorsements[e.key];
                        return (
                          <Badge key={e.key} className={cn("text-[10px] border",
                            active
                              ? e.critical ? "bg-green-500/15 text-green-500 border-green-500/20" : "bg-blue-500/15 text-blue-500 border-blue-500/20"
                              : e.critical ? "bg-red-500/15 text-red-500 border-red-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          )}>
                            {active ? <CheckCircle className="w-2.5 h-2.5 mr-1" /> : <XCircle className="w-2.5 h-2.5 mr-1" />}
                            {e.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Coverages */}
                {extraction.coverages?.length > 0 && (
                  <div className={cn("rounded-xl p-4 border mb-5", L ? "bg-slate-50 border-slate-100" : "bg-slate-800/30 border-slate-700/30")}>
                    <p className="text-[10px] uppercase font-bold text-emerald-500 mb-2">Coverage Limits</p>
                    <div className="space-y-3">
                      {extraction.coverages.map((cov: any, i: number) => (
                        <div key={i}>
                          <p className={cn("font-bold text-xs mb-1.5", vl)}>{cov.type.replace(/_/g, " ")}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                            {Object.entries(cov.limits).filter(([, v]) => v != null).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-[11px]">
                                <span className="text-slate-400">{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</span>
                                <span className={cn("font-medium", vl)}>${Number(v).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={resetScan} className="rounded-xl">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Cancel
                  </Button>
                  <Button size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending}
                    className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-bold">
                    {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Confirm & Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FMCSA Verification */}
          <Card className={cc}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-orange-500/15"><Building2 className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <p className={cn("font-bold text-sm", vl)}>FMCSA Cross-Verification</p>
                  <p className={cn("text-xs", mt)}>Verify carrier authority and insurance filings with FMCSA SAFER</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter USDOT number"
                  value={dotNumber}
                  onChange={e => setDotNumber(e.target.value)}
                  className={cn("rounded-xl max-w-xs", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700")}
                />
                <Button size="sm" onClick={handleFMCSAVerify} disabled={fmcsaLoading || !dotNumber.trim()}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  {fmcsaLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1.5" />}
                  Verify
                </Button>
              </div>

              {fmcsaResult && (
                <div className={cn("rounded-xl p-4 border", fmcsaResult.compliant ? (L ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/20") : (L ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20"))}>
                  <div className="flex items-center gap-2 mb-3">
                    {fmcsaResult.compliant ? <ShieldCheck className="w-5 h-5 text-green-500" /> : <ShieldAlert className="w-5 h-5 text-red-500" />}
                    <p className={cn("font-bold text-sm", vl)}>{fmcsaResult.legalName}</p>
                    <Badge className={cn("text-[10px]", fmcsaResult.compliant ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500")}>
                      {fmcsaResult.compliant ? "Compliant" : "Issues Found"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      ["DOT#", fmcsaResult.dotNumber],
                      ["Safety", fmcsaResult.safetyRating],
                      ["Authorities", `${fmcsaResult.activeAuthorities}/${fmcsaResult.totalAuthorities}`],
                      ["Filings", fmcsaResult.insuranceFilings],
                    ].map(([l, v]) => (
                      <div key={l as string} className="text-xs">
                        <p className="text-slate-400">{l}</p>
                        <p className={cn("font-bold", vl)}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge className={cn("text-[10px]", fmcsaResult.hasLiabilityFiling ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500")}>
                      {fmcsaResult.hasLiabilityFiling ? "✓" : "✗"} BIPD Liability
                    </Badge>
                    <Badge className={cn("text-[10px]", fmcsaResult.hasCargoFiling ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500")}>
                      {fmcsaResult.hasCargoFiling ? "✓" : "✗"} Cargo
                    </Badge>
                    <Badge className={cn("text-[10px]", fmcsaResult.hmFlag === "Y" ? "bg-purple-500/15 text-purple-500" : "bg-slate-500/10 text-slate-400")}>
                      {fmcsaResult.hmFlag === "Y" ? "✓ Hazmat Auth" : "No Hazmat"}
                    </Badge>
                  </div>
                  {fmcsaResult.discrepancies?.length > 0 && (
                    <div className="mt-2">
                      {fmcsaResult.discrepancies.map((d: string, i: number) => (
                        <p key={i} className="text-[11px] text-red-500">• {d}</p>
                      ))}
                    </div>
                  )}
                  {fmcsaResult.warnings?.length > 0 && (
                    <div className="mt-1">
                      {fmcsaResult.warnings.map((w: string, i: number) => (
                        <p key={i} className="text-[11px] text-yellow-500">• {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════ POLICIES TAB ═══════════════════ */}
      {activeTab === "policies" && (
        <div className="space-y-3">
          {policiesQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className={cn("h-24 rounded-2xl animate-pulse", L ? "bg-slate-100" : "bg-slate-800")} />)}</div>
          ) : policies.length === 0 ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <FileText className={cn("w-10 h-10 mx-auto mb-3", L ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("font-bold mb-1", vl)}>No policies on file</p>
                <p className={cn("text-xs mb-4", mt)}>Upload an insurance document to get started</p>
                <Button size="sm" onClick={() => setActiveTab("scan")} className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white">
                  <Scan className="w-3.5 h-3.5 mr-1.5" />Scan Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            policies.map((p: any) => {
              const now = new Date();
              const exp = p.expirationDate ? new Date(p.expirationDate) : null;
              const daysLeft = exp ? Math.ceil((exp.getTime() - now.getTime()) / 86400000) : null;
              const isExpired = daysLeft !== null && daysLeft < 0;
              const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
              return (
                <Card key={p.id} className={cn(cc, isExpired && "ring-1 ring-red-500/30", isExpiring && "ring-1 ring-yellow-500/30")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2.5 rounded-xl",
                          isExpired ? "bg-red-500/15" : isExpiring ? "bg-yellow-500/15" : "bg-blue-500/15"
                        )}>
                          <Shield className={cn("w-5 h-5",
                            isExpired ? "text-red-500" : isExpiring ? "text-yellow-500" : "text-blue-500"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={cn("font-bold text-sm", vl)}>{(p.policyType || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                            <Badge className={cn("text-[9px]",
                              isExpired ? "bg-red-500/15 text-red-500" : isExpiring ? "bg-yellow-500/15 text-yellow-500" : "bg-green-500/15 text-green-500"
                            )}>
                              {isExpired ? "Expired" : isExpiring ? `${daysLeft}d left` : "Active"}
                            </Badge>
                            {p.verificationSource === "gemini_extraction" && (
                              <Badge className="bg-purple-500/15 text-purple-500 text-[9px]"><Sparkles className="w-2.5 h-2.5 mr-0.5" />AI Scanned</Badge>
                            )}
                          </div>
                          <p className={cn("text-xs", mt)}>{p.providerName || "Unknown"} — #{p.policyNumber}</p>
                          <div className="flex gap-4 mt-1.5">
                            {p.perOccurrenceLimit && <p className="text-[11px] text-slate-400">Limit: <span className={cn("font-medium", vl)}>${parseFloat(p.perOccurrenceLimit).toLocaleString()}</span></p>}
                            {p.combinedSingleLimit && <p className="text-[11px] text-slate-400">CSL: <span className={cn("font-medium", vl)}>${parseFloat(p.combinedSingleLimit).toLocaleString()}</span></p>}
                            {exp && <p className="text-[11px] text-slate-400">Exp: <span className={cn("font-medium", isExpired ? "text-red-500" : isExpiring ? "text-yellow-500" : vl)}>{exp.toISOString().split("T")[0]}</span></p>}
                          </div>
                          {(p.endorsements as string[] || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(p.endorsements as string[]).map((e: string) => (
                                <Badge key={e} className="bg-slate-500/10 text-slate-400 text-[9px] border border-slate-500/20">{e}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ═══════════════════ COMPLIANCE TAB ═══════════════════ */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          <Card className={cn(cc, compliance.compliant ? "ring-1 ring-green-500/20" : compliance.totalPolicies > 0 ? "ring-1 ring-red-500/20" : "")}>
            <CardContent className="p-6 text-center">
              {compliance.compliant ? (
                <>
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className={cn("text-xl font-bold mb-1", vl)}>Compliant</p>
                  <p className={cn("text-sm", mt)}>Your insurance coverage meets all federal requirements</p>
                </>
              ) : compliance.totalPolicies > 0 ? (
                <>
                  <ShieldX className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p className={cn("text-xl font-bold mb-1", vl)}>Non-Compliant</p>
                  <p className={cn("text-sm mb-4", mt)}>Issues found with your insurance coverage</p>
                  {compliance.deficiencies?.map((d: string, i: number) => (
                    <p key={i} className="text-sm text-red-500 mb-1">• {d}</p>
                  ))}
                </>
              ) : (
                <>
                  <Shield className={cn("w-16 h-16 mx-auto mb-4", L ? "text-slate-300" : "text-slate-600")} />
                  <p className={cn("text-xl font-bold mb-1", vl)}>No Policies</p>
                  <p className={cn("text-sm mb-4", mt)}>Upload insurance documents to check compliance</p>
                  <Button size="sm" onClick={() => setActiveTab("scan")} className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white">
                    <Scan className="w-3.5 h-3.5 mr-1.5" />Scan Document
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {compliance.totalPolicies > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Auto Liability", value: `$${(compliance.autoLiabilityLimit || 0).toLocaleString()}`, ok: (compliance.autoLiabilityLimit || 0) >= 750000 },
                { label: "Cargo", value: `$${(compliance.cargoLimit || 0).toLocaleString()}`, ok: (compliance.cargoLimit || 0) > 0 },
                { label: "MCS-90", value: compliance.hasMcs90 ? "On File" : "Missing", ok: compliance.hasMcs90 },
                { label: "Hazmat", value: compliance.hasHazmatCoverage ? "Covered" : "None", ok: compliance.hasHazmatCoverage },
                { label: "Pollution", value: compliance.hasPollutionLiability ? "Covered" : "None", ok: compliance.hasPollutionLiability },
                { label: "Total Policies", value: compliance.totalPolicies, ok: true },
              ].map(item => (
                <div key={item.label} className={cn("rounded-xl p-3 border", L ? "bg-slate-50 border-slate-100" : "bg-slate-800/30 border-slate-700/30")}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
                    {item.ok ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className={cn("font-bold text-sm", item.ok ? "text-green-500" : "text-red-500")}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ ALERTS TAB ═══════════════════ */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alertsQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className={cn("h-16 rounded-2xl animate-pulse", L ? "bg-slate-100" : "bg-slate-800")} />)}</div>
          ) : alerts.length === 0 ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <CheckCircle className={cn("w-10 h-10 mx-auto mb-3 text-green-500")} />
                <p className={cn("font-bold mb-1", vl)}>No active alerts</p>
                <p className={cn("text-xs", mt)}>All insurance coverage is in good standing</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((a: any) => (
              <Card key={a.id} className={cn(cc, a.severity === "critical" && "ring-1 ring-red-500/20", a.severity === "warning" && "ring-1 ring-yellow-500/20")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-xl",
                      a.severity === "critical" ? "bg-red-500/15" : a.severity === "warning" ? "bg-yellow-500/15" : "bg-blue-500/15"
                    )}>
                      {a.severity === "critical" ? <ShieldAlert className="w-5 h-5 text-red-500" /> :
                       a.severity === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> :
                       <Info className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={cn("font-bold text-sm", vl)}>{a.title}</p>
                        <Badge className={cn("text-[9px]",
                          a.severity === "critical" ? "bg-red-500/15 text-red-500" :
                          a.severity === "warning" ? "bg-yellow-500/15 text-yellow-500" :
                          "bg-blue-500/15 text-blue-500"
                        )}>{a.severity}</Badge>
                      </div>
                      <p className={cn("text-xs", mt)}>{a.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
