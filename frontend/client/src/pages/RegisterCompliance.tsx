/**
 * COMPLIANCE OFFICER REGISTRATION PAGE
 * Multi-step registration for regulatory compliance specialists
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
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
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, User, Building2, Award, FileText,
  CheckCircle, AlertCircle, Mail, Phone, Lock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ComplianceFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Employment
  companyName: string;
  companyUsdot: string;
  jobTitle: string;
  department: string;
  reportsTo: string;
  
  // Step 3: Certifications & Training
  certifications: string[];
  fmcsaTrainingDate: string;
  hazmatTrainingDate: string;
  clearinghouseAccess: boolean;
  
  // Step 4: Areas of Responsibility
  responsibilities: string[];
  
  // Step 5: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 6: Compliance Integrations
  complianceIds: ComplianceIds;
  
  // Step 7: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptConfidentiality: boolean;
}

const initialFormData: ComplianceFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  companyUsdot: "",
  jobTitle: "",
  department: "",
  reportsTo: "",
  certifications: [],
  fmcsaTrainingDate: "",
  hazmatTrainingDate: "",
  clearinghouseAccess: false,
  responsibilities: [],
  password: "",
  confirmPassword: "",
  complianceIds: emptyComplianceIds,
  acceptTerms: false,
  acceptPrivacy: false,
  acceptConfidentiality: false,
};

const CERTIFICATIONS = [
  "Certified Director of Safety (CDS)",
  "Certified Safety Professional (CSP)",
  "North American Transportation Management Institute (NATMI)",
  "FMCSA Compliance Training Certification",
  "Hazmat Compliance Specialist",
  "DOT Drug & Alcohol Program Manager",
  "Clearinghouse Designated Employer Representative (DER)",
];

const RESPONSIBILITIES = [
  "Driver Qualification Files (DQ)",
  "Hours of Service (HOS) Compliance",
  "Drug & Alcohol Program",
  "Vehicle Maintenance Records",
  "Hazmat Documentation",
  "Insurance & Authority Management",
  "FMCSA Clearinghouse Queries",
  "Accident Investigation & Reporting",
  "CSA Score Management",
  "Audit Preparation",
];

export default function RegisterCompliance() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<ComplianceFormData>(initialFormData);
  const [fmcsaData, setFmcsaData] = useState<FMCSAData | null>(null);

  const updateFormData = (updates: Partial<ComplianceFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleCompanyVerified = (data: FMCSAData) => {
    setFmcsaData(data);
    if (data.verified && data.companyProfile) {
      updateFormData({ companyName: data.companyProfile.legalName });
    }
  };

  const registerMutation = (trpc as any).registration.registerComplianceOfficer.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Your account is pending verification." });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  const handleComplete = async () => {
    await registerMutation.mutateAsync({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      employerCompanyName: formData.companyName,
      companyUsdot: formData.companyUsdot || undefined,
      jobTitle: formData.jobTitle || undefined,
      department: formData.department || undefined,
      reportsTo: formData.reportsTo || undefined,
      certifications: formData.certifications?.length ? formData.certifications : undefined,
      fmcsaTrainingDate: formData.fmcsaTrainingDate || undefined,
      hazmatTrainingDate: formData.hazmatTrainingDate || undefined,
      clearinghouseAccess: formData.clearinghouseAccess || false,
      responsibilities: formData.responsibilities?.length ? formData.responsibilities : undefined,
      complianceIds: Object.fromEntries(
        Object.entries(formData.complianceIds).filter(([_, v]) => v && String(v).trim())
      ) || undefined,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "personal",
      title: "Personal Information",
      description: "Your contact details",
      icon: <User className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">First Name <span className="text-red-400">*</span></Label>
              <Input
                value={formData.firstName}
                onChange={(e: any) => updateFormData({ firstName: e.target.value })}
                placeholder="John"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Last Name <span className="text-red-400">*</span></Label>
              <Input
                value={formData.lastName}
                onChange={(e: any) => updateFormData({ lastName: e.target.value })}
                placeholder="Smith"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => updateFormData({ email: e.target.value })}
                placeholder="john@company.com"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone <span className="text-red-400">*</span></Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e: any) => updateFormData({ phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      },
    },
    {
      id: "employment",
      title: "Employment",
      description: "Your company affiliation",
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Company Name <span className="text-red-400">*</span></Label>
              <Input
                value={formData.companyName}
                onChange={(e: any) => updateFormData({ companyName: e.target.value })}
                placeholder="ABC Trucking LLC"
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <FMCSALookup
            mode="dot"
            dotNumber={formData.companyUsdot}
            mcNumber=""
            onDotChange={(v) => updateFormData({ companyUsdot: v })}
            onMcChange={() => {}}
            onDataLoaded={handleCompanyVerified}
            fmcsaData={fmcsaData}
            compact
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Job Title</Label>
              <Select value={formData.jobTitle} onValueChange={(v: any) => updateFormData({ jobTitle: v })}>
                <SelectTrigger className="bg-white/[0.04] border-slate-600 text-white">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                  <SelectItem value="compliance_manager">Compliance Manager</SelectItem>
                  <SelectItem value="compliance_director">Director of Compliance</SelectItem>
                  <SelectItem value="safety_compliance">Safety & Compliance Specialist</SelectItem>
                  <SelectItem value="dq_administrator">DQ File Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Reports To</Label>
              <Input
                value={formData.reportsTo}
                onChange={(e: any) => updateFormData({ reportsTo: e.target.value })}
                placeholder="VP of Operations, etc."
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.companyName || !formData.companyUsdot) {
          toast.error("Please fill in company information");
          return false;
        }
        return true;
      },
    },
    {
      id: "certifications",
      title: "Certifications & Training",
      description: "Your professional qualifications",
      icon: <Award className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Professional Certifications</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CERTIFICATIONS.map((cert: any) => (
                <div key={cert} className="flex items-center space-x-2 p-3 rounded bg-slate-700/30">
                  <Checkbox
                    id={cert}
                    checked={formData.certifications.includes(cert)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ certifications: [...formData.certifications, cert] });
                      } else {
                        updateFormData({ certifications: formData.certifications.filter(c => c !== cert) });
                      }
                    }}
                  />
                  <Label htmlFor={cert} className="text-sm text-slate-300 cursor-pointer">
                    {cert}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">FMCSA Compliance Training Date</Label>
              <Input
                type="date"
                value={formData.fmcsaTrainingDate}
                onChange={(e: any) => updateFormData({ fmcsaTrainingDate: e.target.value })}
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Hazmat Compliance Training Date</Label>
              <Input
                type="date"
                value={formData.hazmatTrainingDate}
                onChange={(e: any) => updateFormData({ hazmatTrainingDate: e.target.value })}
                className="bg-white/[0.04] border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Checkbox
              id="clearinghouse"
              checked={formData.clearinghouseAccess}
              onCheckedChange={(c: any) => updateFormData({ clearinghouseAccess: c as boolean })}
            />
            <Label htmlFor="clearinghouse" className="text-sm text-blue-300 cursor-pointer">
              I have FMCSA Clearinghouse access as a Designated Employer Representative (DER)
            </Label>
          </div>
        </div>
      ),
    },
    {
      id: "responsibilities",
      title: "Areas of Responsibility",
      description: "What you'll manage on the platform",
      icon: <FileCheck className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Select Your Areas of Responsibility</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your selections will determine which compliance features and alerts you'll have access to on EusoTrip.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Compliance Areas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {RESPONSIBILITIES.map((resp: any) => (
                <div key={resp} className="flex items-center space-x-2 p-3 rounded bg-slate-700/30">
                  <Checkbox
                    id={resp}
                    checked={formData.responsibilities.includes(resp)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ responsibilities: [...formData.responsibilities, resp] });
                      } else {
                        updateFormData({ responsibilities: formData.responsibilities.filter(r => r !== resp) });
                      }
                    }}
                  />
                  <Label htmlFor={resp} className="text-sm text-slate-300 cursor-pointer">
                    {resp}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {formData.responsibilities.length > 0 && (
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-sm text-slate-300 mb-2">Selected Responsibilities:</p>
              <div className="flex flex-wrap gap-2">
                {formData.responsibilities.map((resp: any) => (
                  <Badge key={resp} className="bg-indigo-500/20 text-indigo-400">
                    {resp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
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
      description: "Link existing compliance IDs for faster verification",
      icon: <ShieldCheck className="w-5 h-5" />,
      component: (
        <ComplianceIntegrations
          role="COMPLIANCE_OFFICER"
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
                id="confidentiality"
                checked={formData.acceptConfidentiality}
                onCheckedChange={(c: any) => updateFormData({ acceptConfidentiality: c as boolean })}
              />
              <Label htmlFor="confidentiality" className="text-sm text-slate-300 cursor-pointer">
                I understand that I will have access to sensitive compliance data (driver records, drug test results, etc.) 
                and will maintain confidentiality per DOT regulations
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
                  Your company administrator will be notified and must approve your access. 
                  You'll have full access to compliance dashboards and document management once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptConfidentiality) {
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
      title="Compliance Officer Registration"
      subtitle="Register as a compliance specialist"
      roleIcon={<FileCheck className="w-8 h-8 text-white" />}
      roleColor="from-indigo-500 to-indigo-600"
    />
  );
}
