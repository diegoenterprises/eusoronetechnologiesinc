/**
 * CARRIER REGISTRATION PAGE
 * Multi-step registration for trucking companies
 * Based on EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationWizard, WizardStep } from "@/components/registration/RegistrationWizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Truck, Building2, FileText, Shield, CreditCard, 
  Upload, CheckCircle, AlertCircle, User, Mail, Phone,
  MapPin, Hash, Search, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CarrierFormData {
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
  carrierType: string[];
  equipmentTypes: string[];
  
  // Step 4: Contact Information
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  dispatchEmail: string;
  dispatchPhone: string;
  
  // Step 5: Insurance
  liabilityCarrier: string;
  liabilityPolicy: string;
  liabilityCoverage: string;
  liabilityExpiration: string;
  cargoCarrier: string;
  cargoPolicy: string;
  cargoCoverage: string;
  cargoExpiration: string;
  
  // Step 6: Fleet Information
  powerUnits: string;
  drivers: string;
  hazmatCertifiedDrivers: string;
  
  // Step 7: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptSafetyPolicy: boolean;
}

const initialFormData: CarrierFormData = {
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
  carrierType: [],
  equipmentTypes: [],
  primaryContactName: "",
  primaryContactTitle: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  dispatchEmail: "",
  dispatchPhone: "",
  liabilityCarrier: "",
  liabilityPolicy: "",
  liabilityCoverage: "",
  liabilityExpiration: "",
  cargoCarrier: "",
  cargoPolicy: "",
  cargoCoverage: "",
  cargoExpiration: "",
  powerUnits: "",
  drivers: "",
  hazmatCertifiedDrivers: "",
  acceptTerms: false,
  acceptPrivacy: false,
  acceptSafetyPolicy: false,
};

const EQUIPMENT_TYPES = [
  { value: "mc306", label: "MC-306 (Gasoline Tanker)" },
  { value: "mc307", label: "MC-307 (Chemical Tanker)" },
  { value: "mc312", label: "MC-312 (Corrosive Tanker)" },
  { value: "mc331", label: "MC-331 (Pressure Tank)" },
  { value: "mc338", label: "MC-338 (Cryogenic)" },
  { value: "dryvan", label: "Dry Van" },
  { value: "flatbed", label: "Flatbed" },
  { value: "reefer", label: "Refrigerated" },
];

export default function RegisterCarrier() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<CarrierFormData>(initialFormData);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const updateFormData = (updates: Partial<CarrierFormData>) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleSAFERLookup = async () => {
    if (!formData.usdotNumber) {
      toast.error("Please enter a USDOT number first");
      return;
    }

    setIsLookingUp(true);
    try {
      // Simulate FMCSA SAFER API lookup
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock data - in production this would come from FMCSA SAFER API
      updateFormData({
        companyName: formData.companyName || "Sample Trucking LLC",
        operatingStatus: "AUTHORIZED",
        entityType: "CARRIER",
        physicalAddress: "123 Trucking Way, Houston, TX 77001",
        mailingAddress: "PO Box 1234, Houston, TX 77002",
        phoneNumber: "(713) 555-0100",
        saferVerified: true,
      });
      
      toast.success("SAFER data retrieved successfully");
    } catch (error) {
      toast.error("Failed to lookup SAFER data");
    }
    setIsLookingUp(false);
  };

  const registerMutation = (trpc as any).registration.registerCarrier.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Your carrier account is pending USDOT verification." });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  const handleComplete = async () => {
    await registerMutation.mutateAsync({
      companyName: formData.companyName,
      dba: formData.dba || undefined,
      usdotNumber: formData.usdotNumber,
      mcNumber: formData.mcNumber || undefined,
      einNumber: formData.einNumber || undefined,
      contactName: formData.primaryContactName,
      contactEmail: formData.primaryContactEmail,
      contactPhone: formData.primaryContactPhone,
      password: formData.primaryContactEmail,
      streetAddress: formData.physicalAddress,
      city: "",
      state: "",
      zipCode: "",
      fleetSize: {
        powerUnits: Number(formData.powerUnits) || 0,
        trailers: 0,
        drivers: Number(formData.drivers) || 0,
      },
      hazmatEndorsed: formData.hasHazmatAuthority,
      hazmatClasses: [],
      tankerEndorsed: false,
      liabilityCarrier: formData.liabilityCarrier,
      liabilityPolicy: formData.liabilityPolicy,
      liabilityCoverage: formData.liabilityCoverage,
      liabilityExpiration: formData.liabilityExpiration,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "usdot",
      title: "USDOT Verification",
      description: "Enter your USDOT number for SAFER verification",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">FMCSA SAFER Verification</p>
                <p className="text-xs text-slate-400 mt-1">
                  We'll automatically verify your carrier information from the FMCSA SAFER system.
                  This helps ensure compliance and speeds up the registration process.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usdotNumber" className="text-slate-300">
                USDOT Number <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="usdotNumber"
                  value={formData.usdotNumber}
                  onChange={(e: any) => updateFormData({ usdotNumber: e.target.value })}
                  placeholder="1234567"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Button
                  type="button"
                  onClick={handleSAFERLookup}
                  disabled={isLookingUp}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLookingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcNumber" className="text-slate-300">MC Number</Label>
              <Input
                id="mcNumber"
                value={formData.mcNumber}
                onChange={(e: any) => updateFormData({ mcNumber: e.target.value })}
                placeholder="MC-123456"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          {formData.saferVerified && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">SAFER Verification Successful</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Company Name</p>
                  <p className="text-white">{formData.companyName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Operating Status</p>
                  <Badge className="bg-green-500/20 text-green-400">{formData.operatingStatus}</Badge>
                </div>
                <div>
                  <p className="text-slate-400">Entity Type</p>
                  <p className="text-white">{formData.entityType}</p>
                </div>
                <div>
                  <p className="text-slate-400">Physical Address</p>
                  <p className="text-white">{formData.physicalAddress}</p>
                </div>
              </div>
            </div>
          )}

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
        </div>
      ),
      validate: () => {
        if (!formData.usdotNumber || !formData.einNumber) {
          toast.error("Please enter USDOT number and EIN");
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
          <div className="space-y-4">
            <h4 className="text-white font-medium">Liability Insurance (Min $1,000,000)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Insurance Carrier <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.liabilityCarrier}
                  onChange={(e: any) => updateFormData({ liabilityCarrier: e.target.value })}
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
                <Input
                  type="date"
                  value={formData.liabilityExpiration}
                  onChange={(e: any) => updateFormData({ liabilityExpiration: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Cargo Insurance (Min $100,000)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Insurance Carrier <span className="text-red-400">*</span></Label>
                <Input
                  value={formData.cargoCarrier}
                  onChange={(e: any) => updateFormData({ cargoCarrier: e.target.value })}
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
                <Input
                  type="date"
                  value={formData.cargoExpiration}
                  onChange={(e: any) => updateFormData({ cargoExpiration: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.liabilityCarrier || !formData.liabilityPolicy || !formData.cargoCarrier || !formData.cargoPolicy) {
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
                I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
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
                I accept the <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
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
      title="Carrier Registration"
      subtitle="Register your trucking company to haul hazmat loads"
      roleIcon={<Truck className="w-8 h-8 text-white" />}
      roleColor="from-green-500 to-green-600"
    />
  );
}
