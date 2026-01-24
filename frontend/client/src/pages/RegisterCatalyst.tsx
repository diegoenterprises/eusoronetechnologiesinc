/**
 * CATALYST (DISPATCHER) REGISTRATION PAGE
 * Multi-step registration for dispatchers and coordinators
 * Based on 05_CATALYST_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
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
  Flame, User, FileText, Building2, 
  CheckCircle, AlertCircle, Mail, Phone, MapPin, Award
} from "lucide-react";
import { toast } from "sonner";

interface CatalystFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Employment
  employmentType: string;
  companyName: string;
  companyUsdot: string;
  jobTitle: string;
  department: string;
  
  // Step 3: Experience & Training
  yearsExperience: string;
  dispatchSoftware: string[];
  hazmatTrainingDate: string;
  hazmatTrainingProvider: string;
  
  // Step 4: Certifications
  certifications: string[];
  otherCertifications: string;
  
  // Step 5: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptResponsibility: boolean;
}

const initialFormData: CatalystFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employmentType: "",
  companyName: "",
  companyUsdot: "",
  jobTitle: "",
  department: "",
  yearsExperience: "",
  dispatchSoftware: [],
  hazmatTrainingDate: "",
  hazmatTrainingProvider: "",
  certifications: [],
  otherCertifications: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptResponsibility: false,
};

const DISPATCH_SOFTWARE = [
  "McLeod Software",
  "TMW Systems",
  "Prophesy",
  "Axon Software",
  "Truckstop.com",
  "DAT",
  "LoadLink",
  "TruckingOffice",
  "Rose Rocket",
  "KeepTruckin",
  "Samsara",
  "Other TMS",
];

const CERTIFICATIONS = [
  "Certified Transportation Broker (CTB)",
  "Certified Logistics Professional (CLP)",
  "Hazmat Operations Training",
  "FMCSA Compliance Training",
  "DOT Safety Training",
  "Emergency Response Training",
];

export default function RegisterCatalyst() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<CatalystFormData>(initialFormData);

  const updateFormData = (updates: Partial<CatalystFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    try {
      console.log("Submitting catalyst registration:", formData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("Registration submitted!", {
        description: "Your account is pending company verification.",
      });
      
      setLocation("/login");
    } catch (error) {
      toast.error("Registration failed");
      throw error;
    }
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
              <Label className="text-slate-300">
                First Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
                placeholder="John"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Last Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
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
                onChange={(e) => updateFormData({ email: e.target.value })}
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
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
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
      description: "Your company affiliation",
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Company Association Required</p>
                <p className="text-xs text-slate-400 mt-1">
                  Catalysts must be associated with a registered carrier on EusoTrip. 
                  Your company administrator will need to approve your registration.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Employment Type <span className="text-red-400">*</span></Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: "employee", label: "W-2 Employee", desc: "Full-time or part-time employee" },
                { value: "contractor", label: "1099 Contractor", desc: "Independent contractor" },
                { value: "agency", label: "Staffing Agency", desc: "Placed by staffing agency" },
              ].map((type) => (
                <div
                  key={type.value}
                  onClick={() => updateFormData({ employmentType: type.value })}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.employmentType === type.value
                      ? "bg-red-500/20 border-red-500"
                      : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{type.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Company Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.companyName}
                onChange={(e) => updateFormData({ companyName: e.target.value })}
                placeholder="ABC Trucking LLC"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Company USDOT Number <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.companyUsdot}
                onChange={(e) => updateFormData({ companyUsdot: e.target.value })}
                placeholder="1234567"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Job Title</Label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => updateFormData({ jobTitle: e.target.value })}
                placeholder="Dispatcher, Load Coordinator, etc."
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Department</Label>
              <Select value={formData.department} onValueChange={(v) => updateFormData({ department: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dispatch">Dispatch</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="customer_service">Customer Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.employmentType || !formData.companyName || !formData.companyUsdot) {
          toast.error("Please fill in all required company information");
          return false;
        }
        return true;
      },
    },
    {
      id: "experience",
      title: "Experience & Training",
      description: "Your dispatch experience and training",
      icon: <Award className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Years of Dispatch Experience</Label>
            <Select value={formData.yearsExperience} onValueChange={(v) => updateFormData({ yearsExperience: v })}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">Less than 1 year</SelectItem>
                <SelectItem value="1-3">1-3 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Dispatch Software Experience</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DISPATCH_SOFTWARE.map((software) => (
                <div key={software} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                  <Checkbox
                    id={software}
                    checked={formData.dispatchSoftware.includes(software)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ dispatchSoftware: [...formData.dispatchSoftware, software] });
                      } else {
                        updateFormData({ dispatchSoftware: formData.dispatchSoftware.filter(s => s !== software) });
                      }
                    }}
                  />
                  <Label htmlFor={software} className="text-xs text-slate-300 cursor-pointer">
                    {software}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-300 font-medium">Hazmat Training Recommended</p>
                <p className="text-xs text-slate-400 mt-1">
                  If you will be dispatching hazmat loads, hazmat operations training is highly recommended 
                  to understand emergency procedures and compliance requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Hazmat Training Completion Date</Label>
              <Input
                type="date"
                value={formData.hazmatTrainingDate}
                onChange={(e) => updateFormData({ hazmatTrainingDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Training Provider</Label>
              <Input
                value={formData.hazmatTrainingProvider}
                onChange={(e) => updateFormData({ hazmatTrainingProvider: e.target.value })}
                placeholder="J.J. Keller, company training, etc."
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "certifications",
      title: "Certifications",
      description: "Professional certifications",
      icon: <Award className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Industry Certifications</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CERTIFICATIONS.map((cert) => (
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

          <div className="space-y-2">
            <Label className="text-slate-300">Other Certifications</Label>
            <Input
              value={formData.otherCertifications}
              onChange={(e) => updateFormData({ otherCertifications: e.target.value })}
              placeholder="List any other relevant certifications"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {formData.certifications.length > 0 && (
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-sm text-slate-300 mb-2">Selected Certifications:</p>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert) => (
                  <Badge key={cert} className="bg-red-500/20 text-red-400">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
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
                onCheckedChange={(c) => updateFormData({ acceptTerms: c as boolean })}
              />
              <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a> and 
                <a href="/privacy" className="text-blue-400 hover:underline ml-1">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="privacy"
                checked={formData.acceptPrivacy}
                onCheckedChange={(c) => updateFormData({ acceptPrivacy: c as boolean })}
              />
              <Label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer">
                I understand that my employer will be notified of my registration and must approve my access
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="responsibility"
                checked={formData.acceptResponsibility}
                onCheckedChange={(c) => updateFormData({ acceptResponsibility: c as boolean })}
              />
              <Label htmlFor="responsibility" className="text-sm text-slate-300 cursor-pointer">
                I understand my responsibility to comply with FMCSA HOS regulations when dispatching drivers 
                and will not instruct drivers to violate safety regulations
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
                  After submission, your company administrator will receive a notification to approve 
                  your account. Once approved, you'll have access to the Catalyst dispatch dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptPrivacy || !formData.acceptResponsibility) {
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
      subtitle="Register as a dispatcher/coordinator"
      roleIcon={<Flame className="w-8 h-8 text-white" />}
      roleColor="from-red-500 to-red-600"
    />
  );
}
