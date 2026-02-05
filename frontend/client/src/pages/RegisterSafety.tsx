/**
 * SAFETY MANAGER REGISTRATION PAGE
 * Multi-step registration for safety program managers
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationWizard, WizardStep } from "@/components/registration/RegistrationWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, User, Building2, Award, FileText,
  CheckCircle, AlertCircle, Shield, Activity
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface SafetyFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Employment
  companyName: string;
  companyUsdot: string;
  jobTitle: string;
  yearsInSafety: string;
  reportsTo: string;
  
  // Step 3: Certifications
  certifications: string[];
  csaTrainingDate: string;
  accidentInvestigationDate: string;
  
  // Step 4: Responsibilities
  responsibilities: string[];
  fleetSize: string;
  driverCount: string;
  
  // Step 5: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptSafetyCommitment: boolean;
}

const initialFormData: SafetyFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  companyUsdot: "",
  jobTitle: "",
  yearsInSafety: "",
  reportsTo: "",
  certifications: [],
  csaTrainingDate: "",
  accidentInvestigationDate: "",
  responsibilities: [],
  fleetSize: "",
  driverCount: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptSafetyCommitment: false,
};

const CERTIFICATIONS = [
  "Certified Director of Safety (CDS)",
  "Certified Safety Professional (CSP)",
  "Associate Safety Professional (ASP)",
  "Occupational Health & Safety Technologist (OHST)",
  "Transportation Safety Institute (TSI) Graduate",
  "Smith System Certified Trainer",
  "Defensive Driving Instructor",
  "OSHA 30-Hour General Industry",
  "OSHA 10-Hour Construction",
];

const RESPONSIBILITIES = [
  "CSA Score Management",
  "Driver Safety Training",
  "Accident Investigation",
  "Drug & Alcohol Program Oversight",
  "Safety Meeting Coordination",
  "Incident Reporting",
  "Driver Coaching & Scorecards",
  "Dash Cam Review",
  "Safety Equipment Compliance",
  "Workers Compensation Claims",
];

export default function RegisterSafety() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<SafetyFormData>(initialFormData);

  const updateFormData = (updates: Partial<SafetyFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const registerMutation = (trpc as any).registration.registerSafetyManager.useMutation({
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
      password: formData.email,
      employerCompanyName: formData.companyName,
      employerUsdotNumber: formData.companyUsdot || "0000000",
      yearsAsSafetyManager: Number(formData.yearsInSafety) || 1,
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
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Last Name <span className="text-red-400">*</span></Label>
              <Input
                value={formData.lastName}
                onChange={(e: any) => updateFormData({ lastName: e.target.value })}
                placeholder="Smith"
                className="bg-slate-700/50 border-slate-600 text-white"
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
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Phone <span className="text-red-400">*</span></Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e: any) => updateFormData({ phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-slate-700/50 border-slate-600 text-white"
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
      description: "Your company and role",
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
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Company USDOT <span className="text-red-400">*</span></Label>
              <Input
                value={formData.companyUsdot}
                onChange={(e: any) => updateFormData({ companyUsdot: e.target.value })}
                placeholder="1234567"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Job Title</Label>
              <Select value={formData.jobTitle} onValueChange={(v: any) => updateFormData({ jobTitle: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety_manager">Safety Manager</SelectItem>
                  <SelectItem value="safety_director">Director of Safety</SelectItem>
                  <SelectItem value="vp_safety">VP of Safety</SelectItem>
                  <SelectItem value="safety_coordinator">Safety Coordinator</SelectItem>
                  <SelectItem value="safety_specialist">Safety Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Years in Safety</Label>
              <Select value={formData.yearsInSafety} onValueChange={(v: any) => updateFormData({ yearsInSafety: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2">0-2 years</SelectItem>
                  <SelectItem value="2-5">2-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10-20">10-20 years</SelectItem>
                  <SelectItem value="20+">20+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Reports To</Label>
            <Input
              value={formData.reportsTo}
              onChange={(e: any) => updateFormData({ reportsTo: e.target.value })}
              placeholder="CEO, VP Operations, etc."
              className="bg-slate-700/50 border-slate-600 text-white"
            />
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
      description: "Your safety qualifications",
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
              <Label className="text-slate-300">CSA Training Date</Label>
              <Input
                type="date"
                value={formData.csaTrainingDate}
                onChange={(e: any) => updateFormData({ csaTrainingDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Accident Investigation Training Date</Label>
              <Input
                type="date"
                value={formData.accidentInvestigationDate}
                onChange={(e: any) => updateFormData({ accidentInvestigationDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "responsibilities",
      title: "Responsibilities & Fleet",
      description: "What you'll manage",
      icon: <Activity className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Safety Responsibilities</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Fleet Size (Power Units)</Label>
              <Select value={formData.fleetSize} onValueChange={(v: any) => updateFormData({ fleetSize: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select fleet size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 trucks</SelectItem>
                  <SelectItem value="11-50">11-50 trucks</SelectItem>
                  <SelectItem value="51-100">51-100 trucks</SelectItem>
                  <SelectItem value="101-500">101-500 trucks</SelectItem>
                  <SelectItem value="500+">500+ trucks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Driver Count</Label>
              <Select value={formData.driverCount} onValueChange={(v: any) => updateFormData({ driverCount: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select driver count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-20">1-20 drivers</SelectItem>
                  <SelectItem value="21-100">21-100 drivers</SelectItem>
                  <SelectItem value="101-500">101-500 drivers</SelectItem>
                  <SelectItem value="500+">500+ drivers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">CSA Score Monitoring</p>
                <p className="text-xs text-slate-400 mt-1">
                  EusoTrip provides real-time CSA BASIC score monitoring with alerts when scores 
                  approach intervention thresholds. You'll have full visibility into driver safety metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "terms",
      title: "Terms & Commitment",
      description: "Safety commitment pledge",
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
                I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
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
                I accept the <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Checkbox
                id="safetyCommitment"
                checked={formData.acceptSafetyCommitment}
                onCheckedChange={(c: any) => updateFormData({ acceptSafetyCommitment: c as boolean })}
              />
              <Label htmlFor="safetyCommitment" className="text-sm text-pink-300 cursor-pointer">
                <strong>Safety Commitment:</strong> I pledge to prioritize safety in all operations, 
                investigate all accidents thoroughly, coach drivers constructively, and maintain a culture 
                where safety concerns can be raised without fear of retaliation
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
                  Your company administrator will approve your access. Once approved, you'll have 
                  full access to the Safety Dashboard, CSA scores, driver scorecards, and incident management.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptSafetyCommitment) {
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
      title="Safety Manager Registration"
      subtitle="Register as a safety program manager"
      roleIcon={<AlertTriangle className="w-8 h-8 text-white" />}
      roleColor="from-pink-500 to-pink-600"
    />
  );
}
