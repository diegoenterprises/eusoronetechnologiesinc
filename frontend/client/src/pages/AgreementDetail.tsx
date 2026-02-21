/**
 * AGREEMENT DETAIL VIEW — View a single agreement with full details
 * Fetches by ID, decrypts content, shows parties, terms, signatures
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, FileText, CheckCircle, Clock, Shield, Download,
  Building2, Calendar, DollarSign, Truck, MapPin, PenTool,
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

function fmt(t: string) {
  return t?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return String(d); }
}

function fmtCurrency(v?: string | number | null) {
  if (!v) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? String(v) : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AgreementDetail() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/agreements/:id");
  const id = params?.id ? parseInt(params.id) : null;

  const query = (trpc as any).agreements?.getById?.useQuery?.(
    { id: id! },
    { enabled: !!id }
  ) || { data: null, isLoading: false };

  const ag = query.data;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-green-500/15 text-green-500 border-green-500/30";
      case "pending_signature": case "pending_review": return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
      case "draft": return "bg-blue-500/15 text-blue-500 border-blue-500/30";
      case "expired": case "terminated": return "bg-red-500/15 text-red-400 border-red-500/30";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  if (!id) return <div className="p-8 text-center text-slate-400">Invalid agreement ID</div>;

  if (query.isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-[960px] mx-auto space-y-4">
        <div className={cn("h-8 w-48 rounded-xl animate-pulse", isLight ? "bg-slate-200" : "bg-slate-700")} />
        <div className={cn("h-64 rounded-2xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />
      </div>
    );
  }

  if (!ag) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className={cn("font-bold text-lg mb-1", vl)}>Agreement not found</p>
        <p className={mt}>This agreement may have been deleted or you don't have access.</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setLocation("/agreements")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Agreements
        </Button>
      </div>
    );
  }

  const partyAName = ag.partyA?.name || "Party A";
  const partyBName = ag.partyB?.name || ag.partyBCompany?.name || "Party B";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")} onClick={() => setLocation("/agreements")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              #{ag.agreementNumber || `AG-${ag.id}`}
            </h1>
            <Badge className={cn("border text-xs font-bold", statusColor(ag.status))}>
              {fmt(ag.status || "draft")}
            </Badge>
            <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-xs">
              {fmt(ag.agreementType || "agreement")}
            </Badge>
          </div>
          <p className={cn("text-xs mt-0.5", mt)}>
            Created {ag.createdAt ? fmtDate(ag.createdAt) : "—"} · {fmt(ag.contractDuration || "")}
          </p>
        </div>
        <Button variant="outline" className={cn("rounded-xl font-bold", isLight ? "border-slate-200" : "border-slate-700")}
          onClick={() => downloadAgreementPdf({
            agreementNumber: ag.agreementNumber || `AG-${ag.id}`,
            agreementType: ag.agreementType || "catalyst_shipper",
            contractDuration: ag.contractDuration,
            status: ag.status,
            generatedContent: ag.generatedContent || "No content available.",
            partyAName, partyARole: ag.partyARole || "SHIPPER",
            partyBName, partyBRole: ag.partyBRole || "CATALYST",
            baseRate: ag.baseRate, rateType: ag.rateType,
            paymentTermDays: ag.paymentTermDays,
            effectiveDate: ag.effectiveDate, expirationDate: ag.expirationDate,
            equipmentTypes: ag.equipmentTypes, hazmatRequired: ag.hazmatRequired,
            minInsuranceAmount: ag.minInsuranceAmount, liabilityLimit: ag.liabilityLimit,
            cargoInsuranceRequired: ag.cargoInsuranceRequired,
            signatures: ag.signatures,
          })}>
          <Download className="w-4 h-4 mr-2" />Download PDF
        </Button>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={cl}>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-500 uppercase">Party A ({fmt(ag.partyARole || "Shipper")})</span>
          </div>
          <p className={cn("font-bold", vl)}>{partyAName}</p>
          {ag.partyACompany?.name && <p className="text-xs text-slate-400">{ag.partyACompany.name}</p>}
        </div>
        <div className={cl}>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-500 uppercase">Party B ({fmt(ag.partyBRole || "Catalyst")})</span>
          </div>
          <p className={cn("font-bold", vl)}>{partyBName}</p>
          {ag.partyBCompany?.name && <p className="text-xs text-slate-400">{ag.partyBCompany.name}</p>}
        </div>
      </div>

      {/* Key Terms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Base Rate", value: fmtCurrency(ag.baseRate), icon: <DollarSign className="w-3.5 h-3.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" /> },
          { label: "Rate Type", value: fmt(ag.rateType || "—"), icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
          { label: "Payment Terms", value: `Net ${ag.paymentTermDays || 30} days`, icon: <Clock className="w-3.5 h-3.5 text-yellow-500" /> },
          { label: "Duration", value: fmt(ag.contractDuration || "—"), icon: <Calendar className="w-3.5 h-3.5 text-purple-500" /> },
        ].map(item => (
          <div key={item.label} className={cl}>
            <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-[10px] uppercase text-slate-400 font-bold">{item.label}</span></div>
            <p className={cn("font-bold", vl)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Effective", value: fmtDate(ag.effectiveDate) },
          { label: "Expiration", value: fmtDate(ag.expirationDate) },
          { label: "Auto Liability", value: fmtCurrency(ag.minInsuranceAmount) },
          { label: "Cargo Insurance", value: fmtCurrency(ag.cargoInsuranceRequired) },
        ].map(item => (
          <div key={item.label} className={cl}>
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">{item.label}</span>
            <p className={cn("font-bold text-sm", vl)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Agreement Content */}
      <Card className={cc}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <EsangIcon className="w-5 h-5 text-blue-500" />
            <h3 className={cn("font-bold text-lg", vl)}>Agreement Terms</h3>
          </div>
          <div className={cn("prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed", isLight ? "text-slate-700" : "text-slate-300")}>
            {ag.generatedContent || "No agreement content available."}
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      {ag.signatures && ag.signatures.length > 0 && (
        <Card className={cc}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className={cn("font-bold text-lg", vl)}>Signatures</h3>
            </div>
            <div className="space-y-4">
              {ag.signatures.map((sig: any, i: number) => (
                <div key={i} className={cn("flex items-center gap-4 p-3 rounded-xl", cl)}>
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>{sig.signerName || "—"}</p>
                    <p className="text-xs text-slate-400">{fmt(sig.signatureRole || "")} · Signed {sig.signedAt ? fmtDate(sig.signedAt) : "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
