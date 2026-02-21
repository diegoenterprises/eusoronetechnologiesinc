/**
 * SHIPPER REGISTRATION PAGE
 * Multi-step registration for chemical/oil shippers
 * Based on EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationWizard, WizardStep } from "@/components/registration/RegistrationWizard";
import { ComplianceIntegrations, PasswordFields, validatePassword, emptyComplianceIds } from "@/components/registration/ComplianceIntegrations";
import type { ComplianceIds } from "@/components/registration/ComplianceIntegrations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, Building2, FileText, Shield, CreditCard, 
  Upload, CheckCircle, AlertCircle, User, Mail, Phone,
  MapPin, Globe, Hash, Lock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ShipperFormData {
  // Step 1: Company Information
  companyName: string;
  dba: string;
  companyType: string;
  einNumber: string;
  dunsNumber: string;
  yearEstablished: string;
  
  // Step 2: Contact Information
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  billingEmail: string;
  
  // Step 3: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Step 4: Regulatory Registration
  phmsamRegistrationNumber: string;
  epaId: string;
  statePermits: string[];
  hazmatTypes: string[];
  
  // Step 5: Insurance
  insuranceCatalyst: string;
  policyNumber: string;
  coverageAmount: string;
  expirationDate: string;
  insuranceCertificate: File | null;
  
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

const initialFormData: ShipperFormData = {
  companyName: "",
  dba: "",
  companyType: "",
  einNumber: "",
  dunsNumber: "",
  yearEstablished: "",
  primaryContactName: "",
  primaryContactTitle: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  billingEmail: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
  phmsamRegistrationNumber: "",
  epaId: "",
  statePermits: [],
  hazmatTypes: [],
  insuranceCatalyst: "",
  policyNumber: "",
  coverageAmount: "",
  expirationDate: "",
  insuranceCertificate: null,
  password: "",
  confirmPassword: "",
  complianceIds: emptyComplianceIds,
  acceptTerms: false,
  acceptPrivacy: false,
  acceptCompliance: false,
};

const HAZMAT_CLASSES = [
  { value: "class2", label: "Class 2 - Gases" },
  { value: "class3", label: "Class 3 - Flammable Liquids" },
  { value: "class4", label: "Class 4 - Flammable Solids" },
  { value: "class5", label: "Class 5 - Oxidizers" },
  { value: "class6", label: "Class 6 - Toxic Substances" },
  { value: "class7", label: "Class 7 - Radioactive" },
  { value: "class8", label: "Class 8 - Corrosives" },
  { value: "class9", label: "Class 9 - Miscellaneous" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function RegisterShipper() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ShipperFormData>(initialFormData);

  const updateFormData = (updates: Partial<ShipperFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const registerMutation = (trpc as any).registration.registerShipper.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted successfully!", {
        description: "Your account is pending verification. We'll email you within 24-48 hours.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Registration failed", {
        description: error.message || "Please try again or contact support.",
      });
    },
  });

  const handleComplete = async () => {
    const hazmatClasses = formData.hazmatTypes
      .map(t => t.replace("class", ""))
      .filter(c => ["2","3","4","5","6","7","8","9"].includes(c)) as ("2"|"3"|"4"|"5"|"6"|"7"|"8"|"9")[];
    
    // Filter out empty compliance IDs
    const complianceIds = Object.fromEntries(
      Object.entries(formData.complianceIds).filter(([_, v]) => v && String(v).trim())
    );

    await registerMutation.mutateAsync({
      companyName: formData.companyName,
      dba: formData.dba || undefined,
      einNumber: formData.einNumber,
      dunsNumber: formData.dunsNumber || undefined,
      companyType: formData.companyType,
      yearEstablished: formData.yearEstablished || undefined,
      contactName: formData.primaryContactName,
      contactTitle: formData.primaryContactTitle || undefined,
      contactEmail: formData.primaryContactEmail,
      contactPhone: formData.primaryContactPhone,
      billingEmail: formData.billingEmail || undefined,
      password: formData.password,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country || undefined,
      phmsaNumber: formData.phmsamRegistrationNumber || undefined,
      epaId: formData.epaId || undefined,
      statePermits: formData.statePermits.length > 0 ? formData.statePermits : undefined,
      hazmatClasses,
      generalLiabilityCarrier: formData.insuranceCatalyst || undefined,
      generalLiabilityPolicy: formData.policyNumber || undefined,
      generalLiabilityCoverage: formData.coverageAmount || undefined,
      generalLiabilityExpiration: formData.expirationDate || undefined,
      complianceIds: Object.keys(complianceIds).length > 0 ? complianceIds : undefined,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "company",
      title: "Company Information",
      description: "Tell us about your company",
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-slate-300">
                Legal Company Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e: any) => updateFormData({ companyName: e.target.value })}
                placeholder="ABC Chemical Corp"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dba" className="text-slate-300">DBA (if different)</Label>
              <Input
                id="dba"
                value={formData.dba}
                onChange={(e: any) => updateFormData({ dba: e.target.value })}
                placeholder="Doing Business As"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyType" className="text-slate-300">
                Company Type <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.companyType} onValueChange={(v: any) => updateFormData({ companyType: v })}>
                <SelectTrigger className="bg-white/[0.04] border-slate-600 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="refinery">Refinery</SelectItem>
                  <SelectItem value="terminal">Terminal Operator</SelectItem>
                  <SelectItem value="chemical_plant">Chemical Plant</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearEstablished" className="text-slate-300">Year Established</Label>
              <Input
                id="yearEstablished"
                type="number"
                value={formData.yearEstablished}
                onChange={(e: any) => updateFormData({ yearEstablished: e.target.value })}
                placeholder="2000"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="einNumber" className="text-slate-300">
                EIN (Tax ID) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="einNumber"
                value={formData.einNumber}
                onChange={(e: any) => updateFormData({ einNumber: e.target.value })}
                placeholder="XX-XXXXXXX"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dunsNumber" className="text-slate-300">DUNS Number</Label>
              <Input
                id="dunsNumber"
                value={formData.dunsNumber}
                onChange={(e: any) => updateFormData({ dunsNumber: e.target.value })}
                placeholder="Optional"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.companyName || !formData.companyType || !formData.einNumber) {
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
              <Label htmlFor="primaryContactName" className="text-slate-300">
                Contact Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="primaryContactName"
                value={formData.primaryContactName}
                onChange={(e: any) => updateFormData({ primaryContactName: e.target.value })}
                placeholder="John Smith"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContactTitle" className="text-slate-300">Title</Label>
              <Input
                id="primaryContactTitle"
                value={formData.primaryContactTitle}
                onChange={(e: any) => updateFormData({ primaryContactTitle: e.target.value })}
                placeholder="Logistics Manager"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryContactEmail" className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e: any) => updateFormData({ primaryContactEmail: e.target.value })}
                  placeholder="john@company.com"
                  className="bg-white/[0.04] border-slate-600 text-white pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContactPhone" className="text-slate-300">
                Phone <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="primaryContactPhone"
                  type="tel"
                  value={formData.primaryContactPhone}
                  onChange={(e: any) => updateFormData({ primaryContactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="bg-white/[0.04] border-slate-600 text-white pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail" className="text-slate-300">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={(e: any) => updateFormData({ billingEmail: e.target.value })}
              placeholder="billing@company.com (if different)"
              className="bg-white/[0.04] border-slate-600 text-white"
            />
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.primaryContactName || !formData.primaryContactEmail || !formData.primaryContactPhone) {
          toast.error("Please fill in all required contact fields");
          return false;
        }
        if (!formData.primaryContactEmail.includes("@")) {
          toast.error("Please enter a valid email address");
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
            <Label htmlFor="streetAddress" className="text-slate-300">
              Street Address <span className="text-red-400">*</span>
            </Label>
            <Input
              id="streetAddress"
              value={formData.streetAddress}
              onChange={(e: any) => updateFormData({ streetAddress: e.target.value })}
              placeholder="123 Industrial Blvd"
              className="bg-white/[0.04] border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="city" className="text-slate-300">
                City <span className="text-red-400">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e: any) => updateFormData({ city: e.target.value })}
                placeholder="Houston"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-slate-300">
                State <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.state} onValueChange={(v: any) => updateFormData({ state: v })}>
                <SelectTrigger className="bg-white/[0.04] border-slate-600 text-white">
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
              <Label htmlFor="zipCode" className="text-slate-300">
                ZIP Code <span className="text-red-400">*</span>
              </Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e: any) => updateFormData({ zipCode: e.target.value })}
                placeholder="77001"
                className="bg-white/[0.04] border-slate-600 text-white"
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
      id: "regulatory",
      title: "Regulatory Registration",
      description: "Federal and state hazmat registrations",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">PHMSA Registration Required</p>
                <p className="text-xs text-slate-400 mt-1">
                  If you ship placardable quantities of hazardous materials, you must have a valid PHMSA registration.
                  Register at: <a href="https://www.phmsa.dot.gov/hazmat/registration" target="_blank" className="text-blue-400 hover:underline">phmsa.dot.gov</a>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phmsamRegistrationNumber" className="text-slate-300">
                PHMSA Registration Number
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  id="phmsamRegistrationNumber"
                  value={formData.phmsamRegistrationNumber}
                  onChange={(e: any) => updateFormData({ phmsamRegistrationNumber: e.target.value })}
                  placeholder="PHMSA-XXXXXX"
                  className="bg-white/[0.04] border-slate-600 text-white pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="epaId" className="text-slate-300">
                EPA ID Number (if applicable)
              </Label>
              <Input
                id="epaId"
                value={formData.epaId}
                onChange={(e: any) => updateFormData({ epaId: e.target.value })}
                placeholder="TXD123456789"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Hazmat Classes You Ship</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {HAZMAT_CLASSES.map((hazClass: any) => (
                <div key={hazClass.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={hazClass.value}
                    checked={formData.hazmatTypes.includes(hazClass.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ hazmatTypes: [...formData.hazmatTypes, hazClass.value] });
                      } else {
                        updateFormData({ hazmatTypes: formData.hazmatTypes.filter((t: any) => t !== hazClass.value) });
                      }
                    }}
                  />
                  <Label htmlFor={hazClass.value} className="text-sm text-slate-300 cursor-pointer">
                    {hazClass.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "insurance",
      title: "Insurance Information",
      description: "Cargo and liability insurance details",
      icon: <CreditCard className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceCatalyst" className="text-slate-300">
                Insurance Catalyst <span className="text-red-400">*</span>
              </Label>
              <Input
                id="insuranceCatalyst"
                value={formData.insuranceCatalyst}
                onChange={(e: any) => updateFormData({ insuranceCatalyst: e.target.value })}
                placeholder="ABC Insurance Co"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyNumber" className="text-slate-300">
                Policy Number <span className="text-red-400">*</span>
              </Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e: any) => updateFormData({ policyNumber: e.target.value })}
                placeholder="POL-123456"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coverageAmount" className="text-slate-300">
                Coverage Amount <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.coverageAmount} onValueChange={(v: any) => updateFormData({ coverageAmount: v })}>
                <SelectTrigger className="bg-white/[0.04] border-slate-600 text-white">
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000000">$1,000,000</SelectItem>
                  <SelectItem value="2000000">$2,000,000</SelectItem>
                  <SelectItem value="5000000">$5,000,000</SelectItem>
                  <SelectItem value="10000000">$10,000,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-slate-300">
                Policy Expiration <span className="text-red-400">*</span>
              </Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e: any) => updateFormData({ expirationDate: e.target.value })}
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Upload Certificate of Insurance</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                Drag & drop your COI here, or click to browse
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, or PNG up to 10MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e: any) => {
                  const file = e.target.files?.[0];
                  if (file) updateFormData({ insuranceCertificate: file });
                }}
              />
            </div>
            {formData.insuranceCertificate && (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">{formData.insuranceCertificate.name}</span>
              </div>
            )}
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.insuranceCatalyst || !formData.policyNumber || !formData.coverageAmount || !formData.expirationDate) {
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
          role="SHIPPER"
          complianceIds={formData.complianceIds}
          onChange={(ids) => updateFormData({ complianceIds: ids })}
        />
      ),
    },
    {
      id: "terms",
      title: "Terms & Agreements",
      description: "Review and accept platform terms",
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600 max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-white mb-2">Platform Terms of Service</h4>
            <p className="text-sm text-slate-400">
              By registering as a Shipper on EusoTrip, you agree to comply with all applicable federal, 
              state, and local regulations regarding the transportation of hazardous materials. You certify 
              that all information provided is accurate and that you have the legal authority to offer 
              hazardous materials for transport. You agree to maintain current PHMSA registration (if required), 
              proper insurance coverage, and accurate hazmat documentation for all shipments...
            </p>
          </div>

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
                id="acceptCompliance"
                checked={formData.acceptCompliance}
                onCheckedChange={(checked) => updateFormData({ acceptCompliance: checked as boolean })}
              />
              <Label htmlFor="acceptCompliance" className="text-sm text-slate-300 cursor-pointer">
                I certify that all information provided is accurate and I am authorized to register 
                this company on EusoTrip
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
                  After submission, our compliance team will verify your registration within 24-48 hours.
                  You'll receive an email with your account activation link once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptCompliance) {
          toast.error("Please accept all required terms and agreements");
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
      title="Shipper Registration"
      subtitle="Register your company to ship freight on EusoTrip"
      roleIcon={<Package className="w-8 h-8 text-white" />}
      roleColor="from-blue-500 to-blue-600"
    />
  );
}
