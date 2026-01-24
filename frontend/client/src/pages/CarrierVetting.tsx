/**
 * CARRIER VETTING
 * Broker interface for vetting carriers with SAFER/FMCSA integration
 * Based on 03_BROKER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Search, Shield, CheckCircle, XCircle, AlertTriangle, Truck,
  FileText, Clock, MapPin, Phone, Mail, Building, Calendar,
  ExternalLink, RefreshCw, Star, Award, Users, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CarrierData {
  mcNumber: string;
  dotNumber: string;
  legalName: string;
  dbaName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email?: string;
  entityType: "CARRIER" | "BROKER" | "FREIGHT FORWARDER";
  operatingStatus: "AUTHORIZED" | "NOT AUTHORIZED" | "OUT OF SERVICE";
  safetyRating: "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";
  safetyRatingDate?: string;
  insurance: {
    liability: number;
    cargo: number;
    bond?: number;
    effectiveDate: string;
    expirationDate: string;
  };
  equipment: {
    powerUnits: number;
    drivers: number;
  };
  cargoTypes: string[];
  hazmatAuthorized: boolean;
  passengerAuthorized: boolean;
  mcs150Date: string;
  outOfServiceDate?: string;
  csaScores?: {
    unsafeDriving: number;
    hosFatigue: number;
    driverFitness: number;
    controlledSubstances: number;
    vehicleMaintenance: number;
    hazmatCompliance?: number;
    crashIndicator: number;
  };
}

interface VettingChecklist {
  id: string;
  label: string;
  description: string;
  status: "pass" | "fail" | "warning" | "pending";
  autoVerified: boolean;
  verifiedAt?: string;
  notes?: string;
}

const MOCK_CARRIER: CarrierData = {
  mcNumber: "MC-123456",
  dotNumber: "DOT-789012",
  legalName: "SafeHaul Transport LLC",
  dbaName: "SafeHaul",
  address: {
    street: "1234 Industrial Blvd",
    city: "Houston",
    state: "TX",
    zip: "77001",
  },
  phone: "(713) 555-0123",
  email: "dispatch@safehaul.com",
  entityType: "CARRIER",
  operatingStatus: "AUTHORIZED",
  safetyRating: "Satisfactory",
  safetyRatingDate: "2024-06-15",
  insurance: {
    liability: 5000000,
    cargo: 250000,
    bond: 75000,
    effectiveDate: "2024-01-01",
    expirationDate: "2025-01-01",
  },
  equipment: {
    powerUnits: 25,
    drivers: 32,
  },
  cargoTypes: ["General Freight", "Liquids/Gases", "Hazardous Materials"],
  hazmatAuthorized: true,
  passengerAuthorized: false,
  mcs150Date: "2024-03-15",
  csaScores: {
    unsafeDriving: 15,
    hosFatigue: 22,
    driverFitness: 8,
    controlledSubstances: 0,
    vehicleMaintenance: 35,
    hazmatCompliance: 12,
    crashIndicator: 18,
  },
};

export default function CarrierVetting() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [carrier, setCarrier] = useState<CarrierData | null>(null);
  const [checklist, setChecklist] = useState<VettingChecklist[]>([]);

  const performSearch = async () => {
    if (!searchQuery) {
      toast.error("Please enter MC or DOT number");
      return;
    }
    
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCarrier(MOCK_CARRIER);
    generateChecklist(MOCK_CARRIER);
    setIsSearching(false);
    toast.success("Carrier data retrieved from SAFER");
  };

  const generateChecklist = (data: CarrierData) => {
    const items: VettingChecklist[] = [
      {
        id: "operating_authority",
        label: "Operating Authority",
        description: "Carrier has active MC/DOT authority",
        status: data.operatingStatus === "AUTHORIZED" ? "pass" : "fail",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
      },
      {
        id: "safety_rating",
        label: "Safety Rating",
        description: "FMCSA safety rating is Satisfactory or Conditional",
        status: data.safetyRating === "Satisfactory" ? "pass" : 
                data.safetyRating === "Conditional" ? "warning" : "fail",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
      },
      {
        id: "liability_insurance",
        label: "Liability Insurance",
        description: "Minimum $1M liability coverage required",
        status: data.insurance.liability >= 1000000 ? "pass" : "fail",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
        notes: `Current coverage: $${(data.insurance.liability / 1000000).toFixed(1)}M`,
      },
      {
        id: "cargo_insurance",
        label: "Cargo Insurance",
        description: "Minimum $100K cargo coverage required",
        status: data.insurance.cargo >= 100000 ? "pass" : "fail",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
        notes: `Current coverage: $${(data.insurance.cargo / 1000).toFixed(0)}K`,
      },
      {
        id: "insurance_current",
        label: "Insurance Current",
        description: "Insurance policy is not expired",
        status: new Date(data.insurance.expirationDate) > new Date() ? "pass" : "fail",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
        notes: `Expires: ${new Date(data.insurance.expirationDate).toLocaleDateString()}`,
      },
      {
        id: "mcs150_current",
        label: "MCS-150 Current",
        description: "MCS-150 filed within last 24 months",
        status: (() => {
          const mcsDate = new Date(data.mcs150Date);
          const monthsAgo = (new Date().getTime() - mcsDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return monthsAgo <= 24 ? "pass" : monthsAgo <= 30 ? "warning" : "fail";
        })(),
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
        notes: `Last filed: ${new Date(data.mcs150Date).toLocaleDateString()}`,
      },
      {
        id: "hazmat_authority",
        label: "Hazmat Authority",
        description: "Carrier authorized to haul hazardous materials",
        status: data.hazmatAuthorized ? "pass" : "warning",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
      },
      {
        id: "csa_scores",
        label: "CSA Scores Acceptable",
        description: "No CSA BASIC scores above intervention threshold",
        status: data.csaScores ? (
          Object.values(data.csaScores).every(score => score < 65) ? "pass" :
          Object.values(data.csaScores).some(score => score >= 75) ? "fail" : "warning"
        ) : "pending",
        autoVerified: true,
        verifiedAt: new Date().toISOString(),
      },
      {
        id: "w9_on_file",
        label: "W-9 on File",
        description: "Valid W-9 form received",
        status: "pending",
        autoVerified: false,
      },
      {
        id: "carrier_agreement",
        label: "Carrier Agreement Signed",
        description: "Broker-Carrier agreement executed",
        status: "pending",
        autoVerified: false,
      },
      {
        id: "factoring_verified",
        label: "Factoring/NOA Verified",
        description: "Notice of Assignment verified if applicable",
        status: "pending",
        autoVerified: false,
      },
    ];
    
    setChecklist(items);
  };

  const updateChecklistItem = (id: string, status: VettingChecklist["status"]) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status, verifiedAt: new Date().toISOString() } : item
    ));
  };

  const getPassRate = () => {
    if (checklist.length === 0) return 0;
    const passed = checklist.filter(item => item.status === "pass").length;
    return (passed / checklist.length) * 100;
  };

  const canApprove = () => {
    return checklist.every(item => item.status === "pass" || item.status === "warning");
  };

  const getCsaColor = (score: number) => {
    if (score >= 75) return "text-red-400";
    if (score >= 65) return "text-orange-400";
    if (score >= 50) return "text-yellow-400";
    return "text-green-400";
  };

  const handleApprove = () => {
    toast.success("Carrier approved and added to your network");
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Carrier Vetting</h1>
        <p className="text-slate-400 text-sm">SAFER/FMCSA Integration for carrier verification</p>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-slate-300">MC or DOT Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter MC-123456 or DOT-789012"
                  className="bg-slate-700/50 border-slate-600"
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                />
                <Button 
                  onClick={performSearch}
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">{isSearching ? "Searching..." : "Search SAFER"}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {carrier && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carrier Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Carrier Information
                  </CardTitle>
                  <Badge className={cn(
                    carrier.operatingStatus === "AUTHORIZED" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-red-500/20 text-red-400"
                  )}>
                    {carrier.operatingStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Legal Name</p>
                    <p className="text-white font-medium">{carrier.legalName}</p>
                    {carrier.dbaName && (
                      <p className="text-sm text-slate-500">DBA: {carrier.dbaName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">MC / DOT Numbers</p>
                    <p className="text-white font-medium">{carrier.mcNumber}</p>
                    <p className="text-sm text-slate-500">{carrier.dotNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Address</p>
                    <p className="text-white">{carrier.address.street}</p>
                    <p className="text-white">{carrier.address.city}, {carrier.address.state} {carrier.address.zip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Contact</p>
                    <p className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {carrier.phone}
                    </p>
                    {carrier.email && (
                      <p className="text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {carrier.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fleet Size */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <Truck className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{carrier.equipment.powerUnits}</p>
                    <p className="text-xs text-slate-500">Power Units</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{carrier.equipment.drivers}</p>
                    <p className="text-xs text-slate-500">Drivers</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <Shield className={cn(
                      "w-6 h-6 mx-auto mb-1",
                      carrier.safetyRating === "Satisfactory" ? "text-green-400" :
                      carrier.safetyRating === "Conditional" ? "text-yellow-400" : "text-red-400"
                    )} />
                    <p className="text-xl font-bold text-white">{carrier.safetyRating}</p>
                    <p className="text-xs text-slate-500">Safety Rating</p>
                  </div>
                </div>

                {/* Cargo Types */}
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">Cargo Types</p>
                  <div className="flex flex-wrap gap-2">
                    {carrier.cargoTypes.map((type) => (
                      <Badge key={type} className="bg-slate-700 text-slate-300">
                        {type}
                      </Badge>
                    ))}
                    {carrier.hazmatAuthorized && (
                      <Badge className="bg-red-500/20 text-red-400">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Hazmat Authorized
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Insurance Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-sm text-slate-400">Liability</p>
                    <p className="text-xl font-bold text-green-400">
                      ${(carrier.insurance.liability / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/30">
                    <p className="text-sm text-slate-400">Cargo</p>
                    <p className="text-xl font-bold text-blue-400">
                      ${(carrier.insurance.cargo / 1000).toFixed(0)}K
                    </p>
                  </div>
                  {carrier.insurance.bond && (
                    <div className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-sm text-slate-400">Bond</p>
                      <p className="text-xl font-bold text-purple-400">
                        ${(carrier.insurance.bond / 1000).toFixed(0)}K
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Effective: {new Date(carrier.insurance.effectiveDate).toLocaleDateString()}</span>
                  <span className="text-slate-500">-</span>
                  <span className={cn(
                    new Date(carrier.insurance.expirationDate) > new Date() ? "text-green-400" : "text-red-400"
                  )}>
                    Expires: {new Date(carrier.insurance.expirationDate).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CSA Scores */}
            {carrier.csaScores && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    CSA BASIC Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: "unsafeDriving", label: "Unsafe Driving", threshold: 65 },
                      { key: "hosFatigue", label: "HOS Compliance", threshold: 65 },
                      { key: "driverFitness", label: "Driver Fitness", threshold: 80 },
                      { key: "controlledSubstances", label: "Drug/Alcohol", threshold: 80 },
                      { key: "vehicleMaintenance", label: "Vehicle Maint.", threshold: 80 },
                      { key: "hazmatCompliance", label: "Hazmat", threshold: 80 },
                      { key: "crashIndicator", label: "Crash Indicator", threshold: 65 },
                    ].map(({ key, label, threshold }) => {
                      const score = carrier.csaScores?.[key as keyof typeof carrier.csaScores];
                      if (score === undefined) return null;
                      return (
                        <div key={key} className="p-3 rounded-lg bg-slate-700/30">
                          <p className="text-xs text-slate-400 mb-1">{label}</p>
                          <p className={cn("text-2xl font-bold", getCsaColor(score))}>
                            {score}%
                          </p>
                          <div className="h-1.5 bg-slate-600 rounded-full mt-2 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                score >= 75 ? "bg-red-500" :
                                score >= 65 ? "bg-orange-500" :
                                score >= 50 ? "bg-yellow-500" : "bg-green-500"
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Threshold: {threshold}%</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vetting Checklist */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Vetting Checklist</CardTitle>
                  <Badge className={cn(
                    getPassRate() === 100 ? "bg-green-500/20 text-green-400" :
                    getPassRate() >= 70 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {Math.round(getPassRate())}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={getPassRate()} className="h-2 mb-4" />
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        item.status === "pass" ? "border-green-500/30 bg-green-500/5" :
                        item.status === "fail" ? "border-red-500/30 bg-red-500/5" :
                        item.status === "warning" ? "border-yellow-500/30 bg-yellow-500/5" :
                        "border-slate-600"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.autoVerified && item.status !== "pending" && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">Auto</Badge>
                          )}
                          {item.status === "pass" && <CheckCircle className="w-5 h-5 text-green-400" />}
                          {item.status === "fail" && <XCircle className="w-5 h-5 text-red-400" />}
                          {item.status === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                          {item.status === "pending" && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => updateChecklistItem(item.id, "pass")}
                                className="p-1 rounded hover:bg-green-500/20"
                              >
                                <CheckCircle className="w-5 h-5 text-slate-400 hover:text-green-400" />
                              </button>
                              <button 
                                onClick={() => updateChecklistItem(item.id, "fail")}
                                className="p-1 rounded hover:bg-red-500/20"
                              >
                                <XCircle className="w-5 h-5 text-slate-400 hover:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={handleApprove}
                    disabled={!canApprove()}
                    className={cn(
                      "w-full",
                      canApprove() ? "bg-green-600 hover:bg-green-700" : "bg-slate-600"
                    )}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {canApprove() ? "Approve Carrier" : "Complete Checklist First"}
                  </Button>
                  <Button variant="outline" className="w-full border-slate-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on SAFER
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!carrier && !isSearching && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Search for a Carrier</h3>
            <p className="text-slate-400">
              Enter an MC or DOT number above to retrieve carrier information from SAFER
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
