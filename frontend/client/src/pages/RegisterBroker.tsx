/**
 * BROKER REGISTRATION PAGE
 * Multi-step registration for freight brokers
 * Based on 03_BROKER_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationWizard, WizardStep } from "@/components/registration/RegistrationWizard";
import { ComplianceIntegrations, PasswordFields, validatePassword, emptyComplianceIds } from "@/components/registration/ComplianceIntegrations";
import type { ComplianceIds } from "@/components/registration/ComplianceIntegrations";
import { FMCSALookup } from "@/components/registration/FMCSALookup";
import type { FMCSAData } from "@/components/registration/FMCSALookup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Building2, FileText, Shield, CreditCard, 
  Upload, CheckCircle, AlertCircle, User, Mail, Phone, MapPin, Lock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface BrokerFormData {
  // Step 1: Company Information
  companyName: string;
  dba: string;
  einNumber: string;
  mcNumber: string;
  usdotNumber: string;
  yearEstablished: string;
  
  // Step 2: Contact Information
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  
  // Step 3: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Step 4: Authority & Bond
  brokerAuthority: string;
  suretyBondAmount: string;
  suretyBondCatalyst: string;
  bondNumber: string;
  bondExpiration: string;
  
  // Step 5: Insurance
  insuranceCatalyst: string;
  policyNumber: string;
  coverageAmount: string;
  expirationDate: string;
  
  // Step 6: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 7: Compliance Integrations
  complianceIds: ComplianceIds;
  
  // Step 8: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCompliance: boolean;
}

const initialFormData: BrokerFormData = {
  companyName: "",
  dba: "",
  einNumber: "",
  mcNumber: "",
  usdotNumber: "",
  yearEstablished: "",
  primaryContactName: "",
  primaryContactTitle: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  brokerAuthority: "",
  suretyBondAmount: "75000",
  suretyBondCatalyst: "",
  bondNumber: "",
  bondExpiration: "",
  insuranceCatalyst: "",
  policyNumber: "",
  coverageAmount: "",
  expirationDate: "",
  password: "",
  confirmPassword: "",
  complianceIds: emptyComplianceIds,
  acceptTerms: false,
  acceptPrivacy: false,
  acceptCompliance: false,
};

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function RegisterBroker() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<BrokerFormData>(initialFormData);
  const [fmcsaData, setFmcsaData] = useState<FMCSAData | null>(null);

  const updateFormData = (updates: Partial<BrokerFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleFMCSADataLoaded = (data: FMCSAData) => {
    setFmcsaData(data);
    if (!data.verified) return;
    const cp = data.companyProfile;
    const auth = data.authority;
    const ins = data.insurance;
    const updates: Partial<BrokerFormData> = {};
    if (cp) {
      updates.companyName = cp.legalName || formData.companyName;
      updates.dba = cp.dba || formData.dba;
      updates.streetAddress = cp.physicalAddress.street || formData.streetAddress;
      updates.city = cp.physicalAddress.city || formData.city;
      updates.state = cp.physicalAddress.state || formData.state;
      updates.zipCode = cp.physicalAddress.zip || formData.zipCode;
    }
    if (auth) {
      updates.usdotNumber = auth.dotNumber || formData.usdotNumber;
      updates.brokerAuthority = auth.brokerAuthority === "A" ? "ACTIVE" : "INACTIVE";
    }
    if (ins?.bondOnFile) {
      updates.suretyBondAmount = "75000";
    }
    updateFormData(updates);
    toast.success("FMCSA data retrieved — broker fields auto-populated");
  };

  const registerMutation = (trpc as any).registration.registerBroker.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", {
        description: "Your broker account is pending verification.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Registration failed", {
        description: error.message,
      });
    },
  });

  const handleComplete = async () => {
    await registerMutation.mutateAsync({
      companyName: formData.companyName,
      dba: formData.dba || undefined,
      einNumber: formData.einNumber,
      mcNumber: formData.mcNumber,
      usdotNumber: formData.usdotNumber || undefined,
      contactName: formData.primaryContactName,
      contactEmail: formData.primaryContactEmail,
      contactPhone: formData.primaryContactPhone,
      password: formData.password,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      suretyBondAmount: Number(formData.suretyBondAmount) || 75000,
      suretyBondCatalyst: formData.suretyBondCatalyst,
      suretyBondNumber: formData.bondNumber,
      brokersHazmat: false,
      complianceIds: Object.fromEntries(
        Object.entries(formData.complianceIds).filter(([_, v]) => v && String(v).trim())
      ) || undefined,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "company",
      title: "Company Information",
      description: "Tell us about your brokerage",
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Legal Company Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.companyName}
                onChange={(e: any) => updateFormData({ companyName: e.target.value })}
                placeholder="ABC Logistics LLC"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">DBA (if different)</Label>
              <Input
                value={formData.dba}
                onChange={(e: any) => updateFormData({ dba: e.target.value })}
                placeholder="Doing Business As"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                EIN (Tax ID) <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.einNumber}
                onChange={(e: any) => updateFormData({ einNumber: e.target.value })}
                placeholder="XX-XXXXXXX"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Year Established</Label>
              <Input
                type="number"
                value={formData.yearEstablished}
                onChange={(e: any) => updateFormData({ yearEstablished: e.target.value })}
                placeholder="2015"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <FMCSALookup
            mode="both"
            dotNumber={formData.usdotNumber}
            mcNumber={formData.mcNumber}
            onDotChange={(v) => updateFormData({ usdotNumber: v })}
            onMcChange={(v) => updateFormData({ mcNumber: v })}
            onDataLoaded={handleFMCSADataLoaded}
            fmcsaData={fmcsaData}
            compact
          />
        </div>
      ),
      validate: () => {
        if (!formData.companyName || !formData.einNumber || !formData.mcNumber) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      },
    },
    {
      id: "contact",
      title: "Contact Information",
      description: "Primary contact details",
      icon: <User className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Contact Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.primaryContactName}
                onChange={(e: any) => updateFormData({ primaryContactName: e.target.value })}
                placeholder="John Smith"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={formData.primaryContactTitle}
                onChange={(e: any) => updateFormData({ primaryContactTitle: e.target.value })}
                placeholder="Operations Manager"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                value={formData.primaryContactEmail}
                onChange={(e: any) => updateFormData({ primaryContactEmail: e.target.value })}
                placeholder="john@company.com"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Phone <span className="text-red-400">*</span>
              </Label>
              <Input
                type="tel"
                value={formData.primaryContactPhone}
                onChange={(e: any) => updateFormData({ primaryContactPhone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
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
      id: "address",
      title: "Business Address",
      description: "Company headquarters",
      icon: <MapPin className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">
              Street Address <span className="text-red-400">*</span>
            </Label>
            <Input
              value={formData.streetAddress}
              onChange={(e: any) => updateFormData({ streetAddress: e.target.value })}
              placeholder="123 Business Blvd"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-slate-300">
                City <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.city}
                onChange={(e: any) => updateFormData({ city: e.target.value })}
                placeholder="Houston"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                State <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.state} onValueChange={(v: any) => updateFormData({ state: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state: any) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                ZIP <span className="text-red-400">*</span>
              </Label>
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
      id: "authority",
      title: "Authority & Surety Bond",
      description: "FMCSA broker authority and bond",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">FMCSA Broker Requirements</p>
                <p className="text-xs text-slate-400 mt-1">
                  Property brokers must have active FMCSA authority and maintain a $75,000 surety bond 
                  or trust fund agreement (BMC-84 or BMC-85).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Broker Authority Number</Label>
            <Input
              value={formData.brokerAuthority}
              onChange={(e: any) => updateFormData({ brokerAuthority: e.target.value })}
              placeholder="Same as MC number if applicable"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Surety Bond Catalyst <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.suretyBondCatalyst}
                onChange={(e: any) => updateFormData({ suretyBondCatalyst: e.target.value })}
                placeholder="ABC Surety Company"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Bond Number <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.bondNumber}
                onChange={(e: any) => updateFormData({ bondNumber: e.target.value })}
                placeholder="BOND-123456"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Bond Amount <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.suretyBondAmount} onValueChange={(v: any) => updateFormData({ suretyBondAmount: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="75000">$75,000 (Minimum)</SelectItem>
                  <SelectItem value="100000">$100,000</SelectItem>
                  <SelectItem value="250000">$250,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Bond Expiration <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                value={formData.bondExpiration}
                onChange={(e: any) => updateFormData({ bondExpiration: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.suretyBondCatalyst || !formData.bondNumber || !formData.bondExpiration) {
          toast.error("Please fill in all bond information");
          return false;
        }
        return true;
      },
    },
    {
      id: "insurance",
      title: "Insurance",
      description: "Contingent cargo insurance",
      icon: <CreditCard className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Insurance Catalyst <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.insuranceCatalyst}
                onChange={(e: any) => updateFormData({ insuranceCatalyst: e.target.value })}
                placeholder="ABC Insurance Co"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Policy Number <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.policyNumber}
                onChange={(e: any) => updateFormData({ policyNumber: e.target.value })}
                placeholder="POL-123456"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Coverage Amount <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.coverageAmount} onValueChange={(v: any) => updateFormData({ coverageAmount: v })}>
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
              <Label className="text-slate-300">
                Expiration Date <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e: any) => updateFormData({ expirationDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.insuranceCatalyst || !formData.policyNumber || !formData.coverageAmount) {
          toast.error("Please fill in all insurance fields");
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
          role="BROKER"
          complianceIds={formData.complianceIds}
          onChange={(ids) => updateFormData({ complianceIds: ids })}
        />
      ),
    },
    {
      id: "terms",
      title: "Terms & Agreements",
      description: "Review and accept terms",
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(c: any) => updateFormData({ acceptTerms: c as boolean })}
              />
              <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="privacy"
                checked={formData.acceptPrivacy}
                onCheckedChange={(c: any) => updateFormData({ acceptPrivacy: c as boolean })}
              />
              <Label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="compliance"
                checked={formData.acceptCompliance}
                onCheckedChange={(c: any) => updateFormData({ acceptCompliance: c as boolean })}
              />
              <Label htmlFor="compliance" className="text-sm text-slate-300 cursor-pointer">
                I certify that all information is accurate and my company maintains active FMCSA broker authority
                <span className="text-red-400"> *</span>
              </Label>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm text-green-300 font-medium">What happens next?</p>
                <p className="text-xs text-slate-400 mt-1">
                  After submission, we'll verify your broker authority and bond with FMCSA.
                  Verification typically takes 24-48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptCompliance) {
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
      title="Broker Registration"
      subtitle="Register your freight brokerage"
      roleIcon={<Users className="w-8 h-8 text-white" />}
      roleColor="from-purple-500 to-purple-600"
    />
  );
}
