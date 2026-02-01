/**
 * TERMINAL MANAGER REGISTRATION PAGE
 * Multi-step registration for oil/chemical terminal facility managers
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md & EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
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
  Building2, User, FileText, Shield, MapPin,
  CheckCircle, AlertCircle, Mail, Phone, Fuel, Database
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface TerminalFormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  
  // Step 2: Facility Information
  facilityName: string;
  facilityType: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Step 3: Regulatory IDs
  epaId: string;
  statePermitNumber: string;
  spccPlanDate: string;
  storageCapacity: string;
  eiaReporting: boolean;
  
  // Step 4: Operations
  operatingHours: string;
  productsHandled: string[];
  loadingRacks: string;
  unloadingRacks: string;
  hasScada: boolean;
  
  // Step 5: Safety & Compliance
  emergencyContact: string;
  emergencyPhone: string;
  lastInspectionDate: string;
  oshaCompliant: boolean;
  
  // Step 6: Terms
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCompliance: boolean;
}

const initialFormData: TerminalFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
  facilityName: "",
  facilityType: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  epaId: "",
  statePermitNumber: "",
  spccPlanDate: "",
  storageCapacity: "",
  eiaReporting: false,
  operatingHours: "",
  productsHandled: [],
  loadingRacks: "",
  unloadingRacks: "",
  hasScada: false,
  emergencyContact: "",
  emergencyPhone: "",
  lastInspectionDate: "",
  oshaCompliant: false,
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

const PRODUCTS = [
  "Gasoline",
  "Diesel",
  "Jet Fuel",
  "Crude Oil",
  "Ethanol",
  "Biodiesel",
  "Propane/LPG",
  "Natural Gas Liquids",
  "Asphalt",
  "Lubricants",
  "Chemicals",
  "Acids",
  "Solvents",
  "Other Petroleum",
];

export default function RegisterTerminal() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<TerminalFormData>(initialFormData);

  const updateFormData = (updates: Partial<TerminalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const registerMutation = trpc.registration.registerTerminalManager.useMutation({
    onSuccess: () => {
      toast.success("Registration submitted!", { description: "Your facility registration is pending verification." });
      setLocation("/login");
    },
    onError: (error) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  const handleComplete = async () => {
    await registerMutation.mutateAsync({
      managerName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      password: formData.email,
      facilityName: formData.facilityName,
      ownerCompany: formData.facilityName,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      epaIdNumber: formData.epaId || undefined,
      hasSpccPlan: !!formData.spccPlanDate,
    });
  };

  const steps: WizardStep[] = [
    {
      id: "personal",
      title: "Personal Information",
      description: "Terminal manager contact details",
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
                placeholder="john@terminal.com"
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

          <div className="space-y-2">
            <Label className="text-slate-300">Job Title</Label>
            <Select value={formData.jobTitle} onValueChange={(v) => updateFormData({ jobTitle: v })}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terminal_manager">Terminal Manager</SelectItem>
                <SelectItem value="operations_manager">Operations Manager</SelectItem>
                <SelectItem value="facility_manager">Facility Manager</SelectItem>
                <SelectItem value="rack_supervisor">Rack Supervisor</SelectItem>
                <SelectItem value="logistics_coordinator">Logistics Coordinator</SelectItem>
              </SelectContent>
            </Select>
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
      id: "facility",
      title: "Facility Information",
      description: "Terminal location and type",
      icon: <Building2 className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Facility Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.facilityName}
                onChange={(e) => updateFormData({ facilityName: e.target.value })}
                placeholder="Houston Terminal #1"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Facility Type <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.facilityType} onValueChange={(v) => updateFormData({ facilityType: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select facility type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulk_terminal">Bulk Terminal</SelectItem>
                  <SelectItem value="rack_terminal">Rack Terminal</SelectItem>
                  <SelectItem value="refinery">Refinery</SelectItem>
                  <SelectItem value="pipeline_terminal">Pipeline Terminal</SelectItem>
                  <SelectItem value="chemical_plant">Chemical Plant</SelectItem>
                  <SelectItem value="distribution_center">Distribution Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Street Address <span className="text-red-400">*</span>
            </Label>
            <Input
              value={formData.streetAddress}
              onChange={(e) => updateFormData({ streetAddress: e.target.value })}
              placeholder="1234 Industrial Blvd"
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
                onChange={(e) => updateFormData({ city: e.target.value })}
                placeholder="Houston"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                State <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.state} onValueChange={(v) => updateFormData({ state: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
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
                onChange={(e) => updateFormData({ zipCode: e.target.value })}
                placeholder="77001"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.facilityName || !formData.facilityType || !formData.streetAddress || !formData.city || !formData.state) {
          toast.error("Please fill in all facility information");
          return false;
        }
        return true;
      },
    },
    {
      id: "regulatory",
      title: "Regulatory IDs",
      description: "EPA, state permits, and reporting",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-300 font-medium">Regulatory Requirements</p>
                <p className="text-xs text-slate-400 mt-1">
                  Bulk storage facilities must have EPA IDs, SPCC plans, and appropriate state permits. 
                  Facilities with &gt;50,000 barrel capacity must report to EIA.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                EPA ID Number <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.epaId}
                onChange={(e) => updateFormData({ epaId: e.target.value })}
                placeholder="TXD123456789"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">State Permit Number</Label>
              <Input
                value={formData.statePermitNumber}
                onChange={(e) => updateFormData({ statePermitNumber: e.target.value })}
                placeholder="State environmental permit #"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">SPCC Plan Date</Label>
              <Input
                type="date"
                value={formData.spccPlanDate}
                onChange={(e) => updateFormData({ spccPlanDate: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">Spill Prevention, Control, and Countermeasure plan date</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Total Storage Capacity (barrels)</Label>
              <Input
                type="number"
                value={formData.storageCapacity}
                onChange={(e) => updateFormData({ storageCapacity: e.target.value })}
                placeholder="100000"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-lg bg-slate-700/30">
            <Checkbox
              id="eiaReporting"
              checked={formData.eiaReporting}
              onCheckedChange={(c) => updateFormData({ eiaReporting: c as boolean })}
            />
            <Label htmlFor="eiaReporting" className="text-sm text-slate-300 cursor-pointer">
              This facility is required to report to EIA (Energy Information Administration)
            </Label>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.epaId) {
          toast.error("EPA ID is required");
          return false;
        }
        return true;
      },
    },
    {
      id: "operations",
      title: "Operations",
      description: "Products handled and loading infrastructure",
      icon: <Fuel className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Operating Hours</Label>
            <Select value={formData.operatingHours} onValueChange={(v) => updateFormData({ operatingHours: v })}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Select operating hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24_7">24/7 Operations</SelectItem>
                <SelectItem value="extended">Extended Hours (5am-10pm)</SelectItem>
                <SelectItem value="business">Business Hours (8am-5pm)</SelectItem>
                <SelectItem value="custom">Custom Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Products Handled</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRODUCTS.map((product) => (
                <div key={product} className="flex items-center space-x-2 p-2 rounded bg-slate-700/30">
                  <Checkbox
                    id={product}
                    checked={formData.productsHandled.includes(product)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormData({ productsHandled: [...formData.productsHandled, product] });
                      } else {
                        updateFormData({ productsHandled: formData.productsHandled.filter(p => p !== product) });
                      }
                    }}
                  />
                  <Label htmlFor={product} className="text-xs text-slate-300 cursor-pointer">
                    {product}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Number of Loading Racks</Label>
              <Input
                type="number"
                value={formData.loadingRacks}
                onChange={(e) => updateFormData({ loadingRacks: e.target.value })}
                placeholder="8"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Number of Unloading Racks</Label>
              <Input
                type="number"
                value={formData.unloadingRacks}
                onChange={(e) => updateFormData({ unloadingRacks: e.target.value })}
                placeholder="4"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-lg bg-slate-700/30">
            <Checkbox
              id="scada"
              checked={formData.hasScada}
              onCheckedChange={(c) => updateFormData({ hasScada: c as boolean })}
            />
            <Label htmlFor="scada" className="text-sm text-slate-300 cursor-pointer">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Facility has SCADA system for real-time monitoring
              </div>
            </Label>
          </div>
        </div>
      ),
    },
    {
      id: "safety",
      title: "Safety & Compliance",
      description: "Emergency contacts and inspection status",
      icon: <Shield className="w-5 h-5" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Emergency Contact Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => updateFormData({ emergencyContact: e.target.value })}
                placeholder="Jane Smith"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                Emergency Phone (24/7) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => updateFormData({ emergencyPhone: e.target.value })}
                placeholder="(555) 123-4567"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Last Facility Inspection Date</Label>
            <Input
              type="date"
              value={formData.lastInspectionDate}
              onChange={(e) => updateFormData({ lastInspectionDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-lg bg-slate-700/30">
            <Checkbox
              id="osha"
              checked={formData.oshaCompliant}
              onCheckedChange={(c) => updateFormData({ oshaCompliant: c as boolean })}
            />
            <Label htmlFor="osha" className="text-sm text-slate-300 cursor-pointer">
              Facility is OSHA compliant with current Process Safety Management (PSM) documentation
            </Label>
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.emergencyContact || !formData.emergencyPhone) {
          toast.error("Emergency contact information is required");
          return false;
        }
        return true;
      },
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
                I accept the <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
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
                I accept the <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
                <span className="text-red-400"> *</span>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-700/30">
              <Checkbox
                id="compliance"
                checked={formData.acceptCompliance}
                onCheckedChange={(c) => updateFormData({ acceptCompliance: c as boolean })}
              />
              <Label htmlFor="compliance" className="text-sm text-slate-300 cursor-pointer">
                I certify that this facility maintains all required environmental permits and safety documentation
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
                  After submission, our team will verify your EPA ID and facility information. 
                  Once approved, you'll be able to manage appointments and receive trucks at your facility.
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
      title="Terminal Manager Registration"
      subtitle="Register your oil/chemical terminal facility"
      roleIcon={<Building2 className="w-8 h-8 text-white" />}
      roleColor="from-cyan-500 to-cyan-600"
    />
  );
}
