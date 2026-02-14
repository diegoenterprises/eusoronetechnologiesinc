/**
 * CONTRACT SIGNING PAGE — Carrier post-bid-acceptance flow
 * Theme-aware | Brand gradient | Shipper design standard
 * 
 * Flow: Carrier bid accepted → navigate here → review terms → sign with Gradient Ink
 * Uses agreements.generate + agreements.sign tRPC mutations
 */

import React, { useState, useMemo } from "react";
import { useWizardHistory } from "@/hooks/useWizardHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, CheckCircle, ArrowLeft, Shield, DollarSign,
  MapPin, Navigation, Truck, Clock, Package, Building2,
  AlertTriangle, ChevronRight, Download
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import GradientSignaturePad from "@/components/GradientSignaturePad";
import { useAuth } from "@/_core/hooks/useAuth";

type Step = "review" | "terms" | "sign" | "complete";

export default function ContractSigning() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const loadId = params.loadId as string;

  const [step, setStep] = useWizardHistory<Step>("review", "/bids");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [agreementId, setAgreementId] = useState<number | null>(null);

  // Fetch load details
  const loadQuery = (trpc as any).loads.getById.useQuery(
    { id: loadId! },
    { enabled: !!loadId }
  );

  // Fetch accepted bid for this load
  const bidQuery = (trpc as any).carriers?.getAcceptedBid?.useQuery?.(
    { loadId: loadId! },
    { enabled: !!loadId }
  ) || { data: null, isLoading: false };

  // Generate agreement mutation
  const generateMutation = (trpc as any).agreements?.generate?.useMutation?.({
    onSuccess: (data: any) => {
      setAgreementId(data.id);
      toast.success("Rate confirmation generated");
    },
    onError: (err: any) => toast.error("Failed to generate agreement", { description: err.message }),
  }) || { mutate: () => {}, isPending: false };

  // Sign agreement mutation
  const signMutation = (trpc as any).agreements?.sign?.useMutation?.({
    onSuccess: (data: any) => {
      setStep("complete");
      if (data.fullyExecuted) {
        toast.success("Contract fully executed! Both parties have signed.");
      } else {
        toast.success("Your signature has been recorded. Awaiting shipper signature.");
      }
    },
    onError: (err: any) => toast.error("Failed to sign", { description: err.message }),
  }) || { mutate: () => {}, isPending: false };

  const load = loadQuery.data;
  const bid = bidQuery.data;

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mutedCls = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "review", label: "Review", icon: <Package className="w-4 h-4" /> },
    { id: "terms", label: "Terms", icon: <FileText className="w-4 h-4" /> },
    { id: "sign", label: "Sign", icon: <Shield className="w-4 h-4" /> },
    { id: "complete", label: "Done", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  const handleProceedToTerms = () => {
    setStep("terms");
    // Auto-generate agreement when moving to terms
    if (load && !agreementId) {
      generateMutation.mutate({
        type: "carrier_shipper",
        templateId: null,
        partyBUserId: load.shipperId || null,
        partyBCompanyId: null,
        partyBRole: "SHIPPER",
        rateType: "flat",
        baseRate: bid?.amount || load?.rate || 0,
        paymentTermDays: 30,
        equipmentTypes: [load.equipmentType || "dry_van"],
        hazmatRequired: !!load.hazmatClass,
        contractDuration: "single_load",
        strategicInputs: {
          loadId: load.id,
          loadNumber: load.loadNumber,
          origin: load.pickupLocation || load.origin,
          destination: load.deliveryLocation || load.destination,
          commodity: load.commodity || load.cargoType,
        },
        clauses: [
          { id: "rate", title: "Rate Confirmation", body: `Carrier agrees to transport load #${load.loadNumber} for the agreed rate of $${(bid?.amount || load?.rate || 0).toLocaleString()}.`, isModified: false },
          { id: "payment", title: "Payment Terms", body: "Payment shall be made within 30 days of delivery and submission of required documentation (BOL, POD).", isModified: false },
          { id: "liability", title: "Liability & Insurance", body: "Carrier shall maintain minimum cargo insurance of $100,000 and general liability of $1,000,000 as required by FMCSA regulations.", isModified: false },
          { id: "compliance", title: "Regulatory Compliance", body: "Carrier warrants compliance with all applicable DOT, FMCSA, and state transportation regulations.", isModified: false },
        ],
      });
    }
  };

  const handleSign = () => {
    if (!signatureData || !agreementId) {
      toast.error("Please draw your signature first");
      return;
    }
    signMutation.mutate({
      agreementId,
      signatureData,
      signatureRole: "carrier",
      signerName: user?.name || user?.firstName || "Carrier",
      signerTitle: "Authorized Representative",
    });
  };

  // Loading state
  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
        <Skeleton className={cn("h-10 w-64 rounded-xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-64 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-48 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
      </div>
    );
  }

  // Error state
  if (!load) {
    return (
      <div className="p-4 md:p-6 max-w-[900px] mx-auto">
        <div className={cn("text-center py-16 rounded-2xl border", cardCls)}>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className={cn("font-medium text-lg", isLight ? "text-slate-700" : "text-white")}>Load not found</p>
          <p className={mutedCls}>Unable to load contract details</p>
          <Button className="mt-4 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/bids")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to My Bids
          </Button>
        </div>
      </div>
    );
  }

  const originCity = load.pickupLocation?.city || load.origin?.city || "Origin";
  const originState = load.pickupLocation?.state || load.origin?.state || "";
  const destCity = load.deliveryLocation?.city || load.destination?.city || "Destination";
  const destState = load.deliveryLocation?.state || load.destination?.state || "";
  const rate = bid?.amount || load?.rate || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")} onClick={() => setLocation("/bids")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Rate Confirmation & Contract</h1>
          <p className={mutedCls}>Load #{load.loadNumber} — Sign to confirm your commitment</p>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-1">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              idx < stepIndex
                ? "bg-green-500/15 text-green-500"
                : idx === stepIndex
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                  : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
            )}>
              {idx < stepIndex ? <CheckCircle className="w-4 h-4" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className={cn("w-4 h-4 flex-shrink-0", isLight ? "text-slate-300" : "text-slate-600")} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 1: REVIEW */}
      {/* ══════════════════════════════════════════════ */}
      {step === "review" && (
        <div className="space-y-5">
          {/* Rate Hero */}
          <div className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-slate-800/60 border-slate-700/50")}>
            <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Accepted Rate</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mt-1">${Number(rate).toLocaleString()}</p>
                  {load.distance && <p className="text-sm text-slate-400 mt-1">${(Number(rate) / (Number(load.distance) || 1)).toFixed(2)}/mile · {load.distance} miles</p>}
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15">
                  <DollarSign className="w-10 h-10 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Route */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#1473FF]" />
                  </div>
                  <div>
                    <p className={cn("font-bold", valCls)}>{originCity}{originState ? `, ${originState}` : ""}</p>
                    <p className="text-[10px] text-slate-400">PICKUP</p>
                  </div>
                </div>
                <div className="flex-1 mx-4 flex items-center">
                  <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                  <Navigation className="w-5 h-5 mx-2 rotate-90 text-slate-400" />
                  <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className={cn("font-bold text-right", valCls)}>{destCity}{destState ? `, ${destState}` : ""}</p>
                    <p className="text-[10px] text-slate-400 text-right">DELIVERY</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#BE01FF]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Load Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Commodity", value: load.commodity || load.cargoType || "General" },
              { label: "Weight", value: load.weight ? `${load.weight} ${load.weightUnit || "lbs"}` : "TBD" },
              { label: "Equipment", value: load.equipmentType || "Dry Van" },
              { label: "Distance", value: load.distance ? `${load.distance} mi` : "TBD" },
            ].map((item) => (
              <div key={item.label} className={cellCls}>
                <p className="text-[10px] text-slate-400 uppercase">{item.label}</p>
                <p className={valCls}>{item.value}</p>
              </div>
            ))}
          </div>

          {load.hazmatClass && (
            <div className={cn("flex items-center gap-3 p-4 rounded-xl border", isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30")}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className={cn("font-bold text-sm", isLight ? "text-red-700" : "text-red-400")}>Hazmat Load — Class {load.hazmatClass}</p>
                <p className="text-xs text-red-400">Requires hazmat endorsement and placarding</p>
              </div>
            </div>
          )}

          <Button className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-base" onClick={handleProceedToTerms}>
            Continue to Terms <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 2: TERMS */}
      {/* ══════════════════════════════════════════════ */}
      {step === "terms" && (
        <div className="space-y-5">
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <FileText className="w-5 h-5 text-blue-500" />Rate Confirmation Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "1. Rate Confirmation", body: `Carrier agrees to transport Load #${load.loadNumber} from ${originCity}${originState ? `, ${originState}` : ""} to ${destCity}${destState ? `, ${destState}` : ""} for a total rate of $${Number(rate).toLocaleString()}.` },
                { title: "2. Payment Terms", body: "Payment shall be made within 30 calendar days of delivery and submission of required documentation including signed Bill of Lading (BOL) and Proof of Delivery (POD). Quick Pay options may be available at a reduced rate." },
                { title: "3. Liability & Insurance", body: "Carrier shall maintain minimum cargo insurance of $100,000 and automobile liability insurance of $1,000,000 as required by FMCSA regulations (49 CFR Part 387). Carrier is liable for loss or damage to cargo from the time of pickup to delivery." },
                { title: "4. Regulatory Compliance", body: "Carrier warrants that it holds a valid Motor Carrier operating authority issued by the FMCSA, and that all drivers and equipment comply with applicable DOT, FMCSA, and state transportation regulations." },
                { title: "5. Service Standards", body: "Carrier shall pick up and deliver the shipment within the agreed-upon schedule. Carrier shall immediately notify Shipper of any delays, incidents, or changes affecting the shipment." },
                { title: "6. Platform Terms", body: "This transaction is facilitated through the EusoTrip platform. Standard platform transaction fees apply per the EusoTrip Terms of Service." },
              ].map((clause) => (
                <div key={clause.title} className={cellCls}>
                  <p className={cn("font-bold text-sm mb-1", isLight ? "text-slate-800" : "text-white")}>{clause.title}</p>
                  <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-slate-300")}>{clause.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Agree checkbox */}
          <label className={cn("flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
            agreedToTerms
              ? isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30"
              : isLight ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/30"
          )}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-slate-300 accent-[#1473FF]"
            />
            <div>
              <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>I agree to the terms above</p>
              <p className="text-xs text-slate-400 mt-0.5">By checking this box, I confirm that I have read and understood the Rate Confirmation terms and agree to be bound by them.</p>
            </div>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("review")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-base" disabled={!agreedToTerms} onClick={() => setStep("sign")}>
              Proceed to Sign <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 3: SIGN */}
      {/* ══════════════════════════════════════════════ */}
      {step === "sign" && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className={cn("flex items-center justify-between p-4 rounded-xl border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")}>
            <div className="flex items-center gap-3">
              <EsangIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>Load #{load.loadNumber}</p>
                <p className="text-xs text-slate-400">{originCity} → {destCity}</p>
              </div>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(rate).toLocaleString()}</p>
          </div>

          {/* Signature Pad */}
          <Card className={cardCls}>
            <CardContent className="p-5">
              <GradientSignaturePad
                documentTitle="Rate Confirmation Agreement"
                signerName={user?.name || user?.firstName || "Carrier Representative"}
                onSign={(data) => setSignatureData(data)}
                onClear={() => setSignatureData(null)}
                legalText="By electronically signing this document, I acknowledge and agree that my electronic signature holds the same legal validity as a handwritten signature, pursuant to the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. ch. 96) and the Uniform Electronic Transactions Act (UETA)."
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("terms")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-base"
              disabled={!signatureData || signMutation.isPending}
              onClick={handleSign}
            >
              {signMutation.isPending ? (
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" />Signing...</span>
              ) : (
                <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Sign & Submit Contract</span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 4: COMPLETE */}
      {/* ══════════════════════════════════════════════ */}
      {step === "complete" && (
        <div className="space-y-5">
          <div className={cn("text-center py-12 rounded-2xl border", cardCls)}>
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className={cn("text-2xl font-bold mb-2", isLight ? "text-slate-800" : "text-white")}>Contract Signed Successfully</h2>
            <p className={cn("text-sm max-w-md mx-auto", mutedCls)}>
              Your Gradient Ink signature has been recorded for Load #{load.loadNumber}. The rate confirmation is now binding.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 text-xs font-bold">
                <Shield className="w-3 h-3 mr-1" />ESIGN Act Compliant
              </Badge>
              <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-400 border border-purple-500/30 text-xs font-bold">
                <EsangIcon className="w-3 h-3 mr-1" />Gradient Ink Verified
              </Badge>
            </div>

            {/* Summary card */}
            <div className={cn("mx-auto mt-8 max-w-sm p-5 rounded-xl border text-left", cellCls)}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Load</span>
                  <span className={valCls}>#{load.loadNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Route</span>
                  <span className={valCls}>{originCity} → {destCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Rate</span>
                  <span className="font-bold text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${Number(rate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Status</span>
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 border text-[10px]">Signed</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" className={cn("rounded-xl font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setLocation("/bids")}>
                <ArrowLeft className="w-4 h-4 mr-2" />My Bids
              </Button>
              <Button variant="outline" className={cn("rounded-xl font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => downloadAgreementPdf({ agreementNumber: `RC-${load.loadNumber}`, agreementType: "carrier_shipper", contractDuration: "single_load", status: "signed", generatedContent: `Rate Confirmation for Load #${load.loadNumber}\n\nCarrier agrees to transport the specified load for the confirmed rate.\nRoute: ${load.pickupLocation || load.origin || "Origin"} → ${load.deliveryLocation || load.destination || "Destination"}\nRate: $${Number(bid?.amount || load?.rate || 0).toLocaleString()}\nPayment: Net 30 days\nEquipment: ${load.equipmentType || "Dry Van"}`, partyAName: user?.name || "Carrier", partyARole: "CARRIER", partyBName: load.shipperName || "Shipper", partyBRole: "SHIPPER", baseRate: bid?.amount || load?.rate, rateType: "flat", paymentTermDays: 30, equipmentTypes: [load.equipmentType || "dry_van"], hazmatRequired: !!load.hazmatClass })}>
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
              <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation("/loads/transit")}>
                <Truck className="w-4 h-4 mr-2" />View In Transit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
