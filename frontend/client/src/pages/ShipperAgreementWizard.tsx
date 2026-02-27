/**
 * SHIPPER AGREEMENT WIZARD
 * Theme-aware | Brand gradient
 * Cross-referenced with catalyst ContractSigning.tsx
 */
import React, { useState, useRef } from "react";
import { useWizardHistory } from "@/hooks/useWizardHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, CheckCircle, ArrowLeft, Shield, DollarSign, ChevronRight, Clock, Building2, MapPin, Plus, Trash2, FileUp, Scan, Truck, Users, Calendar, Download } from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { downloadAgreementPdf } from "@/lib/agreementPdf";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import GradientSignaturePad from "@/components/GradientSignaturePad";
import { useAuth } from "@/_core/hooks/useAuth";
import DatePicker from "@/components/DatePicker";

type Step = "mode"|"parties"|"financial"|"lanes"|"review"|"sign"|"complete";
type Mode = "generate"|"upload"|null;
interface Lane { oC:string; oS:string; dC:string; dS:string; rate:string; rt:string; vol:string; vp:string; }

const ROLE_AGREEMENT_MAP: Record<string, {types:{value:string;label:string}[]; defaultType:string; partyALabel:string; partyBLabel:string; partyBRole:string}> = {
  SHIPPER: { types:[{value:"catalyst_shipper",label:"Catalyst-Shipper"},{value:"broker_shipper",label:"Broker-Shipper"},{value:"master_service",label:"Master Service Agreement"},{value:"lane_commitment",label:"Lane Commitment"},{value:"fuel_surcharge",label:"Fuel Surcharge Schedule"},{value:"accessorial_schedule",label:"Accessorial Schedule"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"catalyst_shipper", partyALabel:"Shipper", partyBLabel:"Catalyst", partyBRole:"CATALYST" },
  CATALYST: { types:[{value:"catalyst_shipper",label:"Catalyst-Shipper"},{value:"catalyst_driver",label:"Catalyst-Driver (Owner-Op)"},{value:"broker_catalyst",label:"Broker-Catalyst"},{value:"master_service",label:"Master Service Agreement"},{value:"factoring",label:"Factoring Agreement"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"catalyst_shipper", partyALabel:"Catalyst", partyBLabel:"Shipper / Driver", partyBRole:"SHIPPER" },
  BROKER: { types:[{value:"broker_catalyst",label:"Broker-Catalyst"},{value:"broker_shipper",label:"Broker-Shipper"},{value:"master_service",label:"Master Service Agreement"},{value:"lane_commitment",label:"Lane Commitment"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"broker_catalyst", partyALabel:"Broker", partyBLabel:"Catalyst / Shipper", partyBRole:"CATALYST" },
  DISPATCH: { types:[{value:"dispatch_dispatch",label:"Dispatch Service Agreement"},{value:"master_service",label:"Master Service Agreement"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"dispatch_dispatch", partyALabel:"Dispatch (Dispatcher)", partyBLabel:"Catalyst", partyBRole:"CATALYST" },
  ESCORT: { types:[{value:"escort_service",label:"Escort Service Agreement"},{value:"master_service",label:"Master Service Agreement"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"escort_service", partyALabel:"Escort Provider", partyBLabel:"Catalyst", partyBRole:"CATALYST" },
  TERMINAL_MANAGER: { types:[{value:"terminal_access",label:"Terminal Access Agreement"},{value:"throughput",label:"Throughput Agreement"},{value:"storage_service",label:"Storage & Service Agreement"},{value:"master_service",label:"Master Service Agreement"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"terminal_access", partyALabel:"Terminal Operator", partyBLabel:"Catalyst / Shipper", partyBRole:"CATALYST" },
  DRIVER: { types:[{value:"catalyst_driver",label:"Catalyst-Driver (Owner-Op)"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"catalyst_driver", partyALabel:"Driver", partyBLabel:"Catalyst", partyBRole:"CATALYST" },
  ADMIN: { types:[{value:"catalyst_shipper",label:"Catalyst-Shipper"},{value:"broker_catalyst",label:"Broker-Catalyst"},{value:"broker_shipper",label:"Broker-Shipper"},{value:"catalyst_driver",label:"Catalyst-Driver"},{value:"escort_service",label:"Escort Service"},{value:"dispatch_dispatch",label:"Dispatch Service"},{value:"terminal_access",label:"Terminal Access"},{value:"throughput",label:"Throughput Agreement"},{value:"storage_service",label:"Storage & Service"},{value:"master_service",label:"Master Service"},{value:"lane_commitment",label:"Lane Commitment"},{value:"fuel_surcharge",label:"Fuel Surcharge"},{value:"accessorial_schedule",label:"Accessorial Schedule"},{value:"factoring",label:"Factoring"},{value:"nda",label:"NDA"},{value:"custom",label:"Custom"}], defaultType:"catalyst_shipper", partyALabel:"Party A", partyBLabel:"Party B", partyBRole:"CATALYST" },
};
ROLE_AGREEMENT_MAP.SUPER_ADMIN = ROLE_AGREEMENT_MAP.ADMIN;
ROLE_AGREEMENT_MAP.COMPLIANCE_OFFICER = { types:[{value:"nda",label:"Non-Disclosure Agreement"},{value:"master_service",label:"Master Service Agreement"}], defaultType:"nda", partyALabel:"Company", partyBLabel:"Counterparty", partyBRole:"CATALYST" };
ROLE_AGREEMENT_MAP.SAFETY_MANAGER = ROLE_AGREEMENT_MAP.COMPLIANCE_OFFICER;
ROLE_AGREEMENT_MAP.FACTORING = { types:[{value:"factoring",label:"Factoring Agreement"},{value:"nda",label:"Non-Disclosure Agreement"}], defaultType:"factoring", partyALabel:"Factoring Company", partyBLabel:"Catalyst", partyBRole:"CATALYST" };

export default function ShipperAgreementWizard() {
  const { theme } = useTheme(); const isLight = theme === "light";
  const { user } = useAuth(); const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const roleConfig = ROLE_AGREEMENT_MAP[user?.role || "SHIPPER"] || ROLE_AGREEMENT_MAP.SHIPPER;
  const urlType = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("type") : null;
  const initialType = urlType && roleConfig.types.some(t => t.value === urlType) ? urlType : roleConfig.defaultType;
  const [step, setStep] = useWizardHistory<Step>("mode", "/agreements");
  const [mode, setMode] = useState<Mode>(null);
  const [uploadedFile, setUploadedFile] = useState<File|null>(null);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [agType, setAgType] = useState(initialType);
  const [dur, setDur] = useState<string>("short_term");
  const [aDisplayName, setADisplayName] = useState("");
  const [aName, setAName] = useState(user?.name || ""); const [aComp, setAComp] = useState("");
  const [aMc, setAMc] = useState(""); const [aDot, setADot] = useState("");
  const [bDisplayName, setBDisplayName] = useState("");
  const [bName, setBName] = useState(""); const [bComp, setBComp] = useState("");
  const [bMc, setBMc] = useState(""); const [bDot, setBDot] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Texas");
  const [terminationNoticeDays, setTerminationNoticeDays] = useState("30");
  const [nonCircumventMonths, setNonCircumventMonths] = useState("12");
  const [noticePeriodDays, setNoticePeriodDays] = useState("3");
  const [rateType, setRateType] = useState("flat_rate"); const [baseRate, setBaseRate] = useState("");
  const [fuelType, setFuelType] = useState("none"); const [fuelVal, setFuelVal] = useState("");
  const [minChg, setMinChg] = useState(""); const [maxChg, setMaxChg] = useState("");
  const [payDays, setPayDays] = useState("30"); const [qpDisc, setQpDisc] = useState("");
  const [qpDays, setQpDays] = useState(""); const [payFreq, setPayFreq] = useState("per_load");
  const [insAmt, setInsAmt] = useState("1000000"); const [liab, setLiab] = useState("1000000");
  const [cargo, setCargo] = useState("100000");
  const [eqTypes, setEqTypes] = useState<string[]>(["dry_van"]);
  const [hazmat, setHazmat] = useState(false);
  const [effDate, setEffDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDate, setExpDate] = useState("");
  const [lanes, setLanes] = useState<Lane[]>([]);
  const updateLane = (i: number, field: keyof Lane, value: string) => setLanes(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  const [notes, setNotes] = useState("");
  const [agId, setAgId] = useState<number|null>(null);
  const [agNum, setAgNum] = useState(""); const [genContent, setGenContent] = useState("");
  const [sigData, setSigData] = useState<string|null>(null);

  const genMut = (trpc as any).agreements?.generate?.useMutation?.({
    onSuccess: (d:any) => { setAgId(d.id); setAgNum(d.agreementNumber); setGenContent(d.generatedContent||""); toast.success("Agreement generated"); setStep("review"); },
    onError: (e:any) => toast.error("Failed", { description: e.message }),
  }) || { mutate:()=>{}, isPending:false };
  const signMut = (trpc as any).agreements?.sign?.useMutation?.({
    onSuccess: (d:any) => { setStep("complete"); toast.success(d.fullyExecuted ? "Contract fully executed!" : "Signature recorded. Awaiting catalyst."); },
    onError: (e:any) => toast.error("Sign failed", { description: e.message }),
  }) || { mutate:()=>{}, isPending:false };

  const cc = cn("rounded-2xl border", isLight?"bg-white border-slate-200 shadow-sm":"bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight?"bg-slate-50 border-slate-200":"bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight?"text-slate-800":"text-white");
  const mt = cn("text-sm", isLight?"text-slate-500":"text-slate-400");
  const ic = cn("rounded-xl", isLight?"bg-white border-slate-200":"bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");
  const lb = cn("text-xs font-medium mb-1.5 block", isLight?"text-slate-600":"text-slate-400");
  const tc = cn("text-lg font-semibold", isLight?"text-slate-800":"text-white");

  const steps:{id:Step;l:string;i:React.ReactNode}[] = [
    {id:"mode",l:"Method",i:<FileText className="w-3.5 h-3.5"/>},{id:"parties",l:"Parties",i:<Users className="w-3.5 h-3.5"/>},
    {id:"financial",l:"Financial",i:<DollarSign className="w-3.5 h-3.5"/>},{id:"lanes",l:"Lanes",i:<MapPin className="w-3.5 h-3.5"/>},
    {id:"review",l:"Review",i:<FileText className="w-3.5 h-3.5"/>},{id:"sign",l:"Sign",i:<Shield className="w-3.5 h-3.5"/>},
    {id:"complete",l:"Done",i:<CheckCircle className="w-3.5 h-3.5"/>},
  ];
  const si = steps.findIndex(s=>s.id===step);

  const doGen = () => {
    const ld = lanes.filter(l=>l.oC&&l.dC).map(l=>({ origin:{city:l.oC,state:l.oS,radius:50}, destination:{city:l.dC,state:l.dS,radius:50}, rate:parseFloat(l.rate)||0, rateType:l.rt||"flat", volumeCommitment:parseInt(l.vol)||undefined, volumePeriod:l.vp||undefined }));
    const resolvedPartyBRole = agType==="catalyst_driver"?"DRIVER":agType==="broker_shipper"?"SHIPPER":agType==="factoring"?"CATALYST":roleConfig.partyBRole;
    genMut.mutate({ agreementType:agType, contractDuration:dur, partyBUserId:0, partyBRole:resolvedPartyBRole,
      strategicInputs:{ partyASignerName:aName||user?.name||roleConfig.partyALabel, partyACompanyName:aComp, partyAName:aDisplayName||aComp||aName||user?.name||roleConfig.partyALabel, partyAMc:aMc, partyADot:aDot, partyARole:user?.role||"SHIPPER", partyBSignerName:bName, partyBCompanyName:bComp, partyBName:bDisplayName||bComp||bName||"Party B", partyBCompany:bComp, partyBMc:bMc, partyBDot:bDot, partyBRole:resolvedPartyBRole, jurisdiction, payFrequency:payFreq, nonCircumventionMonths:nonCircumventMonths, terminationNoticeDays:terminationNoticeDays, noticePeriodDays:noticePeriodDays },
      rateType, baseRate:parseFloat(baseRate)||0, fuelSurchargeType:fuelType, fuelSurchargeValue:parseFloat(fuelVal)||undefined,
      minimumCharge:parseFloat(minChg)||undefined, maximumCharge:parseFloat(maxChg)||undefined,
      paymentTermDays:parseInt(payDays)||30, quickPayDiscount:parseFloat(qpDisc)||undefined, quickPayDays:parseInt(qpDays)||undefined,
      minInsuranceAmount:parseFloat(insAmt)||undefined, liabilityLimit:parseFloat(liab)||undefined, cargoInsuranceRequired:parseFloat(cargo)||undefined,
      equipmentTypes:eqTypes, hazmatRequired:hazmat, lanes:ld.length>0?ld:undefined,
      effectiveDate:effDate||undefined, expirationDate:expDate||undefined, autoRenew:dur==="evergreen", notes:notes||undefined,
    });
  };
  const doSign = () => { if(!sigData||!agId){toast.error("Draw your signature");return;} signMut.mutate({agreementId:agId,signatureData:sigData,signatureRole:user?.role?.toLowerCase()||"shipper",signerName:user?.name||roleConfig.partyALabel,signerTitle:"Authorized Representative"}); };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[960px] mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl",isLight?"hover:bg-slate-100":"hover:bg-slate-700")} onClick={()=>setLocation("/agreements")}><ArrowLeft className="w-4 h-4"/></Button>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Agreement Wizard</h1><p className={mt}>Generate or digitize a {agType.replace(/_/g, " ")} agreement</p></div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s,i)=>(<React.Fragment key={s.id}><div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0",i<si?"bg-green-500/15 text-green-500":i===si?"bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md":isLight?"bg-slate-100 text-slate-400":"bg-slate-800 text-slate-500")}>{i<si?<CheckCircle className="w-3.5 h-3.5"/>:s.i}<span className="hidden sm:inline">{s.l}</span></div>{i<steps.length-1&&<ChevronRight className={cn("w-3.5 h-3.5 flex-shrink-0",isLight?"text-slate-300":"text-slate-600")}/>}</React.Fragment>))}
      </div>

      {/* ── MODE ── */}
      {step==="mode"&&(<div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={()=>setMode("generate")} className={cn("p-6 rounded-2xl border-2 text-left transition-all",mode==="generate"?"border-[#1473FF] bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 shadow-lg":isLight?"border-slate-200 bg-white hover:border-slate-300":"border-slate-700 bg-slate-800/60 hover:border-slate-600")}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 w-12 h-12 flex items-center justify-center mb-3"><EsangIcon className="w-6 h-6 text-[#1473FF]"/></div>
            <p className={cn("font-bold mb-1",vl)}>Generate Agreement</p><p className={cn("text-xs",mt)}>Auto-generate MSA, Rate Confirmation, or Lane Commitment with FMCSA-compliant clauses.</p>
          </button>
          <button onClick={()=>setMode("upload")} className={cn("p-6 rounded-2xl border-2 text-left transition-all",mode==="upload"?"border-[#BE01FF] bg-gradient-to-br from-[#BE01FF]/10 to-[#1473FF]/10 shadow-lg":isLight?"border-slate-200 bg-white hover:border-slate-300":"border-slate-700 bg-slate-800/60 hover:border-slate-600")}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#BE01FF]/15 to-[#1473FF]/15 w-12 h-12 flex items-center justify-center mb-3"><Scan className="w-6 h-6 text-[#BE01FF]"/></div>
            <p className={cn("font-bold mb-1",vl)}>Upload & Digitize</p><p className={cn("text-xs",mt)}>Upload existing contract. Digitizer extracts clauses, signature lines, and financial fields.</p>
          </button>
        </div>
        {mode==="upload"&&(<Card className={cc}><CardContent className="p-5 space-y-4">
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setUploadedFile(f);toast.success(`${f.name} selected`);}}}/>
          {!uploadedFile?(<button onClick={()=>fileRef.current?.click()} className={cn("w-full p-10 rounded-xl border-2 border-dashed flex flex-col items-center gap-3",isLight?"border-slate-300 hover:border-[#1473FF]":"border-slate-600 hover:border-[#1473FF]")}><FileUp className="w-10 h-10 text-slate-400"/><p className={vl}>Click to upload</p><p className="text-xs text-slate-400">PDF, DOCX, PNG, JPG</p></button>
          ):(<div className={cn("flex items-center justify-between p-4",cl)}><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-blue-500"/><p className={vl}>{uploadedFile.name}</p></div><Button size="sm" variant="outline" onClick={()=>setUploadedFile(null)}><Trash2 className="w-4 h-4"/></Button></div>)}
          {uploadedFile&&<Button className="w-full h-11 bg-gradient-to-r from-[#BE01FF] to-[#1473FF] text-white rounded-xl font-bold" onClick={()=>{setIsDigitizing(true);setTimeout(()=>{setIsDigitizing(false);toast.success("Digitized");setStep("parties");},2000);}} disabled={isDigitizing}>{isDigitizing?<><Clock className="w-4 h-4 mr-2 animate-spin"/>Digitizing...</>:<><Scan className="w-4 h-4 mr-2"/>Digitize</>}</Button>}
        </CardContent></Card>)}
        {mode==="generate"&&(<Card className={cc}><CardContent className="p-5 space-y-4">
          <div><label className={lb}>Agreement Type</label><Select value={agType} onValueChange={setAgType}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent>{roleConfig.types.map(t=>(<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select></div>
          <div><label className={lb}>Duration</label><Select value={dur} onValueChange={setDur}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="spot">Spot (Single Load)</SelectItem><SelectItem value="short_term">Short Term (1-6 mo)</SelectItem><SelectItem value="long_term">Long Term (6-24 mo)</SelectItem><SelectItem value="evergreen">Evergreen</SelectItem></SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className={lb}>Effective Date</label><DatePicker value={effDate} onChange={setEffDate} /></div><div><label className={lb}>Expiration</label><DatePicker value={expDate} onChange={setExpDate} /></div></div>
        </CardContent></Card>)}
        <Button className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!mode} onClick={()=>mode==="upload"&&uploadedFile?undefined:setStep("parties")}>Continue <ChevronRight className="w-5 h-5 ml-2"/></Button>
      </div>)}

      {/* PLACEHOLDER FOR REMAINING STEPS */}
      {step==="parties"&&(<div className="space-y-5">
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Users className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent"/>Party A ({roleConfig.partyALabel})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className={lb}>Party A Name (as shown on agreement)</label><Input value={aDisplayName} onChange={(e:any)=>setADisplayName(e.target.value)} placeholder="e.g. Acme Logistics LLC" className={cn(ic,"font-semibold")}/><p className={cn("text-[10px] mt-1",mt)}>This name appears as "PARTY A" in the generated contract</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Signer Name</label><Input value={aName} onChange={(e:any)=>setAName(e.target.value)} placeholder="Authorized signatory" className={ic}/></div>
              <div><label className={lb}>Company Name</label><Input value={aComp} onChange={(e:any)=>setAComp(e.target.value)} placeholder="Your company name" className={ic}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>MC Number</label><Input value={aMc} onChange={(e:any)=>setAMc(e.target.value)} placeholder="MC-XXXXXX" className={ic}/></div>
              <div><label className={lb}>DOT Number</label><Input value={aDot} onChange={(e:any)=>setADot(e.target.value)} placeholder="DOT XXXXXXX" className={ic}/></div>
            </div>
          </CardContent></Card>
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Building2 className="w-5 h-5 text-blue-500"/>Party B ({roleConfig.partyBLabel})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className={lb}>Party B Name (as shown on agreement)</label><Input value={bDisplayName} onChange={(e:any)=>setBDisplayName(e.target.value)} placeholder="e.g. Swift Transport Inc" className={cn(ic,"font-semibold")}/><p className={cn("text-[10px] mt-1",mt)}>This name appears as "PARTY B" in the generated contract</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Signer Name</label><Input value={bName} onChange={(e:any)=>setBName(e.target.value)} placeholder="Authorized signatory" className={ic}/></div>
              <div><label className={lb}>Company Name</label><Input value={bComp} onChange={(e:any)=>setBComp(e.target.value)} placeholder="Company name" className={ic}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>MC Number</label><Input value={bMc} onChange={(e:any)=>setBMc(e.target.value)} placeholder="MC-XXXXXX" className={ic}/></div>
              <div><label className={lb}>DOT Number</label><Input value={bDot} onChange={(e:any)=>setBDot(e.target.value)} placeholder="DOT XXXXXXX" className={ic}/></div>
            </div>
          </CardContent></Card>
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Shield className="w-5 h-5 text-purple-500"/>Jurisdiction & Clause Terms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className={lb}>Governing Jurisdiction (State)</label><Select value={jurisdiction} onValueChange={setJurisdiction}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent>{["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"].map(s=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lb}>Termination Notice (days)</label><Input type="number" value={terminationNoticeDays} onChange={(e:any)=>setTerminationNoticeDays(e.target.value)} placeholder="30" className={ic}/></div>
              <div><label className={lb}>Non-Circumvention (months)</label><Input type="number" value={nonCircumventMonths} onChange={(e:any)=>setNonCircumventMonths(e.target.value)} placeholder="12" className={ic}/></div>
              <div><label className={lb}>Notice Effective (business days)</label><Input type="number" value={noticePeriodDays} onChange={(e:any)=>setNoticePeriodDays(e.target.value)} placeholder="3" className={ic}/></div>
            </div>
            <p className={cn("text-[10px]",mt)}>These values populate the corresponding articles in the generated agreement (termination, non-circumvention, notices).</p>
          </CardContent></Card>
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Truck className="w-5 h-5 text-purple-500"/>Equipment & Operations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className={lb}>Equipment Types</label>
              <div className="flex flex-wrap gap-2">{["dry_van","reefer","flatbed","liquid_tank","gas_tank","bulk_hopper","hazmat_van","cryogenic","food_grade_tank","water_tank"].map(eq=>(<button key={eq} onClick={()=>setEqTypes(eqTypes.includes(eq)?eqTypes.filter(e=>e!==eq):[...eqTypes,eq])} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all",eqTypes.includes(eq)?"bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white":isLight?"bg-slate-100 text-slate-500":"bg-slate-800 text-slate-400")}>{eq.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</button>))}</div>
            </div>
            {eqTypes.some(e=>["liquid_tank","gas_tank","hazmat_van","cryogenic"].includes(e))&&<label className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer",cl)}>
              <input type="checkbox" checked={hazmat} onChange={e=>setHazmat(e.target.checked)} className="w-4 h-4 accent-[#1473FF]"/>
              <div><p className={vl}>Hazmat Required</p><p className="text-xs text-slate-400">Catalyst must have hazmat endorsement</p></div>
            </label>}
          </CardContent></Card>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setStep("mode")}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={()=>setStep("financial")}>Continue <ChevronRight className="w-5 h-5 ml-2"/></Button>
        </div>
      </div>)}
      {step==="financial"&&(<div className="space-y-5">
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><DollarSign className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent"/>Rate & Compensation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Rate Type</label><Select value={rateType} onValueChange={setRateType}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="flat_rate">Flat Rate</SelectItem><SelectItem value="per_mile">Per Mile</SelectItem><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="per_hour">Hourly</SelectItem></SelectContent></Select></div>
              <div><label className={lb}>Base Rate ($)</label><Input type="number" value={baseRate} onChange={(e:any)=>setBaseRate(e.target.value)} placeholder="0.00" className={ic}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Min Charge ($)</label><Input type="number" value={minChg} onChange={(e:any)=>setMinChg(e.target.value)} placeholder="Optional" className={ic}/></div>
              <div><label className={lb}>Max Charge ($)</label><Input type="number" value={maxChg} onChange={(e:any)=>setMaxChg(e.target.value)} placeholder="Optional" className={ic}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Fuel Surcharge Type</label><Select value={fuelType} onValueChange={setFuelType}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="doe_index">DOE Index</SelectItem><SelectItem value="fixed">Fixed %</SelectItem><SelectItem value="variable">Variable</SelectItem></SelectContent></Select></div>
              {fuelType!=="none"&&<div><label className={lb}>Fuel Surcharge Value</label><Input type="number" value={fuelVal} onChange={(e:any)=>setFuelVal(e.target.value)} placeholder="%" className={ic}/></div>}
            </div>
          </CardContent></Card>

        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Calendar className="w-5 h-5 text-blue-500"/>Payment Terms</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lb}>Payment Terms (Days)</label><Input type="number" value={payDays} onChange={(e:any)=>setPayDays(e.target.value)} placeholder="30" className={ic}/></div>
              <div><label className={lb}>Pay Frequency</label><Select value={payFreq} onValueChange={setPayFreq}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="per_load">Per Load</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="net_30">Net 30</SelectItem><SelectItem value="net_45">Net 45</SelectItem><SelectItem value="net_60">Net 60</SelectItem></SelectContent></Select></div>
            </div>
            <div className={cn("p-3 rounded-xl border",isLight?"bg-blue-50 border-blue-200":"bg-blue-500/10 border-blue-500/30")}>
              <p className={cn("font-bold text-xs mb-2",isLight?"text-blue-700":"text-blue-400")}>Quick Pay Option</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Discount (%)</label><Input type="number" value={qpDisc} onChange={(e:any)=>setQpDisc(e.target.value)} placeholder="e.g. 2" className={ic}/></div>
                <div><label className={lb}>Quick Pay Days</label><Input type="number" value={qpDays} onChange={(e:any)=>setQpDays(e.target.value)} placeholder="e.g. 5" className={ic}/></div>
              </div>
            </div>
          </CardContent></Card>

        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><Shield className="w-5 h-5 text-orange-500"/>Insurance Requirements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lb}>General Liability ($)</label><Input type="number" value={insAmt} onChange={(e:any)=>setInsAmt(e.target.value)} className={ic}/></div>
              <div><label className={lb}>Liability Limit ($)</label><Input type="number" value={liab} onChange={(e:any)=>setLiab(e.target.value)} className={ic}/></div>
              <div><label className={lb}>Cargo Insurance ($)</label><Input type="number" value={cargo} onChange={(e:any)=>setCargo(e.target.value)} className={ic}/></div>
            </div>
          </CardContent></Card>

        <div><label className={lb}>Additional Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Special instructions, exceptions, or additional terms..." className={cn("w-full p-3 text-sm",ic)}/></div>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setStep("parties")}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!baseRate} onClick={()=>setStep("lanes")}>Continue <ChevronRight className="w-5 h-5 ml-2"/></Button>
        </div>
      </div>)}
      {step==="lanes"&&(<div className="space-y-5">
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><MapPin className="w-5 h-5 text-blue-500"/>Lane Commitments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className={cn("text-xs",mt)}>Add specific lane commitments for long-term or MSA contracts. Optional for spot rates.</p>
            {lanes.map((l,i)=>(<div key={i} className={cn("p-4 rounded-xl border space-y-3",cl)}>
              <div className="flex items-center justify-between"><p className={cn("font-bold text-xs",vl)}>Lane {i+1}</p><Button size="sm" variant="ghost" onClick={()=>setLanes(lanes.filter((_,j)=>j!==i))} className="h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5 text-red-400"/></Button></div>
              <div className="grid grid-cols-4 gap-2">
                <div><label className={lb}>Origin City</label><Input value={l.oC} onChange={(e:any)=>updateLane(i,"oC",e.target.value)} placeholder="City" className={ic}/></div>
                <div><label className={lb}>State</label><Input value={l.oS} onChange={(e:any)=>updateLane(i,"oS",e.target.value)} placeholder="ST" className={ic}/></div>
                <div><label className={lb}>Dest City</label><Input value={l.dC} onChange={(e:any)=>updateLane(i,"dC",e.target.value)} placeholder="City" className={ic}/></div>
                <div><label className={lb}>State</label><Input value={l.dS} onChange={(e:any)=>updateLane(i,"dS",e.target.value)} placeholder="ST" className={ic}/></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div><label className={lb}>Rate ($)</label><Input type="number" value={l.rate} onChange={(e:any)=>updateLane(i,"rate",e.target.value)} placeholder="0" className={ic}/></div>
                <div><label className={lb}>Type</label><Select value={l.rt} onValueChange={v=>updateLane(i,"rt",v)}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="flat">Flat</SelectItem><SelectItem value="per_mile">Per Mile</SelectItem></SelectContent></Select></div>
                <div><label className={lb}>Volume</label><Input type="number" value={l.vol} onChange={(e:any)=>updateLane(i,"vol",e.target.value)} placeholder="Loads" className={ic}/></div>
                <div><label className={lb}>Period</label><Select value={l.vp} onValueChange={v=>updateLane(i,"vp",v)}><SelectTrigger className={ic}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent></Select></div>
              </div>
            </div>))}
            <Button variant="outline" onClick={()=>setLanes([...lanes,{oC:"",oS:"",dC:"",dS:"",rate:"",rt:"flat",vol:"",vp:"monthly"}])} className={cn("w-full rounded-xl",isLight?"border-slate-200":"border-slate-700")}><Plus className="w-4 h-4 mr-2"/>Add Lane</Button>
          </CardContent></Card>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setStep("financial")}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={genMut.isPending} onClick={doGen}>{genMut.isPending?<><Clock className="w-4 h-4 mr-2 animate-spin"/>Generating...</>:<><EsangIcon className="w-4 h-4 mr-2"/>Generate Agreement</>}</Button>
        </div>
      </div>)}
      {step==="review"&&(<div className="space-y-5">
        <div className={cn("flex items-center justify-between p-4 rounded-xl border",isLight?"bg-green-50 border-green-200":"bg-green-500/10 border-green-500/30")}>
          <div className="flex items-center gap-3"><EsangIcon className="w-5 h-5 text-green-500"/><div><p className={cn("font-bold text-sm",vl)}>Agreement #{agNum}</p><p className="text-xs text-slate-400">{agType.replace(/_/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase())} · {dur.replace(/_/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase())}</p></div></div>
          <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-400 border border-purple-500/30 text-xs font-bold">Draft</Badge>
        </div>
        <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2",tc)}><FileText className="w-5 h-5 text-blue-500"/>Agreement Content</CardTitle></CardHeader>
          <CardContent><pre className={cn("text-xs whitespace-pre-wrap leading-relaxed p-4 rounded-xl max-h-[400px] overflow-y-auto font-mono",cl)}>{genContent||"Agreement content will appear here after generation."}</pre></CardContent>
        </Card>
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3")}>
          {[{l:"Base Rate",v:`$${parseFloat(baseRate||"0").toLocaleString()}`},{l:"Payment",v:`Net ${payDays} days`},{l:"Frequency",v:payFreq.replace(/_/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase())},{l:"Equipment",v:eqTypes.map(e=>e.replace(/_/g," ")).join(", ")}].map(x=>(<div key={x.l} className={cl}><p className="text-[10px] text-slate-400 uppercase">{x.l}</p><p className={vl}>{x.v}</p></div>))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setStep("lanes")}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button variant="outline" className={cn("rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>downloadAgreementPdf({agreementNumber:agNum,agreementType:agType,contractDuration:dur,status:"draft",generatedContent:genContent,partyAName:user?.name||roleConfig.partyALabel,partyARole:user?.role||"SHIPPER",partyBName:bName,partyBCompany:bComp,partyBRole:roleConfig.partyBRole,baseRate,rateType,paymentTermDays:parseInt(payDays)||30,payFrequency:payFreq,fuelSurchargeType:fuelType,fuelSurchargeValue:fuelVal,minInsuranceAmount:insAmt,liabilityLimit:liab,cargoInsuranceRequired:cargo,effectiveDate:effDate,expirationDate:expDate,equipmentTypes:eqTypes,hazmatRequired:hazmat,lanes:lanes.filter(l=>l.oC&&l.dC)})}><Download className="w-4 h-4 mr-2"/>Download</Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={()=>setStep("sign")}>Proceed to Sign <ChevronRight className="w-5 h-5 ml-2"/></Button>
        </div>
      </div>)}
      {step==="sign"&&(<div className="space-y-5">
        <div className={cn("flex items-center justify-between p-4 rounded-xl border",isLight?"bg-blue-50 border-blue-200":"bg-blue-500/10 border-blue-500/30")}>
          <div className="flex items-center gap-3"><EsangIcon className="w-5 h-5 text-blue-500"/><div><p className={cn("font-bold text-sm",vl)}>Agreement #{agNum}</p><p className="text-xs text-slate-400">{bComp||bName} · ${parseFloat(baseRate||"0").toLocaleString()} {rateType.replace(/_/g," ")}</p></div></div>
          <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-400 border border-purple-500/30 text-xs font-bold">Ready to Sign</Badge>
        </div>
        <Card className={cc}><CardContent className="p-5">
          <GradientSignaturePad documentTitle={`${agType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Agreement`} signerName={user?.name||user?.firstName||`${roleConfig.partyALabel} Representative`} onSign={(d:string)=>setSigData(d)} onClear={()=>setSigData(null)} legalText="By electronically signing this document, I acknowledge and agree that my electronic signature holds the same legal validity as a handwritten signature, pursuant to the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. ch. 96) and the Uniform Electronic Transactions Act (UETA)."/>
        </CardContent></Card>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setStep("review")}><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button>
          <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!sigData||signMut.isPending} onClick={doSign}>{signMut.isPending?<><Clock className="w-4 h-4 mr-2 animate-spin"/>Signing...</>:<><Shield className="w-4 h-4 mr-2"/>Sign & Execute</>}</Button>
        </div>
      </div>)}
      {step==="complete"&&(<div className="space-y-5">
        <div className={cn("text-center py-12 rounded-2xl border",cc)}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"><CheckCircle className="w-10 h-10 text-green-500"/></div>
          <h2 className={cn("text-2xl font-bold mb-2",isLight?"text-slate-800":"text-white")}>Agreement Signed</h2>
          <p className={cn("text-sm max-w-md mx-auto",mt)}>Your Gradient Ink signature has been recorded for agreement #{agNum}. Awaiting counter-party signature to fully execute.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Badge className="bg-green-500/15 text-green-500 border border-green-500/30 text-xs font-bold"><Shield className="w-3 h-3 mr-1"/>ESIGN Act Compliant</Badge>
            <Badge className="bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 text-purple-400 border border-purple-500/30 text-xs font-bold"><EsangIcon className="w-3 h-3 mr-1"/>Gradient Ink Verified</Badge>
          </div>
          <div className={cn("mx-auto mt-8 max-w-sm p-5 rounded-xl border text-left",cl)}>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-xs text-slate-400">Agreement</span><span className={vl}>#{agNum}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">{roleConfig.partyBLabel}</span><span className={vl}>{bComp||bName||"TBD"}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Rate</span><span className="font-bold text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${parseFloat(baseRate||"0").toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Payment</span><span className={vl}>Net {payDays} · {payFreq.replace(/_/g," ")}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-400">Status</span><Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 border text-[10px]">Pending Counter-Signature</Badge></div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="outline" className={cn("rounded-xl font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>setLocation("/agreements")}><ArrowLeft className="w-4 h-4 mr-2"/>Agreements</Button>
            <Button variant="outline" className={cn("rounded-xl font-bold",isLight?"border-slate-200":"border-slate-700")} onClick={()=>downloadAgreementPdf({agreementNumber:agNum,agreementType:agType,contractDuration:dur,status:"pending_signature",generatedContent:genContent,partyAName:user?.name||roleConfig.partyALabel,partyARole:user?.role||"SHIPPER",partyBName:bName,partyBCompany:bComp,partyBRole:roleConfig.partyBRole,baseRate,rateType,paymentTermDays:parseInt(payDays)||30,fuelSurchargeType:fuelType,fuelSurchargeValue:fuelVal,minInsuranceAmount:insAmt,liabilityLimit:liab,cargoInsuranceRequired:cargo,effectiveDate:effDate,expirationDate:expDate,equipmentTypes:eqTypes,hazmatRequired:hazmat})}><Download className="w-4 h-4 mr-2"/>Download PDF</Button>
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={()=>setLocation("/documents")}><FileText className="w-4 h-4 mr-2"/>View Documents</Button>
          </div>
        </div>
      </div>)}
    </div>
  );
}
