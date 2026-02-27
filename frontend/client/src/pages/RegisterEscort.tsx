/**
 * ESCORT REGISTRATION PAGE
 * Multi-step registration for pilot/escort vehicle operators
 * Based on 06_ESCORT_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
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
import { Badge } from "@/components/ui/badge";
import { 
  Car, User, FileText, Shield, MapPin, 
  Upload, CheckCircle, AlertCircle, Mail, Phone, Award, Lock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DatePicker from "@/components/DatePicker";
import CanopyConnectButton from "@/components/CanopyConnectButton";
import type { CanopyPolicyData } from "@/components/CanopyConnectButton";

interface EscortFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Step 2: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  serviceRadius: string;
  
  // Step 3: Driver's License
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: string;
  licenseClass: string;
  
  // Step 4: State Certifications
  certifiedStates: string[];
  certificationNumbers: Record<string, string>;
  certificationExpirations: Record<string, string>;
  
  // Step 5: Vehicle Information
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleState: string;
  hasRequiredEquipment: boolean;
  equipmentList: string[];
  
  // Step 6: Insurance
  insuranceCatalyst: string;
  policyNumber: string;
  coverageAmount: string;
  expirationDate: string;
  
  // Step 7: Experience
  yearsExperience: string;
  previousEmployer: string;
  certifications: string[];
  
  // Step 8: Account Security
  password: string;
  confirmPassword: string;
  
  // Step 9: Compliance Integrations
  complianceIds: ComplianceIds;
  
  // Step 10: Terms
  acceptTerms: boolean;
  acceptBackground: boolean;
}

const initialFormData: EscortFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  serviceRadius: "100",
  licenseNumber: "",
  licenseState: "",
  licenseExpiration: "",
  licenseClass: "",
  certifiedStates: [],
  certificationNumbers: {},
  certificationExpirations: {},
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleColor: "",
  vehiclePlate: "",
  vehicleState: "",
  hasRequiredEquipment: false,
  equipmentList: [],
  insuranceCatalyst: "",
  policyNumber: "",
  coverageAmount: "",
  expirationDate: "",
  yearsExperience: "",
  previousEmployer: "",
  certifications: [],
  password: "",
  confirmPassword: "",
  complianceIds: emptyComplianceIds,
  acceptTerms: false,
  acceptBackground: false,
};

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const REQUIRED_EQUIPMENT = [
  "Height Pole (adjustable)",
  "Two-Way Radio/CB",
  "Amber Rotating/Strobe Lights",
  "OVERSIZE LOAD Signs (front/rear)",
  "Flags (red/orange)",
  "Fire Extinguisher",
  "First Aid Kit",
  "Reflective Vest",
  "Stop/Slow Paddle",
];

export default function RegisterEscort() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<EscortFormData>(initialFormData);

  const updateFormData = (updates: Partial<EscortFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const registerMutation = (trpc as any).registration.registerEscort.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Your certifications are being verified." });
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
      dateOfBirth: formData.dateOfBirth || undefined,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      serviceRadius: formData.serviceRadius || undefined,
      driversLicenseNumber: formData.licenseNumber,
      driversLicenseState: formData.licenseState,
      driversLicenseExpiration: formData.licenseExpiration || undefined,
      driversLicenseClass: formData.licenseClass || undefined,
      certifiedStates: formData.certifiedStates?.length ? formData.certifiedStates : undefined,
      certificationNumbers: Object.keys(formData.certificationNumbers || {}).length ? formData.certificationNumbers : undefined,
      certificationExpirations: Object.keys(formData.certificationExpirations || {}).length ? formData.certificationExpirations : undefined,
      vehicleYear: formData.vehicleYear || undefined,
      vehicleMake: formData.vehicleMake || undefined,
      vehicleModel: formData.vehicleModel || undefined,
      vehicleColor: formData.vehicleColor || undefined,
      vehiclePlate: formData.vehiclePlate || undefined,
      vehicleState: formData.vehicleState || undefined,
      hasRequiredEquipment: formData.hasRequiredEquipment || false,
      equipmentList: formData.equipmentList?.length ? formData.equipmentList : undefined,
      insuranceCarrier: formData.insuranceCatalyst || undefined,
      insurancePolicy: formData.policyNumber || undefined,
      insuranceCoverage: formData.coverageAmount || undefined,
      insuranceExpiration: formData.expirationDate || undefined,
      experienceYears: Number(formData.yearsExperience) || 0,
      previousEmployer: formData.previousEmployer || undefined,
      certifications: formData.certifications?.length ? formData.certifications : undefined,
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
                placeholder="john@email.com"
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

          <div className="space-y-2">
            <Label className="text-slate-300">Date of Birth <span className="text-red-400">*</span></Label>
            <DatePicker value={formData.dateOfBirth} onChange={(v) => updateFormData({ dateOfBirth: v })} />
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
      title: "Service Area",
      description: "Your location and service radius",
      icon: <MapPin className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Street Address <span className="text-red-400">*</span></Label>
            <Input
              value={formData.streetAddress}
              onChange={(e: any) => updateFormData({ streetAddress: e.target.value })}
              placeholder="123 Main St"
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
              <Label className="text-slate-300">ZIP <span className="text-red-400">*</span></Label>
              <Input
                value={formData.zipCode}
                onChange={(e: any) => updateFormData({ zipCode: e.target.value })}
                placeholder="77001"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Service Radius (miles)</Label>
            <Select value={formData.serviceRadius} onValueChange={(v: any) => updateFormData({ serviceRadius: v })}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
                <SelectItem value="200">200 miles</SelectItem>
                <SelectItem value="500">500 miles</SelectItem>
                <SelectItem value="unlimited">Nationwide</SelectItem>
              </SelectContent>
            </Select>
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
      id: "license",
      title: "Driver's License",
      description: "Your valid driver's license",
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">License Number <span className="text-red-400">*</span></Label>
              <Input
                value={formData.licenseNumber}
                onChange={(e: any) => updateFormData({ licenseNumber: e.target.value })}
                placeholder="12345678"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Issuing State <span className="text-red-400">*</span></Label>
              <Select value={formData.licenseState} onValueChange={(v: any) => updateFormData({ licenseState: v })}>
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
              <Label className="text-slate-300">Expiration Date <span className="text-red-400">*</span></Label>
              <DatePicker value={formData.licenseExpiration} onChange={(v) => updateFormData({ licenseExpiration: v })} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">License Class</Label>
              <Select value={formData.licenseClass} onValueChange={(v: any) => updateFormData({ licenseClass: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (Class D/C)</SelectItem>
                  <SelectItem value="commercial">Commercial (CDL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.licenseNumber || !formData.licenseState || !formData.licenseExpiration) {
          toast.error("Please fill in all license information");
          return false;
        }
        return true;
      },
    },
    {
      id: "certifications",
      title: "State Certifications",
      description: "Pilot/Escort certifications by state",
      icon: <Award className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">State Certification Requirements</p>
                <p className="text-xs text-slate-400 mt-1">
                  Many states require pilot/escort vehicle operators to be certified. Select the states 
                  where you hold valid certifications. Some states have reciprocity agreements.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Certified States</Label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {US_STATES.map((state: any) => (
                <Badge
                  key={state}
                  variant={formData.certifiedStates.includes(state) ? "default" : "outline"}
                  className="cursor-pointer justify-center"
                  onClick={() => {
                    if (formData.certifiedStates.includes(state)) {
                      updateFormData({ 
                        certifiedStates: formData.certifiedStates.filter(s => s !== state) 
                      });
                    } else {
                      updateFormData({ 
                        certifiedStates: [...formData.certifiedStates, state] 
                      });
                    }
                  }}
                >
                  {state}
                </Badge>
              ))}
            </div>
          </div>

          {formData.certifiedStates.length > 0 && (
            <div className="p-4 rounded-lg bg-slate-700/30">
              <p className="text-sm text-slate-300 mb-3">
                Enter certification details for selected states:
              </p>
              <div className="space-y-3">
                {formData.certifiedStates.slice(0, 5).map((state: any) => (
                  <div key={state} className="grid grid-cols-3 gap-2">
                    <div className="flex items-center">
                      <Badge>{state}</Badge>
                    </div>
                    <Input
                      placeholder="Cert #"
                      value={formData.certificationNumbers[state] || ""}
                      onChange={(e: any) => updateFormData({
                        certificationNumbers: { 
                          ...formData.certificationNumbers, 
                          [state]: e.target.value 
                        }
                      })}
                      className="bg-slate-700/50 border-slate-600 text-white text-sm"
                    />
                    <DatePicker
                      value={formData.certificationExpirations[state] || ""}
                      onChange={(v) => updateFormData({
                        certificationExpirations: { 
                          ...formData.certificationExpirations, 
                          [state]: v 
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "vehicle",
      title: "Vehicle & Equipment",
      description: "Your escort vehicle details",
      icon: <Car className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Year <span className="text-red-400">*</span></Label>
              <Input
                value={formData.vehicleYear}
                onChange={(e: any) => updateFormData({ vehicleYear: e.target.value })}
                placeholder="2022"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Make <span className="text-red-400">*</span></Label>
              <Input
                value={formData.vehicleMake}
                onChange={(e: any) => updateFormData({ vehicleMake: e.target.value })}
                placeholder="Ford"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Model <span className="text-red-400">*</span></Label>
              <Input
                value={formData.vehicleModel}
                onChange={(e: any) => updateFormData({ vehicleModel: e.target.value })}
                placeholder="F-150"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Color</Label>
              <Input
                value={formData.vehicleColor}
                onChange={(e: any) => updateFormData({ vehicleColor: e.target.value })}
                placeholder="White"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">License Plate <span className="text-red-400">*</span></Label>
              <Input
                value={formData.vehiclePlate}
                onChange={(e: any) => updateFormData({ vehiclePlate: e.target.value })}
                placeholder="ABC-1234"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Plate State <span className="text-red-400">*</span></Label>
              <Select value={formData.vehicleState} onValueChange={(v: any) => updateFormData({ vehicleState: v })}>
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

          <div className="space-y-2">
            <Label className="text-slate-300">Required Equipment</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REQUIRED_EQUIPMENT.map((equip: any) => (
                <div key={equip} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                  <Checkbox
                    id={equip}
                    checked={formData.equipmentList.includes(equip)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ equipmentList: [...formData.equipmentList, equip] });
                      } else {
                        updateFormData({ equipmentList: formData.equipmentList.filter(e => e !== equip) });
                      }
                    }}
                  />
                  <Label htmlFor={equip} className="text-sm text-slate-300 cursor-pointer">
                    {equip}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.vehicleYear || !formData.vehicleMake || !formData.vehicleModel || !formData.vehiclePlate) {
          toast.error("Please fill in all vehicle information");
          return false;
        }
        return true;
      },
    },
    {
      id: "insurance",
      title: "Insurance",
      description: "Vehicle and liability insurance",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <CanopyConnectButton
            policyType="auto"
            verified={!!formData.policyNumber && !!formData.insuranceCatalyst && (formData as any)._canopyVerified}
            onPolicyData={(data: CanopyPolicyData) => {
              const updates: Partial<EscortFormData> = { _canopyVerified: true } as any;
              if (data.carrier) updates.insuranceCatalyst = data.carrier;
              if (data.policyNumber) updates.policyNumber = data.policyNumber;
              if (data.policyEnd) updates.expirationDate = data.policyEnd;
              const cov = data.coverages?.find(c => c.type?.toLowerCase().includes('auto') || c.type?.toLowerCase().includes('liability'));
              if (cov?.limit) {
                const num = parseInt(String(cov.limit).replace(/[^0-9]/g, ''));
                if (num >= 1000000) updates.coverageAmount = '1000000';
                else if (num >= 500000) updates.coverageAmount = '500000';
                else if (num >= 300000) updates.coverageAmount = '300000';
                else updates.coverageAmount = '100000';
              }
              updateFormData(updates);
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Insurance Catalyst <span className="text-red-400">*</span></Label>
              <Input
                value={formData.insuranceCatalyst}
                onChange={(e: any) => updateFormData({ insuranceCatalyst: e.target.value })}
                placeholder="ABC Insurance"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Policy Number <span className="text-red-400">*</span></Label>
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
              <Label className="text-slate-300">Coverage Amount <span className="text-red-400">*</span></Label>
              <Select value={formData.coverageAmount} onValueChange={(v: any) => updateFormData({ coverageAmount: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100000">$100,000</SelectItem>
                  <SelectItem value="300000">$300,000</SelectItem>
                  <SelectItem value="500000">$500,000</SelectItem>
                  <SelectItem value="1000000">$1,000,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Expiration Date <span className="text-red-400">*</span></Label>
              <DatePicker value={formData.expirationDate} onChange={(v) => updateFormData({ expirationDate: v })} />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.insuranceCatalyst || !formData.policyNumber || !formData.coverageAmount) {
          toast.error("Please fill in all insurance information");
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
      description: "Link existing compliance IDs for faster verification",
      icon: <ShieldCheck className="w-5 h-5" />,
      component: (
        <ComplianceIntegrations
          role="ESCORT"
          complianceIds={formData.complianceIds}
          onChange={(ids) => updateFormData({ complianceIds: ids })}
        />
      ),
    },
    {
      id: "terms",
      title: "Experience & Terms",
      description: "Your experience and agreements",
      icon: <FileText className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Years of Experience</Label>
              <Select value={formData.yearsExperience} onValueChange={(v: any) => updateFormData({ yearsExperience: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select" />
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
              <Label className="text-slate-300">Previous Employer</Label>
              <Input
                value={formData.previousEmployer}
                onChange={(e: any) => updateFormData({ previousEmployer: e.target.value })}
                placeholder="Company name (if any)"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(c: any) => updateFormData({ acceptTerms: c as boolean })}
              />
              <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                I accept the <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a> and 
                <a href="/privacy-policy" className="text-blue-400 hover:underline ml-1">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="background"
                checked={formData.acceptBackground}
                onCheckedChange={(c: any) => updateFormData({ acceptBackground: c as boolean })}
              />
              <Label htmlFor="background" className="text-sm text-slate-300 cursor-pointer">
                I consent to a background check and MVR review
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
                  After submission, we'll verify your certifications and insurance. Once approved, 
                  you'll be able to browse and accept escort jobs in your service area.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.acceptTerms || !formData.acceptBackground) {
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
      title="Escort Registration"
      subtitle="Register as a pilot/escort vehicle operator"
      roleIcon={<Car className="w-8 h-8 text-white" />}
      roleColor="from-pink-500 to-pink-600"
    />
  );
}
