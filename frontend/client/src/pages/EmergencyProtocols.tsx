/**
 * EMERGENCY PROTOCOLS — Command Center Dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 * Comprehensive emergency management for trucking/logistics operations.
 * Weather alerts, HAZMAT response, accident reporting, crisis communication,
 * multi-agency coordination, natural disaster routing, and compliance reporting.
 *
 * 100% Dynamic — No mock data. All data from tRPC backend.
 * ═══════════════════════════════════════════════════════════════════════════════
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Shield, Cloud, Flame, Truck, Phone,
  Radio, FileText, MapPin, Clock, Users, Activity,
  ChevronRight, ChevronDown, Send, Plus, Loader2,
  Siren, Thermometer, Droplets, Wind, Zap, Eye,
  BookOpen, ClipboardCheck, Building2, HeartPulse,
  ShieldAlert, Navigation, GraduationCap, Landmark,
  Scale, Wrench, Car, PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmergencyType = "accident" | "hazmat_spill" | "weather" | "breakdown" | "medical" | "security" | "natural_disaster" | "fire" | "cargo_theft" | "civil_unrest";
type Severity = "critical" | "high" | "medium" | "low";
type HazmatClass = "class_1_explosives" | "class_2_gases" | "class_3_flammable_liquids" | "class_4_flammable_solids" | "class_5_oxidizers" | "class_6_poisons" | "class_7_radioactive" | "class_8_corrosives" | "class_9_miscellaneous";
type CrisisType = "accident_notification" | "hazmat_spill_alert" | "weather_warning" | "evacuation_order" | "road_closure" | "driver_safety_alert" | "fleet_recall" | "media_statement" | "regulatory_notification" | "customer_advisory";
type AccidentType = "collision" | "rollover" | "jackknife" | "sideswipe" | "rear_end" | "head_on" | "fixed_object" | "pedestrian" | "animal" | "weather_related" | "cargo_shift" | "other";
type InsuranceIncidentType = "accident" | "cargo_damage" | "cargo_theft" | "hazmat" | "property_damage" | "workers_comp";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": case "extreme": return "bg-red-600/20 text-red-400 border-red-500/50";
    case "high": case "severe": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "medium": case "moderate": return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    case "low": case "minor": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "declared": case "active": return "bg-red-500/20 text-red-400";
    case "escalated": return "bg-orange-500/20 text-orange-400";
    case "contained": case "resolving": return "bg-amber-500/20 text-amber-400";
    case "resolved": case "closed": return "bg-green-500/20 text-green-400";
    case "post_mortem": return "bg-blue-500/20 text-blue-400";
    default: return "bg-slate-500/20 text-slate-400";
  }
}

function getThreatLevelColor(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-600 text-white animate-pulse";
    case "SEVERE": return "bg-red-500 text-white";
    case "HIGH": return "bg-orange-500 text-white";
    case "ELEVATED": return "bg-amber-500 text-black";
    default: return "bg-green-600 text-white";
  }
}

function getTypeIcon(type: string): React.ReactNode {
  const iconClass = "w-4 h-4";
  switch (type) {
    case "accident": return <Car className={iconClass} />;
    case "hazmat_spill": return <Droplets className={iconClass} />;
    case "weather": return <Cloud className={iconClass} />;
    case "breakdown": return <Wrench className={iconClass} />;
    case "medical": return <HeartPulse className={iconClass} />;
    case "security": return <ShieldAlert className={iconClass} />;
    case "natural_disaster": return <Zap className={iconClass} />;
    case "fire": return <Flame className={iconClass} />;
    case "cargo_theft": return <ShieldAlert className={iconClass} />;
    default: return <AlertTriangle className={iconClass} />;
  }
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const dashboardQuery = (trpc as any).emergencyProtocols.getEmergencyDashboard.useQuery();
  const fleetQuery = (trpc as any).emergencyProtocols.getFleetSafetyStatus.useQuery();

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full bg-slate-800" />)}
      </div>
    );
  }

  const dash = dashboardQuery.data;
  const fleet = fleetQuery.data;

  return (
    <div className="space-y-6">
      {/* Threat Level Banner */}
      <div className={cn("rounded-lg p-4 text-center font-bold text-lg", getThreatLevelColor(dash?.threatLevel || "NORMAL"))}>
        <div className="flex items-center justify-center gap-2">
          <Siren className="w-6 h-6" />
          THREAT LEVEL: {dash?.threatLevel || "NORMAL"}
          <Siren className="w-6 h-6" />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Active Emergencies</p>
                <p className={cn("text-3xl font-bold mt-1", (dash?.activeEmergencies || 0) > 0 ? "text-red-400" : "text-green-400")}>
                  {dash?.activeEmergencies || 0}
                </p>
              </div>
              <AlertTriangle className={cn("w-10 h-10", (dash?.activeEmergencies || 0) > 0 ? "text-red-400" : "text-slate-600")} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Incidents (30 days)</p>
                <p className="text-3xl font-bold mt-1 text-amber-400">{dash?.recentIncidents30d || 0}</p>
              </div>
              <Activity className="w-10 h-10 text-amber-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Active Drivers</p>
                <p className="text-3xl font-bold mt-1 text-blue-400">{fleet?.activeDrivers || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Fleet Status</p>
                <p className={cn("text-xl font-bold mt-2", fleet?.fleetStatus === "ALERT" ? "text-red-400" : fleet?.fleetStatus === "CAUTION" ? "text-amber-400" : "text-green-400")}>
                  {fleet?.fleetStatus || "NORMAL"}
                </p>
              </div>
              <Shield className={cn("w-10 h-10", fleet?.fleetStatus === "ALERT" ? "text-red-400/50" : fleet?.fleetStatus === "CAUTION" ? "text-amber-400/50" : "text-green-400/50")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Emergencies List */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active Emergencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!dash?.emergencies || dash.emergencies.length === 0) ? (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
              <p className="text-green-400">No active emergencies</p>
              <p className="text-sm mt-1">All systems operational</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dash.emergencies.map((em: any) => (
                <div key={em.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", isLight ? "bg-white border-slate-200 hover:border-red-300 shadow-sm" : "bg-slate-800/50 border-slate-700 hover:border-red-500/30")}>
                  <div className="flex-shrink-0">{getTypeIcon(em.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200 truncate">{em.description || em.type}</span>
                      <Badge className={getStatusColor(em.status)}>{em.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {em.id} &middot; {new Date(em.declaredAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Declare Emergency Tab ────────────────────────────────────────────────────

function DeclareEmergencyTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [form, setForm] = useState({
    type: "" as EmergencyType | "",
    severity: "" as Severity | "",
    title: "",
    description: "",
    location: "",
    injuriesReported: 0,
    fatalitiesReported: 0,
  });

  const declareEmergency = (trpc as any).emergencyProtocols.declareEmergency.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Emergency declared: ${data.emergencyId}`, { description: `Type: ${data.type}, Severity: ${data.severity}` });
      setForm({ type: "", severity: "", title: "", description: "", location: "", injuriesReported: 0, fatalitiesReported: 0 });
    },
    onError: (error: any) => toast.error("Failed to declare emergency", { description: error.message }),
  });

  const handleSubmit = () => {
    if (!form.type || !form.severity || !form.title || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    declareEmergency.mutate({
      type: form.type as EmergencyType,
      severity: form.severity as Severity,
      title: form.title,
      description: form.description,
      location: form.location || undefined,
      injuriesReported: form.injuriesReported,
      fatalitiesReported: form.fatalitiesReported,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className={cn(isLight ? "bg-white border-red-200 shadow-sm" : "bg-slate-900 border-red-500/30")}>
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Siren className="w-5 h-5" />
            Declare Emergency
          </CardTitle>
          <p className="text-sm text-slate-400">Use this form to declare an emergency event. This will trigger notifications and activate response protocols.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Emergency Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as EmergencyType }))}>
                <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="hazmat_spill">HAZMAT Spill</SelectItem>
                  <SelectItem value="weather">Severe Weather</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="security">Security Threat</SelectItem>
                  <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="cargo_theft">Cargo Theft</SelectItem>
                  <SelectItem value="civil_unrest">Civil Unrest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Severity *</Label>
              <Select value={form.severity} onValueChange={(v) => setForm(f => ({ ...f, severity: v as Severity }))}>
                <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical — Life-threatening</SelectItem>
                  <SelectItem value="high">High — Serious risk</SelectItem>
                  <SelectItem value="medium">Medium — Requires attention</SelectItem>
                  <SelectItem value="low">Low — Minor incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Title *</Label>
            <Input
              className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
              placeholder="Brief title for this emergency"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description *</Label>
            <Textarea
              className={cn("min-h-[100px]", isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
              placeholder="Detailed description of the emergency situation..."
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Location</Label>
            <Input
              className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
              placeholder="Address, mile marker, or coordinates"
              value={form.location}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Injuries Reported</Label>
              <Input
                type="number"
                className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
                value={form.injuriesReported}
                onChange={(e) => setForm(f => ({ ...f, injuriesReported: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Fatalities Reported</Label>
              <Input
                type="number"
                className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
                value={form.fatalitiesReported}
                onChange={(e) => setForm(f => ({ ...f, fatalitiesReported: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={declareEmergency.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {declareEmergency.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Siren className="w-4 h-4 mr-2" />}
            DECLARE EMERGENCY
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── HAZMAT Protocols Tab ─────────────────────────────────────────────────────

function HazmatProtocolsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedClass, setSelectedClass] = useState<HazmatClass | "">("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const protocolQuery = (trpc as any).emergencyProtocols.getHazmatSpillProtocol.useQuery(
    { hazmatClass: selectedClass as HazmatClass },
    { enabled: !!selectedClass }
  );

  const hazmatClasses: Array<{ value: HazmatClass; label: string; color: string }> = [
    { value: "class_1_explosives", label: "Class 1 — Explosives", color: "bg-orange-600/20 text-orange-400 border-orange-500/50" },
    { value: "class_2_gases", label: "Class 2 — Gases", color: "bg-red-600/20 text-red-400 border-red-500/50" },
    { value: "class_3_flammable_liquids", label: "Class 3 — Flammable Liquids", color: "bg-red-500/20 text-red-400 border-red-500/50" },
    { value: "class_4_flammable_solids", label: "Class 4 — Flammable Solids", color: "bg-red-600/20 text-red-300 border-red-400/50" },
    { value: "class_5_oxidizers", label: "Class 5 — Oxidizers", color: "bg-amber-500/20 text-amber-400 border-amber-500/50" },
    { value: "class_6_poisons", label: "Class 6 — Toxic/Infectious", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
    { value: "class_7_radioactive", label: "Class 7 — Radioactive", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
    { value: "class_8_corrosives", label: "Class 8 — Corrosives", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
    { value: "class_9_miscellaneous", label: "Class 9 — Miscellaneous", color: "bg-slate-500/20 text-slate-300 border-slate-500/50" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Reference Emergency Numbers */}
      <Card className={cn(isLight ? "bg-red-50 border-red-200 shadow-sm" : "bg-red-950/30 border-red-500/40")}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-red-400 font-bold flex items-center gap-1"><Phone className="w-4 h-4" /> EMERGENCY:</span>
            <span className="text-white font-mono">911</span>
            <Separator orientation="vertical" className="h-4 bg-red-500/30" />
            <span className="text-amber-400 font-bold">CHEMTREC:</span>
            <span className="text-white font-mono">1-800-424-9300</span>
            <Separator orientation="vertical" className="h-4 bg-red-500/30" />
            <span className="text-amber-400 font-bold">NRC:</span>
            <span className="text-white font-mono">1-800-424-8802</span>
            <Separator orientation="vertical" className="h-4 bg-red-500/30" />
            <span className="text-amber-400 font-bold">POISON:</span>
            <span className="text-white font-mono">1-800-222-1222</span>
          </div>
        </CardContent>
      </Card>

      {/* Class Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {hazmatClasses.map(hc => (
          <button
            key={hc.value}
            onClick={() => setSelectedClass(hc.value)}
            className={cn(
              "p-3 rounded-lg border text-left transition-all text-sm font-medium",
              selectedClass === hc.value
                ? "ring-2 ring-red-500 " + hc.color
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500"
            )}
          >
            {hc.label}
          </button>
        ))}
      </div>

      {/* Protocol Details */}
      {selectedClass && protocolQuery.data && (
        <Card className={cn(isLight ? "bg-white border-red-200 shadow-sm" : "bg-slate-900 border-red-500/30")}>
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Flame className="w-5 h-5" />
              {protocolQuery.data.className}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Examples */}
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">Common Materials</p>
              <div className="flex flex-wrap gap-2">
                {protocolQuery.data.examples?.map((ex: string, i: number) => (
                  <Badge key={i} variant="outline" className="bg-slate-800 border-slate-600 text-slate-300">{ex}</Badge>
                ))}
              </div>
            </div>

            {/* Sections */}
            {[
              { key: "immediateActions", title: "IMMEDIATE ACTIONS", icon: <AlertTriangle className="w-4 h-4 text-red-400" />, color: "text-red-400" },
              { key: "ppe", title: "Required PPE", icon: <Shield className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
              { key: "decontamination", title: "Decontamination", icon: <Droplets className="w-4 h-4 text-blue-400" />, color: "text-blue-400" },
              { key: "agencyNotifications", title: "Agency Notifications", icon: <Phone className="w-4 h-4 text-green-400" />, color: "text-green-400" },
            ].map(section => {
              const items = protocolQuery.data[section.key] as string[] | undefined;
              if (!items?.length) return null;
              const isExpanded = expanded === section.key;
              return (
                <div key={section.key}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : section.key)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {section.icon}
                    <span className={cn("text-sm font-semibold", section.color)}>{section.title}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" /> : <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />}
                  </button>
                  {isExpanded && (
                    <ul className="mt-2 space-y-1 pl-6">
                      {items.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-slate-600 mt-1">&#8226;</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* Evacuation Radius */}
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
              <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Evacuation Radius
              </p>
              <p className="text-sm text-slate-300 mt-1">{protocolQuery.data.evacuationRadius}</p>
            </div>

            {/* ERG Guides */}
            {protocolQuery.data.ergGuideNumbers?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">ERG Guide Numbers</p>
                <div className="flex flex-wrap gap-2">
                  {protocolQuery.data.ergGuideNumbers.map((g: string, i: number) => (
                    <Badge key={i} className="bg-amber-500/20 text-amber-400 border-amber-500/50">Guide {g}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Accident Reporting Tab ───────────────────────────────────────────────────

function AccidentReportingTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: "",
    accidentType: "" as AccidentType | "",
    severity: "" as "minor" | "moderate" | "severe" | "fatal" | "",
    description: "",
    injuries: 0,
    fatalities: 0,
    otherVehiclesInvolved: 0,
    policeReportNumber: "",
    hazmatInvolved: false,
    hazmatReleased: false,
    vehicleTowed: false,
  });

  const protocolQuery = (trpc as any).emergencyProtocols.getAccidentProtocol.useQuery();

  const reportMutation = (trpc as any).emergencyProtocols.reportAccident.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Accident reported: ${data.reportId}`);
      setShowForm(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        location: "", accidentType: "", severity: "", description: "",
        injuries: 0, fatalities: 0, otherVehiclesInvolved: 0,
        policeReportNumber: "", hazmatInvolved: false, hazmatReleased: false, vehicleTowed: false,
      });
    },
    onError: (error: any) => toast.error("Failed to submit report", { description: error.message }),
  });

  const handleSubmit = () => {
    if (!form.accidentType || !form.severity || !form.location || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    reportMutation.mutate({
      date: form.date,
      time: form.time,
      location: form.location,
      accidentType: form.accidentType as AccidentType,
      severity: form.severity as "minor" | "moderate" | "severe" | "fatal",
      description: form.description,
      injuries: form.injuries,
      fatalities: form.fatalities,
      otherVehiclesInvolved: form.otherVehiclesInvolved,
      policeReportNumber: form.policeReportNumber || undefined,
      hazmatInvolved: form.hazmatInvolved,
      hazmatReleased: form.hazmatReleased,
      vehicleTowed: form.vehicleTowed,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">Accident Reporting & Protocols</h3>
        <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "View Protocol" : "Report Accident"}
        </Button>
      </div>

      {showForm ? (
        <Card className={cn(isLight ? "bg-white border-red-200 shadow-sm" : "bg-slate-900 border-red-500/30")}>
          <CardHeader>
            <CardTitle className="text-red-400">New Accident Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Date *</Label>
                <Input type="date" className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Time *</Label>
                <Input type="time" className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Location *</Label>
              <Input className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} placeholder="Address, mile marker, or GPS coordinates" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Accident Type *</Label>
                <Select value={form.accidentType} onValueChange={v => setForm(f => ({ ...f, accidentType: v as AccidentType }))}>
                  <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {["collision", "rollover", "jackknife", "sideswipe", "rear_end", "head_on", "fixed_object", "pedestrian", "animal", "weather_related", "cargo_shift", "other"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Severity *</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as any }))}>
                  <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="fatal">Fatal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description *</Label>
              <Textarea className="bg-slate-800 border-slate-600 text-slate-200 min-h-[80px]" placeholder="Describe what happened..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Injuries</Label>
                <Input type="number" className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={form.injuries} onChange={e => setForm(f => ({ ...f, injuries: parseInt(e.target.value) || 0 }))} min={0} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Fatalities</Label>
                <Input type="number" className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={form.fatalities} onChange={e => setForm(f => ({ ...f, fatalities: parseInt(e.target.value) || 0 }))} min={0} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Other Vehicles</Label>
                <Input type="number" className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={form.otherVehiclesInvolved} onChange={e => setForm(f => ({ ...f, otherVehiclesInvolved: parseInt(e.target.value) || 0 }))} min={0} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Police Report Number</Label>
              <Input className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} placeholder="If available" value={form.policeReportNumber} onChange={e => setForm(f => ({ ...f, policeReportNumber: e.target.value }))} />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-600" checked={form.hazmatInvolved} onChange={e => setForm(f => ({ ...f, hazmatInvolved: e.target.checked }))} />
                HAZMAT Involved
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-600" checked={form.hazmatReleased} onChange={e => setForm(f => ({ ...f, hazmatReleased: e.target.checked }))} />
                HAZMAT Released
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-600" checked={form.vehicleTowed} onChange={e => setForm(f => ({ ...f, vehicleTowed: e.target.checked }))} />
                Vehicle Towed
              </label>
            </div>

            <Button onClick={handleSubmit} disabled={reportMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
              {reportMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Submit Accident Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Protocol Steps */
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Accident Response Protocol — 10-Step Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {protocolQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 bg-slate-800" />)}</div>
            ) : (
              <div className="space-y-3">
                {protocolQuery.data?.steps?.map((step: any) => (
                  <div key={step.step} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", step.priority === "critical" ? "bg-red-600 text-white" : step.priority === "high" ? "bg-amber-500 text-black" : "bg-blue-600 text-white")}>
                        {step.step}
                      </div>
                      <span className="font-semibold text-slate-200">{step.title}</span>
                      <Badge className={getSeverityColor(step.priority)}>{step.priority}</Badge>
                    </div>
                    <ul className="pl-11 space-y-1">
                      {step.actions?.map((action: string, i: number) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-slate-600 mt-0.5">&#8226;</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Crisis Communication Tab ─────────────────────────────────────────────────

function CrisisCommunicationTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedCrisis, setSelectedCrisis] = useState<CrisisType | "">("");
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    message: "",
    severity: "medium" as Severity,
    audience: "all_internal" as string,
  });

  const templateQuery = (trpc as any).emergencyProtocols.getCrisisCommunication.useQuery(
    { crisisType: selectedCrisis as CrisisType },
    { enabled: !!selectedCrisis }
  );

  const sendBroadcast = (trpc as any).emergencyProtocols.sendEmergencyBroadcast.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Broadcast sent: ${data.broadcastId}`, { description: `Estimated recipients: ${data.estimatedRecipients}` });
      setBroadcastForm({ subject: "", message: "", severity: "medium", audience: "all_internal" });
    },
    onError: (error: any) => toast.error("Broadcast failed", { description: error.message }),
  });

  const crisisTypes: Array<{ value: CrisisType; label: string }> = [
    { value: "accident_notification", label: "Accident Notification" },
    { value: "hazmat_spill_alert", label: "HAZMAT Spill Alert" },
    { value: "weather_warning", label: "Weather Warning" },
    { value: "evacuation_order", label: "Evacuation Order" },
    { value: "road_closure", label: "Road Closure" },
    { value: "driver_safety_alert", label: "Driver Safety Alert" },
    { value: "fleet_recall", label: "Fleet Recall" },
    { value: "media_statement", label: "Media Statement" },
    { value: "regulatory_notification", label: "Regulatory Notification" },
    { value: "customer_advisory", label: "Customer Advisory" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Browser */}
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Communication Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Select Crisis Type</Label>
              <Select value={selectedCrisis} onValueChange={v => setSelectedCrisis(v as CrisisType)}>
                <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}><SelectValue placeholder="Choose template" /></SelectTrigger>
                <SelectContent>
                  {crisisTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templateQuery.data?.template && (
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Subject</p>
                  <p className="text-sm text-slate-200 bg-slate-800 p-2 rounded">{templateQuery.data.template.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-400 uppercase mb-1">Internal Message</p>
                  <p className="text-sm text-slate-300 bg-slate-800 p-2 rounded whitespace-pre-wrap">{templateQuery.data.template.internalMessage}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase mb-1">External Message</p>
                  <p className="text-sm text-slate-300 bg-slate-800 p-2 rounded whitespace-pre-wrap">{templateQuery.data.template.externalMessage}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase mb-1">Audience Guidance</p>
                  <p className="text-sm text-slate-400 bg-slate-800 p-2 rounded">{templateQuery.data.template.audienceGuidance}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => {
                    setBroadcastForm({
                      subject: templateQuery.data.template.subject,
                      message: templateQuery.data.template.internalMessage,
                      severity: "medium",
                      audience: "all_internal",
                    });
                  }}
                >
                  Use This Template
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broadcast Sender */}
        <Card className={cn(isLight ? "bg-white border-red-200 shadow-sm" : "bg-slate-900 border-red-500/30")}>
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Send Emergency Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Subject</Label>
              <Input className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")} value={broadcastForm.subject} onChange={e => setBroadcastForm(f => ({ ...f, subject: e.target.value }))} placeholder="Broadcast subject" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Message</Label>
              <Textarea className="bg-slate-800 border-slate-600 text-slate-200 min-h-[120px]" value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))} placeholder="Emergency broadcast message..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Severity</Label>
                <Select value={broadcastForm.severity} onValueChange={v => setBroadcastForm(f => ({ ...f, severity: v as Severity }))}>
                  <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Audience</Label>
                <Select value={broadcastForm.audience} onValueChange={v => setBroadcastForm(f => ({ ...f, audience: v }))}>
                  <SelectTrigger className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_drivers">All Drivers</SelectItem>
                    <SelectItem value="affected_drivers">Affected Drivers</SelectItem>
                    <SelectItem value="dispatchers">Dispatchers</SelectItem>
                    <SelectItem value="all_internal">All Internal</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="all">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => {
                if (!broadcastForm.subject || !broadcastForm.message) {
                  toast.error("Subject and message are required");
                  return;
                }
                sendBroadcast.mutate({
                  crisisType: (selectedCrisis || "driver_safety_alert") as CrisisType,
                  subject: broadcastForm.subject,
                  message: broadcastForm.message,
                  severity: broadcastForm.severity,
                  audience: broadcastForm.audience,
                });
              }}
              disabled={sendBroadcast.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {sendBroadcast.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              SEND BROADCAST
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Communication Checklist */}
      {templateQuery.data?.communicationChecklist && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardHeader>
            <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Communication Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-400 uppercase mb-2">DO</p>
                <ul className="space-y-1">
                  {templateQuery.data.communicationChecklist?.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase mb-2">DO NOT</p>
                <ul className="space-y-1">
                  {templateQuery.data.doNotSay?.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">&#10007;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Emergency Contacts Tab ──────────────────────────────────────────────────

function EmergencyContactsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [category, setCategory] = useState<string>("all");
  const contactsQuery = (trpc as any).emergencyProtocols.getEmergencyContacts.useQuery({ category });

  return (
    <div className="space-y-6">
      {/* Quick Dial Banner */}
      <Card className={cn(isLight ? "bg-red-50 border-red-200 shadow-sm" : "bg-red-950/30 border-red-500/40")}>
        <CardContent className="p-4">
          <p className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            CRITICAL EMERGENCY NUMBERS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "911", desc: "Emergency", color: "bg-red-600" },
              { name: "CHEMTREC", desc: "1-800-424-9300", color: "bg-orange-600" },
              { name: "NRC", desc: "1-800-424-8802", color: "bg-amber-600" },
              { name: "Poison Control", desc: "1-800-222-1222", color: "bg-purple-600" },
            ].map(n => (
              <div key={n.name} className={cn("rounded-lg p-3 text-center", n.color)}>
                <p className="font-bold text-white text-sm">{n.name}</p>
                <p className="text-white/80 text-xs mt-0.5">{n.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "hazmat", "accident", "medical", "security", "regulatory"].map(cat => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className={category === cat ? "bg-red-600 hover:bg-red-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Contact Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contactsQuery.isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-slate-800" />)
        ) : (
          <>
            {contactsQuery.data?.contacts?.map((contact: any, i: number) => (
              <Card key={i} className="bg-slate-900 border-slate-700 hover:border-slate-500 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{contact.name}</p>
                      <p className="text-lg font-mono text-amber-400 mt-1">{contact.phone}</p>
                      <p className="text-xs text-slate-500 mt-1">{contact.description}</p>
                    </div>
                    <Badge className={cn("text-xs",
                      contact.category === "hazmat" ? "bg-orange-500/20 text-orange-400" :
                      contact.category === "emergency" ? "bg-red-500/20 text-red-400" :
                      contact.category === "safety" ? "bg-green-500/20 text-green-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {contact.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Company Contacts */}
            {contactsQuery.data?.companyContacts?.map((contact: any, i: number) => (
              <Card key={`co-${i}`} className="bg-slate-900 border-blue-500/30 hover:border-blue-500/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{contact.name}</p>
                      <p className="text-sm text-blue-400 mt-1">{contact.phone}</p>
                      <p className="text-xs text-slate-500 mt-1">{contact.description}</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">internal</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Compliance Reporting Tab ─────────────────────────────────────────────────

function ComplianceReportingTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [incidentType, setIncidentType] = useState<string>("");
  const complianceQuery = (trpc as any).emergencyProtocols.getComplianceReporting.useQuery(
    { incidentType: incidentType || undefined },
  );

  const insuranceType = useState<InsuranceIncidentType>("accident")[0];
  const insuranceQuery = (trpc as any).emergencyProtocols.getInsuranceClaimWorkflow.useQuery(
    { incidentType: insuranceType },
  );

  return (
    <div className="space-y-6">
      {/* Incident Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!incidentType ? "default" : "outline"} size="sm" onClick={() => setIncidentType("")}
          className={!incidentType ? "bg-red-600 hover:bg-red-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}>
          All
        </Button>
        {["accident", "hazmat_spill", "medical"].map(t => (
          <Button key={t} variant={incidentType === t ? "default" : "outline"} size="sm" onClick={() => setIncidentType(t)}
            className={incidentType === t ? "bg-red-600 hover:bg-red-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}>
            {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Compliance Requirements */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Regulatory Reporting Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 bg-slate-800" />)}</div>
          ) : (
            <div className="space-y-3">
              {complianceQuery.data?.requirements?.map((req: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500/20 text-red-400 text-xs">{req.agency}</Badge>
                      <span className="font-semibold text-slate-200 text-sm">{req.reportType}</span>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs">{req.deadline}</Badge>
                  </div>
                  <p className="text-sm text-slate-400">{req.trigger}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Form: {req.form}</span>
                    <span>Penalties: {req.penalties}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {complianceQuery.data?.criticalReminder && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-500/30">
              <p className="text-sm text-red-400 font-medium">{complianceQuery.data.criticalReminder}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Retention */}
      {complianceQuery.data?.recordRetention && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardHeader>
            <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Record Retention Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {complianceQuery.data.recordRetention.map((rec: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <span className="text-sm text-slate-300">{rec.document}</span>
                  <span className="text-sm text-amber-400 font-mono">{rec.retention}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Claim Workflow */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Insurance Claim Workflow — {insuranceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insuranceQuery.isLoading ? (
            <Skeleton className="h-40 bg-slate-800" />
          ) : (
            <div className="space-y-3">
              {insuranceQuery.data?.workflow?.steps?.map((step: any) => (
                <div key={step.step} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">{step.step}</div>
                    <span className="font-semibold text-slate-200 text-sm">{step.title}</span>
                    <Badge className="bg-amber-500/20 text-amber-400 text-xs ml-auto">{step.deadline}</Badge>
                  </div>
                  <p className="text-sm text-slate-400 pl-10">{step.description}</p>
                  {step.documents?.length > 0 && (
                    <div className="pl-10 mt-2 flex flex-wrap gap-1">
                      {step.documents.map((doc: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs bg-slate-900 border-slate-600 text-slate-400">{doc}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {insuranceQuery.data?.workflow?.tips?.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/20">
                  <p className="text-xs font-semibold text-amber-400 uppercase mb-2">Pro Tips</p>
                  <ul className="space-y-1">
                    {insuranceQuery.data.workflow.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">&#9679;</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Training Tab ─────────────────────────────────────────────────────────────

function TrainingTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const trainingQuery = (trpc as any).emergencyProtocols.getEmergencyTraining.useQuery();

  return (
    <div className="space-y-6">
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Emergency Response Training Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trainingQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 bg-slate-800" />)}</div>
          ) : (
            <div className="space-y-3">
              {trainingQuery.data?.modules?.map((mod: any) => (
                <div key={mod.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-green-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 text-xs">{mod.id}</Badge>
                        <span className="font-semibold text-slate-200">{mod.title}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{mod.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.duration}</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {mod.certification}</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Renewal: {mod.renewalPeriod}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {mod.topics?.map((topic: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs bg-slate-900 border-slate-600 text-slate-400">{topic}</Badge>
                    ))}
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-slate-500">Required for: {mod.requiredFor?.join(", ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {trainingQuery.data?.complianceNote && (
            <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-500/20">
              <p className="text-sm text-amber-400">{trainingQuery.data.complianceNote}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Multi-Agency Coordination Tab ────────────────────────────────────────────

function MultiAgencyTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [incidentType, setIncidentType] = useState<EmergencyType>("accident");

  const coordQuery = (trpc as any).emergencyProtocols.getMultiAgencyCoordination.useQuery({
    incidentType,
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(["accident", "hazmat_spill", "weather", "natural_disaster", "fire", "security"] as EmergencyType[]).map(t => (
          <Button key={t} variant={incidentType === t ? "default" : "outline"} size="sm" onClick={() => setIncidentType(t)}
            className={incidentType === t ? "bg-red-600 hover:bg-red-700" : "border-slate-600 text-slate-300 hover:bg-slate-800"}>
            {t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </Button>
        ))}
      </div>

      {coordQuery.isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 bg-slate-800" />)}</div>
      ) : (
        <>
          {/* Agency Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coordQuery.data?.agencies?.map((agency: any, i: number) => (
              <Card key={i} className="bg-slate-900 border-slate-700 hover:border-blue-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-200">{agency.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{agency.jurisdiction}</p>
                      <Separator className="my-2 bg-slate-700" />
                      <p className="text-xs text-slate-400"><span className="text-amber-400 font-semibold">Contact:</span> {agency.contactProtocol}</p>
                      <p className="text-xs text-slate-400 mt-1"><span className="text-amber-400 font-semibold">Response time:</span> {agency.typicalResponseTime}</p>
                      {agency.requiredInfo?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 font-semibold">Required Information:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agency.requiredInfo.map((info: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs bg-slate-900 border-slate-600 text-slate-400">{info}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coordination Protocol */}
          {coordQuery.data?.coordinationProtocol && (
            <Card className={cn(isLight ? "bg-white border-blue-200 shadow-sm" : "bg-slate-900 border-blue-500/30")}>
              <CardHeader>
                <CardTitle className="text-blue-400 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Coordination Protocol
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {coordQuery.data.coordinationProtocol.map((step: string, i: number) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                {coordQuery.data?.unifiedCommandStructure && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-950/20 border border-blue-500/20">
                    <p className="text-sm text-blue-400">{coordQuery.data.unifiedCommandStructure}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Post-Incident Tab ────────────────────────────────────────────────────────

function PostIncidentTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [emergencyId, setEmergencyId] = useState("");

  const timelineQuery = (trpc as any).emergencyProtocols.getIncidentTimeline.useQuery(
    { emergencyId },
    { enabled: !!emergencyId }
  );

  const reportQuery = (trpc as any).emergencyProtocols.getPostIncidentReport.useQuery(
    { emergencyId: emergencyId || "template" },
  );

  return (
    <div className="space-y-6">
      {/* Emergency ID Input */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-300">Emergency / Incident ID</Label>
              <Input
                className={cn(isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-800 border-slate-600 text-slate-200")}
                placeholder="e.g., EM-123 or ACC-2026-001"
                value={emergencyId}
                onChange={e => setEmergencyId(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => timelineQuery.refetch()}>
              <Eye className="w-4 h-4 mr-2" />
              Load Timeline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {emergencyId && timelineQuery.data?.timeline?.length > 0 && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
          <CardHeader>
            <CardTitle className="text-slate-300 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Incident Timeline — {emergencyId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-700" />
              {timelineQuery.data.timeline.map((event: any, i: number) => (
                <div key={i} className="flex items-start gap-3 pl-6 relative">
                  <div className="absolute left-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900" />
                  <div>
                    <p className="text-sm text-slate-200">{event.event}</p>
                    <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()} &middot; {event.actor}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Incident Report Template */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Post-Incident Report Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportQuery.isLoading ? (
            <Skeleton className="h-40 bg-slate-800" />
          ) : (
            <div className="space-y-3">
              {reportQuery.data?.reportSections?.map((section: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", section.required ? "bg-red-600 text-white" : "bg-slate-600 text-slate-300")}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">{section.section}</span>
                      {section.required && <Badge className="bg-red-500/20 text-red-400 text-xs">Required</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{section.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmergencyProtocols() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className={isLight ? "min-h-screen bg-slate-50 text-slate-900" : "min-h-screen bg-slate-950 text-slate-100"}>
      {/* Header */}
      <div className={cn("border-b backdrop-blur-sm sticky top-0 z-10", isLight ? "border-slate-200 bg-white/90" : "border-red-500/30 bg-slate-900/80")}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold", isLight ? "text-slate-900" : "text-white")}>Emergency Protocols</h1>
              <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Command Center — Emergency & Disaster Response Management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className={cn("border mb-6 flex-wrap h-auto p-1 gap-1", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-700")}>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" />Dashboard
              </TabsTrigger>
              <TabsTrigger value="declare" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Siren className="w-3.5 h-3.5 mr-1.5" />Declare
              </TabsTrigger>
              <TabsTrigger value="hazmat" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Flame className="w-3.5 h-3.5 mr-1.5" />HAZMAT
              </TabsTrigger>
              <TabsTrigger value="accidents" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Car className="w-3.5 h-3.5 mr-1.5" />Accidents
              </TabsTrigger>
              <TabsTrigger value="crisis" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Radio className="w-3.5 h-3.5 mr-1.5" />Crisis Comms
              </TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Phone className="w-3.5 h-3.5 mr-1.5" />Contacts
              </TabsTrigger>
              <TabsTrigger value="agencies" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Landmark className="w-3.5 h-3.5 mr-1.5" />Agencies
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <Scale className="w-3.5 h-3.5 mr-1.5" />Compliance
              </TabsTrigger>
              <TabsTrigger value="postincident" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <FileText className="w-3.5 h-3.5 mr-1.5" />Post-Incident
              </TabsTrigger>
              <TabsTrigger value="training" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" />Training
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="declare"><DeclareEmergencyTab /></TabsContent>
          <TabsContent value="hazmat"><HazmatProtocolsTab /></TabsContent>
          <TabsContent value="accidents"><AccidentReportingTab /></TabsContent>
          <TabsContent value="crisis"><CrisisCommunicationTab /></TabsContent>
          <TabsContent value="contacts"><EmergencyContactsTab /></TabsContent>
          <TabsContent value="agencies"><MultiAgencyTab /></TabsContent>
          <TabsContent value="compliance"><ComplianceReportingTab /></TabsContent>
          <TabsContent value="postincident"><PostIncidentTab /></TabsContent>
          <TabsContent value="training"><TrainingTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
