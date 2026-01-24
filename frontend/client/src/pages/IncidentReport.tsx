/**
 * INCIDENT REPORT PAGE
 * For Safety Managers and Drivers to report and manage incidents
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, FileText, Camera, MapPin, Clock, User,
  Truck, Phone, Upload, CheckCircle, XCircle, Search,
  Filter, ChevronRight, Calendar, Shield, Plus, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Incident {
  id: string;
  incidentNumber: string;
  type: "accident" | "spill" | "violation" | "injury" | "near_miss" | "equipment_failure";
  severity: "critical" | "major" | "minor";
  status: "reported" | "investigating" | "pending_review" | "closed";
  date: string;
  time: string;
  location: string;
  description: string;
  driverName: string;
  vehicleNumber: string;
  loadNumber?: string;
  reportedBy: string;
  injuries: boolean;
  hazmatRelease: boolean;
  propertyDamage: boolean;
  estimatedCost?: number;
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: "i1", incidentNumber: "INC-2026-0045", type: "accident", severity: "major",
    status: "investigating", date: "Jan 22, 2026", time: "14:30",
    location: "I-45 N, Mile Marker 52, Houston, TX",
    description: "Minor collision with another vehicle at traffic light. No injuries reported.",
    driverName: "John Smith", vehicleNumber: "TRK-101", loadNumber: "LOAD-45890",
    reportedBy: "John Smith", injuries: false, hazmatRelease: false, propertyDamage: true,
    estimatedCost: 2500
  },
  {
    id: "i2", incidentNumber: "INC-2026-0044", type: "spill", severity: "critical",
    status: "pending_review", date: "Jan 20, 2026", time: "09:15",
    location: "Shell Terminal, Houston, TX",
    description: "Small product spill during loading. Contained immediately per SOP.",
    driverName: "Maria Garcia", vehicleNumber: "TRK-205", loadNumber: "LOAD-45885",
    reportedBy: "Terminal Manager", injuries: false, hazmatRelease: true, propertyDamage: false,
    estimatedCost: 5000
  },
  {
    id: "i3", incidentNumber: "INC-2026-0043", type: "near_miss", severity: "minor",
    status: "closed", date: "Jan 18, 2026", time: "16:45",
    location: "US-290 W, Austin, TX",
    description: "Vehicle cut off by passenger car. Driver avoided collision with defensive driving.",
    driverName: "Robert Johnson", vehicleNumber: "TRK-312",
    reportedBy: "Robert Johnson", injuries: false, hazmatRelease: false, propertyDamage: false
  },
];

const INCIDENT_TYPES = [
  { value: "accident", label: "Vehicle Accident" },
  { value: "spill", label: "Product Spill/Release" },
  { value: "violation", label: "DOT Violation" },
  { value: "injury", label: "Personal Injury" },
  { value: "near_miss", label: "Near Miss" },
  { value: "equipment_failure", label: "Equipment Failure" },
];

const TYPE_COLORS: Record<string, string> = {
  accident: "bg-red-500/20 text-red-400",
  spill: "bg-orange-500/20 text-orange-400",
  violation: "bg-yellow-500/20 text-yellow-400",
  injury: "bg-purple-500/20 text-purple-400",
  near_miss: "bg-blue-500/20 text-blue-400",
  equipment_failure: "bg-cyan-500/20 text-cyan-400",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  major: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  minor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-blue-500/20 text-blue-400",
  investigating: "bg-yellow-500/20 text-yellow-400",
  pending_review: "bg-purple-500/20 text-purple-400",
  closed: "bg-green-500/20 text-green-400",
};

export default function IncidentReport() {
  const [incidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const [formData, setFormData] = useState({
    type: "",
    severity: "",
    date: "",
    time: "",
    location: "",
    description: "",
    driverName: "",
    vehicleNumber: "",
    loadNumber: "",
    injuries: false,
    hazmatRelease: false,
    propertyDamage: false,
  });

  const filteredIncidents = incidents.filter(inc =>
    inc.incidentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.type || !formData.date || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Incident report submitted", {
      description: "Safety team has been notified.",
    });
    setShowNewForm(false);
    setFormData({
      type: "", severity: "", date: "", time: "", location: "",
      description: "", driverName: "", vehicleNumber: "", loadNumber: "",
      injuries: false, hazmatRelease: false, propertyDamage: false,
    });
  };

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status !== "closed").length,
    critical: incidents.filter(i => i.severity === "critical").length,
    thisMonth: incidents.length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Reports</h1>
          <p className="text-slate-400">Report and manage safety incidents</p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Incidents</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Open Cases</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.open}</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Critical</p>
                <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incidents..."
            className="pl-9 bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-600">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Incident List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No incidents found</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={cn(
                    "p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer",
                    incident.severity === "critical" && "border border-red-500/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-white">{incident.incidentNumber}</span>
                        <Badge className={TYPE_COLORS[incident.type]}>
                          {INCIDENT_TYPES.find(t => t.value === incident.type)?.label}
                        </Badge>
                        <Badge className={SEVERITY_COLORS[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        <Badge className={STATUS_COLORS[incident.status]}>
                          {incident.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-300 mb-2">{incident.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {incident.date} {incident.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {incident.vehicleNumber}
                        </span>
                      </div>

                      {/* Incident Flags */}
                      <div className="flex gap-2 mt-3">
                        {incident.injuries && (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">Injuries</Badge>
                        )}
                        {incident.hazmatRelease && (
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">Hazmat Release</Badge>
                        )}
                        {incident.propertyDamage && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Property Damage</Badge>
                        )}
                        {incident.estimatedCost && (
                          <Badge variant="outline" className="text-xs text-slate-400">
                            Est. Cost: ${incident.estimatedCost.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="ghost" className="text-slate-400">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Incident Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Report New Incident
                </CardTitle>
                <Button variant="ghost" onClick={() => setShowNewForm(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Incident Type & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Incident Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Severity *</Label>
                  <Select value={formData.severity} onValueChange={(v) => setFormData({...formData, severity: v})}>
                    <SelectTrigger className="mt-1 bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Time *</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-slate-300">Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter incident location"
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Driver Name *</Label>
                  <Input
                    value={formData.driverName}
                    onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                    placeholder="Driver name"
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Vehicle Number *</Label>
                  <Input
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                    placeholder="e.g., TRK-101"
                    className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Load Number */}
              <div>
                <Label className="text-slate-300">Load Number (if applicable)</Label>
                <Input
                  value={formData.loadNumber}
                  onChange={(e) => setFormData({...formData, loadNumber: e.target.value})}
                  placeholder="e.g., LOAD-45901"
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-slate-300">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the incident in detail..."
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.injuries}
                    onChange={(e) => setFormData({...formData, injuries: e.target.checked})}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">Injuries Involved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hazmatRelease}
                    onChange={(e) => setFormData({...formData, hazmatRelease: e.target.checked})}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">Hazmat Release</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.propertyDamage}
                    onChange={(e) => setFormData({...formData, propertyDamage: e.target.checked})}
                    className="rounded border-slate-600 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">Property Damage</span>
                </label>
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-slate-300">Photos/Evidence</Label>
                <div className="mt-1 border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Drag photos here or click to upload</p>
                  <Button variant="outline" className="mt-2 border-slate-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowNewForm(false)} className="flex-1 border-slate-600">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-red-600 hover:bg-red-700">
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
