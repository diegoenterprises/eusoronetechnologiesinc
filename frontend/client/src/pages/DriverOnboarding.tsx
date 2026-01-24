/**
 * DRIVER ONBOARDING PAGE
 * Multi-step onboarding wizard for new drivers
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, FileText, Truck, Shield, CheckCircle, ChevronRight,
  ChevronLeft, Upload, Camera, Award, Clock, AlertTriangle,
  Calendar, CreditCard, Phone, Mail, MapPin, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

const STEPS: OnboardingStep[] = [
  { id: "personal", title: "Personal Info", description: "Basic information", icon: User, completed: false },
  { id: "license", title: "CDL & Endorsements", description: "License verification", icon: CreditCard, completed: false },
  { id: "documents", title: "Documents", description: "Upload required docs", icon: FileText, completed: false },
  { id: "equipment", title: "Equipment", description: "Vehicle preferences", icon: Truck, completed: false },
  { id: "safety", title: "Safety Training", description: "Required courses", icon: Shield, completed: false },
  { id: "complete", title: "Complete", description: "Review & submit", icon: CheckCircle, completed: false },
];

export default function DriverOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    ssn: "",
    dob: "",
    cdlNumber: "",
    cdlState: "",
    cdlExpiration: "",
    cdlClass: "",
    endorsements: [] as string[],
    medicalCardExpiration: "",
    twicCard: false,
    twicExpiration: "",
    hazmatEndorsement: false,
    tankerEndorsement: false,
    doublesTriples: false,
    yearsExperience: "",
    previousEmployer: "",
    preferredEquipment: [] as string[],
    willingToTeam: false,
    homeTerminal: "",
    safetyAcknowledged: false,
    hosAcknowledged: false,
    hazmatTrainingDate: "",
    drugTestConsent: false,
    backgroundCheckConsent: false,
    clearinghouseConsent: false,
  });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({
    cdlFront: false,
    cdlBack: false,
    medicalCard: false,
    mvr: false,
    socialSecurity: false,
    proofOfResidence: false,
  });

  const [completedTraining, setCompletedTraining] = useState<string[]>([]);

  const requiredTraining = [
    { id: "hos", name: "Hours of Service (HOS)", duration: "30 min" },
    { id: "hazmat", name: "Hazmat Safety & ERG 2024", duration: "45 min" },
    { id: "defensive", name: "Defensive Driving", duration: "60 min" },
    { id: "pretrip", name: "Pre-Trip Inspection", duration: "30 min" },
    { id: "cargo", name: "Cargo Securement", duration: "30 min" },
  ];

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEndorsementToggle = (endorsement: string) => {
    setFormData(prev => ({
      ...prev,
      endorsements: prev.endorsements.includes(endorsement)
        ? prev.endorsements.filter(e => e !== endorsement)
        : [...prev.endorsements, endorsement]
    }));
  };

  const handleDocUpload = (docId: string) => {
    setUploadedDocs(prev => ({ ...prev, [docId]: true }));
    toast.success("Document uploaded successfully");
  };

  const handleTrainingComplete = (trainingId: string) => {
    if (!completedTraining.includes(trainingId)) {
      setCompletedTraining(prev => [...prev, trainingId]);
      toast.success("Training module completed");
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitApplication = () => {
    toast.success("Application submitted successfully!", {
      description: "You will be contacted within 24-48 hours.",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="John"
                />
              </div>
              <div>
                <Label className="text-slate-300">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Phone</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Street Address</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="123 Main St"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-300">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">State</Label>
                <Select value={formData.state} onValueChange={(v) => handleInputChange("state", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">ZIP</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Date of Birth</Label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Social Security Number</Label>
                <Input
                  type="password"
                  value={formData.ssn}
                  onChange={(e) => handleInputChange("ssn", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="XXX-XX-XXXX"
                />
              </div>
            </div>
          </div>
        );

      case 1: // CDL & Endorsements
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">CDL Number</Label>
                <Input
                  value={formData.cdlNumber}
                  onChange={(e) => handleInputChange("cdlNumber", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label className="text-slate-300">Issuing State</Label>
                <Select value={formData.cdlState} onValueChange={(v) => handleInputChange("cdlState", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">CDL Class</Label>
                <Select value={formData.cdlClass} onValueChange={(v) => handleInputChange("cdlClass", v)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Class A</SelectItem>
                    <SelectItem value="B">Class B</SelectItem>
                    <SelectItem value="C">Class C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.cdlExpiration}
                  onChange={(e) => handleInputChange("cdlExpiration", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-3 block">Endorsements</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: "H", name: "Hazmat (H)" },
                  { id: "N", name: "Tank (N)" },
                  { id: "X", name: "Hazmat + Tank (X)" },
                  { id: "T", name: "Doubles/Triples (T)" },
                  { id: "P", name: "Passenger (P)" },
                  { id: "S", name: "School Bus (S)" },
                ].map((endorsement) => (
                  <div
                    key={endorsement.id}
                    onClick={() => handleEndorsementToggle(endorsement.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      formData.endorsements.includes(endorsement.id)
                        ? "bg-green-500/20 border-green-500/50"
                        : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        formData.endorsements.includes(endorsement.id)
                          ? "bg-green-500 border-green-500"
                          : "border-slate-500"
                      )}>
                        {formData.endorsements.includes(endorsement.id) && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-white text-sm">{endorsement.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Medical Card Expiration</Label>
                <Input
                  type="date"
                  value={formData.medicalCardExpiration}
                  onChange={(e) => handleInputChange("medicalCardExpiration", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Years of Experience</Label>
                <Select value={formData.yearsExperience} onValueChange={(v) => handleInputChange("yearsExperience", v)}>
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
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium">TWIC Card</p>
                  <p className="text-sm text-slate-400 mb-2">
                    Transportation Worker Identification Credential required for terminal access
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.twicCard}
                      onCheckedChange={(v) => handleInputChange("twicCard", !!v)}
                    />
                    <span className="text-white text-sm">I have a valid TWIC card</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Documents
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium">Required Documents</p>
                  <p className="text-sm text-slate-400">
                    All documents must be clear, legible photos or scans. Files should be less than 10MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: "cdlFront", name: "CDL Front", required: true },
                { id: "cdlBack", name: "CDL Back", required: true },
                { id: "medicalCard", name: "Medical Card", required: true },
                { id: "mvr", name: "Motor Vehicle Report (MVR)", required: true },
                { id: "socialSecurity", name: "Social Security Card", required: true },
                { id: "proofOfResidence", name: "Proof of Residence", required: true },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    uploadedDocs[doc.id]
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-slate-700/30 border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className={cn(
                        "w-5 h-5",
                        uploadedDocs[doc.id] ? "text-green-400" : "text-slate-400"
                      )} />
                      <span className="text-white font-medium">{doc.name}</span>
                    </div>
                    {doc.required && (
                      <Badge className="bg-red-500/20 text-red-400 text-xs">Required</Badge>
                    )}
                  </div>
                  
                  {uploadedDocs[doc.id] ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Uploaded
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-600"
                      onClick={() => handleDocUpload(doc.id)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <Camera className="w-5 h-5 text-slate-400" />
                <span className="text-white font-medium">Profile Photo</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Upload a clear headshot photo for your driver profile
              </p>
              <Button variant="outline" size="sm" className="border-slate-600">
                <Camera className="w-4 h-4 mr-2" />
                Take or Upload Photo
              </Button>
            </div>
          </div>
        );

      case 3: // Equipment
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-slate-300 mb-3 block">Preferred Equipment Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: "MC-306", name: "MC-306 (Gasoline)" },
                  { id: "MC-307", name: "MC-307 (Chemical)" },
                  { id: "MC-312", name: "MC-312 (Corrosive)" },
                  { id: "MC-331", name: "MC-331 (Pressure)" },
                  { id: "MC-406", name: "MC-406 (Non-Pressure)" },
                  { id: "MC-407", name: "MC-407 (Low Pressure)" },
                ].map((equipment) => (
                  <div
                    key={equipment.id}
                    onClick={() => {
                      const current = formData.preferredEquipment;
                      const updated = current.includes(equipment.id)
                        ? current.filter(e => e !== equipment.id)
                        : [...current, equipment.id];
                      handleInputChange("preferredEquipment", updated);
                    }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      formData.preferredEquipment.includes(equipment.id)
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className={cn(
                        "w-5 h-5",
                        formData.preferredEquipment.includes(equipment.id) ? "text-blue-400" : "text-slate-400"
                      )} />
                      <span className="text-white text-sm">{equipment.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Home Terminal</Label>
              <Select value={formData.homeTerminal} onValueChange={(v) => handleInputChange("homeTerminal", v)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select terminal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="houston">Houston, TX</SelectItem>
                  <SelectItem value="dallas">Dallas, TX</SelectItem>
                  <SelectItem value="beaumont">Beaumont, TX</SelectItem>
                  <SelectItem value="corpus">Corpus Christi, TX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={formData.willingToTeam}
                  onCheckedChange={(v) => handleInputChange("willingToTeam", !!v)}
                />
                <span className="text-white">Willing to team drive</span>
              </div>
              <p className="text-sm text-slate-400 pl-6">
                Team drivers can cover longer distances and earn additional pay
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Previous Employer (Optional)</Label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={formData.previousEmployer}
                  onChange={(e) => handleInputChange("previousEmployer", e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Company name"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Safety Training
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">Training Progress</p>
                    <p className="text-sm text-slate-400">
                      {completedTraining.length} of {requiredTraining.length} modules completed
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  {Math.round((completedTraining.length / requiredTraining.length) * 100)}%
                </Badge>
              </div>
              <Progress 
                value={(completedTraining.length / requiredTraining.length) * 100} 
                className="mt-3 h-2 bg-slate-700" 
              />
            </div>

            <div className="space-y-3">
              {requiredTraining.map((training) => {
                const isCompleted = completedTraining.includes(training.id);
                return (
                  <div
                    key={training.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      isCompleted
                        ? "bg-green-500/10 border-green-500/50"
                        : "bg-slate-700/30 border-slate-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{training.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {training.duration}
                          </p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleTrainingComplete(training.id)}
                        >
                          Start Training
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-700">
              <p className="text-white font-medium">Acknowledgements</p>
              
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.hosAcknowledged}
                  onCheckedChange={(v) => handleInputChange("hosAcknowledged", !!v)}
                />
                <span className="text-sm text-slate-300">
                  I understand and agree to comply with all Hours of Service regulations per 49 CFR 395
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.safetyAcknowledged}
                  onCheckedChange={(v) => handleInputChange("safetyAcknowledged", !!v)}
                />
                <span className="text-sm text-slate-300">
                  I acknowledge receipt of the company safety policies and procedures manual
                </span>
              </div>
            </div>
          </div>
        );

      case 5: // Complete
        return (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Almost Done!</h2>
              <p className="text-slate-400">Review your information and submit your application</p>
            </div>

            <Card className="bg-slate-700/30 border-slate-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Application Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="text-white">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CDL</span>
                  <span className="text-white">Class {formData.cdlClass} - {formData.cdlState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Endorsements</span>
                  <span className="text-white">{formData.endorsements.join(", ") || "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Documents</span>
                  <span className="text-green-400">
                    {Object.values(uploadedDocs).filter(Boolean).length} of 6 uploaded
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Training</span>
                  <span className="text-green-400">
                    {completedTraining.length} of {requiredTraining.length} completed
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.drugTestConsent}
                  onCheckedChange={(v) => handleInputChange("drugTestConsent", !!v)}
                />
                <span className="text-sm text-slate-300">
                  I consent to pre-employment and random drug and alcohol testing
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.backgroundCheckConsent}
                  onCheckedChange={(v) => handleInputChange("backgroundCheckConsent", !!v)}
                />
                <span className="text-sm text-slate-300">
                  I authorize a background check including driving record (MVR) and criminal history
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={formData.clearinghouseConsent}
                  onCheckedChange={(v) => handleInputChange("clearinghouseConsent", !!v)}
                />
                <span className="text-sm text-slate-300">
                  I authorize queries to the FMCSA Drug & Alcohol Clearinghouse
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Driver Onboarding</h1>
        <p className="text-slate-400 text-sm">Complete all steps to join our team</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">Step {currentStep + 1} of {STEPS.length}</span>
        <span className="text-sm text-white font-medium">{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2 bg-slate-700" />

      {/* Step Indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isCompleted ? "bg-green-500" :
                isActive ? "bg-purple-600" :
                "bg-slate-700"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 hidden md:block",
                isActive ? "text-purple-400" : "text-slate-500"
              )}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: "w-5 h-5 text-purple-400" })}
            {STEPS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="border-slate-600"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={submitApplication}
            disabled={!formData.drugTestConsent || !formData.backgroundCheckConsent || !formData.clearinghouseConsent}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit Application
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={nextStep} className="bg-purple-600 hover:bg-purple-700">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
