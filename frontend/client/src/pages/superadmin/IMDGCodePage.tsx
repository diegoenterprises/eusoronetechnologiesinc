import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Ship, Anchor, Package, FileCheck, Search, ArrowRight, CheckCircle } from "lucide-react";

export default function IMDGCodePage() {
  const [loadId, setLoadId] = useState("");
  const [dotClass, setDotClass] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [packingGroup, setPackingGroup] = useState("");
  const [lookupLoadId, setLookupLoadId] = useState<number | null>(null);

  const classMappingsQ = (trpc as any).imdg?.getClassMappings?.useQuery?.() || { data: [] };
  const packingGroupsQ = (trpc as any).imdg?.getPackingGroups?.useQuery?.() || { data: [] };
  const complianceQ = (trpc as any).imdg?.getCompliance?.useQuery?.({ loadId: lookupLoadId! }, { enabled: !!lookupLoadId }) || { data: null };
  const createM = (trpc as any).imdg?.createCompliance?.useMutation?.({
    onSuccess: (data: any) => { toast.success(`IMDG compliance created — ${data?.imdgClass}`); },
    onError: () => toast.error("Failed to create IMDG compliance"),
  }) || { mutate: () => {}, isPending: false };
  const manifestM = (trpc as any).imdg?.markVesselManifest?.useMutation?.({
    onSuccess: () => { toast.success("Vessel manifest marked as submitted"); if (lookupLoadId) complianceQ.refetch?.(); },
  }) || { mutate: () => {} };

  const mappings = (classMappingsQ.data as any[]) || [];
  const packingGroups = (packingGroupsQ.data as any[]) || [];
  const compliance = complianceQ.data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Ship className="w-5 h-5 text-blue-400" />IMDG Code Integration
        </h1>
        <p className="text-[10px] text-slate-400 mt-0.5">International Maritime Dangerous Goods — Multi-modal road + sea hazmat compliance</p>
      </div>

      {/* Create IMDG Record */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-white flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5 text-blue-400" />Create IMDG Record</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase">Load ID</label>
              <Input value={loadId} onChange={(e: any) => setLoadId(e.target.value)} placeholder="e.g., 42" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase">DOT Hazmat Class</label>
              <Input value={dotClass} onChange={(e: any) => setDotClass(e.target.value)} placeholder="e.g., 3" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase">Proper Shipping Name</label>
              <Input value={shippingName} onChange={(e: any) => setShippingName(e.target.value)} placeholder="e.g., PETROLEUM CRUDE OIL" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase">Packing Group</label>
              <select value={packingGroup} onChange={(e) => setPackingGroup(e.target.value)} className="w-full h-7 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded-md px-2 mt-1">
                <option value="">None</option>
                <option value="I">I — Great Danger</option>
                <option value="II">II — Medium Danger</option>
                <option value="III">III — Minor Danger</option>
              </select>
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs bg-blue-600 text-white" disabled={!loadId || !dotClass || !shippingName}
            onClick={() => createM.mutate({ loadId: parseInt(loadId), dotClass, properShippingName: shippingName, packingGroup: packingGroup || undefined })}>
            Create IMDG Record
          </Button>
        </CardContent>
      </Card>

      {/* Lookup */}
      <div className="flex gap-2">
        <Input placeholder="Lookup IMDG compliance by Load ID..." value={lookupLoadId?.toString() || ""} onChange={(e: any) => setLookupLoadId(parseInt(e.target.value) || null)}
          className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white flex-1" />
      </div>
      {compliance && (
        <Card className="bg-blue-500/5 border-blue-500/20 rounded-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="text-[9px] bg-blue-500/10 border-blue-500/20 text-blue-400">{compliance.imdgClass}</Badge>
              <span className="text-xs text-white font-semibold">{compliance.imdgProperShippingName}</span>
              {compliance.packingGroupCode && <Badge className="text-[8px] bg-amber-500/10 border-amber-500/20 text-amber-400">PG {compliance.packingGroupCode}</Badge>}
            </div>
            {compliance.packingGroupDescription && <p className="text-[10px] text-slate-400">{compliance.packingGroupDescription}</p>}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", compliance.containerPackingCertUrl ? "bg-emerald-400" : "bg-slate-600")} />
                <span className="text-[9px] text-slate-400">Packing Cert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", compliance.dgDeclarationFormUrl ? "bg-emerald-400" : "bg-slate-600")} />
                <span className="text-[9px] text-slate-400">DG Declaration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", compliance.vesselManifestSubmitted ? "bg-emerald-400" : "bg-slate-600")} />
                <span className="text-[9px] text-slate-400">Vessel Manifest</span>
              </div>
              {!compliance.vesselManifestSubmitted && (
                <Button variant="ghost" size="sm" className="h-5 px-2 text-[8px] text-blue-400 hover:bg-blue-500/10" onClick={() => manifestM.mutate({ loadId: lookupLoadId! })}>
                  <CheckCircle className="w-3 h-3 mr-0.5" />Mark Submitted
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reference */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-slate-500 uppercase tracking-wider">DOT → IMDG Class Map</CardTitle></CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
            <div className="space-y-0.5">
              {mappings.map((m: any) => (
                <div key={m.dotClass} className="flex items-center gap-2 text-[10px] py-0.5">
                  <span className="text-white font-mono w-10">{m.dotClass}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-blue-400 font-mono">{m.imdgClass}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] text-slate-500 uppercase tracking-wider">Packing Groups (IMDG)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {packingGroups.map((pg: any) => (
                <div key={pg.code} className="flex items-start gap-2 text-[10px]">
                  <Badge className="text-[8px] bg-amber-500/10 border-amber-500/20 text-amber-400 shrink-0">PG {pg.code}</Badge>
                  <span className="text-slate-400">{pg.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
