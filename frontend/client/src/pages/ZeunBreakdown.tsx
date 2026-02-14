/**
 * ZEUN Breakdown Report Page - Driver breakdown reporting with AI diagnosis
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Wrench, AlertTriangle, Truck, Phone, MapPin, Clock, 
  CheckCircle, XCircle, ChevronRight, Star, RefreshCw,
  Thermometer, Fuel, Gauge, Battery, Navigation
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
  const [step, setStep] = useState(1);
  const [issueCategory, setIssueCategory] = useState<IssueCategory | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [canDrive, setCanDrive] = useState<boolean | null>(null);
  const [driverNotes, setDriverNotes] = useState("");
  const [reportResult, setReportResult] = useState<{
    reportId: number;
    diagnosis: { issue: string; probability: number; severity: string; description: string };
    canDrive: boolean;
    providers: Array<{ id: number; name: string; type: string; distance: string; phone: string | null; rating: number | null; available24x7: boolean | null }>;
    estimatedCost: { min: number; max: number };
  } | null>(null);

  const reportMutation = (trpc as any).zeunMechanics.reportBreakdown.useMutation({
    onSuccess: (result: any) => {
      setReportResult(result);
      setStep(5);
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
    let latitude = 32.7767; // Default Dallas
    let longitude = -96.7970;
    
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
    setIssueCategory("");
    setSeverity("");
    setSymptoms([]);
    setCanDrive(null);
    setDriverNotes("");
    setReportResult(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            ZEUN Mechanics
          </h1>
          <p className="text-muted-foreground">AI-powered breakdown diagnosis and roadside assistance</p>
        </div>
        {step > 1 && step < 5 && (
          <Button variant="outline" onClick={resetForm}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        )}
      </div>

      {/* Active Breakdowns */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : myBreakdowns && myBreakdowns.length > 0 ? (
              <div className="space-y-2">
                {myBreakdowns.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{b.issueCategory.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">{b.symptoms?.slice(0, 2).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={b.status === "RESOLVED" ? "default" : "secondary"}>
                        {b.status}
                      </Badge>
                      <Badge variant={b.severity === "CRITICAL" ? "destructive" : "outline"}>
                        {b.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No active breakdown reports</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step Progress */}
      {step < 5 && (
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4].map((s: any) => (
            <div key={s} className={`flex items-center ${s < 4 ? "flex-1" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Issue Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What is the problem?</CardTitle>
            <CardDescription>Select the category that best describes your issue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ISSUE_CATEGORIES.map((category: any) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => {
                      setIssueCategory(category.value);
                      setStep(2);
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary ${issueCategory === category.value ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <Icon className="h-6 w-6 mb-2" />
                    <div className="font-medium">{category.label}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Describe the symptoms</CardTitle>
            <CardDescription>Add symptoms to help with diagnosis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={symptomInput}
                onChange={(e: any) => setSymptomInput(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && addSymptom(symptomInput)}
                placeholder="Type a symptom and press Enter"
              />
              <Button onClick={() => addSymptom(symptomInput)}>Add</Button>
            </div>

            {symptoms.length > 0 && (
              <div className="space-y-2">
                {symptoms.map((symptom: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>{symptom}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeSymptom(index)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {issueCategory && COMMON_SYMPTOMS[issueCategory] && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Common symptoms:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SYMPTOMS[issueCategory].map((symptom: any) => (
                    <Button
                      key={symptom}
                      variant="outline"
                      size="sm"
                      onClick={() => addSymptom(symptom)}
                      disabled={symptoms.includes(symptom)}
                    >
                      + {symptom}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={symptoms.length === 0}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Severity & Drivability */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>How serious is it?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {SEVERITY_OPTIONS.map((option: any) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left ${severity === option.value ? "border-primary" : "border-border"}`}
                >
                  <Badge className={option.color}>{option.label}</Badge>
                </button>
              ))}
            </div>

            <div>
              <h3 className="font-bold mb-3">Can you drive the truck?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCanDrive(true)}
                  className={`p-4 rounded-lg border-2 ${canDrive === true ? "border-green-600 bg-green-50" : "border-border"}`}
                >
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Yes, limited</div>
                  <div className="text-sm text-muted-foreground">Can drive short distance</div>
                </button>
                <button
                  onClick={() => setCanDrive(false)}
                  className={`p-4 rounded-lg border-2 ${canDrive === false ? "border-red-600 bg-red-50" : "border-border"}`}
                >
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="font-medium">No, unsafe</div>
                  <div className="text-sm text-muted-foreground">Need tow/mobile service</div>
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!severity || canDrive === null}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Notes & Submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              value={driverNotes}
              onChange={(e: any) => setDriverNotes(e.target.value)}
              placeholder="Any additional details about the issue..."
              rows={4}
            />

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-bold mb-2">Summary</h3>
              <div className="text-sm space-y-1">
                <div><strong>Issue:</strong> {ISSUE_CATEGORIES.find((c: any) => c.value === issueCategory)?.label}</div>
                <div><strong>Severity:</strong> {severity}</div>
                <div><strong>Symptoms:</strong> {symptoms.length} reported</div>
                <div><strong>Can Drive:</strong> {canDrive ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={reportMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {reportMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Submit Breakdown Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Results */}
      {step === 5 && reportResult && (
        <div className="space-y-4">
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Diagnosis Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-bold text-lg">{reportResult.diagnosis.issue}</h3>
                <p className="text-muted-foreground">{reportResult.diagnosis.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <Badge variant={reportResult.diagnosis.severity === "CRITICAL" ? "destructive" : "secondary"}>
                    {reportResult.diagnosis.severity} Severity
                  </Badge>
                  <span className="text-sm">
                    Confidence: {(reportResult.diagnosis.probability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-xl font-bold">${reportResult.estimatedCost.min} - ${reportResult.estimatedCost.max}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Can Drive</p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    {reportResult.canDrive ? (
                      <><CheckCircle className="h-5 w-5 text-green-600" /> Yes, limited</>
                    ) : (
                      <><XCircle className="h-5 w-5 text-red-600" /> No - Need tow</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Nearby Repair Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportResult.providers.length > 0 ? (
                <div className="space-y-3">
                  {reportResult.providers.map((provider: any, index: number) => (
                    <div key={provider.id} className={`p-4 border rounded-lg ${index === 0 ? "border-primary bg-primary/5" : ""}`}>
                      {index === 0 && <Badge className="mb-2">Recommended</Badge>}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.type.replace(/_/g, " ")}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {provider.distance} mi
                            </span>
                            {provider.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" /> {provider.rating.toFixed(1)}
                              </span>
                            )}
                            {provider.available24x7 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" /> 24/7
                              </span>
                            )}
                          </div>
                        </div>
                        {provider.phone && (
                          <Button size="sm" asChild>
                            <a href={`tel:${provider.phone}`}>
                              <Phone className="h-4 w-4 mr-1" /> Call
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No providers found in your area</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={resetForm}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Report Another Issue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
