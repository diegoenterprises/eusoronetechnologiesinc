import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Globe, Search, FileCheck, Shield, AlertTriangle, MapPin, ArrowRight, RefreshCw } from "lucide-react";

export default function ADRCompliancePage() {
  const [loadId, setLoadId] = useState("");
  const [dotClass, setDotClass] = useState("");
  const [unNumber, setUnNumber] = useState("");
  const [driverId, setDriverId] = useState("");
  const [lookupLoadId, setLookupLoadId] = useState<number | null>(null);

  const classMappingsQ = (trpc as any).adrCompliance?.getClassMappings?.useQuery?.() || { data: [] };
  const tunnelCodesQ = (trpc as any).adrCompliance?.getTunnelCodes?.useQuery?.() || { data: [] };
  const complianceQ = (trpc as any).adrCompliance?.getCompliance?.useQuery?.({ loadId: lookupLoadId! }, { enabled: !!lookupLoadId }) || { data: null };
  const createM = (trpc as any).adrCompliance?.createCompliance?.useMutation?.({
    onSuccess: (data: any) => { toast.success(`ADR compliance created — Class ${data?.adrClass}, Tunnel ${data?.tunnelRestrictionCode}`); },
    onError: () => toast.error("Failed to create ADR compliance"),
  }) || { mutate: () => {}, isPending: false };
  const validateM = (trpc as any).adrCompliance?.validateDriver?.useQuery?.({ driverId: parseInt(driverId) || 0, adrClass: dotClass }, { enabled: !!driverId && !!dotClass }) || { data: null };

  const mappings = (classMappingsQ.data as any[]) || [];
  const tunnelCodes = (tunnelCodesQ.data as any[]) || [];
  const compliance = complianceQ.data;
  const driverValidation = validateM.data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />EU ADR Compliance Engine
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">European Agreement on Dangerous Goods by Road — Class mapping, tunnel restrictions, driver certifications</p>
      </div>

      {/* Create Compliance */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-emerald-400" />Generate ADR Record</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Load ID</label>
              <Input value={loadId} onChange={(e: any) => setLoadId(e.target.value)} placeholder="e.g., 42" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">DOT Hazmat Class</label>
              <Input value={dotClass} onChange={(e: any) => setDotClass(e.target.value)} placeholder="e.g., 3" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">UN Number</label>
              <Input value={unNumber} onChange={(e: any) => setUnNumber(e.target.value)} placeholder="e.g., UN1267" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs bg-emerald-600 text-white" disabled={!loadId || !dotClass || !unNumber}
            onClick={() => createM.mutate({ loadId: parseInt(loadId), dotClass, unNumber })}>
            Generate ADR Record
          </Button>
        </CardContent>
      </Card>

      {/* Lookup Compliance */}
      <div className="flex gap-2">
        <Input placeholder="Lookup ADR compliance by Load ID..." value={lookupLoadId?.toString() || ""} onChange={(e: any) => setLookupLoadId(parseInt(e.target.value) || null)}
          className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white flex-1" />
      </div>
      {compliance && (
        <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-xl">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400">ADR Class {compliance.adrClass}</Badge>
              <Badge className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-400">{compliance.adrUnNumber}</Badge>
              <Badge className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-400">Tunnel {compliance.tunnelRestrictionCode}</Badge>
            </div>
            <p className="text-xs text-slate-400">{compliance.tunnelDescription}</p>
          </CardContent>
        </Card>
      )}

      {/* Driver Validation */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" />Driver ADR Certification Check</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Driver ID</label>
              <Input value={driverId} onChange={(e: any) => setDriverId(e.target.value)} placeholder="e.g., 7" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">ADR Class</label>
              <Input value={dotClass} onChange={(e: any) => setDotClass(e.target.value)} placeholder="e.g., 3" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
          </div>
          {driverValidation && (
            <div className={cn("p-3 rounded-lg border", driverValidation.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
              {driverValidation.valid ? (
                <p className="text-xs text-emerald-400 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />Driver certified for ADR Class {dotClass}</p>
              ) : (
                <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{driverValidation.reason}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reference Tables */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 uppercase tracking-wider">DOT → ADR Class Map</CardTitle></CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
            <div className="space-y-0.5">
              {mappings.map((m: any) => (
                <div key={m.dotClass} className="flex items-center gap-2 text-xs py-0.5">
                  <span className="text-white font-mono w-10">{m.dotClass}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-emerald-400 font-mono">{m.adrClass}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Tunnel Restriction Codes</CardTitle></CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
            <div className="space-y-1">
              {tunnelCodes.map((t: any) => (
                <div key={t.code} className="flex items-start gap-2 text-xs py-0.5">
                  <Badge className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 shrink-0">{t.code}</Badge>
                  <span className="text-slate-400">{t.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
