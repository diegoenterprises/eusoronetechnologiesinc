import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link2, Shield, CheckCircle, AlertTriangle, Search, RefreshCw, Hash, Clock } from "lucide-react";

export default function BlockchainAuditPage() {
  const [lookupLoadId, setLookupLoadId] = useState("");
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null);

  const statsQ = (trpc as any).blockchainAudit?.getStats?.useQuery?.() || { data: null };
  const recentQ = (trpc as any).blockchainAudit?.getRecentEvents?.useQuery?.() || { data: null };
  const trailQ = (trpc as any).blockchainAudit?.getTrail?.useQuery?.({ loadId: selectedLoadId! }, { enabled: !!selectedLoadId }) || { data: null };
  const verifyQ = (trpc as any).blockchainAudit?.verifyChain?.useQuery?.({ loadId: selectedLoadId! }, { enabled: !!selectedLoadId }) || { data: null };

  const stats = statsQ.data || { totalBlocks: 0, totalLoads: 0, recentEvents: 0 };
  const recent = (recentQ.data as any[]) || [];
  const trail = (trailQ.data as any[]) || [];
  const verification = verifyQ.data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />Blockchain Audit Trail
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Immutable SHA-256 hash chain for compliance logging</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.08] text-slate-400" onClick={() => { statsQ.refetch?.(); recentQ.refetch?.(); }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <Hash className="w-4 h-4 text-cyan-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.totalBlocks.toLocaleString()}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Total Blocks</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <Shield className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.totalLoads}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Audited Loads</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Clock className="w-4 h-4 text-amber-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.recentEvents}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Last 24h Events</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input placeholder="Enter Load ID to inspect chain..." value={lookupLoadId} onChange={(e: any) => setLookupLoadId(e.target.value)}
          className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white flex-1" />
        <Button size="sm" className="h-8 text-xs bg-cyan-600 text-white" onClick={() => { const id = parseInt(lookupLoadId); if (id) setSelectedLoadId(id); else toast.error("Enter a valid load ID"); }}>
          <Search className="w-3.5 h-3.5 mr-1" />Inspect
        </Button>
      </div>

      {/* Chain Verification */}
      {selectedLoadId && verification && (
        <Card className={cn("rounded-xl border", verification.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
          <CardContent className="p-4 flex items-center gap-3">
            {verification.valid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
            <div>
              <p className={cn("text-sm font-bold", verification.valid ? "text-emerald-400" : "text-red-400")}>
                {verification.valid ? "Chain Integrity Verified" : "Chain Integrity BROKEN"}
              </p>
              <p className="text-[10px] text-slate-400">Load #{selectedLoadId} · {verification.blockCount} blocks</p>
              {verification.issues?.length > 0 && (
                <ul className="mt-1 space-y-0.5">{verification.issues.map((issue: string, i: number) => (
                  <li key={i} className="text-[9px] text-red-400">• {issue}</li>
                ))}</ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trail */}
      {selectedLoadId && trail.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Audit Chain — Load #{selectedLoadId}</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {trail.map((block: any, i: number) => (
              <div key={block.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex flex-col items-center">
                  <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-cyan-400" : "bg-slate-600")} />
                  {i < trail.length - 1 && <div className="w-px h-6 bg-white/[0.06]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[8px] bg-cyan-500/10 border-cyan-500/20 text-cyan-400">{block.eventType}</Badge>
                    <span className="text-[8px] text-slate-600">{new Date(block.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">#{block.blockHash?.substring(0, 16)}...</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-white">Recent Events (All Loads)</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-6">No audit events recorded yet</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {recent.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer" onClick={() => setSelectedLoadId(e.loadId)}>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[8px] bg-white/[0.04] border-white/[0.06] text-slate-300">{e.eventType}</Badge>
                    <span className="text-[9px] text-slate-500">Load #{e.loadId}</span>
                  </div>
                  <span className="text-[8px] text-slate-600 font-mono">{e.blockHash?.substring(0, 12)}...</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
