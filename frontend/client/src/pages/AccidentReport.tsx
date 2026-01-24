/**
 * ACCIDENT/INCIDENT REPORT PAGE
 * Safety incident reporting and investigation workflow
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, FileText, Camera, MapPin, Clock, User, Truck,
  Phone, Shield, CheckCircle, Upload, ChevronRight, Eye,
  Calendar, Activity, Users, Building, Ambulance, Car
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Incident {
  id: string;
  type: "accident" | "near_miss" | "injury" | "spill" | "property_damage";
  severity: "minor" | "moderate" | "major" | "critical";
  status: "draft" | "submitted" | "under_review" | "investigation" | "closed";
  date: string;
  location: string;
  driver: string;
  vehicle: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
}

export default function AccidentReport() {
  const [activeTab, setActiveTab] = useState("new");
  const [incidentType, setIncidentType] = useState("");
  const [formStep, setFormStep] = useState(1);

  const [formData, setFormData] = useState({
    type: "",
    date: "",
    time: "",
    location: "",
    address: "",
    city: "",
    state: "",
    driverId: "",
    driverName: "",
    vehicleId: "",
    vehicleNumber: "",
    loadNumber: "",
    description: "",
    weatherConditions: "",
    roadConditions: "",
    injuries: false,
    injuryDetails: "",
    fatalities: false,
    hazmatRelease: false,
    hazmatDetails: "",
    propertyDamage: false,
    propertyDamageDetails: "",
    otherVehiclesInvolved: false,
    otherVehicleCount: "",
    policeReport: false,
    policeReportNumber: "",
    policeDepartment: "",
    witnessInfo: "",
    immediateActions: "",
    rootCause: "",
    preventiveMeasures: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const recentIncidents: Incident[] = [
    {
      id: "inc_001",
      type: "accident",
      severity: "minor",
      status: "closed",
      date: "2025-01-20",
      location: "I-45 N, Houston, TX",
      driver: "Mike Johnson",
      vehicle: "TRK-4521",
      description: "Minor fender bender in parking lot",
      reportedBy: "Mike Johnson",
      reportedAt: "2025-01-20T14:30:00Z",
    },
    {
      id: "inc_002",
      type: "near_miss",
      severity: "moderate",
      status: "under_review",
      date: "2025-01-18",
      location: "US-290 E, Austin, TX",
      driver: "Sarah Williams",
      vehicle: "TRK-3892",
      description: "Vehicle cut off, evasive action taken",
      reportedBy: "Sarah Williams",
      reportedAt: "2025-01-18T09:15:00Z",
    },
    {
      id: "inc_003",
      type: "spill",
      severity: "major",
      status: "investigation",
      date: "2025-01-15",
      location: "Terminal 5, Beaumont, TX",
      driver: "David Brown",
      vehicle: "TRK-2156",
      description: "Product spill during loading - approx 5 gallons",
      reportedBy: "Terminal Manager",
      reportedAt: "2025-01-15T11:45:00Z",
    },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = () => {
    setUploadedPhotos(prev => [...prev, `photo_${prev.length + 1}`]);
    toast.success("Photo uploaded");
  };

  const submitReport = () => {
    toast.success("Incident report submitted", {
      description: "Safety team has been notified",
    });
    setActiveTab("history");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "accident": return Car;
      case "near_miss": return AlertTriangle;
      case "injury": return Ambulance;
      case "spill": return Activity;
      case "property_damage": return Building;
      default: return AlertTriangle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "accident": return "bg-red-500/20 text-red-400";
      case "near_miss": return "bg-yellow-500/20 text-yellow-400";
      case "injury": return "bg-orange-500/20 text-orange-400";
      case "spill": return "bg-purple-500/20 text-purple-400";
      case "property_damage": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor": return "bg-green-500/20 text-green-400";
      case "moderate": return "bg-yellow-500/20 text-yellow-400";
      case "major": return "bg-orange-500/20 text-orange-400";
      case "critical": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-slate-500/20 text-slate-400";
      case "submitted": return "bg-blue-500/20 text-blue-400";
      case "under_review": return "bg-yellow-500/20 text-yellow-400";
      case "investigation": return "bg-purple-500/20 text-purple-400";
      case "closed": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Reporting</h1>
          <p className="text-slate-400 text-sm">Report and track safety incidents</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Emergency
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Open Incidents</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Under Investigation</p>
                <p className="text-2xl font-bold text-purple-400">1</p>
              </div>
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-blue-400">5</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Days Since Last</p>
                <p className="text-2xl font-bold text-green-400">3</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="new" className="data-[state=active]:bg-red-600">
            <FileText className="w-4 h-4 mr-2" />
            New Report
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-red-600">
            <Clock className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* New Report Tab */}
        <TabsContent value="new" className="mt-6">
          {/* Incident Type Selection */}
          {!incidentType && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">What type of incident are you reporting?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { id: "accident", name: "Vehicle Accident", icon: Car, color: "red" },
                    { id: "near_miss", name: "Near Miss", icon: AlertTriangle, color: "yellow" },
                    { id: "injury", name: "Injury", icon: Ambulance, color: "orange" },
                    { id: "spill", name: "Spill/Release", icon: Activity, color: "purple" },
                    { id: "property_damage", name: "Property Damage", icon: Building, color: "blue" },
                  ].map((type) => (
                    <div
                      key={type.id}
                      onClick={() => {
                        setIncidentType(type.id);
                        handleInputChange("type", type.id);
                      }}
                      className={cn(
                        "p-6 rounded-lg border-2 cursor-pointer transition-all text-center hover:scale-105",
                        `border-${type.color}-500/30 hover:border-${type.color}-500/60 bg-${type.color}-500/10`
                      )}
                    >
                      <type.icon className={cn("w-10 h-10 mx-auto mb-3", `text-${type.color}-400`)} />
                      <p className="text-white font-medium">{type.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Form */}
          {incidentType && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    {React.createElement(getTypeIcon(incidentType), { className: "w-5 h-5 text-red-400" })}
                    Incident Report - Step {formStep} of 4
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIncidentType("")}
                  >
                    Change Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {formStep === 1 && (
                  <>
                    <h3 className="text-lg font-medium text-white">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Date of Incident</Label>
                        <div className="relative">
                          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Time of Incident</Label>
                        <div className="relative">
                          <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="time"
                            value={formData.time}
                            onChange={(e) => handleInputChange("time", e.target.value)}
                            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Location Description</Label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                          placeholder="e.g., I-45 N near Exit 52"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <Label className="text-slate-300">Street Address</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                        />
                      </div>
                      <div>
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
                            <SelectItem value="LA">Louisiana</SelectItem>
                            <SelectItem value="OK">Oklahoma</SelectItem>
                            <SelectItem value="NM">New Mexico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Weather Conditions</Label>
                        <Select value={formData.weatherConditions} onValueChange={(v) => handleInputChange("weatherConditions", v)}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clear">Clear</SelectItem>
                            <SelectItem value="cloudy">Cloudy</SelectItem>
                            <SelectItem value="rain">Rain</SelectItem>
                            <SelectItem value="fog">Fog</SelectItem>
                            <SelectItem value="snow">Snow/Ice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Road Conditions</Label>
                        <Select value={formData.roadConditions} onValueChange={(v) => handleInputChange("roadConditions", v)}>
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dry">Dry</SelectItem>
                            <SelectItem value="wet">Wet</SelectItem>
                            <SelectItem value="icy">Icy</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {formStep === 2 && (
                  <>
                    <h3 className="text-lg font-medium text-white">Driver & Vehicle Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Driver Name</Label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={formData.driverName}
                            onChange={(e) => handleInputChange("driverName", e.target.value)}
                            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Vehicle Number</Label>
                        <div className="relative">
                          <Truck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={formData.vehicleNumber}
                            onChange={(e) => handleInputChange("vehicleNumber", e.target.value)}
                            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Load Number (if applicable)</Label>
                      <Input
                        value={formData.loadNumber}
                        onChange={(e) => handleInputChange("loadNumber", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="LOAD-XXXXX"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.otherVehiclesInvolved}
                          onCheckedChange={(v) => handleInputChange("otherVehiclesInvolved", !!v)}
                        />
                        <span className="text-white">Other vehicles involved</span>
                      </div>
                      {formData.otherVehiclesInvolved && (
                        <div>
                          <Label className="text-slate-300">Number of other vehicles</Label>
                          <Input
                            type="number"
                            value={formData.otherVehicleCount}
                            onChange={(e) => handleInputChange("otherVehicleCount", e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white w-32"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.policeReport}
                          onCheckedChange={(v) => handleInputChange("policeReport", !!v)}
                        />
                        <span className="text-white">Police report filed</span>
                      </div>
                      {formData.policeReport && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-slate-300">Report Number</Label>
                            <Input
                              value={formData.policeReportNumber}
                              onChange={(e) => handleInputChange("policeReportNumber", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300">Police Department</Label>
                            <Input
                              value={formData.policeDepartment}
                              onChange={(e) => handleInputChange("policeDepartment", e.target.value)}
                              className="bg-slate-700/50 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {formStep === 3 && (
                  <>
                    <h3 className="text-lg font-medium text-white">Incident Details</h3>
                    
                    <div>
                      <Label className="text-slate-300">Description of Incident</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white min-h-32"
                        placeholder="Provide a detailed description of what happened..."
                      />
                    </div>

                    <div className="space-y-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-red-400 font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Information
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.injuries}
                          onCheckedChange={(v) => handleInputChange("injuries", !!v)}
                        />
                        <span className="text-white">Injuries reported</span>
                      </div>
                      {formData.injuries && (
                        <Textarea
                          value={formData.injuryDetails}
                          onChange={(e) => handleInputChange("injuryDetails", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="Describe injuries and affected persons..."
                        />
                      )}

                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.fatalities}
                          onCheckedChange={(v) => handleInputChange("fatalities", !!v)}
                        />
                        <span className="text-white">Fatalities</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.hazmatRelease}
                          onCheckedChange={(v) => handleInputChange("hazmatRelease", !!v)}
                        />
                        <span className="text-white">Hazmat spill/release</span>
                      </div>
                      {formData.hazmatRelease && (
                        <Textarea
                          value={formData.hazmatDetails}
                          onChange={(e) => handleInputChange("hazmatDetails", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="Product, quantity, containment status..."
                        />
                      )}

                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.propertyDamage}
                          onCheckedChange={(v) => handleInputChange("propertyDamage", !!v)}
                        />
                        <span className="text-white">Property damage</span>
                      </div>
                      {formData.propertyDamage && (
                        <Textarea
                          value={formData.propertyDamageDetails}
                          onChange={(e) => handleInputChange("propertyDamageDetails", e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white"
                          placeholder="Describe property damage..."
                        />
                      )}
                    </div>

                    <div>
                      <Label className="text-slate-300">Witness Information</Label>
                      <Textarea
                        value={formData.witnessInfo}
                        onChange={(e) => handleInputChange("witnessInfo", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="Names and contact information of any witnesses..."
                      />
                    </div>
                  </>
                )}

                {formStep === 4 && (
                  <>
                    <h3 className="text-lg font-medium text-white">Photos & Documentation</h3>
                    
                    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                      <p className="text-white font-medium mb-2">Upload Photos</p>
                      <p className="text-sm text-slate-400 mb-4">
                        Take photos of the scene, damage, surrounding area, and any relevant details
                      </p>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                        {uploadedPhotos.map((photo, idx) => (
                          <div key={idx} className="aspect-square rounded-lg bg-slate-600 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-slate-400" />
                          </div>
                        ))}
                        <div
                          onClick={handlePhotoUpload}
                          className="aspect-square rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors"
                        >
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                      </div>
                      
                      <Button variant="outline" className="border-slate-600" onClick={handlePhotoUpload}>
                        <Camera className="w-4 h-4 mr-2" />
                        Add Photo
                      </Button>
                    </div>

                    <div>
                      <Label className="text-slate-300">Immediate Actions Taken</Label>
                      <Textarea
                        value={formData.immediateActions}
                        onChange={(e) => handleInputChange("immediateActions", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="What actions were taken immediately after the incident..."
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">Preliminary Root Cause (if known)</Label>
                      <Textarea
                        value={formData.rootCause}
                        onChange={(e) => handleInputChange("rootCause", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="Initial assessment of what caused the incident..."
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">Suggested Preventive Measures</Label>
                      <Textarea
                        value={formData.preventiveMeasures}
                        onChange={(e) => handleInputChange("preventiveMeasures", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white"
                        placeholder="What could prevent similar incidents in the future..."
                      />
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setFormStep(prev => prev - 1)}
                    disabled={formStep === 1}
                    className="border-slate-600"
                  >
                    Previous
                  </Button>
                  
                  {formStep < 4 ? (
                    <Button
                      onClick={() => setFormStep(prev => prev + 1)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submitReport}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Submit Report
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIncidents.map((incident) => {
                  const TypeIcon = getTypeIcon(incident.type);
                  return (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-full", getTypeColor(incident.type))}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{incident.description}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {incident.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {incident.driver}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.replace("_", " ")}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
