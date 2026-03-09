import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bot, Plus, AlertTriangle, Activity, MapPin, Gauge, Thermometer, Fuel, Eye, ShieldAlert, X } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  idle: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  emergency_control: "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse",
  offline: "text-slate-600 bg-slate-700/10 border-slate-700/20",
};

export default function AutonomousFleetPage() {
  const [showRegister, setShowRegister] = useState(false);
  const [selectedAvId, setSelectedAvId] = useState<number | null>(null);
  const [regForm, setRegForm] = useState({ vehicleId: "", vin: "", avLevel: "4" });

  const listQ = (trpc as any).autonomous?.list?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const fleetStatusQ = (trpc as any).autonomous?.getFleetStatus?.useQuery?.() || { data: null };
  const telemetryQ = (trpc as any).autonomous?.getLatestTelemetry?.useQuery?.({ avId: selectedAvId!, limit: 20 }, { enabled: !!selectedAvId }) || { data: null };
  const registerM = (trpc as any).autonomous?.register?.useMutation?.({
    onSuccess: () => { toast.success("AV registered"); setShowRegister(false); listQ.refetch?.(); },
    onError: () => toast.error("Failed to register AV"),
  }) || { mutate: () => {}, isPending: false };
  const takeoverM = (trpc as any).autonomous?.emergencyTakeover?.useMutation?.({
    onSuccess: () => { toast.success("Emergency takeover initiated"); listQ.refetch?.(); },
  }) || { mutate: () => {} };
  const releaseM = (trpc as any).autonomous?.releaseControl?.useMutation?.({
    onSuccess: () => { toast.success("Control released"); listQ.refetch?.(); },
  }) || { mutate: () => {} };

  const avList = (listQ.data as any[]) || [];
  const fleetStatus = fleetStatusQ.data || { total: 0, active: 0, idle: 0, emergency: 0, offline: 0 };
  const telemetry = (telemetryQ.data as any[]) || [];

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-amber-400" />Autonomous Vehicle Fleet
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">AV telemetry ingestion, monitoring, and emergency control</p>
        </div>
        <Button size="sm" className="h-7 text-xs bg-amber-600 text-white" onClick={() => setShowRegister(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />Register AV
        </Button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Total", value: fleetStatus.total, color: "text-white" },
          { label: "Active", value: fleetStatus.active, color: "text-emerald-400" },
          { label: "Idle", value: fleetStatus.idle, color: "text-slate-400" },
          { label: "Emergency", value: fleetStatus.emergency, color: "text-red-400" },
          { label: "Offline", value: fleetStatus.offline, color: "text-slate-600" },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
            <span className={cn("text-lg font-bold font-mono", s.color)}>{s.value}</span>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AV List */}
      {avList.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-10 text-center">
            <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">No Autonomous Vehicles Registered</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {avList.map((av: any) => (
            <Card key={av.id} className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer",
              selectedAvId === av.id && "ring-1 ring-amber-500/30")} onClick={() => setSelectedAvId(selectedAvId === av.id ? null : av.id)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">AV #{av.id}</span>
                      <Badge className={cn("text-[8px]", STATUS_COLORS[av.operationalStatus] || STATUS_COLORS.offline)}>{av.operationalStatus}</Badge>
                      <Badge className="text-[8px] bg-white/[0.04] border-white/[0.06] text-slate-400">Level {av.avLevel}</Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 font-mono">VIN: {av.vin}</p>
                    {av.telemetryLastUpdate && <p className="text-[8px] text-slate-600 mt-0.5">Last ping: {new Date(av.telemetryLastUpdate).toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-1">
                    {av.operationalStatus !== "emergency_control" ? (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-red-400 hover:bg-red-500/10"
                        onClick={(e) => { e.stopPropagation(); takeoverM.mutate({ avId: av.id }); }}>
                        <ShieldAlert className="w-3 h-3 mr-0.5" />Takeover
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-emerald-400 hover:bg-emerald-500/10"
                        onClick={(e) => { e.stopPropagation(); releaseM.mutate({ avId: av.id }); }}>
                        Release
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Telemetry Detail */}
      {selectedAvId && telemetry.length > 0 && (
        <Card className="bg-slate-800/50 border-amber-500/20 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-400" />Telemetry — AV #{selectedAvId}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-500">
                    <th className="text-left py-1.5 px-2">Time</th>
                    <th className="text-right py-1.5 px-2"><MapPin className="w-3 h-3 inline" /> Lat</th>
                    <th className="text-right py-1.5 px-2">Lng</th>
                    <th className="text-right py-1.5 px-2"><Gauge className="w-3 h-3 inline" /> Speed</th>
                    <th className="text-right py-1.5 px-2"><Fuel className="w-3 h-3 inline" /> Fuel</th>
                    <th className="text-right py-1.5 px-2"><Thermometer className="w-3 h-3 inline" /> Temp</th>
                    <th className="text-left py-1.5 px-2">Diag</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.map((t: any) => (
                    <tr key={t.id} className="border-b border-white/[0.03]">
                      <td className="py-1 px-2 text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                      <td className="py-1 px-2 text-right font-mono text-white">{Number(t.latitude).toFixed(5)}</td>
                      <td className="py-1 px-2 text-right font-mono text-white">{Number(t.longitude).toFixed(5)}</td>
                      <td className="py-1 px-2 text-right font-mono text-cyan-400">{t.speed ? `${Number(t.speed).toFixed(1)} mph` : "—"}</td>
                      <td className="py-1 px-2 text-right font-mono text-emerald-400">{t.fuelLevel ? `${Number(t.fuelLevel).toFixed(0)}%` : "—"}</td>
                      <td className="py-1 px-2 text-right font-mono text-amber-400">{t.engineTemp ? `${Number(t.engineTemp).toFixed(0)}°F` : "—"}</td>
                      <td className="py-1 px-2 text-slate-500">{t.diagnosticCode || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-amber-400" />Register AV</h2>
              <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Vehicle ID</label>
                <Input value={regForm.vehicleId} onChange={(e: any) => setRegForm({ ...regForm, vehicleId: e.target.value })} placeholder="Existing vehicle ID" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">VIN (17 characters)</label>
                <Input value={regForm.vin} onChange={(e: any) => setRegForm({ ...regForm, vin: e.target.value })} placeholder="1HGBH41JXMN109186" maxLength={17} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1 font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">AV Level (1-5)</label>
                <select value={regForm.avLevel} onChange={(e) => setRegForm({ ...regForm, avLevel: e.target.value })} className="w-full h-7 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded-md px-2 mt-1">
                  <option value="1">Level 1 — Driver Assistance</option>
                  <option value="2">Level 2 — Partial Automation</option>
                  <option value="3">Level 3 — Conditional Automation</option>
                  <option value="4">Level 4 — High Automation</option>
                  <option value="5">Level 5 — Full Automation</option>
                </select>
              </div>
            </div>
            <Button className="w-full bg-amber-600 text-white text-xs" disabled={registerM.isPending || !regForm.vehicleId || regForm.vin.length !== 17}
              onClick={() => registerM.mutate({ vehicleId: parseInt(regForm.vehicleId), vin: regForm.vin, avLevel: parseInt(regForm.avLevel) })}>
              {registerM.isPending ? "Registering..." : "Register Vehicle"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
