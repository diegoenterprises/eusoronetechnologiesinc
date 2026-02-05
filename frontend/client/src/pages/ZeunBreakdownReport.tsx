/**
 * ZEUN MECHANICS™ BREAKDOWN REPORT PAGE
 * Report vehicle breakdowns and get instant diagnostics
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  MapPin,
  Wrench,
  Clock,
  DollarSign,
  CheckCircle,
  Loader2,
  Phone,
  MessageSquare,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BreakdownFormData {
  vehicleVin: string;
  symptoms: string[];
  issueCategory: string;
  severity: string;
  canDrive: boolean;
  latitude: number;
  longitude: number;
  address: string;
  loadStatus: "LOADED" | "EMPTY";
  isHazmat: boolean;
}

export default function ZeunBreakdownReport() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BreakdownFormData>({
    vehicleVin: "",
    symptoms: [],
    issueCategory: "ENGINE",
    severity: "HIGH",
    canDrive: false,
    latitude: 0,
    longitude: 0,
    address: "",
    loadStatus: "LOADED",
    isHazmat: false,
  });

  const [currentSymptom, setCurrentSymptom] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportBreakdownMutation = (trpc as any).zeunMechanics.reportBreakdown.useMutation();

  const handleAddSymptom = () => {
    if (currentSymptom.trim()) {
      setFormData({
        ...formData,
        symptoms: [...formData.symptoms, currentSymptom],
      });
      setCurrentSymptom("");
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter((_, i) => i !== index),
    });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!formData.vehicleVin || formData.symptoms.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await reportBreakdownMutation.mutateAsync({
        vehicleId: 1,
        latitude: formData.latitude,
        longitude: formData.longitude,
        symptoms: formData.symptoms,
        issueCategory: formData.issueCategory as any,
        severity: formData.severity as any,
        canDrive: formData.canDrive,
        driverNotes: formData.address,
      });

      setReportId(String(result.reportId));
      setDiagnosticResult(result);
    } catch (error) {
      console.error("Error reporting breakdown:", error);
      alert("Failed to report breakdown. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (diagnosticResult) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Breakdown Diagnostic Results</h1>
          <p className="text-slate-400 mt-1">Report ID: {reportId}</p>
        </div>

        {/* Severity Alert */}
        <Card className="bg-red-900/20 border-red-700 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-2">
                CRITICAL BREAKDOWN DETECTED
              </h3>
              <p className="text-red-300">
                Your vehicle requires immediate attention. Roadside assistance has been notified.
              </p>
            </div>
          </div>
        </Card>

        {/* Diagnostic Codes */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Diagnostic Trouble Codes</h2>
          <div className="space-y-3">
            {diagnosticResult.diagnosticCodes?.map((code: any, idx: number) => (
              <Card key={idx} className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white">
                      SPN {code.spn} FMI {code.fmi}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{code.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      code.severity === "CRITICAL"
                        ? "bg-red-900 text-red-200"
                        : code.severity === "HIGH"
                          ? "bg-orange-900 text-orange-200"
                          : "bg-yellow-900 text-yellow-200"
                    }`}
                  >
                    {code.severity}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-400">Possible Causes:</p>
                    <ul className="list-disc list-inside text-slate-300 mt-1">
                      {code.possibleCauses?.map((cause: string, i: number) => (
                        <li key={i}>{cause}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700">
                    <div>
                      <p className="text-slate-400 text-xs">Repair Time</p>
                      <p className="text-white font-bold">
                        {code.estimatedRepairTime?.[0]}-{code.estimatedRepairTime?.[1]} hrs
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Cost Range</p>
                      <p className="text-white font-bold">
                        ${code.estimatedCost?.[0]}-${code.estimatedCost?.[1]}
                      </p>
                    </div>
                  </div>

                  {code.isOutOfService && (
                    <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded">
                      <p className="text-red-300 text-xs font-bold">
                        🚫 OUT OF SERVICE - Vehicle cannot operate legally
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {diagnosticResult.recommendedActions && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recommended Actions</h2>
            <Card className="bg-slate-800 border-slate-700 p-4 space-y-2">
              {diagnosticResult.recommendedActions.map((action: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-300">{action}</p>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Nearest Providers */}
        {diagnosticResult.nearestProviders && diagnosticResult.nearestProviders.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Nearest Repair Facilities</h2>
            <div className="space-y-3">
              {diagnosticResult.nearestProviders.map((provider: any, idx: number) => (
                <Card key={idx} className="bg-slate-800 border-slate-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{provider.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={16} className="text-blue-400" />
                        <span className="text-sm text-slate-400">{provider.distance} miles away</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-bold text-white">{provider.rating}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Rating</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Phone size={16} className="mr-2" />
                      Call
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <MessageSquare size={16} className="mr-2" />
                      Message
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setDiagnosticResult(null);
              setReportId(null);
              setFormData({
                vehicleVin: "",
                symptoms: [],
                issueCategory: "ENGINE",
                severity: "HIGH",
                canDrive: false,
                latitude: 0,
                longitude: 0,
                address: "",
                loadStatus: "LOADED",
                isHazmat: false,
              });
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          >
            Report Another Breakdown
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Phone size={16} className="mr-2" />
            Call 24/7 Hotline: 1-844-ZEUN-HELP
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Report Breakdown</h1>
        <p className="text-slate-400 mt-1">Get instant diagnostics and find repair facilities</p>
      </div>

      {/* Breakdown Form */}
      <Card className="bg-slate-800 border-slate-700 p-6 space-y-6">
        {/* Vehicle VIN */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Vehicle VIN</label>
          <input
            type="text"
            value={formData.vehicleVin}
            onChange={(e: any) => setFormData({ ...formData, vehicleVin: e.target.value })}
            placeholder="Enter vehicle VIN"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
          />
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Symptoms</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentSymptom}
              onChange={(e: any) => setCurrentSymptom(e.target.value)}
              onKeyPress={(e: any) => e.key === "Enter" && handleAddSymptom()}
              placeholder="e.g., Engine won't start, Clicking sound"
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
            <Button onClick={handleAddSymptom} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add
            </Button>
          </div>

          {formData.symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.symptoms.map((symptom: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-blue-900/30 border border-blue-700 rounded px-3 py-1 flex items-center gap-2"
                >
                  <span className="text-sm text-blue-200">{symptom}</span>
                  <button
                    onClick={() => handleRemoveSymptom(idx)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issue Category */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Issue Category</label>
          <select
            value={formData.issueCategory || ""}
            onChange={(e: any) => setFormData({ ...formData, issueCategory: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="ENGINE">Engine</option>
            <option value="TRANSMISSION">Transmission</option>
            <option value="BRAKES">Brakes</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="COOLING_SYSTEM">Cooling System</option>
            <option value="FUEL_SYSTEM">Fuel System</option>
            <option value="TIRES">Tires</option>
            <option value="SUSPENSION">Suspension</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Severity</label>
          <div className="grid grid-cols-5 gap-2">
            {["CRITICAL", "HIGH", "MEDIUM", "LOW", "ADVISORY"].map((level: string) => (
              <button
                key={level}
                onClick={() => setFormData({ ...formData, severity: level })}
                className={`py-2 rounded text-sm font-bold transition ${
                  formData.severity === level
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.address}
              onChange={(e: any) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter location or address"
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
            <Button
              onClick={handleGetLocation}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MapPin size={16} />
            </Button>
          </div>
          {formData.latitude !== 0 && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <MapPin size={12} className="text-blue-400" />
              {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </p>
          )}
        </div>

        {/* Load Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Load Status</label>
            <select
              value={formData.loadStatus}
              onChange={(e: any) => setFormData({ ...formData, loadStatus: e.target.value as "LOADED" | "EMPTY" })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="LOADED" >Loaded</option>
              <option value="EMPTY" >Empty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">HazMat?</label>
            <button
              onClick={() => setFormData({ ...formData, isHazmat: !formData.isHazmat })}
              className={`w-full py-2 rounded font-bold transition ${
                formData.isHazmat
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {formData.isHazmat ? "YES - HazMat" : "NO - Regular"}
            </button>
          </div>
        </div>

        {/* Can Drive */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Can You Drive?</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormData({ ...formData, canDrive: true })}
              className={`flex-1 py-2 rounded font-bold transition ${
                formData.canDrive
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              Yes, I can drive
            </button>
            <button
              onClick={() => setFormData({ ...formData, canDrive: false })}
              className={`flex-1 py-2 rounded font-bold transition ${
                !formData.canDrive
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              No, I cannot drive
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitReport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-bold"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analyzing Breakdown...
            </>
          ) : (
            <>
              <Wrench size={16} className="mr-2" />
              Report Breakdown & Get Diagnostics
            </>
          )}
        </Button>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-700 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-300 mb-1">24/7 Support Available</h3>
            <p className="text-sm text-blue-200">
              Call our hotline at 1-844-ZEUN-HELP (1-844-938-6435) for immediate assistance
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

