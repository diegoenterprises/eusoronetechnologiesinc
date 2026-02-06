/**
 * AGREEMENT BUILDER — Wizard-style contract generator
 * 100% Dynamic - No mock data
 * Steps: Type -> Parties -> Terms -> Lanes -> Review -> Generate
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  FileText, ArrowRight, ArrowLeft, Check, Truck, Handshake, Building2,
  Users, Shield, RefreshCw, MapPin, Scale, PenLine, DollarSign, Calendar,
  Plus, Trash2, AlertTriangle, CheckCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "type", label: "Agreement Type", icon: FileText },
  { id: "parties", label: "Parties", icon: Users },
  { id: "terms", label: "Financial Terms", icon: DollarSign },
  { id: "lanes", label: "Lanes & Equipment", icon: MapPin },
  { id: "review", label: "Review & Generate", icon: Check },
];

const AGREEMENT_TYPES = [
  { value: "carrier_shipper", label: "Carrier-Shipper Agreement", icon: Truck, desc: "Standard transportation agreement between a shipper and carrier" },
  { value: "broker_carrier", label: "Broker-Carrier Agreement", icon: Handshake, desc: "Brokerage agreement between a freight broker and carrier" },
  { value: "broker_shipper", label: "Broker-Shipper Agreement", icon: Building2, desc: "Brokerage agreement between a broker and shipper" },
  { value: "carrier_driver", label: "Carrier-Driver Agreement", icon: Users, desc: "Independent contractor agreement between carrier and driver" },
  { value: "escort_service", label: "Escort Service Agreement", icon: Shield, desc: "Escort/pilot car service agreement for oversized loads" },
  { value: "catalyst_dispatch", label: "Dispatch Service Agreement", icon: RefreshCw, desc: "Dispatch service agreement for catalyst/dispatcher" },
  { value: "lane_commitment", label: "Lane Commitment Agreement", icon: MapPin, desc: "Volume commitment on specific origin-destination lanes" },
  { value: "master_service", label: "Master Service Agreement", icon: Scale, desc: "Umbrella agreement covering all future business" },
  { value: "nda", label: "Non-Disclosure Agreement", icon: FileText, desc: "Confidentiality agreement between parties" },
  { value: "custom", label: "Custom Agreement", icon: PenLine, desc: "Build a custom agreement from scratch" },
];

interface LaneEntry {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  rate: number;
  rateType: string;
  volumeCommitment?: number;
  volumePeriod?: string;
}

interface AccessorialEntry {
  type: string;
  rate: number;
  unit: string;
  description: string;
}

export default function AgreementBuilder() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [agreementType, setAgreementType] = useState("");
  const [contractDuration, setContractDuration] = useState("short_term");

  // Parties
  const [partyBUserId, setPartyBUserId] = useState<number>(0);
  const [partyBCompanyId, setPartyBCompanyId] = useState<number | undefined>();
  const [partyBRole, setPartyBRole] = useState("");
  const [partyBSearch, setPartyBSearch] = useState("");

  // Strategic inputs
  const [inputs, setInputs] = useState<Record<string, unknown>>({});

  // Financial
  const [rateType, setRateType] = useState("per_mile");
  const [baseRate, setBaseRate] = useState<number>(0);
  const [fuelSurchargeType, setFuelSurchargeType] = useState("none");
  const [fuelSurchargeValue, setFuelSurchargeValue] = useState<number>(0);
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [quickPayDiscount, setQuickPayDiscount] = useState<number>(0);
  const [quickPayDays, setQuickPayDays] = useState<number>(0);
  const [minInsurance, setMinInsurance] = useState<number>(1000000);
  const [liabilityLimit, setLiabilityLimit] = useState<number>(1000000);
  const [cargoInsurance, setCargoInsurance] = useState<number>(100000);

  // Operational
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [hazmatRequired, setHazmatRequired] = useState(false);
  const [twicRequired, setTwicRequired] = useState(false);
  const [tankerEndorsement, setTankerEndorsement] = useState(false);

  // Lanes
  const [lanes, setLanes] = useState<LaneEntry[]>([]);
  const [accessorials, setAccessorials] = useState<AccessorialEntry[]>([]);

  // Dates
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");

  // Search users
  const usersQuery = (trpc as any).users.search?.useQuery(
    { query: partyBSearch },
    { enabled: partyBSearch.length >= 2 }
  );

  const generateMutation = (trpc as any).agreements.generate.useMutation({
    onSuccess: (data: any) => {
      setIsGenerating(false);
      navigate(`/agreement/${data.id}`);
    },
    onError: () => setIsGenerating(false),
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate({
      agreementType,
      contractDuration,
      partyBUserId,
      partyBCompanyId,
      partyBRole,
      strategicInputs: {
        ...inputs,
        partyAName: "Current User",
        partyBName: partyBSearch || "Counterparty",
      },
      rateType,
      baseRate: baseRate || undefined,
      fuelSurchargeType,
      fuelSurchargeValue: fuelSurchargeValue || undefined,
      paymentTermDays,
      quickPayDiscount: quickPayDiscount || undefined,
      quickPayDays: quickPayDays || undefined,
      minInsuranceAmount: minInsurance || undefined,
      liabilityLimit: liabilityLimit || undefined,
      cargoInsuranceRequired: cargoInsurance || undefined,
      equipmentTypes: equipmentTypes.length ? equipmentTypes : undefined,
      hazmatRequired,
      twicRequired,
      tankerEndorsementRequired: tankerEndorsement,
      lanes: lanes.length ? lanes.map(l => ({
        origin: { city: l.originCity, state: l.originState },
        destination: { city: l.destinationCity, state: l.destinationState },
        rate: l.rate,
        rateType: l.rateType,
        volumeCommitment: l.volumeCommitment,
        volumePeriod: l.volumePeriod,
      })) : undefined,
      accessorialSchedule: accessorials.length ? accessorials : undefined,
      effectiveDate: effectiveDate || undefined,
      expirationDate: expirationDate || undefined,
      autoRenew,
      notes: notes || undefined,
    });
  };

  const addLane = () => {
    setLanes([...lanes, { originCity: "", originState: "", destinationCity: "", destinationState: "", rate: 0, rateType: "per_mile" }]);
  };

  const removeLane = (idx: number) => setLanes(lanes.filter((_, i) => i !== idx));

  const updateLane = (idx: number, field: string, value: any) => {
    const updated = [...lanes];
    (updated[idx] as any)[field] = value;
    setLanes(updated);
  };

  const addAccessorial = () => {
    setAccessorials([...accessorials, { type: "", rate: 0, unit: "flat", description: "" }]);
  };

  const removeAccessorial = (idx: number) => setAccessorials(accessorials.filter((_, i) => i !== idx));

  const canAdvance = () => {
    if (step === 0) return !!agreementType;
    if (step === 1) return partyBUserId > 0 || partyBSearch.length > 0;
    return true;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Agreement Builder
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Fill in strategic inputs to auto-generate a legally-formatted agreement
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => {
          const StepIcon = s.icon;
          const isActive = idx === step;
          const isCompleted = idx < step;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => idx <= step && setStep(idx)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors",
                  isActive && "bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 text-white border border-[#1473FF]/30",
                  isCompleted && "bg-green-500/10 text-green-400 cursor-pointer",
                  !isActive && !isCompleted && "text-slate-500"
                )}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                {s.label}
              </button>
              {idx < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {/* STEP 0: Agreement Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Select Agreement Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AGREEMENT_TYPES.map((t) => {
                  const TypeIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setAgreementType(t.value)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                        agreementType === t.value
                          ? "border-[#1473FF] bg-[#1473FF]/10"
                          : "border-slate-700/50 bg-slate-900/30 hover:border-slate-600"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        agreementType === t.value ? "bg-[#1473FF]/20" : "bg-slate-800"
                      )}>
                        <TypeIcon className={cn("w-5 h-5", agreementType === t.value ? "text-blue-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Separator className="bg-slate-700/50" />

              <div>
                <Label className="text-sm text-slate-300">Contract Duration</Label>
                <Select value={contractDuration} onValueChange={setContractDuration}>
                  <SelectTrigger className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spot">Spot (Single Load)</SelectItem>
                    <SelectItem value="short_term">Short-Term (30-90 days)</SelectItem>
                    <SelectItem value="long_term">Long-Term (6-12+ months)</SelectItem>
                    <SelectItem value="evergreen">Evergreen (Auto-renewing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 1: Parties */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Identify Counterparty</h2>
              <p className="text-sm text-slate-400">You are Party A. Search for the other party on the platform.</p>

              <div>
                <Label className="text-sm text-slate-300">Search User or Company</Label>
                <Input
                  placeholder="Search by name, email, or company..."
                  value={partyBSearch}
                  onChange={(e) => setPartyBSearch(e.target.value)}
                  className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg"
                />
                {usersQuery?.data && usersQuery.data.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {usersQuery.data.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setPartyBUserId(u.id);
                          setPartyBSearch(u.name || u.email || "");
                          setPartyBRole(u.role || "CARRIER");
                          setPartyBCompanyId(u.companyId || undefined);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                          partyBUserId === u.id ? "bg-[#1473FF]/10 border border-[#1473FF]/30" : "hover:bg-slate-800/50"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {(u.name || "?")[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-slate-400">{u.role} {u.companyId ? `- Company #${u.companyId}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {partyBUserId === 0 && partyBSearch.length >= 2 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    If the user is not on the platform yet, enter their name and we will create a placeholder. They can sign once they join.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Counterparty Role</Label>
                  <Select value={partyBRole} onValueChange={setPartyBRole}>
                    <SelectTrigger className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHIPPER">Shipper</SelectItem>
                      <SelectItem value="CARRIER">Carrier</SelectItem>
                      <SelectItem value="BROKER">Broker</SelectItem>
                      <SelectItem value="DRIVER">Driver</SelectItem>
                      <SelectItem value="ESCORT">Escort</SelectItem>
                      <SelectItem value="CATALYST">Catalyst/Dispatcher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Effective Date</Label>
                  <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Expiration Date</Label>
                  <Input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
                <div className="flex items-center gap-3 pt-7">
                  <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                  <Label className="text-sm text-slate-300">Auto-Renew</Label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financial Terms */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Financial Terms</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Rate Type</Label>
                  <Select value={rateType} onValueChange={setRateType}>
                    <SelectTrigger className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_mile">Per Mile</SelectItem>
                      <SelectItem value="flat_rate">Flat Rate</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_ton">Per Ton</SelectItem>
                      <SelectItem value="per_gallon">Per Gallon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Base Rate ($)</Label>
                  <Input type="number" step="0.01" value={baseRate || ""} onChange={e => setBaseRate(parseFloat(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Payment Terms (Days)</Label>
                  <Input type="number" value={paymentTermDays} onChange={e => setPaymentTermDays(parseInt(e.target.value) || 30)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
              </div>

              <Separator className="bg-slate-700/50" />
              <h3 className="text-sm font-medium text-slate-300">Fuel Surcharge</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Type</Label>
                  <Select value={fuelSurchargeType} onValueChange={setFuelSurchargeType}>
                    <SelectTrigger className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="doe_index">DOE Index</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fuelSurchargeType !== "none" && (
                  <div>
                    <Label className="text-sm text-slate-300">Value</Label>
                    <Input type="number" step="0.01" value={fuelSurchargeValue || ""} onChange={e => setFuelSurchargeValue(parseFloat(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                  </div>
                )}
              </div>

              <Separator className="bg-slate-700/50" />
              <h3 className="text-sm font-medium text-slate-300">Quick Pay</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Quick Pay Discount (%)</Label>
                  <Input type="number" step="0.5" value={quickPayDiscount || ""} onChange={e => setQuickPayDiscount(parseFloat(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Quick Pay Days</Label>
                  <Input type="number" value={quickPayDays || ""} onChange={e => setQuickPayDays(parseInt(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
              </div>

              <Separator className="bg-slate-700/50" />
              <h3 className="text-sm font-medium text-slate-300">Insurance & Liability</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-slate-300">Min. Insurance ($)</Label>
                  <Input type="number" value={minInsurance || ""} onChange={e => setMinInsurance(parseInt(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Liability Limit ($)</Label>
                  <Input type="number" value={liabilityLimit || ""} onChange={e => setLiabilityLimit(parseInt(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm text-slate-300">Cargo Insurance ($)</Label>
                  <Input type="number" value={cargoInsurance || ""} onChange={e => setCargoInsurance(parseInt(e.target.value) || 0)} className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Lanes & Equipment */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Lanes, Equipment & Accessorials</h2>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Equipment Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {["dry_van", "flatbed", "refrigerated", "tanker", "lowboy", "step_deck"].map(eq => (
                    <button
                      key={eq}
                      onClick={() => setEquipmentTypes(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq])}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                        equipmentTypes.includes(eq)
                          ? "bg-[#1473FF]/10 border-[#1473FF]/30 text-blue-400"
                          : "border-slate-700/50 text-slate-400 hover:border-slate-600"
                      )}
                    >
                      {eq.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <Switch checked={hazmatRequired} onCheckedChange={setHazmatRequired} />Hazmat Required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <Switch checked={twicRequired} onCheckedChange={setTwicRequired} />TWIC Required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <Switch checked={tankerEndorsement} onCheckedChange={setTankerEndorsement} />Tanker Endorsement
                  </label>
                </div>
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">Lane Commitments</h3>
                  <Button variant="outline" size="sm" className="border-slate-600 rounded-lg text-xs" onClick={addLane}>
                    <Plus className="w-3 h-3 mr-1" />Add Lane
                  </Button>
                </div>
                {lanes.length === 0 ? (
                  <p className="text-xs text-slate-500">No lanes added. Lanes are optional for most agreement types.</p>
                ) : (
                  <div className="space-y-3">
                    {lanes.map((lane, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Lane {idx + 1}</span>
                          <button onClick={() => removeLane(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input placeholder="Origin City" value={lane.originCity} onChange={e => updateLane(idx, "originCity", e.target.value)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                          <Input placeholder="State" value={lane.originState} onChange={e => updateLane(idx, "originState", e.target.value)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                          <Input placeholder="Dest City" value={lane.destinationCity} onChange={e => updateLane(idx, "destinationCity", e.target.value)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                          <Input placeholder="State" value={lane.destinationState} onChange={e => updateLane(idx, "destinationState", e.target.value)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input type="number" placeholder="Rate" step="0.01" value={lane.rate || ""} onChange={e => updateLane(idx, "rate", parseFloat(e.target.value) || 0)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                          <Select value={lane.rateType} onValueChange={v => updateLane(idx, "rateType", v)}>
                            <SelectTrigger className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_mile">Per Mile</SelectItem>
                              <SelectItem value="flat">Flat</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="Volume/period" value={lane.volumeCommitment || ""} onChange={e => updateLane(idx, "volumeCommitment", parseInt(e.target.value) || undefined)} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">Accessorial Charges</h3>
                  <Button variant="outline" size="sm" className="border-slate-600 rounded-lg text-xs" onClick={addAccessorial}>
                    <Plus className="w-3 h-3 mr-1" />Add Accessorial
                  </Button>
                </div>
                {accessorials.map((acc, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input placeholder="Type (detention, layover...)" value={acc.type} onChange={e => { const u = [...accessorials]; u[idx].type = e.target.value; setAccessorials(u); }} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8 flex-1" />
                    <Input type="number" placeholder="Rate" value={acc.rate || ""} onChange={e => { const u = [...accessorials]; u[idx].rate = parseFloat(e.target.value) || 0; setAccessorials(u); }} className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8 w-24" />
                    <Select value={acc.unit} onValueChange={v => { const u = [...accessorials]; u[idx].unit = v; setAccessorials(u); }}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700/50 rounded-lg text-xs h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={() => removeAccessorial(idx)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Review & Generate</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30 space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Agreement Details</h3>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p><span className="text-slate-500">Type:</span> {agreementType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <p><span className="text-slate-500">Duration:</span> {contractDuration.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <p><span className="text-slate-500">Counterparty:</span> {partyBSearch || "Not specified"} ({partyBRole})</p>
                    <p><span className="text-slate-500">Dates:</span> {effectiveDate || "TBD"} - {expirationDate || "TBD"}</p>
                    <p><span className="text-slate-500">Auto-Renew:</span> {autoRenew ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30 space-y-2">
                  <h3 className="text-sm font-medium text-slate-300">Financial Terms</h3>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p><span className="text-slate-500">Rate:</span> <span className="text-green-400">${baseRate.toLocaleString()}</span> {rateType.replace(/_/g, "/")}</p>
                    <p><span className="text-slate-500">Payment:</span> Net {paymentTermDays} days</p>
                    <p><span className="text-slate-500">Fuel Surcharge:</span> {fuelSurchargeType === "none" ? "None" : `${fuelSurchargeType} - ${fuelSurchargeValue}`}</p>
                    <p><span className="text-slate-500">Insurance:</span> ${minInsurance.toLocaleString()} / Cargo: ${cargoInsurance.toLocaleString()}</p>
                    {quickPayDays > 0 && <p><span className="text-slate-500">Quick Pay:</span> {quickPayDiscount}% off for {quickPayDays} day pay</p>}
                  </div>
                </div>

                {lanes.length > 0 && (
                  <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30 space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Lane Commitments ({lanes.length})</h3>
                    {lanes.map((l, i) => (
                      <p key={i} className="text-xs text-slate-400">
                        {l.originCity}, {l.originState} &rarr; {l.destinationCity}, {l.destinationState} — ${l.rate} {l.rateType}
                      </p>
                    ))}
                  </div>
                )}

                {equipmentTypes.length > 0 && (
                  <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30 space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Requirements</h3>
                    <div className="flex flex-wrap gap-1">
                      {equipmentTypes.map(e => <Badge key={e} className="bg-slate-700/50 text-slate-400 border-0 text-xs">{e.replace(/_/g, " ")}</Badge>)}
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                      {hazmatRequired && <span className="text-orange-400">Hazmat</span>}
                      {twicRequired && <span className="text-blue-400">TWIC</span>}
                      {tankerEndorsement && <span className="text-purple-400">Tanker</span>}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-slate-300">Notes</Label>
                <Textarea
                  placeholder="Additional notes for the agreement..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="mt-1.5 bg-slate-900/50 border-slate-700/50 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  Platform transaction fees apply per load as outlined in the EusoTrip Terms of Service. This agreement governs the business relationship between the parties.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="border-slate-600 rounded-lg"
          onClick={() => step === 0 ? navigate("/agreement-management") : setStep(step - 1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />{step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
          >
            Next<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><FileText className="w-4 h-4 mr-2" />Generate Agreement</>}
          </Button>
        )}
      </div>
    </div>
  );
}
