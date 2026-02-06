/**
 * DRIVER REGISTRATION PAGE
 * Multi-step registration for CDL drivers with hazmat endorsement
 * Based on 04_DRIVER_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
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
  User, FileText, Shield, CreditCard, 
  Upload, CheckCircle, AlertCircle, Mail, Phone,
  MapPin, Calendar, Truck, Award
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DriverFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  
  // Step 2: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Step 3: Employment Type
  employmentType: string;
  carrierUsdot: string;
  carrierName: string;
  
  // Step 4: CDL Information
  cdlNumber: string;
  cdlState: string;
  cdlClass: string;
  cdlExpiration: string;
  endorsements: string[];
  restrictions: string[];
  
  // Step 5: Medical & TWIC
  medicalCardNumber: string;
  medicalExpiration: string;
  twicNumber: string;
  twicExpiration: string;
  
  // Step 6: Training & Certifications
  hazmatTrainingDate: string;
  hazmatTrainingProvider: string;
  securityTrainingDate: string;
  additionalCerts: string[];
  
  // Step 7: Terms
  acceptTerms: boolean;
  acceptBackgroundCheck: boolean;
  acceptDrugTest: boolean;
}

const initialFormData: DriverFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  ssn: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  employmentType: "",
  carrierUsdot: "",
  carrierName: "",
  cdlNumber: "",
  cdlState: "",
  cdlClass: "",
  cdlExpiration: "",
  endorsements: [],
  restrictions: [],
  medicalCardNumber: "",
  medicalExpiration: "",
  twicNumber: "",
  twicExpiration: "",
  hazmatTrainingDate: "",
  hazmatTrainingProvider: "",
  securityTrainingDate: "",
  additionalCerts: [],
  acceptTerms: false,
  acceptBackgroundCheck: false,
  acceptDrugTest: false,
};

const CDL_ENDORSEMENTS = [
  { code: "H", label: "Hazardous Materials" },
  { code: "N", label: "Tank Vehicles" },
  { code: "P", label: "Passenger" },
  { code: "S", label: "School Bus" },
  { code: "T", label: "Double/Triple Trailers" },
  { code: "X", label: "Combination H + N" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function RegisterDriver() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<DriverFormData>(initialFormData);

  const updateFormData = (updates: Partial<DriverFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const registerMutation = (trpc as any).registration.registerDriver.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Background check and CDL verification in progress." });
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
      dateOfBirth: formData.dateOfBirth,
      ssn: formData.ssn || undefined,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      cdlNumber: formData.cdlNumber,
      cdlState: formData.cdlState,
      cdlClass: (formData.cdlClass || "A") as "A" | "B" | "C",
      cdlExpiration: formData.cdlExpiration,
      cdlEndorsements: formData.endorsements || [],
      hazmatEndorsement: formData.endorsements?.includes("H") || formData.endorsements?.includes("X") || false,
      tankerEndorsement: formData.endorsements?.includes("N") || false,
      twicCard: !!formData.twicNumber,
      twicExpiration: formData.twicExpiration || undefined,
      medicalCardExpiration: formData.medicalExpiration,
      yearsExperience: 0,
      pspConsent: formData.acceptTerms,
      backgroundCheckConsent: formData.acceptBackgroundCheck,
      drugTestConsent: formData.acceptDrugTest,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "personal",
      title: "Personal Information",
      description: "Your legal name and contact details",
      icon: <User className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Legal First Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e: any) => updateFormData({ firstName: e.target.value })}
                placeholder="John"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">As it appears on your CDL</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Legal Last Name <span className="text-red-400">*</span>
              </Label>
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
              <Label className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e: any) => updateFormData({ email: e.target.value })}
                placeholder="john.smith@email.com"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Phone <span className="text-red-400">*</span>
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e: any) => updateFormData({ phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Date of Birth <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e: any) => updateFormData({ dateOfBirth: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                SSN (Last 4 digits) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="password"
                maxLength={4}
                value={formData.ssn}
                onChange={(e: any) => updateFormData({ ssn: e.target.value })}
                placeholder="••••"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">Required for TSA background verification</p>
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
      id: "address",
      title: "Address",
      description: "Your current residential address",
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
              placeholder="123 Main St"
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
                  {US_STATES.map((st: any) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
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
          toast.error("Please fill in your complete address");
          return false;
        }
        return true;
      },
    },
    {
      id: "employment",
      title: "Employment Type",
      description: "How you operate as a driver",
      icon: <Truck className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Employment Type <span className="text-red-400">*</span></Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: "company", label: "Company Driver", desc: "W-2 employee of a carrier" },
                { value: "owner_op", label: "Owner-Operator", desc: "Leased to a carrier (1099)" },
                { value: "independent", label: "Independent", desc: "Own authority/USDOT" },
              ].map((type: any) => (
                <div
                  key={type.value}
                  onClick={() => updateFormData({ employmentType: type.value })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.employmentType === type.value
                      ? "bg-orange-500/20 border-orange-500"
                      : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{type.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {(formData.employmentType === "company" || formData.employmentType === "owner_op") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-700/30">
              <div className="space-y-2">
                <Label className="text-slate-300">Carrier USDOT Number</Label>
                <Input
                  value={formData.carrierUsdot}
                  onChange={(e: any) => updateFormData({ carrierUsdot: e.target.value })}
                  placeholder="1234567"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Carrier Name</Label>
                <Input
                  value={formData.carrierName}
                  onChange={(e: any) => updateFormData({ carrierName: e.target.value })}
                  placeholder="ABC Trucking LLC"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          )}
        </div>
      ),
      validate: () => {
        if (!formData.employmentType) {
          toast.error("Please select your employment type");
          return false;
        }
        return true;
      },
    },
    {
      id: "cdl",
      title: "CDL Information",
      description: "Your Commercial Driver's License details",
      icon: <CreditCard className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Hazmat Endorsement Required</p>
                <p className="text-xs text-slate-400 mt-1">
                  To transport hazardous materials on EusoTrip, you must have a valid Hazmat (H) or 
                  Combination (X) endorsement with TSA approval.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                CDL Number <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.cdlNumber}
                onChange={(e: any) => updateFormData({ cdlNumber: e.target.value })}
                placeholder="12345678"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Issuing State <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.cdlState} onValueChange={(v: any) => updateFormData({ cdlState: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((st: any) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                CDL Class <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.cdlClass} onValueChange={(v: any) => updateFormData({ cdlClass: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Class A - Combination Vehicles</SelectItem>
                  <SelectItem value="B">Class B - Heavy Straight Vehicles</SelectItem>
                  <SelectItem value="C">Class C - Small Vehicles (Hazmat)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Expiration Date <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                value={formData.cdlExpiration}
                onChange={(e: any) => updateFormData({ cdlExpiration: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Endorsements</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CDL_ENDORSEMENTS.map((end: any) => (
                <div key={end.code} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                  <Checkbox
                    id={`end-${end.code}`}
                    checked={formData.endorsements.includes(end.code)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ endorsements: [...formData.endorsements, end.code] });
                      } else {
                        updateFormData({ endorsements: formData.endorsements.filter((e: any) => e !== end.code) });
                      }
                    }}
                  />
                  <Label htmlFor={`end-${end.code}`} className="text-sm text-slate-300 cursor-pointer">
                    {end.code} - {end.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.cdlNumber || !formData.cdlState || !formData.cdlClass || !formData.cdlExpiration) {
          toast.error("Please fill in all CDL information");
          return false;
        }
        if (!formData.endorsements.includes("H") && !formData.endorsements.includes("X")) {
          toast.error("Hazmat endorsement (H or X) is required");
          return false;
        }
        return true;
      },
    },
    {
      id: "medical",
      title: "Medical & TWIC",
      description: "DOT medical certification and TWIC card",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-white font-medium">DOT Medical Certificate</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Medical Examiner's Certificate Number</Label>
                <Input
                  value={formData.medicalCardNumber}
                  onChange={(e: any) => updateFormData({ medicalCardNumber: e.target.value })}
                  placeholder="ME Certificate #"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Expiration Date <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.medicalExpiration}
                  onChange={(e: any) => updateFormData({ medicalExpiration: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">TWIC Card (Transportation Worker ID)</h4>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-300">
                TWIC is required for unescorted access to maritime facilities and vessels.
                If you don't have one, you can apply at <a href="https://www.tsa.gov/twic" target="_blank" className="underline">tsa.gov/twic</a>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">TWIC Card Number</Label>
                <Input
                  value={formData.twicNumber}
                  onChange={(e: any) => updateFormData({ twicNumber: e.target.value })}
                  placeholder="TWIC #"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.twicExpiration}
                  onChange={(e: any) => updateFormData({ twicExpiration: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.medicalExpiration) {
          toast.error("Medical certificate expiration is required");
          return false;
        }
        return true;
      },
    },
    {
      id: "training",
      title: "Training & Certifications",
      description: "Hazmat training and additional certifications",
      icon: <Award className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">49 CFR 172.704 Hazmat Training</p>
                <p className="text-xs text-slate-400 mt-1">
                  All hazmat drivers must complete initial and recurrent (every 3 years) training 
                  including general awareness, function-specific, safety, and security training.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Hazmat Training Completion Date <span className="text-red-400">*</span>
              </Label>
              <Input
                type="date"
                value={formData.hazmatTrainingDate}
                onChange={(e: any) => updateFormData({ hazmatTrainingDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Training Provider</Label>
              <Input
                value={formData.hazmatTrainingProvider}
                onChange={(e: any) => updateFormData({ hazmatTrainingProvider: e.target.value })}
                placeholder="J.J. Keller, Luma, etc."
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Security Awareness Training Date</Label>
            <Input
              type="date"
              value={formData.securityTrainingDate}
              onChange={(e: any) => updateFormData({ securityTrainingDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Additional Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {["Tanker Specialist", "Bulk Loading", "Chlorine Institute", "Ammonia Safety", "LPG Certified"].map((cert: any) => (
                <Badge
                  key={cert}
                  variant={formData.additionalCerts.includes(cert) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (formData.additionalCerts.includes(cert)) {
                      updateFormData({ additionalCerts: formData.additionalCerts.filter(c => c !== cert) });
                    } else {
                      updateFormData({ additionalCerts: [...formData.additionalCerts, cert] });
                    }
                  }}
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.hazmatTrainingDate) {
          toast.error("Hazmat training date is required");
          return false;
        }
        return true;
      },
    },
    {
      id: "terms",
      title: "Terms & Consent",
      description: "Review and accept required agreements",
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
                I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a> and 
                <a href="/privacy" className="text-blue-400 hover:underline ml-1">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="background"
                checked={formData.acceptBackgroundCheck}
                onCheckedChange={(c: any) => updateFormData({ acceptBackgroundCheck: c as boolean })}
              />
              <Label htmlFor="background" className="text-sm text-slate-300 cursor-pointer">
                I consent to a TSA Security Threat Assessment (STA) background check as required for 
                hazmat endorsement per 49 CFR 1572
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="drugtest"
                checked={formData.acceptDrugTest}
                onCheckedChange={(c: any) => updateFormData({ acceptDrugTest: c as boolean })}
              />
              <Label htmlFor="drugtest" className="text-sm text-slate-300 cursor-pointer">
                I understand I am subject to pre-employment and random drug & alcohol testing per 
                DOT 49 CFR Part 40 and FMCSA Clearinghouse requirements
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
                  After submission, we'll verify your CDL and endorsements via state DMV records.
                  TSA background verification typically takes 7-14 days. You'll receive email updates 
                  throughout the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptBackgroundCheck || !formData.acceptDrugTest) {
          toast.error("Please accept all required consents");
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
      title="Driver Registration"
      subtitle="Register as a CDL driver on EusoTrip"
      roleIcon={<User className="w-8 h-8 text-white" />}
      roleColor="from-orange-500 to-orange-600"
    />
  );
}
