/**
 * ZEUN MECHANICS — AI-Powered Breakdown Diagnosis & Roadside Intelligence
 * State-of-the-art guided flow with real-time provider matching.
 * Theme-aware | Brand gradient | Premium UX.
 */

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { 
  Wrench, AlertTriangle, Truck, Phone, MapPin, Clock, 
  CheckCircle, XCircle, ChevronRight, Star, RefreshCw,
  Thermometer, Fuel, Gauge, Battery, Navigation, Zap, Shield,
  BookOpen, HardHat, Search, ExternalLink, ChevronDown, ChevronUp,
  Flame, Heart, Cloud, CircleDot, ShieldAlert, Siren, Info,
  Package, Cable, Car, Radio, Lightbulb, Megaphone, Ruler, Camera, Eye, ImageIcon,
} from "lucide-react";
import { EquipmentIntelligencePanel } from "./EquipmentIntelligence";

type ZeunMode = "diagnostics" | "equipment";

const ESCORT_VEHICLE_TYPES = ["pilot_car", "escort_truck", "height_pole_vehicle", "route_survey_vehicle"];
const isEscortVehicle = (type?: string) => type ? ESCORT_VEHICLE_TYPES.includes(type) : false;

const BASE_ISSUE_CATEGORIES = [
  { value: "ENGINE", label: "Engine Problem", icon: Wrench },
  { value: "BRAKES", label: "Brakes", icon: AlertTriangle },
  { value: "TRANSMISSION", label: "Transmission", icon: Gauge },
  { value: "ELECTRICAL", label: "Electrical", icon: Battery },
  { value: "TIRES", label: "Tires/Wheels", icon: Truck },
  { value: "FUEL_SYSTEM", label: "Fuel System", icon: Fuel },
  { value: "COOLING", label: "Cooling/Overheat", icon: Thermometer },
  { value: "EXHAUST", label: "Exhaust/DEF", icon: Wrench },
  { value: "STEERING", label: "Steering", icon: Navigation },
  { value: "SUSPENSION", label: "Suspension", icon: Truck },
  { value: "HVAC", label: "HVAC/Climate", icon: Thermometer },
  { value: "OTHER", label: "Other", icon: Wrench },
] as const;

const ESCORT_ISSUE_CATEGORIES = [
  { value: "LIGHTING", label: "Warning Lights/Beacons", icon: Lightbulb },
  { value: "SIGNAGE", label: "Signs/Flags/Banners", icon: Megaphone },
  { value: "COMMUNICATIONS", label: "Radio/Comms", icon: Radio },
  { value: "HEIGHT_POLE", label: "Height Pole/Measuring", icon: Ruler },
] as const;

const ISSUE_CATEGORIES = [...BASE_ISSUE_CATEGORIES] as const;

const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Low - Minor issue", color: "bg-green-100 text-green-800" },
  { value: "MEDIUM", label: "Medium - Needs attention", color: "bg-yellow-100 text-yellow-800" },
  { value: "HIGH", label: "High - Urgent", color: "bg-orange-100 text-orange-800" },
  { value: "CRITICAL", label: "Critical - Emergency", color: "bg-red-100 text-red-800" },
] as const;

const COMMON_SYMPTOMS: Record<string, string[]> = {
  ENGINE: ["Won't start", "Check engine light", "Loss of power", "Rough idle", "Knocking noise", "Smoke from exhaust"],
  BRAKES: ["Air pressure low", "Brakes won't release", "Grinding noise", "ABS light on", "Soft pedal"],
  TRANSMISSION: ["Won't shift", "Grinding gears", "Slipping", "No power", "Stuck in gear"],
  ELECTRICAL: ["Dead batteries", "No start", "Dim lights", "Warning lights on", "No power"],
  COOLING: ["Overheating", "Low coolant warning", "Steam from engine", "Temperature gauge high"],
  FUEL_SYSTEM: ["Won't start", "Loss of power", "Engine dies", "Fuel leak"],
  EXHAUST: ["DEF light on", "Derate warning", "Check engine", "Regen needed", "Smoke"],
  STEERING: ["Hard to steer", "Pulling to side", "Vibration", "Loose steering"],
  SUSPENSION: ["Rough ride", "Leaning", "Bouncing", "Noise over bumps"],
  HVAC: ["No heat", "No A/C", "Weak airflow", "Strange smell"],
  TIRES: ["Flat tire", "Blowout", "Low pressure", "Vibration"],
  LIGHTING: ["Amber beacon not working", "Strobe light failure", "LED bar malfunction", "Turn signals out", "Headlight dim", "Roof lights flickering"],
  SIGNAGE: ["Oversize load sign damaged", "Flag holder broken", "Banner torn", "Magnetic sign not sticking", "Reflective tape peeling"],
  COMMUNICATIONS: ["CB radio static", "No transmission", "Two-way radio dead", "Antenna broken", "Bluetooth disconnected", "GPS tracker offline"],
  HEIGHT_POLE: ["Pole won't extend", "Pole stuck", "Measurement inaccurate", "Mount broken", "Pole bent", "Quick-release jammed"],
  OTHER: ["Unknown issue", "Multiple problems", "Need inspection"],
};

const ESCORT_VEHICLE_LABELS: Record<string, string> = {
  pilot_car: "Pilot Car",
  escort_truck: "Escort Truck",
  height_pole_vehicle: "Height Pole Vehicle",
  route_survey_vehicle: "Route Survey Vehicle",
};

type IssueCategory = typeof ISSUE_CATEGORIES[number]["value"];
type Severity = typeof SEVERITY_OPTIONS[number]["value"];

export default function ZeunBreakdown() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [mode, setMode] = useState<ZeunMode>("diagnostics");
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; unitNumber: string; make: string; model: string; year: number; type: string } | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [canDrive, setCanDrive] = useState<boolean | null>(null);
  const [driverNotes, setDriverNotes] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);
  const [dtcCode, setDtcCode] = useState("");
  const [dtcSearch, setDtcSearch] = useState("");
  const [showSelfRepair, setShowSelfRepair] = useState(false);
  const [emergencyDetail, setEmergencyDetail] = useState<string | null>(null);
  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");

  // ── VIGA Visual Intelligence State ──
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [vigaResult, setVigaResult] = useState<any>(null);
  const [vigaAnalyzing, setVigaAnalyzing] = useState(false);

  const vigaDiagnose = (trpc as any).visualIntelligence.diagnoseMechanical.useMutation({
    onSuccess: (result: any) => {
      setVigaResult(result);
      setVigaAnalyzing(false);
      // Auto-populate symptoms from VIGA diagnosis
      if (result?.data?.defects?.length) {
        const newSymptoms = result.data.defects.map((d: any) => d.description).filter((s: string) => !symptoms.includes(s));
        if (newSymptoms.length) setSymptoms(prev => [...prev, ...newSymptoms]);
      }
      // Auto-set severity from VIGA if not yet set
      if (!severity && result?.data?.safetyRisk) {
        const riskMap: Record<string, string> = { NONE: "LOW", LOW: "LOW", MODERATE: "MEDIUM", HIGH: "HIGH", IMMEDIATE_DANGER: "CRITICAL" };
        const mapped = riskMap[result.data.safetyRisk];
        if (mapped) setSeverity(mapped as Severity);
      }
      // Auto-set canDrive from VIGA
      if (canDrive === null && result?.data?.canContinueDriving !== undefined) {
        setCanDrive(result.data.canContinueDriving);
      }
    },
    onError: () => setVigaAnalyzing(false),
  });

  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleVigaAnalyze = useCallback(() => {
    if (!photoBase64) return;
    setVigaAnalyzing(true);
    setVigaResult(null);
    vigaDiagnose.mutate({
      imageBase64: photoBase64,
      mimeType: "image/jpeg",
      vehicleMake: selectedVehicle?.make,
      vehicleModel: selectedVehicle?.model,
      vehicleYear: selectedVehicle?.year,
      issueCategory: issueCategory || undefined,
      symptoms,
    });
  }, [photoBase64, selectedVehicle, issueCategory, symptoms]);
  const [reportResult, setReportResult] = useState<{
    reportId: number;
    diagnosis: { issue: string; probability: number; severity: string; description: string };
    canDrive: boolean;
    providers: Array<{ id: number; name: string; type: string; distance: string; phone: string | null; rating: number | null; available24x7: boolean | null }>;
    estimatedCost: { min: number; max: number };
    safetyWarnings?: string[];
    preventiveTips?: string[];
    alternativeDiagnoses?: Array<{ issue: string; probability: number; severity: string }>;
    partsLikelyNeeded?: string[];
  } | null>(null);

  const { data: fleetVehicles, isLoading: fleetLoading } = (trpc as any).fleet.getVehicles.useQuery(
    { search: vehicleSearch || undefined },
    { staleTime: 60000 }
  );

  const reportMutation = (trpc as any).zeunMechanics.reportBreakdown.useMutation({
    onSuccess: (result: any) => {
      setReportResult(result);
      setStep(6);
    },
  });

  const { data: myBreakdowns, isLoading: breakdownsLoading, refetch } = (trpc as any).zeunMechanics.getMyBreakdowns.useQuery({
    limit: 5,
    status: "OPEN",
  });

  // Emergency roadside data
  const { data: emergencyData } = (trpc as any).zeunMechanics.getEmergencyRoadside.useQuery({}, { staleTime: 300000 });

  // DTC code lookup
  const dtcQuery = (trpc as any).zeunMechanics.lookupDTC.useQuery(
    { code: dtcSearch },
    { enabled: !!dtcSearch }
  );

  // Self-repair guide (loads after diagnosis on step 6)
  const selfRepairQuery = (trpc as any).zeunMechanics.getSelfRepairGuide.useQuery(
    {
      issueCategory: issueCategory || "OTHER",
      severity: severity || "MEDIUM",
      symptoms,
      vehicleMake: selectedVehicle?.make,
      vehicleModel: selectedVehicle?.model,
      vehicleYear: selectedVehicle?.year,
    },
    { enabled: step === 6 && !!issueCategory }
  );

  // Emergency procedure detail
  const emergencyProcQuery = (trpc as any).zeunMechanics.getEmergencyProcedure.useQuery(
    { emergencyType: emergencyDetail || "breakdown_highway" },
    { enabled: !!emergencyDetail }
  );

  const addSymptom = (symptom: string) => {
    if (symptom.trim() && !symptoms.includes(symptom.trim())) {
      setSymptoms([...symptoms, symptom.trim()]);
      setSymptomInput("");
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!issueCategory || !severity || symptoms.length === 0 || canDrive === null) return;

    // Get current location
    let latitude = 30.2672; // Fallback if geolocation denied
    let longitude = -97.7431;
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Using default location
      }
    }

    await reportMutation.mutateAsync({
      vehicleId: selectedVehicle ? parseInt(selectedVehicle.id) : undefined,
      issueCategory,
      severity,
      symptoms,
      canDrive,
      latitude,
      longitude,
      driverNotes: driverNotes || undefined,
    });
  };

  const resetForm = () => {
    setStep(1);
    setSelectedVehicle(null);
    setVehicleSearch("");
    setIssueCategory("");
    setSeverity("");
    setSymptoms([]);
    setCanDrive(null);
    setDriverNotes("");
    setReportResult(null);
    setShowSelfRepair(false);
    setDtcCode("");
    setDtcSearch("");
    setEmergencyDetail(null);
    refetch();
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">ZEUN Mechanics</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">AI Powered</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>Vehicle diagnostics, equipment intelligence & load-ready matching</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "diagnostics" && step > 1 && step < 6 && (
            <Button size="sm" variant="outline" className="rounded-xl" onClick={resetForm}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Start Over
            </Button>
          )}
        </div>
      </div>

      {/* ── Mode Switcher ── */}
      <div className={cn("flex gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {([
          { id: "diagnostics" as ZeunMode, label: "Diagnostics", icon: Wrench, desc: "Breakdown & Maintenance" },
          { id: "equipment" as ZeunMode, label: "Equipment", icon: Package, desc: "Load Matching & Readiness" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
              mode === t.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : L ? "text-slate-500 hover:text-slate-700 hover:bg-slate-200/60" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Equipment Intelligence Mode ── */}
      {mode === "equipment" && <EquipmentIntelligencePanel />}

      {/* ── Diagnostics Mode ── */}
      {mode === "diagnostics" && (<>

      {/* ── Emergency Roadside Assistance Panel ── */}
      {step < 6 && (
        <Card className={cn(cc, showEmergency ? "border-red-500/30" : "")}>
          <button onClick={() => setShowEmergency(!showEmergency)}
            className={cn("w-full px-4 py-3 flex items-center justify-between", L ? "hover:bg-red-50/50" : "hover:bg-red-500/5")}>
            <div className="flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-500" />
              <span className={cn("text-sm font-semibold", L ? "text-red-700" : "text-red-400")}>Emergency Roadside Assistance</span>
            </div>
            {showEmergency ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showEmergency && (
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a href="tel:911" className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-500/30 transition-all hover:border-red-500 hover:shadow-md", L ? "bg-red-50" : "bg-red-500/10")}>
                  <Phone className="h-6 w-6 text-red-500" />
                  <span className="text-xs font-bold text-red-500">911 Emergency</span>
                </a>
                <button onClick={() => setEmergencyDetail("breakdown_highway")} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md", L ? "border-slate-200 bg-orange-50 hover:border-orange-300" : "border-slate-700/50 bg-orange-500/10 hover:border-orange-500/30")}>
                  <ShieldAlert className="h-6 w-6 text-orange-500" />
                  <span className={cn("text-xs font-bold", L ? "text-orange-700" : "text-orange-400")}>Highway Safety</span>
                </button>
                <button onClick={() => setEmergencyDetail("engine_fire")} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md", L ? "border-slate-200 bg-red-50 hover:border-red-300" : "border-slate-700/50 bg-red-500/10 hover:border-red-500/30")}>
                  <Flame className="h-6 w-6 text-red-500" />
                  <span className={cn("text-xs font-bold", L ? "text-red-700" : "text-red-400")}>Vehicle Fire</span>
                </button>
                <button onClick={() => setEmergencyDetail("medical_emergency")} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md", L ? "border-slate-200 bg-pink-50 hover:border-pink-300" : "border-slate-700/50 bg-pink-500/10 hover:border-pink-500/30")}>
                  <Heart className="h-6 w-6 text-pink-500" />
                  <span className={cn("text-xs font-bold", L ? "text-pink-700" : "text-pink-400")}>Medical Help</span>
                </button>
              </div>

              {emergencyDetail && emergencyProcQuery.data && (
                <div className={cn("p-4 rounded-xl border", L ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/10 border-yellow-500/20")}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className={cn("font-bold text-sm", L ? "text-yellow-800" : "text-yellow-300")}>{emergencyProcQuery.data.title || "Emergency Procedure"}</h4>
                  </div>
                  <ol className="space-y-2">
                    {(emergencyProcQuery.data.steps || emergencyProcQuery.data.instructions || []).map((s: string, i: number) => (
                      <li key={i} className={cn("flex gap-2 text-sm", L ? "text-yellow-900" : "text-yellow-200")}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-600">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  {emergencyProcQuery.data.doNot && emergencyProcQuery.data.doNot.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
                      {emergencyProcQuery.data.doNot.map((w: string, i: number) => (
                        <p key={i} className="text-xs font-bold text-red-500">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setEmergencyDetail(null)} className="mt-3 text-xs text-slate-400 hover:text-slate-300 underline">Dismiss</button>
                </div>
              )}

              {emergencyData && (
                <div className="space-y-3">
                  {emergencyData.emergencyContacts && emergencyData.emergencyContacts.length > 0 && (
                    <div>
                      <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", L ? "text-slate-500" : "text-slate-400")}>Emergency Contacts</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {emergencyData.emergencyContacts.map((c: any, i: number) => (
                          <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                            <div>
                              <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{c.name}</p>
                              <p className="text-xs text-slate-400">{c.description || c.type}</p>
                            </div>
                            {c.number && (
                              <Button size="sm" variant="outline" className="rounded-xl text-xs" asChild>
                                <a href={`tel:${c.number}`}><Phone className="h-3 w-3 mr-1" />{c.number}</a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── DTC Code Quick Lookup ── */}
      {step === 1 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <Search className="w-4 h-4 text-purple-500" />
            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Quick DTC Code Lookup</span>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={dtcCode}
                onChange={(e: any) => setDtcCode(e.target.value.toUpperCase())}
                onKeyDown={(e: any) => e.key === "Enter" && dtcCode.trim() && setDtcSearch(dtcCode.trim())}
                placeholder="Enter DTC code (e.g. P0300, U0100)..."
                className={cn("rounded-xl font-mono", L ? "" : "bg-slate-800/50 border-slate-700/50")}
              />
              <Button onClick={() => dtcCode.trim() && setDtcSearch(dtcCode.trim())} disabled={!dtcCode.trim() || dtcQuery.isFetching}
                className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                {dtcQuery.isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {dtcQuery.data && (
              <div className={cn("p-4 rounded-xl border space-y-3", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                <div className="flex items-center gap-2">
                  <Badge className="border-0 bg-purple-500/15 text-purple-500 text-[10px] font-bold font-mono">{dtcQuery.data.code}</Badge>
                  <span className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>{dtcQuery.data.description || dtcQuery.data.title}</span>
                </div>
                {dtcQuery.data.system && <p className="text-xs text-slate-400">System: {dtcQuery.data.system}</p>}
                {dtcQuery.data.possibleCauses && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Possible Causes</p>
                    <ul className="space-y-1">
                      {(Array.isArray(dtcQuery.data.possibleCauses) ? dtcQuery.data.possibleCauses : [dtcQuery.data.possibleCauses]).map((cause: string, i: number) => (
                        <li key={i} className={cn("text-sm flex items-start gap-1.5", L ? "text-slate-600" : "text-slate-300")}>
                          <CircleDot className="h-3 w-3 mt-0.5 text-slate-400 flex-shrink-0" />{cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {dtcQuery.data.severity && (
                  <Badge className={cn("border-0 text-[10px] font-bold",
                    dtcQuery.data.severity === "CRITICAL" ? "bg-red-500/15 text-red-500" :
                    dtcQuery.data.severity === "HIGH" ? "bg-orange-500/15 text-orange-500" :
                    "bg-yellow-500/15 text-yellow-500"
                  )}>{dtcQuery.data.severity}</Badge>
                )}
                {dtcQuery.data.repairDifficulty && (
                  <p className="text-xs text-slate-400">Repair Difficulty: <strong className={cn(L ? "text-slate-700" : "text-slate-200")}>{dtcQuery.data.repairDifficulty}</strong></p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Active Breakdowns ── */}
      {step === 1 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Active Issues</span>
          </div>
          <CardContent className="p-4">
            {breakdownsLoading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>
            ) : myBreakdowns && myBreakdowns.length > 0 ? (
              <div className="space-y-2">
                {myBreakdowns.map((b: any) => (
                  <div key={b.id} className={cn("flex items-center justify-between p-3.5 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <div>
                      <p className={cn("font-medium text-sm", L ? "text-slate-800" : "text-white")}>{b.issueCategory.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.symptoms?.slice(0, 2).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-0 text-[10px] font-bold", b.status === "RESOLVED" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500")}>{b.status}</Badge>
                      <Badge className={cn("border-0 text-[10px] font-bold", b.severity === "CRITICAL" ? "bg-red-500/15 text-red-500" : "bg-slate-500/15 text-slate-400")}>{b.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-slate-400">No active breakdown reports</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step Progress ── */}
      {step < 6 && (
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s: any) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step >= s ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
              )}>{step > s ? <CheckCircle className="w-4 h-4" /> : s}</div>
              {s < 5 && <div className={cn("flex-1 h-0.5 mx-2 rounded-full", step > s ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : L ? "bg-slate-200" : "bg-slate-700")} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 1: Select Vehicle ── */}
      {step === 1 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
            <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Select Vehicle</p>
            <p className="text-xs text-slate-400 mt-0.5">Choose the vehicle experiencing the issue from your fleet</p>
          </div>
          <CardContent className="p-4 space-y-4">
            <Input
              value={vehicleSearch}
              onChange={(e: any) => setVehicleSearch(e.target.value)}
              placeholder="Search by unit number, make, or model..."
              className={cn("rounded-xl", L ? "" : "bg-slate-800/50 border-slate-700/50")}
            />
            {fleetLoading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>
            ) : fleetVehicles && fleetVehicles.length > 0 ? (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {fleetVehicles.map((v: any) => {
                  const sel = selectedVehicle?.id === v.id;
                  return (
                    <button key={v.id} onClick={() => setSelectedVehicle(v)}
                      className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        sel ? "border-blue-500 bg-blue-500/10" : L ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50" : "border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-500/5"
                      )}>
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", sel ? "bg-blue-500/20" : L ? "bg-slate-100" : "bg-slate-800")}>
                        {isEscortVehicle(v.type) ? <Car className={cn("w-5 h-5", sel ? "text-blue-500" : L ? "text-slate-500" : "text-slate-400")} /> : <Truck className={cn("w-5 h-5", sel ? "text-blue-500" : L ? "text-slate-500" : "text-slate-400")} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{v.unitNumber}</p>
                        <p className="text-xs text-slate-400">{v.year} {v.make} {v.model} {v.type ? `- ${ESCORT_VEHICLE_LABELS[v.type] || v.type.replace(/_/g, " ")}` : ""}</p>
                      </div>
                      <Badge className={cn("border-0 text-[10px] font-bold flex-shrink-0",
                        v.status === "active" ? "bg-green-500/15 text-green-500" :
                        v.status === "maintenance" ? "bg-yellow-500/15 text-yellow-500" :
                        "bg-slate-500/15 text-slate-400"
                      )}>{v.status}</Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-slate-400">No vehicles found in your fleet</p>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!selectedVehicle} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Issue Type ── */}
      {step === 2 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
            <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>What is the problem?</p>
            <p className="text-xs text-slate-400 mt-0.5">Select the category that best describes your issue</p>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...ISSUE_CATEGORIES, ...(isEscortVehicle(selectedVehicle?.type) ? ESCORT_ISSUE_CATEGORIES : [])].map((category: any) => {
                const Icon = category.icon;
                const sel = issueCategory === category.value;
                return (
                  <button key={category.value} onClick={() => { setIssueCategory(category.value); setStep(3); }}
                    className={cn("p-4 rounded-xl border-2 text-left transition-all group",
                      sel ? "border-blue-500 bg-blue-500/10" : L ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50" : "border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-500/5"
                    )}>
                    <Icon className={cn("h-5 w-5 mb-2 transition-colors", sel ? "text-blue-500" : L ? "text-slate-500 group-hover:text-blue-500" : "text-slate-400 group-hover:text-blue-400")} />
                    <div className={cn("font-medium text-sm", L ? "text-slate-700" : "text-slate-200")}>{category.label}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Symptoms ── */}
      {step === 3 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
            <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Describe the symptoms</p>
            <p className="text-xs text-slate-400 mt-0.5">Add symptoms to help ZEUN AI diagnose your issue</p>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2">
              <Input value={symptomInput} onChange={(e: any) => setSymptomInput(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && addSymptom(symptomInput)} placeholder="Type a symptom and press Enter" className={cn("rounded-xl", L ? "" : "bg-slate-800/50 border-slate-700/50")} />
              <Button onClick={() => addSymptom(symptomInput)} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">Add</Button>
            </div>

            {symptoms.length > 0 && (
              <div className="space-y-2">
                {symptoms.map((symptom: any, index: number) => (
                  <div key={index} className={cn("flex items-center justify-between p-3 rounded-xl", L ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20")}>
                    <span className={cn("text-sm font-medium", L ? "text-blue-700" : "text-blue-300")}>{symptom}</span>
                    <button onClick={() => removeSymptom(index)} className="text-slate-400 hover:text-red-500"><XCircle className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}

            {/* ── VIGA Visual Scan — Photo-based AI Diagnosis ── */}
            <div className={cn("p-4 rounded-xl border-2 border-dashed transition-all", L ? "border-purple-300/50 bg-purple-50/30" : "border-purple-500/30 bg-purple-500/5")}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", L ? "text-slate-800" : "text-white")}>VIGA Visual Scan</p>
                  <p className="text-[10px] text-slate-400">Take a photo of the issue — AI diagnoses from the image</p>
                </div>
              </div>

              <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />

              {!photoPreview ? (
                <button onClick={() => photoInputRef.current?.click()}
                  className={cn("w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all",
                    L ? "border-slate-300 hover:border-purple-400 hover:bg-purple-50" : "border-slate-600 hover:border-purple-500 hover:bg-purple-500/10"
                  )}>
                  <ImageIcon className={cn("w-8 h-8", L ? "text-slate-400" : "text-slate-500")} />
                  <span className={cn("text-sm font-medium", L ? "text-slate-600" : "text-slate-300")}>Tap to photograph the issue</span>
                  <span className="text-[10px] text-slate-400">Camera will open — point at the broken part</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={photoPreview} alt="Captured issue" className="w-full rounded-xl max-h-48 object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setVigaResult(null); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {!vigaResult && !vigaAnalyzing && (
                    <Button onClick={handleVigaAnalyze} className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                      <Eye className="h-4 w-4 mr-2" />Analyze with VIGA AI
                    </Button>
                  )}

                  {vigaAnalyzing && (
                    <div className={cn("p-4 rounded-xl border text-center", L ? "bg-purple-50 border-purple-200" : "bg-purple-500/10 border-purple-500/20")}>
                      <RefreshCw className="h-5 w-5 mx-auto mb-2 text-purple-500 animate-spin" />
                      <p className={cn("text-sm font-medium", L ? "text-purple-700" : "text-purple-300")}>VIGA analyzing image...</p>
                      <p className="text-[10px] text-slate-400 mt-1">Multi-pass visual reasoning in progress</p>
                    </div>
                  )}

                  {vigaResult?.data && (
                    <div className={cn("p-4 rounded-xl border space-y-3", L ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <p className={cn("text-sm font-bold", L ? "text-emerald-700" : "text-emerald-400")}>Visual Diagnosis Complete</p>
                        <Badge className="border-0 bg-emerald-500/15 text-emerald-500 text-[10px] font-bold ml-auto">
                          {((vigaResult.data.confidence || 0) * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>

                      <div className={cn("p-3 rounded-lg", L ? "bg-white/80" : "bg-slate-800/50")}>
                        <p className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>{vigaResult.data.component}</p>
                        <Badge className={cn("border-0 text-[10px] font-bold mt-1",
                          vigaResult.data.condition === "FAILED" || vigaResult.data.condition === "CRITICAL" ? "bg-red-500/15 text-red-500" :
                          vigaResult.data.condition === "DAMAGED" ? "bg-orange-500/15 text-orange-500" :
                          vigaResult.data.condition === "WORN" ? "bg-yellow-500/15 text-yellow-500" :
                          "bg-green-500/15 text-green-500"
                        )}>{vigaResult.data.condition}</Badge>
                      </div>

                      {vigaResult.data.defects?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Defects Identified</p>
                          {vigaResult.data.defects.map((d: any, i: number) => (
                            <div key={i} className={cn("flex items-start gap-2 text-sm p-2 rounded-lg mb-1", L ? "bg-white/60" : "bg-slate-800/30")}>
                              <Badge className={cn("border-0 text-[9px] font-bold flex-shrink-0 mt-0.5",
                                d.severity === "CRITICAL" ? "bg-red-500/15 text-red-500" :
                                d.severity === "HIGH" ? "bg-orange-500/15 text-orange-500" :
                                "bg-yellow-500/15 text-yellow-500"
                              )}>{d.severity}</Badge>
                              <div>
                                <p className={cn("font-medium text-xs", L ? "text-slate-700" : "text-slate-200")}>{d.description}</p>
                                {d.location && <p className="text-[10px] text-slate-400">Location: {d.location}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {vigaResult.data.repairRecommendation && (
                        <div className={cn("p-3 rounded-lg", L ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20")}>
                          <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold mb-1">Repair Recommendation</p>
                          <p className={cn("text-sm", L ? "text-blue-800" : "text-blue-200")}>{vigaResult.data.repairRecommendation}</p>
                        </div>
                      )}

                      {vigaResult.data.repairSteps?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Repair Steps</p>
                          <ol className="space-y-1">
                            {vigaResult.data.repairSteps.map((s: string, i: number) => (
                              <li key={i} className={cn("flex gap-2 text-xs", L ? "text-slate-600" : "text-slate-300")}>
                                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[9px] font-bold text-purple-500">{i + 1}</span>
                                {s}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {vigaResult.data.partsNeeded?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold w-full mb-0.5">Parts Needed</span>
                          {vigaResult.data.partsNeeded.map((p: string, i: number) => (
                            <Badge key={i} className={cn("border text-[10px]", L ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-teal-500/10 border-teal-500/20 text-teal-400")}>{p}</Badge>
                          ))}
                        </div>
                      )}

                      <div className={cn("flex items-center gap-2 pt-1 border-t", L ? "border-slate-200" : "border-slate-700/30")}>
                        <Badge className={cn("border-0 text-[10px] font-bold",
                          vigaResult.data.safetyRisk === "IMMEDIATE_DANGER" || vigaResult.data.safetyRisk === "HIGH" ? "bg-red-500/15 text-red-500" :
                          vigaResult.data.safetyRisk === "MODERATE" ? "bg-orange-500/15 text-orange-500" :
                          "bg-green-500/15 text-green-500"
                        )}>Safety: {vigaResult.data.safetyRisk}</Badge>
                        <Badge className={cn("border-0 text-[10px] font-bold",
                          vigaResult.data.canContinueDriving ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
                        )}>{vigaResult.data.canContinueDriving ? "Can drive (limited)" : "Cannot drive"}</Badge>
                        {vigaResult.data.estimatedRepairTime && (
                          <Badge className="border-0 bg-slate-500/15 text-slate-400 text-[10px] font-bold ml-auto">
                            <Clock className="w-3 h-3 mr-1" />{vigaResult.data.estimatedRepairTime}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {photoPreview && !vigaResult && !vigaAnalyzing && (
                    <button onClick={() => photoInputRef.current?.click()} className="text-xs text-slate-400 hover:text-slate-300 underline">
                      Retake photo
                    </button>
                  )}
                </div>
              )}
            </div>

            {issueCategory && COMMON_SYMPTOMS[issueCategory] && (
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Common symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS[issueCategory].map((symptom: any) => (
                    <button key={symptom} onClick={() => addSymptom(symptom)} disabled={symptoms.includes(symptom)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        symptoms.includes(symptom) ? "opacity-40 cursor-not-allowed" : L ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50" : "border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10",
                        L ? "text-slate-600" : "text-slate-300"
                      )}>+ {symptom}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={symptoms.length === 0} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Severity & Drivability ── */}
      {step === 4 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
            <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>How serious is it?</p>
          </div>
          <CardContent className="p-4 space-y-6">
            <div className="space-y-2">
              {SEVERITY_OPTIONS.map((option: any) => {
                const sel = severity === option.value;
                const colors: Record<string, string> = { LOW: "border-green-500 bg-green-500/10", MEDIUM: "border-yellow-500 bg-yellow-500/10", HIGH: "border-orange-500 bg-orange-500/10", CRITICAL: "border-red-500 bg-red-500/10" };
                return (
                  <button key={option.value} onClick={() => setSeverity(option.value)}
                    className={cn("w-full p-3.5 rounded-xl border-2 text-left transition-all", sel ? colors[option.value] || "border-blue-500" : L ? "border-slate-200 hover:border-slate-300" : "border-slate-700/50 hover:border-slate-600")}>
                    <Badge className={cn("border-0 text-[10px] font-bold", option.color)}>{option.label}</Badge>
                  </button>
                );
              })}
            </div>

            <div>
              <p className={cn("text-sm font-semibold mb-3", L ? "text-slate-800" : "text-white")}>Can you drive the {isEscortVehicle(selectedVehicle?.type) ? "vehicle" : "truck"}?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCanDrive(true)}
                  className={cn("p-4 rounded-xl border-2 text-center transition-all",
                    canDrive === true ? "border-green-500 bg-green-500/10" : L ? "border-slate-200 hover:border-green-300" : "border-slate-700/50 hover:border-green-500/30"
                  )}>
                  <CheckCircle className="h-7 w-7 mx-auto mb-2 text-green-500" />
                  <div className={cn("font-medium text-sm", L ? "text-slate-700" : "text-slate-200")}>Yes, limited</div>
                  <div className="text-xs text-slate-400">Can drive short distance</div>
                </button>
                <button onClick={() => setCanDrive(false)}
                  className={cn("p-4 rounded-xl border-2 text-center transition-all",
                    canDrive === false ? "border-red-500 bg-red-500/10" : L ? "border-slate-200 hover:border-red-300" : "border-slate-700/50 hover:border-red-500/30"
                  )}>
                  <XCircle className="h-7 w-7 mx-auto mb-2 text-red-500" />
                  <div className={cn("font-medium text-sm", L ? "text-slate-700" : "text-slate-200")}>No, unsafe</div>
                  <div className="text-xs text-slate-400">Need tow/mobile service</div>
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={() => setStep(5)} disabled={!severity || canDrive === null} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 5: Notes & Submit ── */}
      {step === 5 && (
        <Card className={cc}>
          <div className={cn("px-4 py-3 border-b", L ? "border-slate-100" : "border-slate-700/30")}>
            <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Additional details</p>
          </div>
          <CardContent className="p-4 space-y-5">
            <Textarea value={driverNotes} onChange={(e: any) => setDriverNotes(e.target.value)} placeholder="Any additional details about the issue..." rows={4} className={cn("rounded-xl", L ? "" : "bg-slate-800/50 border-slate-700/50")} />

            <div className={cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-3", L ? "text-slate-500" : "text-slate-400")}>Report Summary</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400 text-xs">Vehicle</span><p className={cn("font-medium", L ? "text-slate-800" : "text-white")}>{selectedVehicle ? `${selectedVehicle.unitNumber} - ${selectedVehicle.make} ${selectedVehicle.model}` : "N/A"}</p></div>
                <div><span className="text-slate-400 text-xs">Issue</span><p className={cn("font-medium", L ? "text-slate-800" : "text-white")}>{ISSUE_CATEGORIES.find((c: any) => c.value === issueCategory)?.label}</p></div>
                <div><span className="text-slate-400 text-xs">Severity</span><p className={cn("font-medium", L ? "text-slate-800" : "text-white")}>{severity}</p></div>
                <div><span className="text-slate-400 text-xs">Symptoms</span><p className={cn("font-medium", L ? "text-slate-800" : "text-white")}>{symptoms.length} reported</p></div>
                <div><span className="text-slate-400 text-xs">Can Drive</span><p className={cn("font-medium", canDrive ? "text-green-500" : "text-red-500")}>{canDrive ? "Yes" : "No"}</p></div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(4)}>Back</Button>
              <Button onClick={handleSubmit} disabled={reportMutation.isPending} className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold">
                {reportMutation.isPending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : <><AlertTriangle className="h-4 w-4 mr-2" />Submit Breakdown Report</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 6: Results ── */}
      {step === 6 && reportResult && (
        <div className="space-y-4">
          {/* Diagnosis Card */}
          <Card className={cn(cc, "border-green-500/30")}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-green-100" : "border-green-500/20")}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className={cn("text-sm font-semibold", L ? "text-green-700" : "text-green-400")}>Diagnosis Complete</span>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className={cn("p-4 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                <h3 className={cn("font-bold text-lg", L ? "text-slate-800" : "text-white")}>{reportResult.diagnosis.issue}</h3>
                <p className="text-sm text-slate-400 mt-1">{reportResult.diagnosis.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Badge className={cn("border-0 text-[10px] font-bold", reportResult.diagnosis.severity === "CRITICAL" ? "bg-red-500/15 text-red-500" : "bg-yellow-500/15 text-yellow-500")}>{reportResult.diagnosis.severity}</Badge>
                  <span className="text-xs text-slate-400">Confidence: <strong className="text-blue-500">{(reportResult.diagnosis.probability * 100).toFixed(0)}%</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={cn("p-4 rounded-xl border text-center", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Estimated Cost</p>
                  <p className={cn("text-xl font-bold mt-1", L ? "text-slate-800" : "text-white")}>${reportResult.estimatedCost.min} - ${reportResult.estimatedCost.max}</p>
                </div>
                <div className={cn("p-4 rounded-xl border text-center", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Can Drive</p>
                  <p className={cn("text-lg font-bold mt-1 flex items-center justify-center gap-1.5", reportResult.canDrive ? "text-green-500" : "text-red-500")}>
                    {reportResult.canDrive ? <><CheckCircle className="h-4 w-4" /> Limited</> : <><XCircle className="h-4 w-4" /> Need Tow</>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Providers Card */}
          <Card className={cc}>
            <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Nearby Repair Providers</span>
            </div>
            <CardContent className="p-4">
              {reportResult.providers.length > 0 ? (
                <div className="space-y-3">
                  {reportResult.providers.map((provider: any, index: number) => (
                    <div key={provider.id} className={cn("p-4 rounded-xl border transition-all",
                      index === 0 ? (L ? "border-blue-300 bg-blue-50/50" : "border-blue-500/30 bg-blue-500/5") : (L ? "border-slate-200" : "border-slate-700/30")
                    )}>
                      {index === 0 && <Badge className="border-0 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] font-bold mb-2">Recommended</Badge>}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={cn("font-bold text-sm", L ? "text-slate-800" : "text-white")}>{provider.name}</h4>
                          <p className="text-xs text-slate-400">{provider.type.replace(/_/g, " ")}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{provider.distance} mi</span>
                            {provider.rating && <span className="flex items-center gap-1 text-xs text-yellow-500"><Star className="h-3 w-3" />{provider.rating.toFixed(1)}</span>}
                            {provider.available24x7 && <span className="flex items-center gap-1 text-xs text-green-500"><Clock className="h-3 w-3" />24/7</span>}
                          </div>
                        </div>
                        {provider.phone && (
                          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl text-xs" asChild>
                            <a href={`tel:${provider.phone}`}><Phone className="h-3.5 w-3.5 mr-1" />Call</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-slate-400">No providers found in your area</p>
              )}
            </CardContent>
          </Card>

          {/* Manufacturer & Vehicle Data */}
          {selectedVehicle && (
            <Card className={cc}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
                <Truck className="w-4 h-4 text-indigo-500" />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Manufacturer & Vehicle Data</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Make / Model</p>
                    <p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{selectedVehicle.make} {selectedVehicle.model}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Year</p>
                    <p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{selectedVehicle.year}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unit #</p>
                    <p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{selectedVehicle.unitNumber}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Type</p>
                    <p className={cn("text-sm font-bold mt-0.5", L ? "text-slate-800" : "text-white")}>{selectedVehicle.type || "N/A"}</p>
                  </div>
                </div>
                {selfRepairQuery.data?.manufacturer?.dealerTip && (
                  <div className={cn("p-3 rounded-xl border", L ? "bg-indigo-50 border-indigo-200" : "bg-indigo-500/10 border-indigo-500/20")}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="h-3.5 w-3.5 text-indigo-500" />
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Manufacturer Notes</p>
                    </div>
                    <p className={cn("text-sm", L ? "text-indigo-900" : "text-indigo-200")}>{selfRepairQuery.data.manufacturer.dealerTip}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safety Warnings */}
          {reportResult.safetyWarnings && reportResult.safetyWarnings.length > 0 && (
            <Card className={cn(cc, "border-red-500/20")}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-red-100" : "border-red-500/20")}>
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span className={cn("text-sm font-semibold", L ? "text-red-700" : "text-red-400")}>Safety Warnings</span>
              </div>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {reportResult.safetyWarnings.map((w: string, i: number) => (
                    <li key={i} className={cn("flex items-start gap-2 text-sm p-2 rounded-lg", L ? "bg-red-50" : "bg-red-500/5")}>
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className={cn(L ? "text-red-800" : "text-red-300")}>{w}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Alternative Diagnoses */}
          {reportResult.alternativeDiagnoses && reportResult.alternativeDiagnoses.length > 0 && (
            <Card className={cc}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
                <CircleDot className="w-4 h-4 text-amber-500" />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Alternative Diagnoses</span>
              </div>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {reportResult.alternativeDiagnoses.map((d: any, i: number) => (
                    <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <div>
                        <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{d.issue}</p>
                        <Badge className={cn("border-0 text-[10px] font-bold mt-1",
                          d.severity === "CRITICAL" ? "bg-red-500/15 text-red-500" :
                          d.severity === "HIGH" ? "bg-orange-500/15 text-orange-500" :
                          "bg-yellow-500/15 text-yellow-500"
                        )}>{d.severity}</Badge>
                      </div>
                      <span className="text-xs text-slate-400">Probability: <strong className="text-blue-500">{(d.probability * 100).toFixed(0)}%</strong></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parts Likely Needed */}
          {reportResult.partsLikelyNeeded && reportResult.partsLikelyNeeded.length > 0 && (
            <Card className={cc}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
                <Wrench className="w-4 h-4 text-teal-500" />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Parts Likely Needed</span>
              </div>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {reportResult.partsLikelyNeeded.map((part: string, i: number) => (
                    <Badge key={i} className={cn("border text-xs font-medium px-3 py-1", L ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-teal-500/10 border-teal-500/20 text-teal-400")}>{part}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Self-Repair Guide */}
          <Card className={cn(cc, "border-emerald-500/20")}>
            <button onClick={() => setShowSelfRepair(!showSelfRepair)}
              className={cn("w-full px-4 py-3 flex items-center justify-between border-b", L ? "border-emerald-100 hover:bg-emerald-50/50" : "border-emerald-500/20 hover:bg-emerald-500/5")}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span className={cn("text-sm font-semibold", L ? "text-emerald-700" : "text-emerald-400")}>Self-Repair Guide</span>
                {selfRepairQuery.data?.difficulty && (
                  <Badge className={cn("border-0 text-[10px] font-bold",
                    selfRepairQuery.data.difficulty === "EASY" ? "bg-green-500/15 text-green-500" :
                    selfRepairQuery.data.difficulty === "MODERATE" ? "bg-yellow-500/15 text-yellow-500" :
                    "bg-red-500/15 text-red-500"
                  )}>{selfRepairQuery.data.difficulty}</Badge>
                )}
              </div>
              {showSelfRepair ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {showSelfRepair && (
              <CardContent className="p-4 space-y-4">
                {selfRepairQuery.isLoading ? (
                  <div className="space-y-2"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
                ) : selfRepairQuery.data ? (
                  <>
                    {selfRepairQuery.data.canDIY === false && (
                      <div className={cn("p-3 rounded-xl border", L ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20")}>
                        <p className={cn("text-sm font-bold", L ? "text-red-700" : "text-red-400")}>Professional repair recommended for this issue</p>
                        <p className={cn("text-xs mt-1", L ? "text-red-600" : "text-red-300")}>{selfRepairQuery.data.manufacturer?.dealerTip || "This repair requires specialized tools and expertise."}</p>
                      </div>
                    )}

                    {selfRepairQuery.data.safetyWarnings && selfRepairQuery.data.safetyWarnings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <HardHat className="h-3.5 w-3.5 text-yellow-500" />
                          <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Safety Precautions</p>
                        </div>
                        <ul className="space-y-1.5">
                          {selfRepairQuery.data.safetyWarnings.map((p: string, i: number) => (
                            <li key={i} className={cn("flex items-start gap-2 text-sm", L ? "text-slate-700" : "text-slate-300")}>
                              <Shield className="h-3.5 w-3.5 mt-0.5 text-yellow-500 flex-shrink-0" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selfRepairQuery.data.tools && selfRepairQuery.data.tools.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tools Required</p>
                        <div className="flex flex-wrap gap-2">
                          {selfRepairQuery.data.tools.map((tool: string, i: number) => (
                            <Badge key={i} className={cn("border text-xs", L ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-800/50 border-slate-700/30 text-slate-300")}>{tool}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selfRepairQuery.data.steps && selfRepairQuery.data.steps.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Repair Steps</p>
                        <ol className="space-y-3">
                          {selfRepairQuery.data.steps.map((s: any, i: number) => (
                            <li key={i} className={cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] flex items-center justify-center text-[10px] font-bold text-white">{i + 1}</span>
                                <div>
                                  <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{typeof s === "string" ? s : s.title || s.instruction}</p>
                                  {typeof s !== "string" && s.detail && <p className="text-xs text-slate-400 mt-0.5">{s.detail}</p>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {selfRepairQuery.data.estimatedTime && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Estimated repair time: <strong className={cn(L ? "text-slate-700" : "text-slate-200")}>{selfRepairQuery.data.estimatedTime}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center py-4 text-sm text-slate-400">Self-repair guidance unavailable for this issue</p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Preventive Tips */}
          {reportResult.preventiveTips && reportResult.preventiveTips.length > 0 && (
            <Card className={cc}>
              <div className={cn("px-4 py-3 border-b flex items-center gap-2", L ? "border-slate-100" : "border-slate-700/30")}>
                <Shield className="w-4 h-4 text-blue-500" />
                <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>Preventive Tips</span>
              </div>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {reportResult.preventiveTips.map((tip: string, i: number) => (
                    <li key={i} className={cn("flex items-start gap-2 text-sm", L ? "text-slate-600" : "text-slate-300")}>
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />{tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button onClick={resetForm} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Report Another Issue</Button>
          </div>
        </div>
      )}

      </>)}
    </div>
  );
}
