/**
 * ZEUN MECHANICS — AI-Powered Breakdown Diagnosis & Roadside Intelligence
 * State-of-the-art guided flow with real-time provider matching.
 * Theme-aware | Brand gradient | Premium UX.
 */

import { useState } from "react";
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
  Thermometer, Fuel, Gauge, Battery, Navigation, Zap, Shield
} from "lucide-react";

const ISSUE_CATEGORIES = [
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
  OTHER: ["Unknown issue", "Multiple problems", "Need inspection"],
};

type IssueCategory = typeof ISSUE_CATEGORIES[number]["value"];
type Severity = typeof SEVERITY_OPTIONS[number]["value"];

export default function ZeunBreakdown() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; unitNumber: string; make: string; model: string; year: number; type: string } | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [canDrive, setCanDrive] = useState<boolean | null>(null);
  const [driverNotes, setDriverNotes] = useState("");
  const cc = cn("rounded-2xl border backdrop-blur-sm transition-all", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const [reportResult, setReportResult] = useState<{
    reportId: number;
    diagnosis: { issue: string; probability: number; severity: string; description: string };
    canDrive: boolean;
    providers: Array<{ id: number; name: string; type: string; distance: string; phone: string | null; rating: number | null; available24x7: boolean | null }>;
    estimatedCost: { min: number; max: number };
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
        console.log("Using default location");
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
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">AI Diagnosis</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>AI-powered breakdown diagnosis & roadside intelligence</p>
        </div>
        {step > 1 && step < 6 && (
          <Button size="sm" variant="outline" className="rounded-xl" onClick={resetForm}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Start Over
          </Button>
        )}
      </div>

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
                        <Truck className={cn("w-5 h-5", sel ? "text-blue-500" : L ? "text-slate-500" : "text-slate-400")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm", L ? "text-slate-800" : "text-white")}>{v.unitNumber}</p>
                        <p className="text-xs text-slate-400">{v.year} {v.make} {v.model} {v.type ? `- ${v.type}` : ""}</p>
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
              {ISSUE_CATEGORIES.map((category: any) => {
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
              <p className={cn("text-sm font-semibold mb-3", L ? "text-slate-800" : "text-white")}>Can you drive the truck?</p>
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

          <div className="flex justify-center">
            <Button onClick={resetForm} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Report Another Issue</Button>
          </div>
        </div>
      )}
    </div>
  );
}
