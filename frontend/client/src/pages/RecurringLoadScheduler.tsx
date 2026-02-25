/**
 * RECURRING LOAD SCHEDULER — Schedule recurring shipments & dedicated lanes
 * Theme-aware | Brand gradient | HOS-compliant scheduling
 *
 * Scenarios:
 * - Daily loads same origin→dest (dedicated lane)
 * - Specific days (Mon/Wed/Fri, Tue/Thu only)
 * - Specific pickup times (7am, 8am, etc.)
 * - Multiple loads per day at same location
 * - Different origins in same area → one dest
 * - Short/long term contracts with volume commitments
 * - HOS compliance: 11hr drive, 14hr duty, 70hr/8-day
 *
 * Platform fee: {PLATFORM_FEE}% applied to every recurring load
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  FileText, CheckCircle, ArrowLeft, Shield, DollarSign,
  ChevronRight, Clock, Building2, MapPin,
  Plus, Trash2, AlertTriangle, Truck, Users, Repeat,
  Calendar, Scale, Timer, Route, Zap
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import AddressAutocomplete, { ParsedAddress } from "@/components/AddressAutocomplete";
import DatePicker from "@/components/DatePicker";

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const PLATFORM_FEE = 3.5;
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  TX: { lat: 31.97, lng: -99.90 }, CA: { lat: 36.78, lng: -119.42 }, OK: { lat: 35.47, lng: -97.52 },
  LA: { lat: 30.98, lng: -91.96 }, NM: { lat: 34.52, lng: -105.87 }, AR: { lat: 34.75, lng: -92.29 },
  CO: { lat: 39.55, lng: -105.78 }, KS: { lat: 38.73, lng: -98.38 }, MO: { lat: 38.57, lng: -92.60 },
  IL: { lat: 40.63, lng: -89.40 }, FL: { lat: 27.66, lng: -81.52 }, GA: { lat: 32.16, lng: -82.90 },
  AL: { lat: 32.32, lng: -86.90 }, MS: { lat: 32.35, lng: -89.40 }, TN: { lat: 35.52, lng: -86.58 },
  NC: { lat: 35.76, lng: -79.02 }, SC: { lat: 33.84, lng: -81.16 }, VA: { lat: 37.43, lng: -78.66 },
  PA: { lat: 41.20, lng: -77.19 }, NY: { lat: 42.17, lng: -74.95 }, OH: { lat: 40.42, lng: -82.91 },
  MI: { lat: 44.31, lng: -85.60 }, IN: { lat: 40.27, lng: -86.13 }, WI: { lat: 43.78, lng: -88.79 },
  MN: { lat: 46.73, lng: -94.69 }, ND: { lat: 47.55, lng: -101.00 }, MT: { lat: 46.88, lng: -110.36 },
  WY: { lat: 43.08, lng: -107.29 }, NE: { lat: 41.49, lng: -99.90 }, SD: { lat: 43.97, lng: -99.90 },
  IA: { lat: 41.88, lng: -93.10 }, AZ: { lat: 34.05, lng: -111.09 }, NV: { lat: 38.80, lng: -116.42 },
  UT: { lat: 39.32, lng: -111.09 }, WA: { lat: 47.75, lng: -120.74 }, OR: { lat: 43.80, lng: -120.55 },
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOS_LIMITS = { maxDrive: 11, maxDuty: 14, maxWeekly: 70, resetHours: 34 };

interface SchedulePattern {
  id: string;
  originCity: string; originState: string;
  originAddress: string; originLat: number; originLng: number;
  destCity: string; destState: string;
  destAddress: string; destLat: number; destLng: number;
  days: string[];
  pickupTime: string;
  loadsPerDay: number;
  equipmentType: string;
  ratePerLoad: string;
  estimatedMiles: string;
  estimatedDriveHours: string;
  notes: string;
}

type Step = "overview" | "schedule" | "hos" | "agreement" | "review";

export default function RecurringLoadScheduler() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("overview");

  // Schedule config
  const [contractName, setContractName] = useState("");
  const [contractType, setContractType] = useState<"dedicated_lane" | "multi_stop" | "area_coverage" | "scheduled_route">("dedicated_lane");
  const [duration, setDuration] = useState("short_term");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [catalystName, setCatalystName] = useState("");
  const [linkedAgreement, setLinkedAgreement] = useState("");
  const [patterns, setPatterns] = useState<SchedulePattern[]>([]);
  const [activating, setActivating] = useState(false);

  // Load creation mutation — wired to loads.create (the wizard-compatible endpoint)
  const createLoadMutation = (trpc as any).loads?.create?.useMutation?.({
    onError: (err: any) => console.error("[RecurringScheduler] create error:", err?.message),
  });

  const activateSchedule = async () => {
    if (patterns.length === 0) { toast.error("Add at least one lane pattern"); return; }
    setActivating(true);
    let created = 0;
    let failed = 0;

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      const maxLoads = 30;

      for (const pattern of patterns) {
        const originCoords = pattern.originLat && pattern.originLng
          ? { lat: pattern.originLat, lng: pattern.originLng }
          : STATE_COORDS[pattern.originState.toUpperCase()] || { lat: 32.0, lng: -96.0 };
        const destCoords = pattern.destLat && pattern.destLng
          ? { lat: pattern.destLat, lng: pattern.destLng }
          : STATE_COORDS[pattern.destState.toUpperCase()] || { lat: 30.0, lng: -95.0 };

        const originStr = pattern.originAddress || `${pattern.originCity}, ${pattern.originState}`;
        const destStr = pattern.destAddress || `${pattern.destCity}, ${pattern.destState}`;
        const driveMiles = parseFloat(pattern.estimatedMiles) || 300;
        const driveHrs = parseFloat(pattern.estimatedDriveHours) || 5;

        let current = new Date(start);
        while (current <= end && created + failed < maxLoads) {
          const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][current.getDay()];
          if (pattern.days.includes(dayName)) {
            for (let l = 0; l < pattern.loadsPerDay && created + failed < maxLoads; l++) {
              try {
                const [hours, minutes] = (pattern.pickupTime || "08:00").split(":").map(Number);
                const pickupDate = new Date(current);
                pickupDate.setHours(hours || 8, minutes || 0, 0, 0);
                const deliveryDate = new Date(pickupDate.getTime() + driveHrs * 60 * 60 * 1000 + 2 * 60 * 60 * 1000);

                if (createLoadMutation) {
                  await createLoadMutation.mutateAsync({
                    origin: originStr,
                    destination: destStr,
                    originLat: originCoords.lat,
                    originLng: originCoords.lng,
                    destLat: destCoords.lat,
                    destLng: destCoords.lng,
                    distance: driveMiles,
                    equipment: pattern.equipmentType,
                    pickupDate: pickupDate.toISOString(),
                    deliveryDate: deliveryDate.toISOString(),
                    rate: pattern.ratePerLoad || "0",
                    assignmentType: catalystName ? "direct_catalyst" : "open_market",
                    linkedAgreementId: selectedAgreementId ? String(selectedAgreementId) : undefined,
                    productName: `${contractType.replace(/_/g, " ")} shipment`,
                  });
                  created++;
                }
              } catch { failed++; }
            }
          }
          current.setDate(current.getDate() + 1);
        }
      }

      if (created > 0) {
        toast.success(`Schedule activated! ${created} loads posted.`, { description: catalystName ? `Dedicated to ${catalystName}` : "Posted for catalyst bidding" });
        setLocation("/my-loads");
      } else if (failed > 0) {
        toast.error(`Failed to create loads (${failed} errors). Check your schedule configuration.`);
      } else {
        toast.warning("No loads generated. Check your date range and selected days.");
      }
    } catch (err: any) {
      toast.error("Failed to activate schedule", { description: err?.message });
    } finally {
      setActivating(false);
    }
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const ic = cn("rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");
  const lb = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-600" : "text-slate-400");
  const tc = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");

  // Fetch user's agreements for the Link Agreement step
  const agQuery = (trpc as any).agreements?.list?.useQuery?.({ limit: 50 }) || { data: null, isLoading: false };
  const existingAgreements: any[] = (() => {
    const d = agQuery.data;
    return Array.isArray(d) ? d : Array.isArray(d?.agreements) ? d.agreements : [];
  })();
  const [selectedAgreementId, setSelectedAgreementId] = useState<number | null>(null);

  const addPattern = () => setPatterns([...patterns, {
    id: `p-${Date.now()}`, originCity: "", originState: "", originAddress: "", originLat: 0, originLng: 0,
    destCity: "", destState: "", destAddress: "", destLat: 0, destLng: 0,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"], pickupTime: "08:00", loadsPerDay: 1,
    equipmentType: "dry_van", ratePerLoad: "", estimatedMiles: "", estimatedDriveHours: "", notes: "",
  }]);

  const updatePattern = (id: string, field: keyof SchedulePattern, value: any) => {
    setPatterns(patterns.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePattern = (id: string) => setPatterns(patterns.filter(p => p.id !== id));

  const toggleDay = (id: string, day: string) => {
    const p = patterns.find(x => x.id === id);
    if (!p) return;
    const days = p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day];
    updatePattern(id, "days", days);
  };

  // HOS compliance check
  const checkHOS = (pattern: SchedulePattern) => {
    const hrs = parseFloat(pattern.estimatedDriveHours) || 0;
    const loadsPerDay = pattern.loadsPerDay;
    const totalDailyDrive = hrs * loadsPerDay;
    const dailyDuty = totalDailyDrive * 1.3; // ~30% non-driving duty
    const weeklyDays = pattern.days.length;
    const weeklyHours = totalDailyDrive * weeklyDays;

    return {
      dailyDriveOk: totalDailyDrive <= HOS_LIMITS.maxDrive,
      dailyDutyOk: dailyDuty <= HOS_LIMITS.maxDuty,
      weeklyOk: weeklyHours <= HOS_LIMITS.maxWeekly,
      totalDailyDrive,
      dailyDuty: Math.round(dailyDuty * 10) / 10,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
    };
  };

  // Totals
  const totalLoadsPerWeek = patterns.reduce((s, p) => s + (p.loadsPerDay * p.days.length), 0);
  const totalRevPerWeek = patterns.reduce((s, p) => s + ((parseFloat(p.ratePerLoad) || 0) * p.loadsPerDay * p.days.length), 0);
  const totalFeePerWeek = totalRevPerWeek * (PLATFORM_FEE / 100);

  const steps: { id: Step; l: string }[] = [
    { id: "overview", l: "Setup" }, { id: "schedule", l: "Schedule" },
    { id: "hos", l: "HOS Check" }, { id: "agreement", l: "Agreement" }, { id: "review", l: "Review" },
  ];
  const si = steps.findIndex(s => s.id === step);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "hover:bg-slate-100" : "hover:bg-slate-700")} onClick={() => setLocation("/agreements")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Recurring Load Scheduler</h1>
          <p className={mt}>Set up scheduled lanes, dedicated routes & volume commitments</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
              i < si ? "bg-green-500/15 text-green-500" : i === si ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
            )}>{i < si ? <CheckCircle className="w-3.5 h-3.5" /> : null}{s.l}</div>
            {i < steps.length - 1 && <ChevronRight className={cn("w-3.5 h-3.5", isLight ? "text-slate-300" : "text-slate-600")} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP: OVERVIEW */}
      {step === "overview" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><Route className="w-5 h-5 text-blue-500" />Schedule Type</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "dedicated_lane", label: "Dedicated Lane", desc: "Same origin → same destination, recurring", icon: <MapPin className="w-5 h-5 text-blue-500" /> },
                  { id: "multi_stop", label: "Multi-Stop Route", desc: "Multiple pickups/drops on a fixed route", icon: <Route className="w-5 h-5 text-purple-500" /> },
                  { id: "area_coverage", label: "Area Coverage", desc: "Multiple origins in same area → one dest", icon: <Truck className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" /> },
                  { id: "scheduled_route", label: "Scheduled Route", desc: "Specific days & times, custom pattern", icon: <Calendar className="w-5 h-5 text-orange-500" /> },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setContractType(t.id)} className={cn("p-4 rounded-xl border text-left transition-all",
                    contractType === t.id ? "border-[#1473FF] bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 shadow-md" : isLight ? "border-slate-200 hover:border-slate-300" : "border-slate-700 hover:border-slate-600"
                  )}>
                    <div className="mb-2">{t.icon}</div>
                    <p className={cn("font-bold text-sm", vl)}>{t.label}</p>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Schedule Name</label><Input value={contractName} onChange={(e: any) => setContractName(e.target.value)} placeholder="e.g. Dallas-Houston Daily" className={ic} /></div>
                <div><label className={lb}>Duration</label><Select value={duration} onValueChange={setDuration}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short_term">Short Term (1-6 mo)</SelectItem><SelectItem value="long_term">Long Term (6-24 mo)</SelectItem><SelectItem value="evergreen">Evergreen</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lb}>Start Date</label><DatePicker value={startDate} onChange={setStartDate} /></div>
                <div><label className={lb}>End Date</label><DatePicker value={endDate} onChange={setEndDate} /></div>
              </div>
              <div><label className={lb}>Dedicated Catalyst (optional)</label><Input value={catalystName} onChange={(e: any) => setCatalystName(e.target.value)} placeholder="Leave blank to open for bidding" className={ic} /></div>
            </CardContent>
          </Card>
          <Button className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={!contractName} onClick={() => { if (patterns.length === 0) addPattern(); setStep("schedule"); }}>
            Configure Schedule <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* STEP: SCHEDULE PATTERNS */}
      {step === "schedule" && (
        <div className="space-y-5">
          {patterns.map((p, idx) => (
            <Card key={p.id} className={cc}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("flex items-center gap-2 text-base", tc)}><MapPin className="w-4 h-4 text-blue-500" />Lane {idx + 1}</CardTitle>
                  {patterns.length > 1 && <Button size="sm" variant="ghost" onClick={() => removePattern(p.id)} className="h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Origin & Dest — Google Maps Autocomplete */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={lb}>Origin</label>
                    <AddressAutocomplete
                      value={p.originAddress || `${p.originCity}${p.originState ? ", " + p.originState : ""}`}
                      onChange={(v) => updatePattern(p.id, "originAddress", v)}
                      onSelect={(parsed: ParsedAddress) => {
                        const updated = { ...p, originCity: parsed.city, originState: parsed.state, originAddress: parsed.address, originLat: parsed.lat, originLng: parsed.lng };
                        if (updated.destLat && updated.destLng && parsed.lat && parsed.lng) {
                          const miles = haversineDistance(parsed.lat, parsed.lng, updated.destLat, updated.destLng);
                          updated.estimatedMiles = String(miles);
                          updated.estimatedDriveHours = String(Math.round(miles / 55 * 10) / 10);
                        }
                        setPatterns(patterns.map(x => x.id === p.id ? updated : x));
                      }}
                      placeholder="Search origin address..."
                      className={ic}
                    />
                    {p.originCity && <p className="text-[10px] text-slate-400 mt-1">{p.originCity}, {p.originState}</p>}
                  </div>
                  <div>
                    <label className={lb}>Destination</label>
                    <AddressAutocomplete
                      value={p.destAddress || `${p.destCity}${p.destState ? ", " + p.destState : ""}`}
                      onChange={(v) => updatePattern(p.id, "destAddress", v)}
                      onSelect={(parsed: ParsedAddress) => {
                        const updated = { ...p, destCity: parsed.city, destState: parsed.state, destAddress: parsed.address, destLat: parsed.lat, destLng: parsed.lng };
                        if (updated.originLat && updated.originLng && parsed.lat && parsed.lng) {
                          const miles = haversineDistance(updated.originLat, updated.originLng, parsed.lat, parsed.lng);
                          updated.estimatedMiles = String(miles);
                          updated.estimatedDriveHours = String(Math.round(miles / 55 * 10) / 10);
                        }
                        setPatterns(patterns.map(x => x.id === p.id ? updated : x));
                      }}
                      placeholder="Search destination address..."
                      className={ic}
                    />
                    {p.destCity && <p className="text-[10px] text-slate-400 mt-1">{p.destCity}, {p.destState}</p>}
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className={lb}>Pickup Days</label>
                  <div className="flex gap-1.5">
                    {DAYS.map(d => (
                      <button key={d} onClick={() => toggleDay(p.id, d)} className={cn("w-10 h-10 rounded-lg text-xs font-bold transition-all",
                        p.days.includes(d) ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
                      )}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* Time, Loads, Equipment */}
                <div className="grid grid-cols-4 gap-2">
                  <div><label className={lb}>Pickup Time</label><Input type="time" value={p.pickupTime} onChange={(e: any) => updatePattern(p.id, "pickupTime", e.target.value)} className={ic} /></div>
                  <div><label className={lb}>Loads/Day</label><Input type="number" min={1} max={10} value={p.loadsPerDay} onChange={(e: any) => updatePattern(p.id, "loadsPerDay", parseInt(e.target.value) || 1)} className={ic} /></div>
                  <div><label className={lb}>Equipment</label><Select value={p.equipmentType} onValueChange={v => updatePattern(p.id, "equipmentType", v)}><SelectTrigger className={ic}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dry_van">Dry Van</SelectItem><SelectItem value="flatbed">Flatbed</SelectItem><SelectItem value="reefer">Reefer</SelectItem><SelectItem value="tanker">Tanker</SelectItem><SelectItem value="box_truck">Box Truck</SelectItem></SelectContent></Select></div>
                  <div><label className={lb}>Rate/Load ($)</label><Input type="number" value={p.ratePerLoad} onChange={(e: any) => updatePattern(p.id, "ratePerLoad", e.target.value)} placeholder="0" className={ic} /></div>
                </div>

                {/* Miles & Drive Time for HOS */}
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={lb}>Est. Miles (one-way)</label><Input type="number" value={p.estimatedMiles} onChange={(e: any) => updatePattern(p.id, "estimatedMiles", e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lb}>Est. Drive Hours (one-way)</label><Input type="number" step="0.5" value={p.estimatedDriveHours} onChange={(e: any) => updatePattern(p.id, "estimatedDriveHours", e.target.value)} placeholder="0" className={ic} /></div>
                </div>

                {/* Weekly Summary for this lane */}
                <div className={cn("grid grid-cols-3 gap-2 p-3 rounded-xl", isLight ? "bg-blue-50" : "bg-blue-500/5")}>
                  <div><p className="text-[10px] text-slate-400 uppercase">Loads/Week</p><p className={cn("font-bold", vl)}>{p.loadsPerDay * p.days.length}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Rev/Week</p><p className="font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${((parseFloat(p.ratePerLoad) || 0) * p.loadsPerDay * p.days.length).toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-slate-400 uppercase">Platform Fee</p><p className="font-bold text-purple-400">${(((parseFloat(p.ratePerLoad) || 0) * p.loadsPerDay * p.days.length) * PLATFORM_FEE / 100).toFixed(2)}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addPattern} className={cn("w-full rounded-xl", isLight ? "border-slate-200" : "border-slate-700")}><Plus className="w-4 h-4 mr-2" />Add Another Lane</Button>

          {/* Totals */}
          <div className={cn("grid grid-cols-3 gap-3")}>
            <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Total Loads/Week</p><p className={cn("text-xl font-bold", vl)}>{totalLoadsPerWeek}</p></div>
            <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Total Revenue/Week</p><p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${totalRevPerWeek.toLocaleString()}</p></div>
            <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Platform Fee/Week</p><p className="text-xl font-bold text-purple-400">${totalFeePerWeek.toFixed(2)}</p></div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("overview")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={patterns.length === 0} onClick={() => setStep("hos")}>HOS Compliance Check <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* STEP: HOS COMPLIANCE CHECK */}
      {step === "hos" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><Shield className="w-5 h-5 text-orange-500" />HOS Compliance Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className={cn("p-3 rounded-xl border text-xs", isLight ? "bg-orange-50 border-orange-200" : "bg-orange-500/10 border-orange-500/30")}>
                <p className={cn("font-bold mb-1", isLight ? "text-orange-700" : "text-orange-400")}>FMCSA Hours of Service Rules</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div><p className="text-slate-400">Max Drive</p><p className={vl}>{HOS_LIMITS.maxDrive}hr/day</p></div>
                  <div><p className="text-slate-400">Max Duty</p><p className={vl}>{HOS_LIMITS.maxDuty}hr/day</p></div>
                  <div><p className="text-slate-400">Weekly Cap</p><p className={vl}>{HOS_LIMITS.maxWeekly}hr/8-day</p></div>
                  <div><p className="text-slate-400">Reset</p><p className={vl}>{HOS_LIMITS.resetHours}hr off-duty</p></div>
                </div>
              </div>

              {patterns.map((p, idx) => {
                const hos = checkHOS(p);
                const allOk = hos.dailyDriveOk && hos.dailyDutyOk && hos.weeklyOk;
                return (
                  <div key={p.id} className={cn("p-4 rounded-xl border", allOk ? (isLight ? "border-green-200 bg-green-50" : "border-green-500/30 bg-green-500/5") : (isLight ? "border-red-200 bg-red-50" : "border-red-500/30 bg-red-500/5"))}>
                    <div className="flex items-center gap-2 mb-3">
                      {allOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <p className={cn("font-bold text-sm", vl)}>Lane {idx + 1}: {p.originCity}, {p.originState} → {p.destCity}, {p.destState}</p>
                      <Badge className={cn("text-[10px] border", allOk ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30")}>{allOk ? "Compliant" : "Violation"}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><p className="text-slate-400">Daily Drive ({p.loadsPerDay} loads × {p.estimatedDriveHours}hr)</p><p className={cn("font-bold", hos.dailyDriveOk ? "text-green-500" : "text-red-400")}>{hos.totalDailyDrive}hr / {HOS_LIMITS.maxDrive}hr {hos.dailyDriveOk ? "OK" : "OVER"}</p></div>
                      <div><p className="text-slate-400">Daily Duty (est.)</p><p className={cn("font-bold", hos.dailyDutyOk ? "text-green-500" : "text-red-400")}>{hos.dailyDuty}hr / {HOS_LIMITS.maxDuty}hr {hos.dailyDutyOk ? "OK" : "OVER"}</p></div>
                      <div><p className="text-slate-400">Weekly ({p.days.length} days)</p><p className={cn("font-bold", hos.weeklyOk ? "text-green-500" : "text-red-400")}>{hos.weeklyHours}hr / {HOS_LIMITS.maxWeekly}hr {hos.weeklyOk ? "OK" : "OVER"}</p></div>
                    </div>
                    {!allOk && <p className="text-[11px] text-red-400 mt-2">This schedule may require team drivers or schedule adjustment to maintain HOS compliance.</p>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("schedule")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setStep("agreement")}>Link Agreement <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* STEP: AGREEMENT LINK */}
      {step === "agreement" && (
        <div className="space-y-5">
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><FileText className="w-5 h-5 text-purple-500" />Link to Agreement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className={cn("text-xs", mt)}>Optionally link this recurring schedule to an existing agreement, or create a new one. The agreement governs rates, terms, and conditions for all loads in this schedule.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => setLinkedAgreement("existing")} className={cn("p-4 rounded-xl border text-left transition-all", linkedAgreement === "existing" ? "border-[#1473FF] bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10" : isLight ? "border-slate-200" : "border-slate-700")}>
                  <FileText className="w-5 h-5 text-blue-500 mb-2" />
                  <p className={cn("font-bold text-sm", vl)}>Use Existing Agreement</p>
                  <p className="text-[11px] text-slate-400">Attach to an active MSA or contract</p>
                </button>
                <button onClick={() => setLinkedAgreement("new")} className={cn("p-4 rounded-xl border text-left transition-all", linkedAgreement === "new" ? "border-[#BE01FF] bg-gradient-to-br from-[#BE01FF]/10 to-[#1473FF]/10" : isLight ? "border-slate-200" : "border-slate-700")}>
                  <Plus className="w-5 h-5 text-purple-500 mb-2" />
                  <p className={cn("font-bold text-sm", vl)}>Create New Agreement</p>
                  <p className="text-[11px] text-slate-400">Generate an agreement for this schedule</p>
                </button>
              </div>
              {linkedAgreement === "existing" && (
                <div className="space-y-3">
                  <label className={lb}>Select Agreement</label>
                  {agQuery.isLoading ? (
                    <div className={cn("h-10 rounded-xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />
                  ) : existingAgreements.length === 0 ? (
                    <p className={cn("text-xs p-3 rounded-xl border", cl)}>No agreements found. Create one first.</p>
                  ) : (
                    <Select value={selectedAgreementId ? String(selectedAgreementId) : ""} onValueChange={v => setSelectedAgreementId(parseInt(v) || null)}>
                      <SelectTrigger className={ic}><SelectValue placeholder="Choose an agreement..." /></SelectTrigger>
                      <SelectContent>
                        {existingAgreements.map((ag: any) => (
                          <SelectItem key={ag.id} value={String(ag.id)}>
                            #{ag.agreementNumber || `AG-${ag.id}`} — {ag.agreementType?.replace(/_/g, " ")} — ${ag.baseRate ? parseFloat(ag.baseRate).toLocaleString() : "0"} — {ag.status || "draft"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedAgreementId && (() => {
                    const sel = existingAgreements.find((a: any) => a.id === selectedAgreementId);
                    return sel ? (
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")}>
                        <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-500" /><p className={cn("font-bold text-xs", vl)}>Linked: #{sel.agreementNumber}</p></div>
                        <p className="text-[10px] text-slate-400">Rate: ${sel.baseRate ? parseFloat(sel.baseRate).toLocaleString() : "—"} · {sel.rateType?.replace(/_/g, " ") || "—"} · Net {sel.paymentTermDays || 30} days</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              {linkedAgreement === "new" && (
                <Button className="w-full rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white font-bold" onClick={() => setLocation("/agreements/create")}>
                  <EsangIcon className="w-4 h-4 mr-2" />Open Agreement Wizard
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Platform Fee Breakdown */}
          <Card className={cc}><CardHeader className="pb-3"><CardTitle className={cn("flex items-center gap-2", tc)}><Scale className="w-5 h-5 text-purple-500" />Platform Fee Structure</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 border-slate-700")}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-slate-400">Fee Rate</p><p className={cn("font-bold text-lg", vl)}>{PLATFORM_FEE}%</p></div>
                  <div><p className="text-slate-400">Per Load (avg)</p><p className="font-bold text-lg text-purple-400">${patterns.length > 0 ? (totalFeePerWeek / totalLoadsPerWeek || 0).toFixed(2) : "0.00"}</p></div>
                  <div><p className="text-slate-400">Weekly Total</p><p className="font-bold text-lg text-purple-400">${totalFeePerWeek.toFixed(2)}</p></div>
                  <div><p className="text-slate-400">Monthly Est.</p><p className="font-bold text-lg text-purple-400">${(totalFeePerWeek * 4.33).toFixed(2)}</p></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">Covers: escrow protection, insurance verification, compliance monitoring, dispute resolution, GPS tracking, and payment processing.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("hos")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setStep("review")}>Review & Activate <ChevronRight className="w-5 h-5 ml-2" /></Button>
          </div>
        </div>
      )}

      {/* STEP: REVIEW */}
      {step === "review" && (
        <div className="space-y-5">
          <Card className={cc}><CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15"><Repeat className="w-6 h-6 text-blue-500" /></div>
              <div><p className={cn("font-bold text-lg", vl)}>{contractName}</p><p className="text-xs text-slate-400">{contractType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} · {duration.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} · {startDate} → {endDate || "Ongoing"}</p></div>
            </div>
            {patterns.map((p, idx) => (
              <div key={p.id} className={cn("p-3 rounded-xl border mb-3", cl)}>
                <div className="flex items-center justify-between mb-2">
                  <p className={cn("font-bold text-xs", vl)}>Lane {idx + 1}: {p.originCity}, {p.originState} → {p.destCity}, {p.destState}</p>
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 border text-[10px]">{checkHOS(p).dailyDriveOk && checkHOS(p).weeklyOk ? "HOS OK" : "HOS Warning"}</Badge>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div><p className="text-slate-400">Days</p><p className={vl}>{p.days.join(", ")}</p></div>
                  <div><p className="text-slate-400">Time</p><p className={vl}>{p.pickupTime}</p></div>
                  <div><p className="text-slate-400">Loads/Day</p><p className={vl}>{p.loadsPerDay}</p></div>
                  <div><p className="text-slate-400">Rate</p><p className="font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${parseFloat(p.ratePerLoad || "0").toLocaleString()}</p></div>
                  <div><p className="text-slate-400">Equipment</p><p className={vl}>{p.equipmentType.replace(/_/g, " ")}</p></div>
                </div>
              </div>
            ))}
            <div className={cn("grid grid-cols-4 gap-3 mt-4")}>
              <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Loads/Week</p><p className={cn("text-lg font-bold", vl)}>{totalLoadsPerWeek}</p></div>
              <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Rev/Week</p><p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${totalRevPerWeek.toLocaleString()}</p></div>
              <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Fee/Week</p><p className="text-lg font-bold text-purple-400">${totalFeePerWeek.toFixed(2)}</p></div>
              <div className={cl}><p className="text-[10px] text-slate-400 uppercase">Monthly Est.</p><p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${(totalRevPerWeek * 4.33).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
            </div>
          </CardContent></Card>
          <div className="flex gap-3">
            <Button variant="outline" className={cn("flex-1 rounded-xl h-12 font-bold", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setStep("agreement")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button className="flex-1 h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" disabled={activating} onClick={activateSchedule}>{activating ? <><span className="animate-spin mr-2">⏳</span>Creating Loads...</> : <><Zap className="w-4 h-4 mr-2" />Activate Schedule</>}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
