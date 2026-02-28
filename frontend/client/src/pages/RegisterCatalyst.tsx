/**
 * CATALYST REGISTRATION PAGE
 * Multi-step registration for trucking companies
 * Based on EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationWizard, WizardStep } from "@/components/registration/RegistrationWizard";
import { ComplianceIntegrations, PasswordFields, validatePassword, emptyComplianceIds } from "@/components/registration/ComplianceIntegrations";
import type { ComplianceIds } from "@/components/registration/ComplianceIntegrations";
import { FMCSALookup } from "@/components/registration/FMCSALookup";
import type { FMCSAData } from "@/components/registration/FMCSALookup";
import { ProductPicker, CompliancePreview } from "@/components/registration/CompliancePreview";
import StripeConnectStep from "@/components/registration/StripeConnectStep";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Truck, Building2, FileText, Shield, CreditCard, 
  Upload, CheckCircle, AlertCircle, User, Mail, Phone,
  MapPin, Hash, Search, Loader2, Lock, ShieldCheck, Landmark
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DatePicker from "@/components/DatePicker";
import CanopyConnectButton from "@/components/CanopyConnectButton";
import type { CanopyPolicyData } from "@/components/CanopyConnectButton";

interface CatalystFormData {
  // Step 1: Company Information
  companyName: string;
  dba: string;
  usdotNumber: string;
  mcNumber: string;
  einNumber: string;
  
  // Step 2: FMCSA Verification (auto-filled from SAFER lookup)
  operatingStatus: string;
  entityType: string;
  physicalAddress: string;
  mailingAddress: string;
  phoneNumber: string;
  saferVerified: boolean;
  
  // Step 3: Authority & Endorsements
  hasHazmatAuthority: boolean;
  hazmatAuthorityNumber: string;
  hazmatClasses: string[];
  catalystType: string[];
  equipmentTypes: string[];
  products: string[];
  
  // Step 3b: Operating States
  processAgentStates: string[];
  
  // Step 4: Contact Information
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  dispatchEmail: string;
  dispatchPhone: string;
  
  // Step 5: Insurance
  liabilityCatalyst: string;
  liabilityPolicy: string;
  liabilityCoverage: string;
  liabilityExpiration: string;
  cargoCatalyst: string;
  cargoPolicy: string;
  cargoCoverage: string;
  cargoExpiration: string;
  
  // Step 6: Fleet Information
  powerUnits: string;
  drivers: string;
  hazmatCertifiedDrivers: string;
  
  // Step 7: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Step 8: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 9: Compliance Integrations
  complianceIds: ComplianceIds;
  
  // Step 10: Payment Setup
  businessType: "individual" | "company" | "";
  
  // Step 11: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptSafetyPolicy: boolean;
}

const initialFormData: CatalystFormData = {
  companyName: "",
  dba: "",
  usdotNumber: "",
  mcNumber: "",
  einNumber: "",
  operatingStatus: "",
  entityType: "",
  physicalAddress: "",
  mailingAddress: "",
  phoneNumber: "",
  saferVerified: false,
  hasHazmatAuthority: false,
  hazmatAuthorityNumber: "",
  hazmatClasses: [],
  catalystType: [],
  equipmentTypes: [],
  products: [],
  processAgentStates: [],
  primaryContactName: "",
  primaryContactTitle: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  dispatchEmail: "",
  dispatchPhone: "",
  liabilityCatalyst: "",
  liabilityPolicy: "",
  liabilityCoverage: "",
  liabilityExpiration: "",
  cargoCatalyst: "",
  cargoPolicy: "",
  cargoCoverage: "",
  cargoExpiration: "",
  powerUnits: "",
  drivers: "",
  hazmatCertifiedDrivers: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  password: "",
  confirmPassword: "",
  complianceIds: emptyComplianceIds,
  businessType: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptSafetyPolicy: false,
};

const EQUIPMENT_TYPES = [
  { value: "liquid_tank", label: "Liquid Tank Trailer (MC-306/DOT-406)", hazmat: true },
  { value: "gas_tank", label: "Pressurized Gas Tank (MC-331)", hazmat: true },
  { value: "dry_van", label: "Dry Van", hazmat: false },
  { value: "reefer", label: "Refrigerated (Reefer)", hazmat: false },
  { value: "flatbed", label: "Flatbed", hazmat: false },
  { value: "bulk_hopper", label: "Dry Bulk / Hopper", hazmat: false },
  { value: "hazmat_van", label: "Hazmat Box / Van", hazmat: true },
  { value: "cryogenic", label: "Cryogenic Tank (MC-338)", hazmat: true },
  { value: "food_grade_tank", label: "Food-Grade Liquid Tank (Milk, Juice, Oil)", hazmat: false },
  { value: "water_tank", label: "Water Tank (Potable / Non-Potable)", hazmat: false },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const HAZMAT_CLASSES = [
  { value: "2", label: "Class 2 - Gases" },
  { value: "3", label: "Class 3 - Flammable Liquids" },
  { value: "4", label: "Class 4 - Flammable Solids" },
  { value: "5", label: "Class 5 - Oxidizers & Organic Peroxides" },
  { value: "6", label: "Class 6 - Toxic & Infectious" },
  { value: "7", label: "Class 7 - Radioactive" },
  { value: "8", label: "Class 8 - Corrosives" },
  { value: "9", label: "Class 9 - Miscellaneous" },
];

export default function RegisterCatalyst() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<CatalystFormData>(initialFormData);
  const [fmcsaData, setFmcsaData] = useState<FMCSAData | null>(null);

  const updateFormData = (updates: Partial<CatalystFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleFMCSADataLoaded = (data: FMCSAData) => {
    setFmcsaData(data);
    if (!data.verified) return;

    // Auto-populate 30+ fields from FMCSA response
    const cp = data.companyProfile;
    const auth = data.authority;
    const safety = data.safety;
    const ins = data.insurance;

    const updates: Partial<CatalystFormData> = {
      saferVerified: true,
      operatingStatus: auth?.operatingStatus || "",
      entityType: auth?.catalystOperation || "CATALYST",
    };

    if (cp) {
      updates.companyName = cp.legalName || formData.companyName;
      updates.dba = cp.dba || formData.dba;
      updates.physicalAddress = [cp.physicalAddress.street, cp.physicalAddress.city, cp.physicalAddress.state, cp.physicalAddress.zip].filter(Boolean).join(", ");
      updates.streetAddress = cp.physicalAddress.street || formData.streetAddress;
      updates.city = cp.physicalAddress.city || formData.city;
      updates.state = cp.physicalAddress.state || formData.state;
      updates.zipCode = cp.physicalAddress.zip || formData.zipCode;
      updates.phoneNumber = cp.phone || formData.phoneNumber;
      updates.powerUnits = String(cp.fleetSize || formData.powerUnits);
      updates.drivers = String(cp.driverCount || formData.drivers);
    }

    if (auth) {
      updates.mcNumber = auth.docketNumbers?.[0]?.docketNumber
        ? `MC-${auth.docketNumbers[0].docketNumber}`
        : formData.mcNumber;
    }

    if (data.hazmat?.authorized) {
      updates.hasHazmatAuthority = true;
    }

    updateFormData(updates);
    toast.success("FMCSA data retrieved — fields auto-populated", {
      description: data.warnings?.length ? `${data.warnings.length} warning(s) found` : undefined,
    });
  };

  const registerMutation = (trpc as any).registration.registerCatalyst.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Your catalyst account is pending USDOT verification." });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  const handleComplete = async () => {
    const complianceIds = Object.fromEntries(
      Object.entries(formData.complianceIds).filter(([_, v]) => v && String(v).trim())
    );

    await registerMutation.mutateAsync({
      companyName: formData.companyName,
      dba: formData.dba || undefined,
      usdotNumber: formData.usdotNumber,
      mcNumber: formData.mcNumber || undefined,
      einNumber: formData.einNumber || undefined,
      operatingStatus: formData.operatingStatus || undefined,
      entityType: formData.entityType || undefined,
      contactName: formData.primaryContactName,
      contactTitle: formData.primaryContactTitle || undefined,
      contactEmail: formData.primaryContactEmail,
      contactPhone: formData.primaryContactPhone,
      dispatchEmail: formData.dispatchEmail || undefined,
      dispatchPhone: formData.dispatchPhone || undefined,
      password: formData.password,
      streetAddress: formData.streetAddress || formData.physicalAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      fleetSize: {
        powerUnits: Number(formData.powerUnits) || 0,
        trailers: 0,
        drivers: Number(formData.drivers) || 0,
      },
      hazmatEndorsed: formData.hasHazmatAuthority,
      hazmatAuthorityNumber: formData.hazmatAuthorityNumber || undefined,
      hazmatCertifiedDrivers: Number(formData.hazmatCertifiedDrivers) || undefined,
      hazmatClasses: formData.hazmatClasses.length > 0
        ? formData.hazmatClasses.filter(c => ["2","3","4","5","6","7","8","9"].includes(c)) as any
        : formData.hasHazmatAuthority ? ["3" as const] : [],
      tankerEndorsed: formData.equipmentTypes.some((t: string) => ["liquid_tank","gas_tank","cryogenic","food_grade_tank","water_tank"].includes(t)),
      catalystType: formData.catalystType.length > 0 ? formData.catalystType : undefined,
      equipmentTypes: formData.equipmentTypes.length > 0 ? formData.equipmentTypes : undefined,
      products: formData.products.length > 0 ? formData.products : undefined,
      processAgentStates: formData.processAgentStates.length > 0 ? formData.processAgentStates : undefined,
      liabilityCarrier: formData.liabilityCatalyst || undefined,
      liabilityPolicy: formData.liabilityPolicy || undefined,
      liabilityCoverage: formData.liabilityCoverage || undefined,
      liabilityExpiration: formData.liabilityExpiration || undefined,
      cargoCarrier: formData.cargoCatalyst || undefined,
      cargoPolicy: formData.cargoPolicy || undefined,
      cargoCoverage: formData.cargoCoverage || undefined,
      cargoExpiration: formData.cargoExpiration || undefined,
      complianceIds: Object.keys(complianceIds).length > 0 ? complianceIds : undefined,
    });

    // Store business type preference for post-login Stripe Connect onboarding
    if (formData.businessType) {
      try { localStorage.setItem("eusotrip_stripe_biz_type", formData.businessType); } catch {}
    }
  };

  const steps: WizardStep[] = [
    {
      id: "usdot",
      title: "USDOT Verification",
      description: "Enter your USDOT number for FMCSA verification",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <FMCSALookup
            mode="both"
            dotNumber={formData.usdotNumber}
            mcNumber={formData.mcNumber}
            onDotChange={(v) => updateFormData({ usdotNumber: v })}
            onMcChange={(v) => updateFormData({ mcNumber: v })}
            onDataLoaded={handleFMCSADataLoaded}
            fmcsaData={fmcsaData}
          />

          <div className="space-y-2">
            <Label htmlFor="einNumber" className="text-slate-300">
              EIN (Tax ID) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="einNumber"
              value={formData.einNumber}
              onChange={(e: any) => updateFormData({ einNumber: e.target.value })}
              placeholder="XX-XXXXXXX"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {formData.saferVerified && formData.companyName && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-sm text-green-300">
                <strong>{formData.companyName}</strong> — verified & auto-populated from FMCSA
              </span>
            </div>
          )}
        </div>
      ),
      validate: () => {
        if (!formData.usdotNumber || !formData.einNumber) {
          toast.error("Please enter USDOT number and EIN");
          return false;
        }
        if (fmcsaData?.isBlocked) {
          toast.error("Registration blocked", { description: fmcsaData.blockReason || "Catalyst not authorized to operate" });
          return false;
        }
        return true;
      },
    },
    {
      id: "authority",
      title: "Operating Authority",
      description: "Hazmat authority and equipment types",
      icon: <Truck className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-300 font-medium">Hazmat Authority Required</p>
                <p className="text-xs text-slate-400 mt-1">
                  To transport hazardous materials on EusoTrip, you must have valid hazmat authority 
                  from FMCSA and appropriate insurance coverage.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-lg bg-slate-700/30">
            <Checkbox
              id="hasHazmatAuthority"
              checked={formData.hasHazmatAuthority}
              onCheckedChange={(checked) => updateFormData({ hasHazmatAuthority: checked as boolean })}
            />
            <Label htmlFor="hasHazmatAuthority" className="text-slate-300 cursor-pointer">
              I have valid Hazmat Operating Authority
            </Label>
          </div>

          {formData.hasHazmatAuthority && (
            <div className="space-y-2">
              <Label htmlFor="hazmatAuthorityNumber" className="text-slate-300">
                Hazmat Authority Number
              </Label>
              <Input
                id="hazmatAuthorityNumber"
                value={formData.hazmatAuthorityNumber}
                onChange={(e: any) => updateFormData({ hazmatAuthorityNumber: e.target.value })}
                placeholder="HM-123456"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Equipment Types</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EQUIPMENT_TYPES.map((equip: any) => (
                <div key={equip.value} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                  <Checkbox
                    id={equip.value}
                    checked={formData.equipmentTypes.includes(equip.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ equipmentTypes: [...formData.equipmentTypes, equip.value] });
                      } else {
                        updateFormData({ equipmentTypes: formData.equipmentTypes.filter((t: any) => t !== equip.value) });
                      }
                    }}
                  />
                  <Label htmlFor={equip.value} className="text-sm text-slate-300 cursor-pointer">
                    {equip.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {formData.hasHazmatAuthority && (
            <div className="space-y-2">
              <Label className="text-slate-300">Hazmat Classes Transported</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {HAZMAT_CLASSES.map((hc: any) => (
                  <div key={hc.value} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                    <Checkbox
                      id={`hc-${hc.value}`}
                      checked={formData.hazmatClasses.includes(hc.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFormData({ hazmatClasses: [...formData.hazmatClasses, hc.value] });
                        } else {
                          updateFormData({ hazmatClasses: formData.hazmatClasses.filter((c: any) => c !== hc.value) });
                        }
                      }}
                    />
                    <Label htmlFor={`hc-${hc.value}`} className="text-xs text-slate-300 cursor-pointer">
                      {hc.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Product Picker — filtered by selected equipment ─── */}
          <ProductPicker
            trailerTypes={formData.equipmentTypes}
            selectedProducts={formData.products}
            onProductsChange={(products) => updateFormData({ products })}
          />

          <div className="space-y-2">
            <Label className="text-slate-300">Operating States</Label>
            <p className="text-xs text-slate-500">Select all states where your fleet operates. This determines state-specific compliance documents (IFTA, weight-distance tax, oversize permits, CARB, etc.)</p>
            <div className="flex flex-wrap gap-1.5">
              {US_STATES.map((st: any) => (
                <Badge
                  key={st}
                  variant={formData.processAgentStates.includes(st) ? "default" : "outline"}
                  className={`cursor-pointer text-xs px-2 py-1 transition-all ${
                    formData.processAgentStates.includes(st)
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                      : "bg-slate-700/30 text-slate-400 border-slate-600 hover:border-slate-400 hover:text-slate-300"
                  }`}
                  onClick={() => {
                    if (formData.processAgentStates.includes(st)) {
                      updateFormData({ processAgentStates: formData.processAgentStates.filter((s: any) => s !== st) });
                    } else {
                      updateFormData({ processAgentStates: [...formData.processAgentStates, st] });
                    }
                  }}
                >
                  {st}
                </Badge>
              ))}
            </div>
            {formData.processAgentStates.length > 0 && (
              <p className="text-xs text-blue-400">{formData.processAgentStates.length} state(s) selected</p>
            )}
          </div>

          {/* ─── Smart Compliance Preview — updates in real-time ─── */}
          <CompliancePreview
            trailerTypes={formData.equipmentTypes}
            products={formData.products}
            operatingStates={formData.processAgentStates}
            hasHazmat={formData.hasHazmatAuthority}
          />
        </div>
      ),
    },
    {
      id: "contact",
      title: "Contact Information",
      description: "Primary and dispatch contacts",
      icon: <User className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-white font-medium">Primary Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryContactName" className="text-slate-300">
                  Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="primaryContactName"
                  value={formData.primaryContactName}
                  onChange={(e: any) => updateFormData({ primaryContactName: e.target.value })}
                  placeholder="John Smith"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactTitle" className="text-slate-300">Title</Label>
                <Input
                  id="primaryContactTitle"
                  value={formData.primaryContactTitle}
                  onChange={(e: any) => updateFormData({ primaryContactTitle: e.target.value })}
                  placeholder="Owner/Operations Manager"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactEmail" className="text-slate-300">
                  Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e: any) => updateFormData({ primaryContactEmail: e.target.value })}
                  placeholder="john@trucking.com"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactPhone" className="text-slate-300">
                  Phone <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="primaryContactPhone"
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e: any) => updateFormData({ primaryContactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Dispatch Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dispatchEmail" className="text-slate-300">Dispatch Email</Label>
                <Input
                  id="dispatchEmail"
                  type="email"
                  value={formData.dispatchEmail}
                  onChange={(e: any) => updateFormData({ dispatchEmail: e.target.value })}
                  placeholder="dispatch@trucking.com"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispatchPhone" className="text-slate-300">24/7 Dispatch Phone</Label>
                <Input
                  id="dispatchPhone"
                  type="tel"
                  value={formData.dispatchPhone}
                  onChange={(e: any) => updateFormData({ dispatchPhone: e.target.value })}
                  placeholder="(555) 123-4568"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.primaryContactName || !formData.primaryContactEmail || !formData.primaryContactPhone) {
          toast.error("Please fill in all required contact fields");
          return false;
        }
        return true;
      },
    },
    {
      id: "insurance",
      title: "Insurance",
      description: "Liability and cargo insurance",
      icon: <CreditCard className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <CanopyConnectButton
            policyType="liability"
            verified={!!formData.liabilityPolicy && !!formData.liabilityCatalyst && (formData as any)._canopyVerified}
            onPolicyData={(data: CanopyPolicyData) => {
              const updates: Partial<CatalystFormData> = { _canopyVerified: true } as any;
              if (data.carrier) updates.liabilityCatalyst = data.carrier;
              if (data.policyNumber) updates.liabilityPolicy = data.policyNumber;
              if (data.policyEnd) updates.liabilityExpiration = data.policyEnd;
              const biCov = data.coverages?.find(c => c.type?.toLowerCase().includes('liability') || c.type?.toLowerCase().includes('bi'));
              if (biCov?.limit) {
                const num = parseInt(String(biCov.limit).replace(/[^0-9]/g, ''));
                if (num >= 5000000) updates.liabilityCoverage = '5000000';
                else if (num >= 2000000) updates.liabilityCoverage = '2000000';
                else updates.liabilityCoverage = '1000000';
              }
              updateFormData(updates);
            }}
          />
          <div className="space-y-4">
            <h4 className="text-white font-medium">Liability Insurance (Min $1,000,000)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Insurance Catalyst <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.liabilityCatalyst}
                  onChange={(e: any) => updateFormData({ liabilityCatalyst: e.target.value })}
                  placeholder="ABC Insurance"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Policy Number <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.liabilityPolicy}
                  onChange={(e: any) => updateFormData({ liabilityPolicy: e.target.value })}
                  placeholder="POL-123456"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Coverage Amount <span className="text-red-400">*</span></Label>
                <Select value={formData.liabilityCoverage} onValueChange={(v: any) => updateFormData({ liabilityCoverage: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000000">$1,000,000</SelectItem>
                    <SelectItem value="2000000">$2,000,000</SelectItem>
                    <SelectItem value="5000000">$5,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Expiration Date <span className="text-red-400">*</span></Label>
                <DatePicker value={formData.liabilityExpiration} onChange={(v) => updateFormData({ liabilityExpiration: v })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Cargo Insurance (Min $100,000)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Insurance Catalyst <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.cargoCatalyst}
                  onChange={(e: any) => updateFormData({ cargoCatalyst: e.target.value })}
                  placeholder="ABC Insurance"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Policy Number <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.cargoPolicy}
                  onChange={(e: any) => updateFormData({ cargoPolicy: e.target.value })}
                  placeholder="CARGO-123456"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Coverage Amount <span className="text-red-400">*</span></Label>
                <Select value={formData.cargoCoverage} onValueChange={(v: any) => updateFormData({ cargoCoverage: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100000">$100,000</SelectItem>
                    <SelectItem value="250000">$250,000</SelectItem>
                    <SelectItem value="500000">$500,000</SelectItem>
                    <SelectItem value="1000000">$1,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Expiration Date <span className="text-red-400">*</span></Label>
                <DatePicker value={formData.cargoExpiration} onChange={(v) => updateFormData({ cargoExpiration: v })} />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.liabilityCatalyst || !formData.liabilityPolicy || !formData.cargoCatalyst || !formData.cargoPolicy) {
          toast.error("Please fill in all insurance fields");
          return false;
        }
        return true;
      },
    },
    {
      id: "fleet",
      title: "Fleet Information",
      description: "Power units and driver count",
      icon: <Truck className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Power Units <span className="text-red-400">*</span></Label>
              <Input
                type="number"
                value={formData.powerUnits}
                onChange={(e: any) => updateFormData({ powerUnits: e.target.value })}
                placeholder="10"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Total Drivers <span className="text-red-400">*</span></Label>
              <Input
                type="number"
                value={formData.drivers}
                onChange={(e: any) => updateFormData({ drivers: e.target.value })}
                placeholder="15"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Hazmat Certified Drivers</Label>
              <Input
                type="number"
                value={formData.hazmatCertifiedDrivers}
                onChange={(e: any) => updateFormData({ hazmatCertifiedDrivers: e.target.value })}
                placeholder="12"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-700/30">
            <p className="text-sm text-slate-400">
              After registration, you'll be able to add individual drivers and vehicles to your fleet.
              Each driver must have their own profile with CDL verification and hazmat endorsement (if applicable).
            </p>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.powerUnits || !formData.drivers) {
          toast.error("Please enter fleet information");
          return false;
        }
        return true;
      },
    },
    {
      id: "address",
      title: "Business Address",
      description: "Company headquarters address",
      icon: <MapPin className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Street Address <span className="text-red-400">*</span></Label>
            <Input
              value={formData.streetAddress}
              onChange={(e: any) => updateFormData({ streetAddress: e.target.value })}
              placeholder="123 Trucking Way"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-slate-300">City <span className="text-red-400">*</span></Label>
              <Input
                value={formData.city}
                onChange={(e: any) => updateFormData({ city: e.target.value })}
                placeholder="Houston"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">State <span className="text-red-400">*</span></Label>
              <Input
                value={formData.state}
                onChange={(e: any) => updateFormData({ state: e.target.value })}
                placeholder="TX"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">ZIP Code <span className="text-red-400">*</span></Label>
              <Input
                value={formData.zipCode}
                onChange={(e: any) => updateFormData({ zipCode: e.target.value })}
                placeholder="77001"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.streetAddress || !formData.city || !formData.state || !formData.zipCode) {
          toast.error("Please fill in all address fields");
          return false;
        }
        return true;
      },
    },
    {
      id: "security",
      title: "Account Security",
      description: "Create your login credentials",
      icon: <Lock className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <PasswordFields
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            onPasswordChange={(v) => updateFormData({ password: v })}
            onConfirmChange={(v) => updateFormData({ confirmPassword: v })}
          />
        </div>
      ),
      validate: () => {
        const err = validatePassword(formData.password, formData.confirmPassword);
        if (err) { toast.error(err); return false; }
        return true;
      },
    },
    {
      id: "compliance",
      title: "Compliance Integrations",
      description: "Link existing compliance network memberships for faster verification",
      icon: <ShieldCheck className="w-5 h-5" />,
      component: (
        <ComplianceIntegrations
          role="CATALYST"
          complianceIds={formData.complianceIds}
          onChange={(ids) => updateFormData({ complianceIds: ids })}
        />
      ),
    },
    {
      id: "payments",
      title: "Payment Setup",
      description: "How you'll get paid on EusoTrip",
      icon: <Landmark className="w-5 h-5" />,
      component: (
        <StripeConnectStep
          businessType={formData.businessType}
          onBusinessTypeChange={(t) => updateFormData({ businessType: t })}
          role="CATALYST"
        />
      ),
      validate: () => {
        if (!formData.businessType) {
          toast.error("Please select your business type for payment setup");
          return false;
        }
        return true;
      },
    },
    {
      id: "terms",
      title: "Terms & Agreements",
      description: "Review and accept platform terms",
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => updateFormData({ acceptTerms: checked as boolean })}
              />
              <Label htmlFor="acceptTerms" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptPrivacy"
                checked={formData.acceptPrivacy}
                onCheckedChange={(checked) => updateFormData({ acceptPrivacy: checked as boolean })}
              />
              <Label htmlFor="acceptPrivacy" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acceptSafetyPolicy"
                checked={formData.acceptSafetyPolicy}
                onCheckedChange={(checked) => updateFormData({ acceptSafetyPolicy: checked as boolean })}
              />
              <Label htmlFor="acceptSafetyPolicy" className="text-sm text-slate-300 cursor-pointer">
                I certify that my company maintains a valid safety management program and all drivers 
                are properly qualified per FMCSA regulations
                <span className="text-red-400"> *</span>
              </Label>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptSafetyPolicy) {
          toast.error("Please accept all required terms");
          return false;
        }
        return true;
      },
    },
  ];

  return (
    <RegistrationWizard
      steps={steps}
      onComplete={handleComplete}
      title="Catalyst Registration"
      subtitle="Register your trucking company to haul freight on EusoTrip"
      roleIcon={<Truck className="w-8 h-8 text-white" />}
      roleColor="from-green-500 to-green-600"
    />
  );
}
