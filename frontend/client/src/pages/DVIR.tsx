/**
 * DVIR - Driver Vehicle Inspection Report
 * Post-trip inspection report per 49 CFR 396.11/396.13
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  CheckCircle, XCircle, AlertTriangle, Truck, FileText, 
  Calendar, Clock, MapPin, User, Send, History, Eye,
  ChevronRight, Wrench, Shield, Pen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DefectItem {
  id: string;
  category: string;
  description: string;
  severity: "minor" | "major" | "critical";
  reportedAt: string;
  status: "reported" | "acknowledged" | "repaired" | "deferred";
  mechanicNotes?: string;
  repairedAt?: string;
  repairedBy?: string;
}

interface DVIRReport {
  id: string;
  date: string;
  type: "pre-trip" | "post-trip";
  truckNumber: string;
  trailerNumber?: string;
  odometer: number;
  driver: string;
  location: string;
  defectsFound: boolean;
  defects: DefectItem[];
  driverSignature?: string;
  mechanicSignature?: string;
  certifiedSafe: boolean;
  submittedAt?: string;
}

const DEFECT_CATEGORIES = [
  { id: "air_compressor", label: "Air Compressor" },
  { id: "air_lines", label: "Air Lines" },
  { id: "battery", label: "Battery" },
  { id: "brakes", label: "Brake Accessories" },
  { id: "carburetor", label: "Carburetor" },
  { id: "clutch", label: "Clutch" },
  { id: "defroster", label: "Defroster/Heater" },
  { id: "drive_line", label: "Drive Line" },
  { id: "fifth_wheel", label: "Fifth Wheel" },
  { id: "front_axle", label: "Front Axle" },
  { id: "fuel_tanks", label: "Fuel Tanks" },
  { id: "horn", label: "Horn" },
  { id: "lights", label: "Lights" },
  { id: "mirrors", label: "Mirrors" },
  { id: "muffler", label: "Muffler" },
  { id: "oil_pressure", label: "Oil Pressure" },
  { id: "radiator", label: "Radiator" },
  { id: "rear_end", label: "Rear End" },
  { id: "reflectors", label: "Reflectors" },
  { id: "safety_equipment", label: "Safety Equipment" },
  { id: "springs", label: "Suspension" },
  { id: "starter", label: "Starter" },
  { id: "steering", label: "Steering" },
  { id: "tires", label: "Tires" },
  { id: "transmission", label: "Transmission" },
  { id: "wheels", label: "Wheels/Rims" },
  { id: "windows", label: "Windows" },
  { id: "windshield_wipers", label: "Windshield Wipers" },
  { id: "other", label: "Other" },
];

const MOCK_HISTORY: DVIRReport[] = [
  {
    id: "dvir_001",
    date: "2025-01-22",
    type: "post-trip",
    truckNumber: "TRK-4521",
    trailerNumber: "TRL-8847",
    odometer: 245680,
    driver: "Mike Johnson",
    location: "Austin, TX",
    defectsFound: true,
    defects: [
      {
        id: "def_001",
        category: "lights",
        description: "Left rear turn signal intermittent",
        severity: "minor",
        reportedAt: "2025-01-22T18:30:00",
        status: "repaired",
        mechanicNotes: "Replaced bulb and checked wiring",
        repairedAt: "2025-01-22T20:15:00",
        repairedBy: "John Smith",
      },
    ],
    driverSignature: "Mike Johnson",
    mechanicSignature: "John Smith",
    certifiedSafe: true,
    submittedAt: "2025-01-22T18:35:00",
  },
  {
    id: "dvir_002",
    date: "2025-01-21",
    type: "post-trip",
    truckNumber: "TRK-4521",
    trailerNumber: "TRL-8847",
    odometer: 245485,
    driver: "Mike Johnson",
    location: "Houston, TX",
    defectsFound: false,
    defects: [],
    driverSignature: "Mike Johnson",
    certifiedSafe: true,
    submittedAt: "2025-01-21T17:45:00",
  },
];

export default function DVIR() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [reportType, setReportType] = useState<"pre-trip" | "post-trip">("post-trip");
  const [vehicleInfo, setVehicleInfo] = useState({
    truckNumber: "TRK-4521",
    trailerNumber: "TRL-8847",
    odometer: "",
    location: "",
  });
  const [defectsFound, setDefectsFound] = useState<boolean | null>(null);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [newDefect, setNewDefect] = useState({
    category: "",
    description: "",
    severity: "minor" as "minor" | "major" | "critical",
  });
  const [showAddDefect, setShowAddDefect] = useState(false);
  const [driverSignature, setDriverSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history] = useState<DVIRReport[]>(MOCK_HISTORY);

  const addDefect = () => {
    if (!newDefect.category || !newDefect.description) {
      toast.error("Please fill in all defect details");
      return;
    }
    
    const defect: DefectItem = {
      id: `def_${Date.now()}`,
      category: newDefect.category,
      description: newDefect.description,
      severity: newDefect.severity,
      reportedAt: new Date().toISOString(),
      status: "reported",
    };
    
    setDefects([...defects, defect]);
    setNewDefect({ category: "", description: "", severity: "minor" });
    setShowAddDefect(false);
    toast.success("Defect added");
  };

  const removeDefect = (id: string) => {
    setDefects(defects.filter(d => d.id !== id));
  };

  const handleSubmit = async () => {
    if (!vehicleInfo.odometer) {
      toast.error("Please enter odometer reading");
      return;
    }
    if (defectsFound === null) {
      toast.error("Please indicate if defects were found");
      return;
    }
    if (!driverSignature) {
      toast.error("Please sign the report");
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("DVIR submitted successfully!");
    navigate("/driver");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400";
      case "major": return "bg-orange-500/20 text-orange-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "repaired": return "bg-green-500/20 text-green-400";
      case "acknowledged": return "bg-blue-500/20 text-blue-400";
      case "deferred": return "bg-orange-500/20 text-orange-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">DVIR</h1>
          <p className="text-slate-400 text-sm">Driver Vehicle Inspection Report</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400">49 CFR 396.11</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "new" ? "default" : "outline"}
          onClick={() => setActiveTab("new")}
          className={activeTab === "new" ? "bg-blue-600" : "border-slate-600"}
        >
          <FileText className="w-4 h-4 mr-2" />
          New Report
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={activeTab === "history" ? "bg-blue-600" : "border-slate-600"}
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </div>

      {activeTab === "new" ? (
        <div className="space-y-6">
          {/* Report Type */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <Label className="text-slate-300 mb-3 block">Report Type</Label>
              <div className="flex gap-3">
                <Button
                  variant={reportType === "pre-trip" ? "default" : "outline"}
                  onClick={() => setReportType("pre-trip")}
                  className={reportType === "pre-trip" ? "bg-blue-600" : "border-slate-600"}
                >
                  Pre-Trip
                </Button>
                <Button
                  variant={reportType === "post-trip" ? "default" : "outline"}
                  onClick={() => setReportType("post-trip")}
                  className={reportType === "post-trip" ? "bg-blue-600" : "border-slate-600"}
                >
                  Post-Trip
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Truck Number</Label>
                  <Input
                    value={vehicleInfo.truckNumber}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, truckNumber: e.target.value })}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Trailer Number</Label>
                  <Input
                    value={vehicleInfo.trailerNumber}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, trailerNumber: e.target.value })}
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Odometer *</Label>
                  <Input
                    type="number"
                    value={vehicleInfo.odometer}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, odometer: e.target.value })}
                    placeholder="Current mileage"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Location</Label>
                  <Input
                    value={vehicleInfo.location}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, location: e.target.value })}
                    placeholder="City, State"
                    className="bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Defects Question */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Defects Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Were any defects or deficiencies discovered that would affect safe operation?
              </p>
              <div className="flex gap-3">
                <Button
                  variant={defectsFound === true ? "default" : "outline"}
                  onClick={() => setDefectsFound(true)}
                  className={defectsFound === true ? "bg-red-600 hover:bg-red-700" : "border-slate-600"}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Yes, Defects Found
                </Button>
                <Button
                  variant={defectsFound === false ? "default" : "outline"}
                  onClick={() => { setDefectsFound(false); setDefects([]); }}
                  className={defectsFound === false ? "bg-green-600 hover:bg-green-700" : "border-slate-600"}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  No Defects
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Defect List */}
          {defectsFound && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-400" />
                    Reported Defects
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddDefect(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Defect
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {defects.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No defects reported yet</p>
                    <p className="text-sm">Click "Add Defect" to report an issue</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {defects.map((defect) => (
                      <div 
                        key={defect.id}
                        className="p-4 rounded-lg border border-slate-600 bg-slate-700/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-medium">
                              {DEFECT_CATEGORIES.find(c => c.id === defect.category)?.label || defect.category}
                            </p>
                            <p className="text-sm text-slate-400">{defect.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(defect.severity)}>
                              {defect.severity}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeDefect(defect.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Defect Form */}
                {showAddDefect && (
                  <div className="mt-4 p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <h4 className="text-white font-medium mb-4">Add New Defect</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Category</Label>
                        <select
                          value={newDefect.category}
                          onChange={(e) => setNewDefect({ ...newDefect, category: e.target.value })}
                          className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
                        >
                          <option value="">Select category</option>
                          {DEFECT_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Description</Label>
                        <textarea
                          value={newDefect.description}
                          onChange={(e) => setNewDefect({ ...newDefect, description: e.target.value })}
                          placeholder="Describe the defect in detail..."
                          className="w-full mt-1 p-3 rounded-md bg-slate-700/50 border border-slate-600 text-white h-20 resize-none"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Severity</Label>
                        <div className="flex gap-2 mt-1">
                          {["minor", "major", "critical"].map((sev) => (
                            <Button
                              key={sev}
                              variant={newDefect.severity === sev ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewDefect({ ...newDefect, severity: sev as any })}
                              className={cn(
                                newDefect.severity === sev 
                                  ? sev === "critical" ? "bg-red-600" : sev === "major" ? "bg-orange-600" : "bg-yellow-600"
                                  : "border-slate-600"
                              )}
                            >
                              {sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addDefect} className="bg-green-600 hover:bg-green-700">
                          Add Defect
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddDefect(false)} className="border-slate-600">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Driver Certification */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Pen className="w-5 h-5 text-green-400" />
                Driver Certification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-slate-700/30 mb-4">
                <p className="text-slate-300 text-sm">
                  I certify that this vehicle has been inspected in accordance with the applicable
                  requirements of 49 CFR 396.11 and 396.13. The condition of this vehicle is noted
                  above, and any defects are accurately reported.
                </p>
              </div>
              <div>
                <Label className="text-slate-300">Driver Signature *</Label>
                <Input
                  value={driverSignature}
                  onChange={(e) => setDriverSignature(e.target.value)}
                  placeholder="Type your full name as signature"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{user?.name || "Driver"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 h-12"
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit DVIR
              </>
            )}
          </Button>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-4">
          {history.map((report) => (
            <Card key={report.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{report.truckNumber}</span>
                      {report.trailerNumber && (
                        <span className="text-slate-400">/ {report.trailerNumber}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{report.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={report.type === "pre-trip" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}>
                      {report.type}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{report.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="text-slate-400">
                    <span>Odometer: </span>
                    <span className="text-white">{report.odometer.toLocaleString()} mi</span>
                  </div>
                </div>

                {report.defectsFound ? (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {report.defects.length} defect(s) reported
                    </p>
                    {report.defects.map((defect) => (
                      <div 
                        key={defect.id}
                        className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-sm">{defect.description}</p>
                          <p className="text-xs text-slate-500">
                            {DEFECT_CATEGORIES.find(c => c.id === defect.category)?.label}
                          </p>
                        </div>
                        <Badge className={getStatusColor(defect.status)}>
                          {defect.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    No defects found
                  </div>
                )}

                {report.certifiedSafe && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Certified safe for operation</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
