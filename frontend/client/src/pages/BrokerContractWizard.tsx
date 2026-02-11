/**
 * BROKER CONTRACT WIZARD — Double-sided broker agreement flow
 * Theme-aware | Brand gradient
 *
 * Brokers operate in two directions:
 * 1. Shipper → Broker: Securing loads/lanes from shippers
 * 2. Broker → Carrier: Brokering loads to carriers
 *
 * This wizard handles BOTH sides:
 * - Broker can secure a load from a shipper and create shipper↔broker agreement
 * - Broker can then broker it to a carrier with broker↔carrier agreement
 * - Broker can also post their own loads
 * - Margin/markup is calculated between shipper rate and carrier rate
 * - Platform fee is applied to BOTH sides of every transaction
 *
 * Cross-referenced with ShipperAgreementWizard + ContractSigning
 * Same tRPC mutations: agreements.generate + agreements.sign
 */
import React, { useState } from "react";
import { useWizardHistory } from "@/hooks/useWizardHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, CheckCircle, ArrowLeft, Shield, DollarSign,
  ChevronRight, Sparkles, Clock, Building2, MapPin,
  AlertTriangle, Truck, Users, Scale, ArrowRight,
  Percent, CreditCard, Calendar, Download
} from "lucide-react";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import GradientSignaturePad from "@/components/GradientSignaturePad";
import { useAuth } from "@/_core/hooks/useAuth";

const PLATFORM_FEE = 3.5;
const PLATFORM_FEE_MIN = 15;

type Step = "direction" | "parties" | "rates" | "terms" | "review" | "sign" | "complete";
type Direction = "shipper_to_broker" | "broker_to_carrier" | null;

export default function BrokerContractWizard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [step, setStep] = useWizardHistory<Step>("direction", "/agreements");
  const [direction, setDirection] = useState<Direction>(null);

  // Parties
  const [partyName, setPartyName] = useState("");
  const [partyCompany, setPartyCompany] = useState("");
  const [partyMc, setPartyMc] = useState("");
  const [partyDot, setPartyDot] = useState("");

  // Rates — broker sees both sides
  const [shipperRate, setShipperRate] = useState(""); // what shipper pays
  const [carrierRate, setCarrierRate] = useState(""); // what carrier gets
  const [rateType, setRateType] = useState("flat");
  const [fuelSurcharge, setFuelSurcharge] = useState("none");
  const [fuelValue, setFuelValue] = useState("");

  // Terms
  const [agType, setAgType] = useState("broker_carrier");
  const [duration, setDuration] = useState("spot");
  const [payDays, setPayDays] = useState("30");
  const [payFreq, setPayFreq] = useState("per_load");
  const [effDate, setEffDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDate, setExpDate] = useState("");
  const [eqTypes, setEqTypes] = useState<string[]>(["dry_van"]);

  // Lane
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");

  // Result
  const [agId, setAgId] = useState<number | null>(null);
  const [agNum, setAgNum] = useState("");
  const [genContent, setGenContent] = useState("");
  const [sigData, setSigData] = useState<string | null>(null);

  // Computed
  const sRate = parseFloat(shipperRate) || 0;
  const cRate = parseFloat(carrierRate) || 0;
  const margin = sRate - cRate;
  const marginPct = sRate > 0 ? ((margin / sRate) * 100) : 0;
  const platformFeeShipper = Math.max(sRate * (PLATFORM_FEE / 100), PLATFORM_FEE_MIN);
  const platformFeeCarrier = Math.max(cRate * (PLATFORM_FEE / 100), PLATFORM_FEE_MIN);
  const totalPlatformFee = platformFeeShipper + platformFeeCarrier;
  const netBrokerRevenue = margin - totalPlatformFee;

  const genMut = (trpc as any).agreements?.generate?.useMutation?.({
    onSuccess: (d: any) => { setAgId(d.id); setAgNum(d.agreementNumber); setGenContent(d.generatedContent || ""); toast.success("Agreement generated"); setStep("review"); },
    onError: (e: any) => toast.error("Failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const signMut = (trpc as any).agreements?.sign?.useMutation?.({
    onSuccess: (d: any) => { setStep("complete"); toast.success(d.fullyExecuted ? "Contract fully executed!" : "Signature recorded."); },
    onError: (e: any) => toast.error("Sign failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const ic = cn("rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");
  const lb = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-600" : "text-slate-400");
  const tc = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");

  const stpList: { id: Step; l: string }[] = [
    { id: "direction", l: "Direction" }, { id: "parties", l: "Parties" },
    { id: "rates", l: "Rates" }, { id: "terms", l: "Terms" },
    { id: "review", l: "Review" }, { id: "sign", l: "Sign" }, { id: "complete", l: "Done" },
  ];
  const si = stpList.findIndex(s => s.id === step);

  const doGen = () => {
    const baseRate = direction === "shipper_to_broker" ? sRate : cRate;
    genMut.mutate({
      agreementType: direction === "shipper_to_broker" ? "broker_shipper" : "broker_carrier",
      contractDuration: duration, partyBUserId: 0,
      partyBRole: direction === "shipper_to_broker" ? "SHIPPER" : "CARRIER",
      strategicInputs: {
        partyAName: user?.name || "Broker", partyBName: partyName,
        partyBCompany: partyCompany, partyBMc: partyMc, partyBDot: partyDot,
        payFrequency: payFreq, brokerMargin: margin.toFixed(2),
        brokerMarginPercent: marginPct.toFixed(1),
        platformFee: PLATFORM_FEE.toString(),
        nonCircumventionMonths: "12", terminationNoticeDays: "30",
      },
      rateType, baseRate, fuelSurchargeType: fuelSurcharge,
      fuelSurchargeValue: parseFloat(fuelValue) || undefined,
      paymentTermDays: parseInt(payDays) || 30,
      equipmentTypes: eqTypes,
      lanes: originCity && destCity ? [{
        origin: { city: originCity, state: originState, radius: 50 },
        destination: { city: destCity, state: destState, radius: 50 },
        rate: baseRate, rateType,
      }] : undefined,
      effectiveDate: effDate || undefined, expirationDate: expDate || undefined,
      autoRenew: duration === "evergreen",
    });
  };

  const doSign = () => {
    if (!sigData || !agId) { toast.error("Draw your signature"); return; }
    signMut.mutate({ agreementId: agId, signatureData: sigData, signatureRole: "broker", signerName: user?.name || "Broker", signerTitle: "Licensed Property Broker" });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[960px] mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")} onClick={() => setLocation("/agreements")}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Broker Contract Wizard</h1>
          <p className={mt}>Create shipper↔broker or broker↔carrier agreements</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {stpList.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
              i < si ? "bg-green-500/15 text-green-500" : i === si ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
            )}>{i < si ? <CheckCircle className="w-3.5 h-3.5" /> : null}{s.l}</div>
            {i < stpList.length - 1 && <ChevronRight className={cn("w-3.5 h-3.5", isLight ? "text-slate-300" : "text-slate-600")} />}
          </React.Fragment>
        ))}
      </div>

      {/* DIRECTION */}
      {step === "direction" && (
        <div className="space-y-5">
          <p className={cn("text-center text-sm", mt)}>Which side of the brokerage are you contracting?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => { setDirection("shipper_to_broker"); setAgType("broker_shipper"); }} className={cn("p-6 rounded-2xl border-2 text-left transition-all", direction === "shipper_to_broker" ? "border-[#1473FF] bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 shadow-lg" : isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-800/60")}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/15"><Building2 className="w-5 h-5 text-blue-500" /></div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="p-2 rounded-lg bg-purple-500/15"><Scale className="w-5 h-5 text-purple-500" /></div>
              </div>
              <p className={cn("font-bold mb-1", vl)}>Shipper → Broker</p>
              <p className={cn("text-xs", mt)}>Secure a load or lane from a shipper. You'll set the rate the shipper pays you.</p>
            </button>
            <button onClick={() => { setDirection("broker_to_carrier"); setAgType("broker_carrier"); }} className={cn("p-6 rounded-2xl border-2 text-left transition-all", direction === "broker_to_carrier" ? "border-[#BE01FF] bg-gradient-to-br from-[#BE01FF]/10 to-[#1473FF]/10 shadow-lg" : isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-800/60")}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/15"><Scale className="w-5 h-5 text-purple-500" /></div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="p-2 rounded-lg bg-emerald-500/15"><Truck className="w-5 h-5 text-emerald-500" /></div>
              </div>
              <p className={cn("font-bold mb-1", vl)}>Broker → Carrier</p>
              <p className={cn("text-xs", mt)}>Broker a load to a carrier. You'll set the rate you pay the carrier.</p>
            </button>
          </div>
          <Button className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!direction} onClick={() => setStep("parties")}>Continue <ChevronRight className="w-5 h-5 ml-2" /></Button>
        </div>
      )}

      {/* PARTIES */}
      {step === "parties" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}>
            {direction === "shipper_to_broker" ? <><Building2 className="w-5 h-5 text-blue-500" />Shipper Details</> : <><Truck className="w-5 h-5 text-emerald-500" />Carrier Details</>}
          </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Contact Name</label><Input value={partyName} onChange={(e: any) => setPartyName(e.target.value)} placeholder="Full name" className={ic} /></div>
                <div><label className={lb}>Company</label><Input value={partyCompany} onChange={(e: any) => setPartyCompany(e.target.value)} placeholder="Company name" className={ic} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>MC Number</label><Input value={partyMc} onChange={(e: any) => setPartyMc(e.target.value)} placeholder="MC-XXXXXX" className={ic} /></div>
                <div><label className={lb}>DOT Number</label><Input value={partyDot} onChange={(e: any) => setPartyDot(e.target.value)} placeholder="DOT XXXXXXX" className={ic} /></div>
              </div>
            </CardContent>
          </Card>
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><MapPin className="w-5 h-5 text-blue-500" />Lane (Optional)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div><label className={lb}>Origin City</label><Input value={originCity} onChange={(e: any) => setOriginCity(e.target.value)} placeholder="City" className={ic} /></div>
                <div><label className={lb}>State</label><Input value={originState} onChange={(e: any) => setOriginState(e.target.value)} placeholder="ST" className={ic} /></div>
                <div><label className={lb}>Dest City</label><Input value={destCity} onChange={(e: any) => setDestCity(e.target.value)} placeholder="City" className={ic} /></div>
                <div><label className={lb}>State</label><Input value={destState} onChange={(e: any) => setDestState(e.target.value)} placeholder="ST" className={ic} /></div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("direction")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setStep("rates")}>Continue <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* RATES — Broker margin calculator */}
      {step === "rates" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><DollarSign className="w-5 h-5 text-emerald-500" />Rate & Margin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lb}>Shipper Pays ($)</label><Input type="number" value={shipperRate} onChange={(e: any) => setShipperRate(e.target.value)} placeholder="0.00" className={ic} /></div>
                <div><label className={lb}>Carrier Gets ($)</label><Input type="number" value={carrierRate} onChange={(e: any) => setCarrierRate(e.target.value)} placeholder="0.00" className={ic} /></div>
                <div><label className={lb}>Rate Type</label><Select value={rateType} onValueChange={setRateType}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flat">Flat</SelectItem><SelectItem value="per_mile">Per Mile</SelectItem></SelectContent></Select></div>
              </div>

              {/* Margin Display */}
              <div className={cn("p-4 rounded-xl border", margin >= 0 ? (isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/30") : (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/30"))}>
                <p className={cn("text-xs font-bold mb-3", margin >= 0 ? "text-emerald-600" : "text-red-500")}>Broker Margin Analysis</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-slate-400">Gross Margin</p><p className={cn("text-lg font-bold", margin >= 0 ? "text-emerald-500" : "text-red-400")}>${margin.toFixed(2)}</p></div>
                  <div><p className="text-slate-400">Margin %</p><p className={cn("text-lg font-bold", marginPct >= 10 ? "text-emerald-500" : marginPct >= 0 ? "text-yellow-500" : "text-red-400")}>{marginPct.toFixed(1)}%</p></div>
                  <div><p className="text-slate-400">Platform Fee (both sides)</p><p className="text-lg font-bold text-purple-400">${totalPlatformFee.toFixed(2)}</p></div>
                  <div><p className="text-slate-400">Net Revenue</p><p className={cn("text-lg font-bold", netBrokerRevenue >= 0 ? "text-emerald-500" : "text-red-400")}>${netBrokerRevenue.toFixed(2)}</p></div>
                </div>
                {marginPct < 10 && marginPct >= 0 && <p className="text-[11px] text-yellow-500 mt-2">⚠ Margin below 10%. Consider negotiating better shipper rates.</p>}
                {margin < 0 && <p className="text-[11px] text-red-400 mt-2">⚠ Negative margin — carrier rate exceeds shipper rate.</p>}
              </div>

              {/* Platform Fee Breakdown */}
              <div className={cn("p-3 rounded-xl border text-xs", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/5 border-purple-500/30")}>
                <p className={cn("font-bold text-xs mb-2", isLight ? "text-purple-700" : "text-purple-400")}>Platform Fee Breakdown ({PLATFORM_FEE}%)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-slate-400">Shipper Side</p><p className={vl}>${platformFeeShipper.toFixed(2)}</p></div>
                  <div><p className="text-slate-400">Carrier Side</p><p className={vl}>${platformFeeCarrier.toFixed(2)}</p></div>
                  <div><p className="text-slate-400">Total Fee</p><p className="font-bold text-purple-400">${totalPlatformFee.toFixed(2)}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Fuel Surcharge</label><Select value={fuelSurcharge} onValueChange={setFuelSurcharge}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="doe_index">DOE Index</SelectItem><SelectItem value="fixed">Fixed %</SelectItem></SelectContent></Select></div>
                {fuelSurcharge !== "none" && <div><label className={lb}>Surcharge Value</label><Input type="number" value={fuelValue} onChange={(e: any) => setFuelValue(e.target.value)} placeholder="%" className={ic} /></div>}
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("parties")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setStep("terms")}>Continue <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* TERMS */}
      {step === "terms" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><Calendar className="w-5 h-5 text-blue-500" />Contract Terms</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Duration</label><Select value={duration} onValueChange={setDuration}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="spot">Spot (Single)</SelectItem><SelectItem value="short_term">Short Term</SelectItem><SelectItem value="long_term">Long Term</SelectItem><SelectItem value="evergreen">Evergreen</SelectItem></SelectContent></Select></div>
                <div><label className={lb}>Pay Frequency</label><Select value={payFreq} onValueChange={setPayFreq}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="per_load">Per Load</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="net_30">Net 30</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lb}>Payment Days</label><Input type="number" value={payDays} onChange={(e: any) => setPayDays(e.target.value)} className={ic} /></div>
                <div><label className={lb}>Effective</label><Input type="date" value={effDate} onChange={(e: any) => setEffDate(e.target.value)} className={ic} /></div>
                <div><label className={lb}>Expires</label><Input type="date" value={expDate} onChange={(e: any) => setExpDate(e.target.value)} className={ic} /></div>
              </div>
              <div><label className={lb}>Equipment</label>
                <div className="flex flex-wrap gap-2">{["dry_van", "reefer", "flatbed", "liquid_tank", "gas_tank", "bulk_hopper", "hazmat_van", "cryogenic"].map(eq => (
                  <button key={eq} onClick={() => setEqTypes(eqTypes.includes(eq) ? eqTypes.filter(e => e !== eq) : [...eqTypes, eq])} className={cn("px-3 py-1.5 rounded-full text-xs font-medium", eqTypes.includes(eq) ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>{eq.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</button>
                ))}</div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("rates")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={genMut.isPending} onClick={doGen}>{genMut.isPending ? <><Clock className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Agreement</>}</Button>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === "review" && (
        <div className="space-y-5">
          <div className={cn("flex items-center justify-between p-4 rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")}>
            <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-green-500" /><div><p className={cn("font-bold text-sm", vl)}>Agreement #{agNum}</p><p className="text-xs text-slate-400">{direction === "shipper_to_broker" ? "Shipper → Broker" : "Broker → Carrier"}</p></div></div>
            <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-400 border border-purple-500/30 text-xs font-bold">Draft</Badge>
          </div>
          <Card className={cc}><CardContent className="p-4"><pre className={cn("text-xs whitespace-pre-wrap leading-relaxed p-4 rounded-xl max-h-[300px] overflow-y-auto font-mono", cl)}>{genContent || "Agreement content..."}</pre></CardContent></Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Shipper Rate", v: `$${sRate.toLocaleString()}` },
              { l: "Carrier Rate", v: `$${cRate.toLocaleString()}` },
              { l: "Your Margin", v: `$${margin.toFixed(2)} (${marginPct.toFixed(1)}%)` },
              { l: "Platform Fee", v: `$${totalPlatformFee.toFixed(2)}` },
            ].map(x => (<div key={x.l} className={cl}><p className="text-[10px] text-slate-400 uppercase">{x.l}</p><p className={vl}>{x.v}</p></div>))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("terms")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button variant="outline" className={cn("rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => downloadAgreementPdf({ agreementNumber: agNum, agreementType: direction === "shipper_to_broker" ? "broker_shipper" : "broker_carrier", contractDuration: duration, status: "draft", generatedContent: genContent, partyAName: user?.name || "Broker", partyARole: "BROKER", partyBName: partyName, partyBCompany: partyCompany, partyBRole: direction === "shipper_to_broker" ? "SHIPPER" : "CARRIER", baseRate: direction === "shipper_to_broker" ? sRate : cRate, rateType, paymentTermDays: parseInt(payDays) || 30, fuelSurchargeType: fuelSurcharge, fuelSurchargeValue: fuelValue, effectiveDate: effDate, expirationDate: expDate, equipmentTypes: eqTypes, lanes: originCity && destCity ? [{ origin: { city: originCity, state: originState }, destination: { city: destCity, state: destState } }] : undefined })}><Download className="w-4 h-4 mr-2" />Download</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setStep("sign")}>Sign <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* SIGN */}
      {step === "sign" && (
        <div className="space-y-5">
          <Card className={cc}><CardContent className="p-5">
            <GradientSignaturePad documentTitle={direction === "shipper_to_broker" ? "Shipper-Broker Agreement" : "Broker-Carrier Agreement"} signerName={user?.name || "Broker Representative"} onSign={(d: string) => setSigData(d)} onClear={() => setSigData(null)} legalText="By electronically signing, I confirm this agreement and acknowledge the platform fee structure. Pursuant to ESIGN Act (15 U.S.C. ch. 96)." />
          </CardContent></Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("review")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!sigData || signMut.isPending} onClick={doSign}>{signMut.isPending ? <><Clock className="w-4 h-4 mr-2 animate-spin" />Signing...</> : <><Shield className="w-4 h-4 mr-2" />Sign & Execute</>}</Button>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {step === "complete" && (
        <div className={cn("text-center py-12 rounded-2xl border", cc)}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"><CheckCircle className="w-10 h-10 text-green-500" /></div>
          <h2 className={cn("text-2xl font-bold mb-2", isLight ? "text-slate-800" : "text-white")}>Agreement Signed</h2>
          <p className={cn("text-sm max-w-md mx-auto mb-6", mt)}>Your signature has been recorded for agreement #{agNum}. {direction === "shipper_to_broker" ? "Now broker this load to a carrier." : "Awaiting counter-signature."}</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 text-xs font-bold"><Shield className="w-3 h-3 mr-1" />ESIGN Compliant</Badge>
            <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-bold"><Scale className="w-3 h-3 mr-1" />Fee: ${totalPlatformFee.toFixed(2)}</Badge>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className={cn("rounded-xl font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setLocation("/agreements")}><ArrowLeft className="w-4 h-4 mr-2" />Agreements</Button>
            <Button variant="outline" className={cn("rounded-xl font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => downloadAgreementPdf({ agreementNumber: agNum, agreementType: direction === "shipper_to_broker" ? "broker_shipper" : "broker_carrier", contractDuration: duration, status: "pending_signature", generatedContent: genContent, partyAName: user?.name || "Broker", partyARole: "BROKER", partyBName: partyName, partyBCompany: partyCompany, partyBRole: direction === "shipper_to_broker" ? "SHIPPER" : "CARRIER", baseRate: direction === "shipper_to_broker" ? sRate : cRate, rateType, paymentTermDays: parseInt(payDays) || 30, effectiveDate: effDate, expirationDate: expDate, equipmentTypes: eqTypes })}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
            {direction === "shipper_to_broker" && (
              <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => { setDirection("broker_to_carrier"); setStep("parties"); setPartyName(""); setPartyCompany(""); setPartyMc(""); setPartyDot(""); setSigData(null); setAgId(null); }}>
                <Truck className="w-4 h-4 mr-2" />Broker to Carrier
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
