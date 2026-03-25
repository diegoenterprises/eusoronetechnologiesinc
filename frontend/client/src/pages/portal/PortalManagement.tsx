import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield, Plus, RefreshCw, X, Key, Users, Link2, Unlink,
  Copy, Eye, EyeOff, ChevronDown, ChevronUp, BarChart3,
  Clock, Package, Trash2, Calendar,
} from "lucide-react";

export default function PortalManagement() {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedToken, setExpandedToken] = useState<number | null>(null);
  const [linkTokenId, setLinkTokenId] = useState<number | null>(null);
  const [linkLoadIds, setLinkLoadIds] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    expiresInDays: 365,
  });

  const tokensQuery = (trpc as any).customerPortal.listPortalAccess.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  const tokens: any[] = tokensQuery.data?.tokens || [];

  const createMut = (trpc as any).customerPortal.createPortalAccess.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Token created for ${data.customerName}`);
      setShowCreate(false);
      tokensQuery.refetch();
      // Copy portal URL
      navigator.clipboard?.writeText(`${window.location.origin}${data.portalUrl}`);
      toast.info("Portal URL copied to clipboard");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeMut = (trpc as any).customerPortal.revokeAccess.useMutation({
    onSuccess: () => { toast.success("Token revoked"); tokensQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const linkMut = (trpc as any).customerPortal.linkLoads.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Linked ${data.linkedCount} loads`);
      setLinkTokenId(null);
      setLinkLoadIds("");
      tokensQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeCount = tokens.filter((t: any) => t.isActive).length;
  const totalLoads = tokens.reduce((sum: number, t: any) => sum + (t.loadCount || 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-400" />
          <h1 className="text-lg font-bold">Portal Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => tokensQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5", tokensQuery.isFetching && "animate-spin")} />
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Token
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
        <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 p-3 text-center">
          <div className="text-xs text-slate-500 uppercase">Active Tokens</div>
          <div className="text-xl font-bold text-purple-400">{activeCount}</div>
        </div>
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 text-center">
          <div className="text-xs text-slate-500 uppercase">Total Linked Loads</div>
          <div className="text-xl font-bold text-blue-400">{totalLoads}</div>
        </div>
        <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3 text-center">
          <div className="text-xs text-slate-500 uppercase">Total Tokens</div>
          <div className="text-xl font-bold text-green-400">{tokens.length}</div>
        </div>
      </div>

      {/* Create Token Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Key className="w-4 h-4 text-purple-400" />Create Portal Token</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase mb-1 block">Customer Name</label>
                <Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g. Permian Basin Oil Co." />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase mb-1 block">Customer Email</label>
                <Input type="email" value={form.customerEmail} onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="customer@example.com" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase mb-1 block">Expires In (days)</label>
                <Input type="number" value={form.expiresInDays} onChange={e => setForm(p => ({ ...p, expiresInDays: Number(e.target.value) }))} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" />
              </div>
            </div>
            <Button size="sm" className="h-8 w-full text-xs bg-purple-600 hover:bg-purple-700"
              onClick={() => createMut.mutate(form)} disabled={!form.customerName || createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Generate Token & Copy URL"}
            </Button>
          </Card>
        </div>
      )}

      {/* Link Loads Modal */}
      {linkTokenId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setLinkTokenId(null)}>
          <Card className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-96 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-400" />Link Loads</h3>
              <button onClick={() => setLinkTokenId(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase mb-1 block">Load IDs (comma-separated)</label>
              <Input value={linkLoadIds} onChange={e => setLinkLoadIds(e.target.value)} className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g. 101, 102, 103" />
            </div>
            <Button size="sm" className="h-8 w-full text-xs bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const ids = linkLoadIds.split(",").map(s => Number(s.trim())).filter(n => n > 0);
                if (ids.length === 0) { toast.error("Enter valid load IDs"); return; }
                linkMut.mutate({ tokenId: linkTokenId, loadIds: ids });
              }} disabled={linkMut.isPending}>
              {linkMut.isPending ? "Linking..." : "Link Loads"}
            </Button>
          </Card>
        </div>
      )}

      {/* Token Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="text-xs text-slate-500 uppercase border-b border-white/[0.06] bg-slate-900">
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Expires</th>
              <th className="px-3 py-2 text-left">Last Access</th>
              <th className="px-3 py-2 text-center">Loads</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokensQuery.isLoading ? (
              <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : tokens.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-500">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />No portal tokens created yet
              </td></tr>
            ) : tokens.map((t: any) => (
              <tr key={t.tokenId} className={cn("border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors", !t.isActive && "opacity-50")}>
                <td className="px-3 py-2 font-medium text-white">{t.customerName}</td>
                <td className="px-3 py-2 text-slate-300">{t.customerEmail || "—"}</td>
                <td className="px-3 py-2 text-slate-300">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2 text-slate-300">{t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : "—"}</td>
                <td className="px-3 py-2 text-slate-300">{t.lastAccessAt ? new Date(t.lastAccessAt).toLocaleString() : "Never"}</td>
                <td className="px-3 py-2 text-center">
                  <Badge className="bg-blue-500/10 text-blue-400 border-0 text-xs">{t.loadCount}</Badge>
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge className={cn("border-0 text-xs", t.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                    {t.isActive ? "Active" : "Revoked"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setLinkTokenId(t.tokenId)} className="text-blue-400 hover:text-blue-300 p-0.5" title="Link loads">
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    {t.isActive && (
                      <button onClick={() => { if (confirm(`Revoke access for ${t.customerName}?`)) revokeMut.mutate({ tokenId: t.tokenId }); }} className="text-red-400 hover:text-red-300 p-0.5" title="Revoke">
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs shrink-0">
        <div className="text-slate-400">{activeCount} active token{activeCount !== 1 ? "s" : ""} · {totalLoads} linked load{totalLoads !== 1 ? "s" : ""}</div>
        <div className="text-slate-500">GPS data delayed 2 min for security</div>
      </div>
    </div>
  );
}
